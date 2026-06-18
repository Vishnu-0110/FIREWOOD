import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axiosClient';
import { EyeIcon, EyeOffIcon, IconAction, RightIcon } from '../components/AppIcons';
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
  const sceneRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const updatePointer = (event) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const rect = scene.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const tiltX = ((event.clientY - rect.top) / rect.height - 0.5) * -10;
    const tiltY = ((event.clientX - rect.left) / rect.width - 0.5) * 10;

    scene.style.setProperty('--pointer-x', `${x}%`);
    scene.style.setProperty('--pointer-y', `${y}%`);
    scene.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    scene.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
  };

  const resetPointer = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.style.setProperty('--pointer-x', '50%');
    scene.style.setProperty('--pointer-y', '42%');
    scene.style.setProperty('--tilt-x', '0deg');
    scene.style.setProperty('--tilt-y', '0deg');
  };

  const onSubmit = async (data) => {
    try {
      let response;

      try {
        response = await api.post('/auth/login', data, { timeout: LOGIN_TIMEOUT_MS });
      } catch (error) {
        if (error?.code !== 'ECONNABORTED') {
          throw error;
        }

        toast.info('Trying again...');
        await wait(LOGIN_RETRY_DELAY_MS);
        response = await api.post('/auth/login', data, { timeout: LOGIN_TIMEOUT_MS });
      }

      if (!response.data?.token || !response.data?.user) {
        throw new Error('Invalid login response from server');
      }
      dispatch(setCredentials(response.data));
      toast.success('Signed in', { autoClose: 2000 });
      navigate('/');
    } catch (error) {
      if (!error?.response) {
        if (error?.code === 'ECONNABORTED') {
          toast.error('Server busy. Try again.');
        } else {
          toast.error('Server unreachable.');
        }
        return;
      }
      toast.error(error.response.data?.message || 'Sign-in failed');
    }
  };

  return (
    <div
      ref={sceneRef}
      className="login-page"
      onPointerMove={updatePointer}
      onPointerLeave={resetPointer}
    >
      <div className="login-backdrop" aria-hidden="true">
        <span className="login-backdrop-orbit login-backdrop-orbit-a" />
        <span className="login-backdrop-orbit login-backdrop-orbit-b" />
        <span className="login-backdrop-orbit login-backdrop-orbit-c" />
        <span className="login-backdrop-grid" />
        <span className="login-backdrop-trace login-backdrop-trace-a" />
        <span className="login-backdrop-trace login-backdrop-trace-b" />
        <span className="login-backdrop-node login-backdrop-node-a" />
        <span className="login-backdrop-node login-backdrop-node-b" />
        <span className="login-backdrop-node login-backdrop-node-c" />
      </div>

      <div className="login-shell">
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
              {errors.email && <small className="field-error">{errors.email.message}</small>}
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  {...register('password', { required: 'Password is required' })}
                />
                <IconAction
                  type="button"
                  icon={showPassword ? EyeOffIcon : EyeIcon}
                  label={showPassword ? 'Hide password' : 'Show password'}
                  className="btn-sm btn-outline-secondary"
                  onClick={() => setShowPassword((prev) => !prev)}
                />
              </div>
              {errors.password && <small className="field-error">{errors.password.message}</small>}
            </div>
            <div className="d-flex justify-content-center pt-1">
              <IconAction
                type="submit"
                icon={RightIcon}
                label={isSubmitting ? 'Signing in...' : 'Login'}
                className="btn-lg btn-warning login-submit-btn"
                disabled={isSubmitting}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
