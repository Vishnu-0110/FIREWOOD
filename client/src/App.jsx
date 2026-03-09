import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomerListPage from './pages/CustomerListPage';
import CustomerFormPage from './pages/CustomerFormPage';
import InvoiceFormPage from './pages/InvoiceFormPage';
import InvoiceHistoryPage from './pages/InvoiceHistoryPage';
import InvoiceViewPage from './pages/InvoiceViewPage';
import ProfilePage from './pages/ProfilePage';
import api from './api/axiosClient';
import { clearCredentials, setCredentials } from './features/authSlice';

const NotFound = () => <div className="p-4">Page not found</div>;

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const [checkingSession, setCheckingSession] = useState(Boolean(isAuthenticated && token));

  useEffect(() => {
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
    return <div className="d-flex justify-content-center align-items-center min-vh-100">Loading session...</div>;
  }

  return (
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
  );
}

export default App;
