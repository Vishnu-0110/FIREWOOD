import { Component, Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import api from './api/axiosClient';
import { clearCredentials, setCredentials } from './features/authSlice';

const NotFound = () => <div className="p-4">Page not found</div>;
const CHUNK_RETRY_KEY_PREFIX = 'firewood-route-chunk-retry';
const CHUNK_RETRY_WINDOW_MS = 60 * 1000;

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');
  return /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);
};

const getRetryKey = (routeKey) => `${CHUNK_RETRY_KEY_PREFIX}:${routeKey}`;

const shouldRetryChunkLoad = (routeKey) => {
  if (typeof window === 'undefined') return false;

  const raw = window.sessionStorage.getItem(getRetryKey(routeKey));
  if (!raw) return true;

  try {
    const parsed = JSON.parse(raw);
    const timestamp = Number(parsed?.timestamp);
    return !Number.isFinite(timestamp) || (Date.now() - timestamp) > CHUNK_RETRY_WINDOW_MS;
  } catch {
    return true;
  }
};

const markChunkRetry = (routeKey) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(getRetryKey(routeKey), JSON.stringify({ timestamp: Date.now() }));
};

const lazyRoute = (loader, routeKey) => lazy(async () => {
  try {
    return await loader();
  } catch (error) {
    if (typeof window !== 'undefined' && isChunkLoadError(error) && shouldRetryChunkLoad(routeKey)) {
      markChunkRetry(routeKey);
      window.location.reload();
      return new Promise(() => {});
    }
    throw error;
  }
});

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (typeof window !== 'undefined' && isChunkLoadError(error) && shouldRetryChunkLoad('boundary')) {
      markChunkRetry('boundary');
      window.location.reload();
      return;
    }

    return undefined;
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="loading-screen loading-screen-full">
        <div className="loading-shell text-center">
          <div className="loading-copy mb-2">Something went wrong while opening this page.</div>
          <button type="button" className="btn btn-warning" onClick={this.handleReload}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

const LoginPage = lazyRoute(() => import('./pages/LoginPage'), 'login');
const DashboardPage = lazyRoute(() => import('./pages/DashboardPage'), 'dashboard');
const CustomerListPage = lazyRoute(() => import('./pages/CustomerListPage'), 'customers');
const CustomerFormPage = lazyRoute(() => import('./pages/CustomerFormPage'), 'customer-form');
const InvoiceFormPage = lazyRoute(() => import('./pages/InvoiceFormPage'), 'invoice-form');
const InvoiceHistoryPage = lazyRoute(() => import('./pages/InvoiceHistoryPage'), 'invoice-history');
const InvoiceViewPage = lazyRoute(() => import('./pages/InvoiceViewPage'), 'invoice-view');
const ProfilePage = lazyRoute(() => import('./pages/ProfilePage'), 'profile');

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token, theme } = useSelector((state) => state.auth);
  const [checkingSession, setCheckingSession] = useState(Boolean(isAuthenticated && token));
  const initialSessionCheckDone = useRef(false);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const { body } = document;
    body.classList.remove('auth-screen', 'app-theme-light', 'app-theme-dark');

    if (isAuthenticated || checkingSession) {
      body.classList.add(theme === 'dark' ? 'app-theme-dark' : 'app-theme-light');
    } else {
      body.classList.add('auth-screen');
    }

    return undefined;
  }, [checkingSession, isAuthenticated, theme]);

  useEffect(() => {
    if (initialSessionCheckDone.current) return undefined;
    initialSessionCheckDone.current = true;

    let active = true;

    const verifySession = async () => {
      if (!isAuthenticated || !token) {
        if (active) setCheckingSession(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        dispatch(setCredentials({ user: response.data.user, token }));
      } catch {
        dispatch(clearCredentials());
      } finally {
        if (active) setCheckingSession(false);
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [dispatch, isAuthenticated, token]);

  if (checkingSession) {
    return <LoadingSpinner full />;
  }

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingSpinner full />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/new" element={<CustomerFormPage />} />
            <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="/invoices" element={<InvoiceHistoryPage />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id/edit" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceViewPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/404" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

export default App;
