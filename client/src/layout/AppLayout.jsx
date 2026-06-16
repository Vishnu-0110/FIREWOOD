import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const getIsMobileView = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 991.98px)').matches;
};

const getRouteLabel = (pathname) => {
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/customers/new')) return 'Add Factory';
  if (pathname.startsWith('/customers')) return 'Factories';
  if (pathname.startsWith('/invoices/new')) return 'Generate Invoice';
  if (pathname.startsWith('/invoices/')) return 'Invoice Details';
  if (pathname.startsWith('/invoices')) return 'Invoice History';
  if (pathname.startsWith('/profile')) return 'Profile';
  return 'Page';
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const { theme } = useSelector((state) => state.auth);
  const isDark = theme === 'dark';
  const [isMobileView, setIsMobileView] = useState(getIsMobileView);
  const [collapsed, setCollapsed] = useState(() => {
    const savedCollapsed = localStorage.getItem('sidebar_collapsed') === '1';
    return getIsMobileView() ? true : savedCollapsed;
  });
  const [isRouteSwitching, setIsRouteSwitching] = useState(false);
  const hasMountedRef = useRef(false);
  const routeLabel = useMemo(() => getRouteLabel(location.pathname), [location.pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 991.98px)');
    const onChange = (event) => {
      const mobileView = event.matches;
      setIsMobileView(mobileView);
      if (mobileView) {
        setCollapsed(true);
        return;
      }
      const savedCollapsed = localStorage.getItem('sidebar_collapsed') === '1';
      setCollapsed(savedCollapsed);
    };

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    if (isMobileView) return;
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed, isMobileView]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    setIsRouteSwitching(true);
    const timer = window.setTimeout(() => {
      setIsRouteSwitching(false);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, []);

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const handleCloseMobileSidebar = () => {
    if (isMobileView) setCollapsed(true);
  };

  return (
    <div className={isDark ? 'theme-dark app-layout' : 'theme-light app-layout'}>
      <div className="app-shell">
        <Sidebar collapsed={collapsed} onNavigate={handleCloseMobileSidebar} />
        {isMobileView ? (
          <button
            type="button"
            className={`app-sidebar-backdrop ${collapsed ? '' : 'show'}`}
            onClick={handleCloseMobileSidebar}
            aria-label="Close menu"
          />
        ) : null}
        <main className="app-main">
          <Topbar collapsed={collapsed} onToggleSidebar={handleToggleSidebar} />
          <div className={`app-route-indicator ${isRouteSwitching ? 'show' : ''}`} aria-live="polite" aria-atomic="true">
            <span className="app-route-indicator-dot" />
            <span>{routeLabel}</span>
          </div>
          <div className={`container-fluid py-3 app-content app-page-shell ${isRouteSwitching ? 'is-switching' : ''}`}>
            <div key={location.pathname} className="app-page-surface">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
