import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { formatCurrency } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';

const CustomerListPage = () => {
  const [state, setState] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [q, setQ] = useState('');

  const load = async (page = 1, search = q) => {
    try {
      const response = await api.get(`/customers?q=${encodeURIComponent(search)}&page=${page}&limit=10`);
      setState(response.data);
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Could not load factories');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const response = await api.get('/customers?q=&page=1&limit=10');
        setState(response.data);
      } catch (error) {
        if (isSilentAuthError(error)) return;
        toast.error(error?.response?.data?.message || 'Could not load factories');
      }
    };

    init();
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm('Delete this factory?')) return;
    try {
      await api.delete(`/customers/${id}`);
      toast.success('Deleted');
      load(state.page, q);
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">Factories</span>
          <h1 className="page-title mb-1">Factory Directory</h1>
          <p className="page-subtitle mb-0">Search, update and organize your billing factories quickly on any screen size.</p>
        </div>
      </section>

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>Factory List</span>
          <div className="d-flex gap-2 page-actions-row">
            <input
              className="form-control form-control-sm"
              placeholder="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load(1, q)}
            />
            <button className="btn btn-sm btn-warning" onClick={() => load(1, q)}>Search</button>
            <Link className="btn btn-sm btn-dark" to="/customers/new">Add Factory</Link>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-mobile-stack mb-0">
            <thead>
              <tr>
                <th>Factory</th>
                <th>Total Loads</th>
                <th>Total Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr key={item._id}>
                  <td data-label="Factory">{item.factoryName || item.customerName || '-'}</td>
                  <td data-label="Total Loads">{item.totalLoadsSent}</td>
                  <td data-label="Total Revenue">{formatCurrency(item.totalAmountPaid)}</td>
                  <td data-label="Actions" className="d-flex gap-1 action-cell">
                    <Link className="btn btn-sm btn-outline-primary" to={`/customers/${item._id}/edit`}>Edit</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center">
          <small>Total: {state.total}</small>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={state.page <= 1} onClick={() => load(state.page - 1, q)}>Prev</button>
            <span className="small align-self-center">{state.page} / {state.pages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={state.page >= state.pages} onClick={() => load(state.page + 1, q)}>Next</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomerListPage;
