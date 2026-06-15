import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { clearCredentials, toggleTheme } from '../features/authSlice';

const PowerIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3.25a.85.85 0 0 1 .85.85v7.55a.85.85 0 1 1-1.7 0V4.1a.85.85 0 0 1 .85-.85Z" fill="currentColor" />
    <path d="M7.08 5.1a.85.85 0 0 1 1.18.22.85.85 0 0 1-.18 1.17 6.1 6.1 0 1 0 7.84 0 .85.85 0 1 1 1-1.37 7.8 7.8 0 1 1-9.86 0Z" fill="currentColor" />
  </svg>
);

const Topbar = ({ collapsed, onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Proceed with local logout even if request fails.
    } finally {
      dispatch(clearCredentials());
      toast.success('Signed out');
      navigate('/login');
    }
  };

  return (
    <header className="app-topbar d-flex align-items-center px-3 py-2">
      <div className="d-flex align-items-center gap-2 topbar-left">
        <button
          type="button"
          className="btn btn-sm sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '☰' : '✕'}
        </button>
      </div>
      <div className="topbar-brand" title="Vijaya Lakshmi Firewood Supplier">
        <img
          className="topbar-company-logo topbar-brand-logo"
          src="/invoice-logo.png"
          alt="Vijaya Lakshmi logo"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <span className="visually-hidden">Vijaya Lakshmi Firewood Supplier</span>
      </div>
      <div className="d-flex align-items-center gap-2 topbar-actions">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary topbar-ghost-btn topbar-icon-btn"
          onClick={() => dispatch(toggleTheme())}
          aria-label={user?.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={user?.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
          <span className="topbar-icon-btn-symbol" aria-hidden="true">{user?.theme === 'dark' ? '☀' : '☾'}</span>
          <span className="topbar-icon-btn-label">{user?.theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger topbar-ghost-btn topbar-icon-btn topbar-logout-btn"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <span className="topbar-icon-btn-symbol" aria-hidden="true"><PowerIcon /></span>
          <span className="topbar-icon-btn-label">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
