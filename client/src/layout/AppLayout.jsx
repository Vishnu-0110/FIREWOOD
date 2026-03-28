import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const getIsMobileView = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 991.98px)').matches;
};

const AppLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const isDark = user?.theme === 'dark';
  const [isMobileView, setIsMobileView] = useState(getIsMobileView);
  const [collapsed, setCollapsed] = useState(() => {
    const savedCollapsed = localStorage.getItem('sidebar_collapsed') === '1';
    return getIsMobileView() ? true : savedCollapsed;
  });

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

  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const handleCloseMobileSidebar = () => {
    if (isMobileView) setCollapsed(true);
  };

  return (
    <div className={isDark ? 'theme-dark' : 'theme-light'}>
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
          <div className="container-fluid py-3 app-content">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
