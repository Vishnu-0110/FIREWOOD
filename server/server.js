const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

dotenv.config();
require('./config/validateEnv');

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const backupRoutes = require('./routes/backupRoutes');

const sanitizeRequest = require('./middleware/sanitizeMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

/* =========================
   DATABASE CONNECTION
========================= */
connectDB();

/* =========================
   APP INITIALIZATION
========================= */
const app = express();

/* =========================
   CORS CONFIGURATION
========================= */
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      const isLocalDevOrigin = Boolean(origin) && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalDevOrigin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy blocked this origin'));
    }
  })
);

/* =========================
   SECURITY MIDDLEWARE
========================= */
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeRequest);
app.use(hpp());
app.use(morgan('combined'));

/* =========================
   RATE LIMITER
========================= */
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  })
);

/* =========================
   HEALTH ROUTES
========================= */
app.get('/', (req, res) => {
  res.send('Firewood API is running 🚀');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

/* =========================
   API ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);

/* =========================
   ERROR HANDLING
========================= */
app.use(notFound);
app.use(errorHandler);

/* =========================
   SERVER START
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
