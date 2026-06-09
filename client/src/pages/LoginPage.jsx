import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { setCredentials } from '../features/authSlice';

const LOGIN_TIMEOUT_MS = 60000;
const LOGIN_RETRY_DELAY_MS = 1500;

const wait = (ms) => new Promise((resolve) => {
  window.setTimeout(resolve, ms);
});

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('app-theme-light', 'app-theme-dark');
      document.body.classList.add('auth-screen');
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('auth-screen');
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      let response;

      try {
        response = await api.post('/auth/login', data, { timeout: LOGIN_TIMEOUT_MS });
      } catch (error) {
        if (error?.code !== 'ECONNABORTED') {
          throw error;
        }

        toast.info('Server is waking up. Retrying login...');
        await wait(LOGIN_RETRY_DELAY_MS);
        response = await api.post('/auth/login', data, { timeout: LOGIN_TIMEOUT_MS });
      }

      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid login response from server');
      }
      dispatch(setCredentials(response.data));
      toast.success('Login successful');
      navigate('/');
    } catch (error) {
      if (!error?.response) {
        if (error?.code === 'ECONNABORTED') {
          toast.error('Server is still waking up. Please wait a moment and try again.');
        } else {
          toast.error('Server unreachable. Check backend status and VITE_API_URL deployment value.');
        }
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
        <div className="login-ops-strip mb-4" aria-hidden="true">
          <div className="login-ops-card">
            <span className="login-ops-label">Factory queue</span>
            <strong>08 Ready</strong>
            <span className="login-ops-bar"><span /></span>
          </div>
          <div className="login-ops-card">
            <span className="login-ops-label">Billing sync</span>
            <strong>Live Updates</strong>
            <span className="login-ops-bar"><span /></span>
          </div>
          <div className="login-ops-card">
            <span className="login-ops-label">Dispatch flow</span>
            <strong>On Track</strong>
            <span className="login-ops-bar"><span /></span>
          </div>
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
