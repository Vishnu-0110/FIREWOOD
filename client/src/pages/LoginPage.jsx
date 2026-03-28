import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { setCredentials } from '../features/authSlice';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid login response from server');
      }
      dispatch(setCredentials(response.data));
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      if (!error?.response) {
        toast.error('Server unreachable. Check backend/MongoDB connection.');
        return;
      }
      toast.error(error.response.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-page d-flex align-items-center justify-content-center min-vh-100">
      <div className="card shadow-sm p-4 login-card">
        <div className="login-card-header text-center mb-4">
          <p className="login-overline mb-1">Secure Access</p>
          <h4 className="mb-1">Vijaya Lakshmi Billing</h4>
          <small className="text-muted">Sign in to continue to your workspace</small>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input className="form-control" {...register('email', { required: 'Email is required' })} />
            {errors.email && <small className="text-danger">{errors.email.message}</small>}
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <small className="text-danger">{errors.password.message}</small>}
          </div>
          <button disabled={isSubmitting} className="btn btn-warning w-100" type="submit">
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
