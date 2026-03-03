import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const isDark = user?.theme === 'dark';
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === '1');

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className={isDark ? 'theme-dark' : 'theme-light'}>
      <div className="app-shell">
        <Sidebar collapsed={collapsed} />
        <main className="app-main">
          <Topbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((prev) => !prev)} />
          <div className="container-fluid py-3">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
