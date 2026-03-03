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
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn btn-sm sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '☰' : '✕'}
        </button>
        <div>
        <h6 className="mb-0">Vijaya Lakshmi Firewood Supplier</h6>
        <small className="text-muted">GST Billing & Load Management</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => dispatch(toggleTheme())}>
          {user?.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button type="button" className="btn btn-sm btn-warning" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
