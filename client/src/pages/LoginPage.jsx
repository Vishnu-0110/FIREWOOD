import { useEffect, useRef, useState } from 'react';
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
  const sceneRef = useRef(null);

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
    <div
      ref={sceneRef}
      className="login-page"
      onPointerMove={updatePointer}
      onPointerLeave={resetPointer}
    >
      <div className="login-shell">
        <section className="login-showcase" aria-hidden="true">
          <div className="login-showcase-badge">Live operations</div>
          <h1>Billing, dispatch, and factory flow in one motion.</h1>
          <p>
            Watch the workflow pulse as trucks arrive, invoices clear, and settlements move through the queue.
          </p>

          <div className="login-flow-map">
            <div className="login-flow-line" />
            <div className="login-flow-step">
              <span className="login-flow-step-index">01</span>
              <strong>Inbound loads</strong>
              <small>Truck lane active</small>
            </div>
            <div className="login-flow-step">
              <span className="login-flow-step-index">02</span>
              <strong>Billing pass</strong>
              <small>Rates and totals updating</small>
            </div>
            <div className="login-flow-step">
              <span className="login-flow-step-index">03</span>
              <strong>Dispatch out</strong>
              <small>Ledger and delivery synced</small>
            </div>
          </div>

          <div className="login-hud-grid">
            <article className="login-hud-card login-hud-card-wide">
              <span className="login-hud-label">Today</span>
              <strong>08 invoices cleared</strong>
              <div className="login-hud-track">
                <span />
              </div>
            </article>
            <article className="login-hud-card">
              <span className="login-hud-label">Revenue</span>
              <strong>Live</strong>
              <div className="login-hud-pulse" />
            </article>
            <article className="login-hud-card">
              <span className="login-hud-label">Dispatch</span>
              <strong>On time</strong>
              <div className="login-hud-pulse login-hud-pulse-alt" />
            </article>
          </div>

          <div className="login-orbit">
            <span className="login-orbit-core" />
            <span className="login-orbit-ring login-orbit-ring-a" />
            <span className="login-orbit-ring login-orbit-ring-b" />
            <span className="login-orbit-node login-orbit-node-a" />
            <span className="login-orbit-node login-orbit-node-b" />
            <span className="login-orbit-node login-orbit-node-c" />
          </div>
        </section>

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
    </div>
  );
};

export default LoginPage;
