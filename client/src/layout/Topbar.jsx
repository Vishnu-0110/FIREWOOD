import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { clearCredentials, toggleTheme } from '../features/authSlice';
import { CloseIcon, IconAction, MenuIcon, MoonIcon, PowerIcon, SunIcon } from '../components/AppIcons';

const Topbar = ({ collapsed, onToggleSidebar, routeLabel = 'Dashboard' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    void api.post('/auth/logout').catch(() => {
      // Proceed with local logout even if the server call fails.
    });

    dispatch(clearCredentials());
    toast.success('Signed out');
    navigate('/login', { replace: true });
  };

  return (
    <header className="app-topbar d-flex align-items-center px-3 py-2">
      <div className="d-flex align-items-center gap-2 topbar-left">
        <IconAction
          type="button"
          icon={collapsed ? MenuIcon : CloseIcon}
          label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
          className="btn-sm btn-outline-secondary sidebar-toggle-btn"
          onClick={onToggleSidebar}
        />
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
        <div className="topbar-title">
          <div className="topbar-kicker">Billing Command Center</div>
          <h6>Vijaya Lakshmi Firewood Supplier</h6>
          <small>{routeLabel}{user?.name ? ` • Welcome, ${user.name}` : ''}</small>
        </div>
      </div>
      <div className="d-flex align-items-center gap-2 topbar-actions">
        <IconAction
          type="button"
          icon={theme === 'dark' ? SunIcon : MoonIcon}
          label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="btn-sm btn-outline-secondary topbar-ghost-btn"
          onClick={() => dispatch(toggleTheme())}
        />
        <IconAction
          type="button"
          icon={PowerIcon}
          label="Logout"
          className="btn-sm btn-outline-danger topbar-ghost-btn"
          onClick={handleLogout}
        />
      </div>
    </header>
  );
};

export default Topbar;
