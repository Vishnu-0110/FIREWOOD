import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ collapsed = false, onNavigate }) => {
  const { pathname } = useLocation();
  const menu = [
    { key: 'dashboard', to: '/', label: 'Dashboard', icon: 'DB' },
    { key: 'customers', to: '/customers', label: 'Factories', icon: 'FC' },
    { key: 'addCustomer', to: '/customers/new', label: 'Add Factory', icon: 'AF' },
    { key: 'generateInvoice', to: '/invoices/new', label: 'Generate Invoice', icon: 'GI' },
    { key: 'invoiceHistory', to: '/invoices', label: 'Invoice History', icon: 'IH' },
    { key: 'profile', to: '/profile', label: 'Profile', icon: 'PR' }
  ];

  const getActiveKey = () => {
    if (pathname === '/') return 'dashboard';
    if (pathname === '/customers') return 'customers';
    if (pathname === '/customers/new') return 'addCustomer';
    if (pathname.startsWith('/customers/') && pathname.endsWith('/edit')) return 'customers';
    if (pathname === '/invoices/new') return 'generateInvoice';
    if (pathname.startsWith('/invoices/') && pathname.endsWith('/edit')) return 'generateInvoice';
    if (pathname === '/invoices' || (pathname.startsWith('/invoices/') && !pathname.endsWith('/edit'))) return 'invoiceHistory';
    if (pathname === '/profile') return 'profile';
    return '';
  };

  const activeKey = getActiveKey();

  return (
    <aside className={`app-sidebar p-3 ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-block mb-4">
        <div className="brand-logo" aria-label="Vijaya Lakshmi logo">
          <img
            src="/invoice-logo.png"
            alt="Vijaya Lakshmi logo"
            onLoad={(e) => {
              e.currentTarget.parentElement?.classList.add('has-logo');
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="brand-logo-fallback" aria-hidden="true">VL</span>
        </div>
        <div className="brand-text">
          <h5 className="fw-bold text-white mb-0">Vijaya Lakshmi</h5>
          <p className="text-light small mb-0">Billing Command Center</p>
        </div>
      </div>
      <nav className="d-flex flex-column gap-2">
        {menu.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`sidebar-link ${activeKey === item.key ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
            onClick={onNavigate}
          >
            <span className="sidebar-link-icon" aria-hidden="true">{item.icon}</span>
            <span className="sidebar-link-text">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
