import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { formatCurrency } from '../utils/format';

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
      }).catch(() => toast.error('Failed to load invoice'));
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    if (Number(data.grossWeight) <= Number(data.tareWeight)) {
      toast.error('Gross weight must be greater than tare weight');
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/invoices/${id}`, data);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', data);
        toast.success('Invoice created');
      }
      navigate('/invoices');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save invoice');
    }
  };

  return (
    <AppLayout>
      <div className="card shadow-sm">
        <div className="card-header">{isEdit ? 'Edit Invoice' : 'Generate Invoice'}</div>
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-md-4">
              <label className="form-label">Invoice Number (optional, per factory)</label>
              <input className="form-control" {...register('invoiceNumber')} />
              <small className="text-muted">If left empty, next number is auto-generated from this factory's previous invoice.</small>
            </div>
            <div className="col-md-4">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" {...register('date', { required: true })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Factory</label>
              <select className="form-select" {...register('customer', { required: 'Factory is required' })}>
                <option value="">Select factory</option>
                {factories.map((item) => (
                  <option key={item._id} value={item._id}>{item.factoryName || item.customerName}</option>
                ))}
              </select>
              {errors.customer && <small className="text-danger">{errors.customer.message}</small>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Vehicle Number</label>
              <input className="form-control" {...register('vehicleNumber', { required: 'Vehicle number is required' })} />
              {errors.vehicleNumber && <small className="text-danger">{errors.vehicleNumber.message}</small>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Gross Weight</label>
              <input type="number" step="0.001" className="form-control" {...register('grossWeight', { required: true, min: 0.001 })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Tare Weight</label>
              <input type="number" step="0.001" className="form-control" {...register('tareWeight', { required: true, min: 0 })} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Rate / Ton</label>
              <input type="number" step="0.01" className="form-control" {...register('ratePerTon', { required: true, min: 0.01 })} />
              <small className="text-muted">Example: 4500 will be applied as 4.5 x Net Weight.</small>
            </div>
            <div className="col-md-8">
              <div className="invoice-calc p-3 rounded">
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
            <div className="col-12 d-flex gap-2">
              <button disabled={isSubmitting} className="btn btn-warning" type="submit">
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Invoice' : 'Save Invoice'}
              </button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/invoices')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default InvoiceFormPage;
