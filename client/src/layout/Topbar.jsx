import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { clearCredentials, toggleTheme } from '../features/authSlice';

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
      toast.info('Logged out');
      navigate('/login');
    }
  };

  return (
    <header className="app-topbar d-flex justify-content-between align-items-center px-3 py-2">
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
          className="btn btn-sm btn-warning topbar-primary-btn topbar-icon-btn"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <span className="topbar-icon-btn-symbol" aria-hidden="true">⎋</span>
          <span className="topbar-icon-btn-label">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
