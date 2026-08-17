import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { CloseIcon, DownloadIcon, EditIcon, EyeIcon, FilterIcon, IconAction, LeftIcon, RightIcon, TrashIcon } from '../components/AppIcons';
import { formatCurrency, formatDate, queryParams } from '../utils/format';
import { showDeleteUndoToast } from '../utils/deleteUndoToast';
import { isSilentAuthError } from '../utils/apiErrors';

const defaultFilters = { q: '', customer: '', startDate: '', endDate: '', page: 1, limit: 10 };

const InvoiceHistoryPage = () => {
  const [factories, setFactories] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingCurrent, setIsExportingCurrent] = useState(false);
  const [isExportingServer, setIsExportingServer] = useState(false);
  const activeFilterCount = [draftFilters.q, draftFilters.customer, draftFilters.startDate, draftFilters.endDate].filter(Boolean).length;

  const load = async (next = filters) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/invoices?${queryParams(next)}`);
      setData(response.data);
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Could not load invoices');
    } finally {
      setIsLoading(false);
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
        if (isSilentAuthError(error)) return;
        toast.error(error?.response?.data?.message || 'Could not load invoices');
      }
    };

    init();
  }, []);

  const applyFilters = (next = draftFilters) => {
    const normalized = { ...next, page: 1 };
    setFilters(normalized);
    load(normalized);
  };

  const syncFilters = (patch) => {
    const next = { ...draftFilters, ...patch };
    const normalized = { ...next, page: 1 };
    setDraftFilters(next);
    setFilters(normalized);
    load(normalized);
  };

  const resetFilters = () => {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
    load(defaultFilters);
  };

  const goToPage = (page) => {
    const next = { ...filters, page };
    setFilters(next);
    load(next);
  };

  const deleteInvoice = async (id, label) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await api.delete(`/invoices/${id}`);
      showDeleteUndoToast({
        message: `${label || 'Invoice'} deleted`,
        onUndo: async () => {
          try {
            await api.post(`/invoices/${id}/restore`);
            toast.success('Invoice restored');
            await load(filters);
          } catch (error) {
            if (isSilentAuthError(error)) return;
            toast.error(error?.response?.data?.message || 'Restore failed');
            throw error;
          }
        }
      });
      await load(filters);
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  const exportCurrent = async () => {
    if (isExportingCurrent) return;

    setIsExportingCurrent(true);
    try {
      const rows = data.items.map((item) => ({
        invoiceNumber: item.invoiceNumber,
        date: formatDate(item.date),
        factory: item.customer?.factoryName || item.customer?.customerName || '-',
        vehicle: item.vehicleNumber,
        netWeight: item.netWeight,
        totalAmount: item.totalAmount
      }));
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
      XLSX.writeFile(wb, 'invoice_history.xlsx');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExportingCurrent(false);
    }
  };

  const downloadServerExcel = async () => {
    if (isExportingServer) return;

    setIsExportingServer(true);
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
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Export failed');
    } finally {
      setIsExportingServer(false);
    }
  };

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">Invoices</span>
          <h1 className="page-title mb-1">Invoice History</h1>
          <p className="page-subtitle mb-0">Filter, export and manage every invoice from one place.</p>
        </div>
      </section>

      <div className="card shadow-sm">
        <div className="card-header">Search and Filters</div>
        <div className="card-body border-bottom">
          <form
            className="row g-2 align-items-end"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters();
            }}
          >
            <div className="col-12 col-lg-3">
              <input
                className="form-control"
                placeholder="Search invoice/factory/vehicle"
                value={draftFilters.q}
                onChange={(e) => syncFilters({ q: e.target.value })}
              />
            </div>
            <div className="col-6 col-lg-2">
              <select className="form-select" value={draftFilters.customer} onChange={(e) => syncFilters({ customer: e.target.value })}>
                <option value="">All Factories</option>
                {factories.map((c) => <option key={c._id} value={c._id}>{c.factoryName || c.customerName}</option>)}
              </select>
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label mb-1" htmlFor="invoice-history-start-date">From Date</label>
              <input
                id="invoice-history-start-date"
                type="date"
                className="form-control"
                value={draftFilters.startDate}
                onChange={(e) => syncFilters({ startDate: e.target.value })}
              />
            </div>
            <div className="col-6 col-lg-2">
              <label className="form-label mb-1" htmlFor="invoice-history-end-date">To Date</label>
              <input
                id="invoice-history-end-date"
                type="date"
                className="form-control"
                value={draftFilters.endDate}
                onChange={(e) => syncFilters({ endDate: e.target.value })}
              />
            </div>
            <div className="col-12 col-xl-6">
              <div className="filter-actions-block">
                <div className="page-actions-row action-row-grid action-row-grid--buttons">
                  <IconAction
                    type="submit"
                    icon={FilterIcon}
                    label={activeFilterCount ? `Apply Filters (${activeFilterCount})` : 'Apply Filters'}
                    className="btn-warning btn-sm filter-apply-btn"
                    disabled={isLoading}
                  />
                  <IconAction
                    type="button"
                    icon={CloseIcon}
                    label="Reset Filters"
                    className="btn-outline-secondary btn-sm"
                    onClick={resetFilters}
                    disabled={isLoading || !activeFilterCount}
                  />
                </div>
                <small className="text-muted d-block mt-2">Edit the filters, then press Apply Filters to refresh the table.</small>
              </div>
            </div>
            <div className="col-12 col-xl-6">
              <div className="page-actions-row action-row-grid action-row-grid--buttons justify-content-xl-end">
                <IconAction type="button" icon={DownloadIcon} label={isExportingCurrent ? 'Exporting...' : 'Export Excel'} className="btn-outline-success btn-sm" onClick={exportCurrent} disabled={isLoading || isExportingCurrent || isExportingServer} />
                <IconAction type="button" icon={DownloadIcon} label={isExportingServer ? 'Downloading...' : 'Server Export'} className="btn-outline-dark btn-sm" onClick={downloadServerExcel} disabled={isLoading || isExportingCurrent || isExportingServer} />
              </div>
            </div>
          </form>
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-mobile-stack mb-0">
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
                  <td data-label="No">{item.invoiceNumber}</td>
                  <td data-label="Date">{formatDate(item.date)}</td>
                  <td data-label="Factory">{item.customer?.factoryName || item.customer?.customerName || '-'}</td>
                  <td data-label="Vehicle">{item.vehicleNumber}</td>
                  <td data-label="Net Weight">{item.netWeight}</td>
                  <td data-label="Total">{formatCurrency(item.totalAmount)}</td>
                  <td data-label="Actions" className="d-flex gap-1 action-cell">
                    <IconAction as={Link} to={`/invoices/${item._id}`} icon={EyeIcon} label="View" className="btn-outline-dark btn-sm" />
                    <IconAction as={Link} to={`/invoices/${item._id}/edit`} icon={EditIcon} label="Edit" className="btn-outline-primary btn-sm" />
                    <IconAction
                      type="button"
                      icon={TrashIcon}
                      label="Delete"
                      className="btn-outline-danger btn-sm"
                      onClick={() => deleteInvoice(item._id, `Invoice #${item.invoiceNumber}`)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer d-flex justify-content-between">
          <small>Total: {data.total}</small>
          <div className="d-flex gap-2">
            <IconAction
              type="button"
              icon={LeftIcon}
              label="Previous page"
              className="btn-outline-secondary btn-sm"
              disabled={data.page <= 1 || isLoading}
              onClick={() => goToPage(data.page - 1)}
            />
            <span className="small align-self-center">{data.page} / {data.pages}</span>
            <IconAction
              type="button"
              icon={RightIcon}
              label="Next page"
              className="btn-outline-secondary btn-sm"
              disabled={data.page >= data.pages || isLoading}
              onClick={() => goToPage(data.page + 1)}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceHistoryPage;
