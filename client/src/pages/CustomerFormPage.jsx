import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AppLayout from '../layout/AppLayout';
import api from '../api/axiosClient';
import { CheckIcon, CloseIcon, IconAction } from '../components/AppIcons';
import { isSilentAuthError } from '../utils/apiErrors';

const CustomerFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { register, handleSubmit, setValue, setError, clearErrors, formState: { errors, isSubmitting } } = useForm();

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
        toast.error('Could not load factory');
      });
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data) => {
    const payload = { ...data, customerName: data.factoryName };
    try {
      if (isEdit) {
        await api.put(`/customers/${id}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Saved');
      }
      navigate('/customers');
    } catch (error) {
      if (isSilentAuthError(error)) return;
      const apiMessage = String(error?.response?.data?.message || '').trim();
      if (apiMessage.toLowerCase() === 'factory already exists') {
        setError('factoryName', { type: 'server', message: 'Factory already exists' });
        return;
      }
      const apiError =
        error?.response?.data?.errors?.[0]?.message ||
        apiMessage ||
        'Save failed';
      toast.error(apiError);
    }
  };

  return (
    <AppLayout>
      <section className="page-hero mb-3">
        <div>
          <span className="page-eyebrow">{isEdit ? 'Update Factory' : 'New Factory'}</span>
          <h1 className="page-title mb-1">{isEdit ? 'Edit Factory' : 'Add Factory'}</h1>
          <p className="page-subtitle mb-0">Keep billing details clean and easy to maintain across devices.</p>
        </div>
      </section>

      <div className="card shadow-sm">
        <div className="card-header">{isEdit ? 'Edit Factory' : 'Add Factory'}</div>
        <div className="card-body">
          <form className="row g-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-12 col-lg-8">
              <label className="form-label">Factory Name</label>
              <input
                className={`form-control ${errors.factoryName ? 'is-invalid' : ''}`}
                {...register('factoryName', {
                  required: 'Factory name is required',
                  onChange: () => clearErrors('factoryName')
                })}
              />
              {errors.factoryName && <small className="field-error">{errors.factoryName.message}</small>}
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">GST Number</label>
              <input className="form-control" {...register('gstNumber')} />
            </div>
            <div className="col-12 col-lg-4">
              <label className="form-label">Phone</label>
              <input className="form-control" {...register('phone')} />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea rows="3" className="form-control" {...register('address')} />
            </div>
            <div className="col-12 d-flex gap-2 form-action-row">
              <button type="submit" className="btn btn-warning btn-lg form-submit-btn" disabled={isSubmitting}>
                <CheckIcon />
                <span>{isSubmitting ? 'Saving...' : 'Save Factory'}</span>
              </button>
              <IconAction
                type="button"
                icon={CloseIcon}
                label="Cancel"
                className="btn-outline-secondary btn-lg"
                onClick={() => navigate('/customers')}
              />
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CustomerFormPage;
