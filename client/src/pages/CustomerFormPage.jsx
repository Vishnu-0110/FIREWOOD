import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { isSilentAuthError } from '../utils/apiErrors';

const CustomerFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (isEdit) {
      api.get(`/customers?q=&page=1&limit=1000`).then((res) => {
        const customer = res.data.items.find((c) => c._id === id);
        if (customer) {
          ['factoryName', 'gstNumber', 'phone', 'address'].forEach((field) => {
            setValue(field, customer[field] || '');
          });
        }
      }).catch((error) => {
        if (isSilentAuthError(error)) return;
        toast.error('Failed to load factory details');
      });
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    const payload = { ...data, customerName: data.factoryName };
    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
        toast.success('Factory updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Factory added');
      }
      navigate('/customers');
    } catch (error) {
      if (isSilentAuthError(error)) return;
      const apiError =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        'Failed to save factory';
      toast.error(apiError);
    }
  };

  return (
    <AppLayout>
      <div className="card shadow-sm">
        <div className="card-header">{isEdit ? 'Edit Factory' : 'Add Factory'}</div>
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-md-8">
              <label className="form-label">Factory Name</label>
              <input className="form-control" {...register('factoryName', { required: 'Factory name is required' })} />
              {errors.factoryName && <small className="text-danger">{errors.factoryName.message}</small>}
            </div>
            <div className="col-md-4">
              <label className="form-label">GST Number</label>
              <input className="form-control" {...register('gstNumber')} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Phone</label>
              <input className="form-control" {...register('phone')} />
            </div>
            <div className="col-md-12">
              <label className="form-label">Address</label>
              <textarea rows="3" className="form-control" {...register('address')} />
            </div>
            <div className="col-12 d-flex gap-2">
              <button disabled={isSubmitting} type="submit" className="btn btn-warning">
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => navigate('/customers')} className="btn btn-outline-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomerFormPage;
