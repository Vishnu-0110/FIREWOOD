import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { clearCredentials, toggleTheme } from '../features/authSlice';

const Topbar = ({ collapsed, onToggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userInitial = String(user?.name || 'U').trim().charAt(0).toUpperCase();

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
        <div className="topbar-title">
          <h6 className="mb-0">Vijaya Lakshmi Firewood Supplier</h6>
          <small className="text-muted">Operations, Billing and Dispatch</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 topbar-actions">
        <div className="topbar-user-chip" title={user?.email || ''}>
          <span className="topbar-user-avatar" aria-hidden="true">{userInitial}</span>
          <span className="topbar-user-meta">
            <strong>{user?.name || 'User'}</strong>
            <small>{user?.role || 'member'}</small>
          </span>
        </div>
        <button type="button" className="btn btn-sm btn-outline-secondary topbar-ghost-btn" onClick={() => dispatch(toggleTheme())}>
          {user?.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button type="button" className="btn btn-sm btn-warning topbar-primary-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
