import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { CheckIcon, IconAction, LeftIcon, RightIcon, SearchIcon } from '../components/AppIcons';
import { formatCurrency, formatDate, queryParams } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';

const emptyPage = { items: [], total: 0, page: 1, pages: 1 };

const TrashPage = () => {
  const [customerFilters, setCustomerFilters] = useState({ q: '', page: 1, limit: 8 });
  const [invoiceFilters, setInvoiceFilters] = useState({ q: '', page: 1, limit: 8 });
  const [deletedCustomers, setDeletedCustomers] = useState(emptyPage);
  const [deletedInvoices, setDeletedInvoices] = useState(emptyPage);
  const [loading, setLoading] = useState(true);

  const loadDeletedCustomers = async (next = customerFilters) => {
    const response = await api.get(`/customers/deleted?${queryParams(next)}`);
    setDeletedCustomers(response.data);
  };

  const loadDeletedInvoices = async (next = invoiceFilters) => {
    const response = await api.get(`/invoices/deleted?${queryParams(next)}`);
    setDeletedInvoices(response.data);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadDeletedCustomers(), loadDeletedInvoices()]);
    } catch (error) {
      if (!isSilentAuthError(error)) {
        toast.error(error?.response?.data?.message || 'Could not load deleted items');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const refreshCustomers = async (next) => {
    const merged = next || customerFilters;
    setCustomerFilters(merged);
    try {
      await loadDeletedCustomers(merged);
    } catch (error) {
      if (!isSilentAuthError(error)) {
        toast.error(error?.response?.data?.message || 'Could not load deleted factories');
      }
    }
  };

  const refreshInvoices = async (next) => {
    const merged = next || invoiceFilters;
    setInvoiceFilters(merged);
    try {
      await loadDeletedInvoices(merged);
    } catch (error) {
      if (!isSilentAuthError(error)) {
        toast.error(error?.response?.data?.message || 'Could not load deleted invoices');
      }
    }
  };

  const restoreCustomer = async (id) => {
    try {
      await api.post(`/customers/${id}/restore`);
      toast.success('Factory restored');
      await Promise.all([
        loadDeletedCustomers(customerFilters),
        loadDeletedInvoices(invoiceFilters)
      ]);
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Restore failed');
    }
  };

  const restoreInvoice = async (id) => {
    try {
      await api.post(`/invoices/${id}/restore`);
      toast.success('Invoice restored');
      await loadDeletedInvoices(invoiceFilters);
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Restore failed');
    }
  };

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">Recovery</span>
          <h1 className="page-title mb-1">Deleted Items</h1>
          <p className="page-subtitle mb-0">Check deleted factories and invoices here, then restore anything you want to bring back.</p>
        </div>
      </section>

      <div className="row g-3">
        <div className="col-12">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>Deleted Factories</span>
              <small>Total: {deletedCustomers.total}</small>
            </div>
            <div className="card-body border-bottom">
              <div className="d-flex gap-2 flex-wrap">
                <input
                  className="form-control"
                  style={{ maxWidth: 320 }}
                  placeholder="Search deleted factories"
                  value={customerFilters.q}
                  onChange={(e) => setCustomerFilters((prev) => ({ ...prev, q: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && refreshCustomers({ ...customerFilters, page: 1 })}
                />
                <IconAction
                  type="button"
                  icon={SearchIcon}
                  label="Search deleted factories"
                  className="btn-warning btn-sm"
                  onClick={() => refreshCustomers({ ...customerFilters, page: 1 })}
                />
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-mobile-stack mb-0">
                <thead>
                  <tr>
                    <th>Factory</th>
                    <th>Phone</th>
                    <th>Deleted On</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedCustomers.items.map((item) => (
                    <tr key={item._id}>
                      <td data-label="Factory">{item.factoryName || item.customerName || '-'}</td>
                      <td data-label="Phone">{item.phone || '-'}</td>
                      <td data-label="Deleted On">{formatDate(item.deletedAt || item.updatedAt)}</td>
                      <td data-label="Action" className="action-cell">
                        <IconAction
                          type="button"
                          icon={CheckIcon}
                          label="Restore factory"
                          className="btn-outline-success btn-sm"
                          onClick={() => restoreCustomer(item._id)}
                        />
                      </td>
                    </tr>
                  ))}
                  {!deletedCustomers.items.length && !loading ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-4">
                        No deleted factories found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <small>Page {deletedCustomers.page} / {deletedCustomers.pages}</small>
              <div className="d-flex gap-2">
                <IconAction
                  type="button"
                  icon={LeftIcon}
                  label="Previous deleted factories page"
                  className="btn-outline-secondary btn-sm"
                  disabled={deletedCustomers.page <= 1}
                  onClick={() => refreshCustomers({ ...customerFilters, page: deletedCustomers.page - 1 })}
                />
                <IconAction
                  type="button"
                  icon={RightIcon}
                  label="Next deleted factories page"
                  className="btn-outline-secondary btn-sm"
                  disabled={deletedCustomers.page >= deletedCustomers.pages}
                  onClick={() => refreshCustomers({ ...customerFilters, page: deletedCustomers.page + 1 })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card shadow-sm h-100">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span>Deleted Invoices</span>
              <small>Total: {deletedInvoices.total}</small>
            </div>
            <div className="card-body border-bottom">
              <div className="d-flex gap-2 flex-wrap">
                <input
                  className="form-control"
                  style={{ maxWidth: 320 }}
                  placeholder="Search deleted invoices"
                  value={invoiceFilters.q}
                  onChange={(e) => setInvoiceFilters((prev) => ({ ...prev, q: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && refreshInvoices({ ...invoiceFilters, page: 1 })}
                />
                <IconAction
                  type="button"
                  icon={SearchIcon}
                  label="Search deleted invoices"
                  className="btn-warning btn-sm"
                  onClick={() => refreshInvoices({ ...invoiceFilters, page: 1 })}
                />
              </div>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-mobile-stack mb-0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Factory</th>
                    <th>Vehicle</th>
                    <th>Deleted On</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedInvoices.items.map((item) => (
                    <tr key={item._id}>
                      <td data-label="No">{item.invoiceNumber}</td>
                      <td data-label="Factory">{item.customer?.factoryName || item.customer?.customerName || '-'}</td>
                      <td data-label="Vehicle">{item.vehicleNumber}</td>
                      <td data-label="Deleted On">{formatDate(item.deletedAt || item.updatedAt)}</td>
                      <td data-label="Total">{formatCurrency(item.totalAmount)}</td>
                      <td data-label="Action" className="action-cell">
                        <IconAction
                          type="button"
                          icon={CheckIcon}
                          label="Restore invoice"
                          className="btn-outline-success btn-sm"
                          onClick={() => restoreInvoice(item._id)}
                          disabled={Boolean(item.customer?.isDeleted)}
                          title={item.customer?.isDeleted ? 'Restore the factory first' : 'Restore invoice'}
                        />
                      </td>
                    </tr>
                  ))}
                  {!deletedInvoices.items.length && !loading ? (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        No deleted invoices found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <small>Page {deletedInvoices.page} / {deletedInvoices.pages}</small>
              <div className="d-flex gap-2">
                <IconAction
                  type="button"
                  icon={LeftIcon}
                  label="Previous deleted invoices page"
                  className="btn-outline-secondary btn-sm"
                  disabled={deletedInvoices.page <= 1}
                  onClick={() => refreshInvoices({ ...invoiceFilters, page: deletedInvoices.page - 1 })}
                />
                <IconAction
                  type="button"
                  icon={RightIcon}
                  label="Next deleted invoices page"
                  className="btn-outline-secondary btn-sm"
                  disabled={deletedInvoices.page >= deletedInvoices.pages}
                  onClick={() => refreshInvoices({ ...invoiceFilters, page: deletedInvoices.page + 1 })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TrashPage;
