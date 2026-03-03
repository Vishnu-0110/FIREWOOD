import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { formatCurrency, formatDate, queryParams } from '../utils/format';

const InvoiceHistoryPage = () => {
  const [factories, setFactories] = useState([]);
  const [filters, setFilters] = useState({ q: '', customer: '', startDate: '', endDate: '', page: 1, limit: 10 });
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });

  const load = async (next = filters) => {
    try {
      const response = await api.get(`/invoices?${queryParams(next)}`);
      setData(response.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load invoices');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [factoriesRes, invoicesRes] = await Promise.all([
          api.get('/customers?page=1&limit=1000'),
          api.get('/invoices?page=1&limit=10')
        ]);
        setFactories(factoriesRes.data.items);
        setData(invoicesRes.data);
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to load invoices');
      }
    };

    init();
  }, []);

  const updateFilters = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    load(next);
  };

  const deleteInvoice = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      toast.success('Invoice deleted');
      load(filters);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const exportCurrent = () => {
    const rows = data.items.map((item) => ({
      invoiceNumber: item.invoiceNumber,
      date: formatDate(item.date),
      factory: item.customer?.factoryName || item.customer?.customerName || '-',
      vehicle: item.vehicleNumber,
      netWeight: item.netWeight,
      totalAmount: item.totalAmount
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    XLSX.writeFile(wb, 'invoice_history.xlsx');
  };

  const downloadServerExcel = async () => {
    try {
      const response = await api.get('/invoices/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invoices.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to export from server');
    }
  };

  return (
    <AppLayout>
      <div className="card shadow-sm">
        <div className="card-header">Invoice History</div>
        <div className="card-body border-bottom">
          <div className="row g-2">
            <div className="col-md-3">
              <input
                className="form-control"
                placeholder="Search invoice/factory/vehicle"
                value={filters.q}
                onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && updateFilters({ q: filters.q, page: 1 })}
              />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={filters.customer} onChange={(e) => updateFilters({ customer: e.target.value, page: 1 })}>
                <option value="">All Factories</option>
                {factories.map((c) => <option key={c._id} value={c._id}>{c.factoryName || c.customerName}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={filters.startDate} onChange={(e) => updateFilters({ startDate: e.target.value, page: 1 })} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control" value={filters.endDate} onChange={(e) => updateFilters({ endDate: e.target.value, page: 1 })} />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-warning" onClick={() => updateFilters({ q: filters.q, page: 1 })}>Filter</button>
              <button className="btn btn-outline-success" onClick={exportCurrent}>Export Excel</button>
              <button className="btn btn-outline-dark" onClick={downloadServerExcel}>Server Export</button>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table className="table table-striped mb-0">
            <thead>
              <tr>
                <th>No</th>
                <th>Date</th>
                <th>Factory</th>
                <th>Vehicle</th>
                <th>Net Weight</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item._id}>
                  <td>{item.invoiceNumber}</td>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.customer?.factoryName || item.customer?.customerName || '-'}</td>
                  <td>{item.vehicleNumber}</td>
                  <td>{item.netWeight}</td>
                  <td>{formatCurrency(item.totalAmount)}</td>
                  <td className="d-flex gap-1">
                    <Link className="btn btn-sm btn-outline-dark" to={`/invoices/${item._id}`}>View</Link>
                    <Link className="btn btn-sm btn-outline-primary" to={`/invoices/${item._id}/edit`}>Edit</Link>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteInvoice(item._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between">
          <small>Total: {data.total}</small>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={data.page <= 1} onClick={() => updateFilters({ page: data.page - 1 })}>Prev</button>
            <span className="small align-self-center">{data.page} / {data.pages}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={data.page >= data.pages} onClick={() => updateFilters({ page: data.page + 1 })}>Next</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceHistoryPage;
