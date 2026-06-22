import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { CheckIcon, CloseIcon, IconAction, TemplateIcon } from '../components/AppIcons';
import { formatCurrency } from '../utils/format';
import { isSilentAuthError } from '../utils/apiErrors';
import { downloadInvoiceTemplatePdf } from '../utils/pdf';

const InvoiceFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { date: dayjs().format('YYYY-MM-DD') } });

  const gross = Number(useWatch({ control, name: 'grossWeight' }) || 0);
  const tare = Number(useWatch({ control, name: 'tareWeight' }) || 0);
  const rate = Number(useWatch({ control, name: 'ratePerTon' }) || 0);
  const net = useMemo(() => Number((gross - tare).toFixed(3)), [gross, tare]);
  const total = useMemo(() => Number((Math.max(net, 0) * (rate / 1000)).toFixed(2)), [net, rate]);

  useEffect(() => {
    api.get('/customers?page=1&limit=1000').then((res) => setFactories(res.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit) {
      api.get(`/invoices/${id}`).then((res) => {
        const inv = res.data;
        setValue('invoiceNumber', inv.invoiceNumber);
        setValue('date', dayjs(inv.date).format('YYYY-MM-DD'));
        setValue('customer', inv.customer?._id);
        setValue('vehicleNumber', inv.vehicleNumber);
        setValue('grossWeight', inv.grossWeight);
        setValue('tareWeight', inv.tareWeight);
        setValue('ratePerTon', inv.ratePerTon);
      }).catch((error) => {
        if (isSilentAuthError(error)) return;
        toast.error('Could not load invoice');
      });
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    if (Number(data.grossWeight) <= Number(data.tareWeight)) {
      toast.error('Gross must be greater than tare');
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/invoices/${id}`, data);
        toast.success('Updated');
        navigate(`/invoices/${id}`);
      } else {
        const response = await api.post('/invoices', data);
        toast.success('Saved');
        navigate(`/invoices/${response.data?._id}`);
      }
    } catch (error) {
      if (isSilentAuthError(error)) return;
      toast.error(error?.response?.data?.message || 'Save failed');
    }
  };

  const downloadTemplate = async () => {
    await downloadInvoiceTemplatePdf();
  };

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">{isEdit ? 'Update Invoice' : 'Create Invoice'}</span>
          <h1 className="page-title mb-1">{isEdit ? 'Edit Invoice' : 'Generate Invoice'}</h1>
          <p className="page-subtitle mb-0">Fast entry, mobile-friendly layout and live totals while you work.</p>
        </div>
        <div className="hero-actions">
          <IconAction
            type="button"
            icon={TemplateIcon}
            label="Download Template"
            className="btn-outline-secondary btn-sm"
            onClick={downloadTemplate}
          />
        </div>
      </section>

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <span>{isEdit ? 'Edit Invoice' : 'Generate Invoice'}</span>
          <span className="status-pill">Live total enabled</span>
        </div>
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-12 col-lg-4">
              <label className="form-label">Invoice Number (optional, per factory)</label>
              <input className="form-control" {...register('invoiceNumber')} />
              <small className="text-muted">If left empty, next number is auto-generated from this factory's previous invoice.</small>
            </div>
            <div className="col-6 col-lg-4">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" {...register('date', { required: 'Date is required' })} />
              {errors.date && <small className="field-error">{errors.date.message}</small>}
            </div>
            <div className="col-6 col-lg-4">
              <label className="form-label">Factory</label>
              <select className="form-select" {...register('customer', { required: 'Factory is required' })}>
                <option value="">Select factory</option>
                {factories.map((item) => (
                  <option key={item._id} value={item._id}>{item.factoryName || item.customerName}</option>
                ))}
              </select>
              {errors.customer && <small className="field-error">{errors.customer.message}</small>}
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Vehicle Number</label>
              <input className="form-control" {...register('vehicleNumber', { required: 'Vehicle number is required' })} />
              {errors.vehicleNumber && <small className="field-error">{errors.vehicleNumber.message}</small>}
            </div>
            <div className="col-6 col-lg-4">
              <label className="form-label">Gross Weight</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                {...register('grossWeight', {
                  required: 'Gross weight is required',
                  min: { value: 0.001, message: 'Enter a valid gross weight' }
                })}
              />
              {errors.grossWeight && <small className="field-error">{errors.grossWeight.message}</small>}
            </div>
            <div className="col-6 col-lg-4">
              <label className="form-label">Tare Weight</label>
              <input
                type="number"
                step="0.001"
                className="form-control"
                {...register('tareWeight', {
                  required: 'Tare weight is required',
                  min: { value: 0, message: 'Enter a valid tare weight' }
                })}
              />
              {errors.tareWeight && <small className="field-error">{errors.tareWeight.message}</small>}
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Rate / Ton</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                {...register('ratePerTon', {
                  required: 'Rate is required',
                  min: { value: 0.01, message: 'Enter a valid rate' }
                })}
              />
              {errors.ratePerTon && <small className="field-error">{errors.ratePerTon.message}</small>}
              <small className="text-muted">Example: 4500 will be applied as 4.5 x Net Weight.</small>
            </div>
            <div className="col-12 col-lg-8">
              <div className="invoice-calc p-3 rounded modern-highlight-card">
                <div className="d-flex justify-content-between">
                  <span>Net Weight</span>
                  <strong>{net > 0 ? net : 0}</strong>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span>Rate / Ton</span>
                  <strong>{Number(rate || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <span>Total Amount</span>
                  <strong>{formatCurrency(total)}</strong>
                </div>
              </div>
            </div>
            <div className="col-12 d-flex gap-2 form-action-row">
              <button type="submit" className="btn btn-warning btn-lg form-submit-btn" disabled={isSubmitting}>
                <CheckIcon />
                <span>{isSubmitting ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice'}</span>
              </button>
              <IconAction
                type="button"
                icon={CloseIcon}
                label="Cancel"
                className="btn-outline-secondary btn-lg"
                onClick={() => navigate('/invoices')}
              />
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceFormPage;
