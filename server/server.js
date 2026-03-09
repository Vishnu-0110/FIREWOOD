const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

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

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/* =========================
   APP INITIALIZATION
========================= */
const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY) {
  const trustProxy = /^(true|false)$/i.test(process.env.TRUST_PROXY)
    ? process.env.TRUST_PROXY.toLowerCase() === 'true'
    : toPositiveInteger(process.env.TRUST_PROXY, process.env.TRUST_PROXY);
  app.set('trust proxy', trustProxy);
} else if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/* =========================
   CORS CONFIGURATION
========================= */
const normalizeOrigin = (origin) => origin.replace(/\/+$/, '');
const configuredOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => (origin === '*' ? origin : normalizeOrigin(origin)));

const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowAllOrigins = allowedOrigins.includes('*');

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const isLocalDevOrigin = Boolean(origin) && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (allowAllOrigins || allowedOrigins.includes(normalizedOrigin) || (process.env.NODE_ENV !== 'production' && isLocalDevOrigin)) {
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
const rateLimitWindowMinutes = toPositiveInteger(process.env.RATE_LIMIT_WINDOW_MINUTES, 15);
const rateLimitMax = toPositiveInteger(process.env.RATE_LIMIT_MAX, 300);

app.use(
  '/api',
  rateLimit({
    windowMs: rateLimitWindowMinutes * 60 * 1000,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.'
  })
);

/* =========================
   STATIC CLIENT (OPTIONAL)
========================= */
const clientDistPath = process.env.CLIENT_DIST_PATH
  ? path.resolve(process.cwd(), process.env.CLIENT_DIST_PATH)
  : path.resolve(__dirname, '../client/dist');

const hasClientBuild = fs.existsSync(clientDistPath);
if (hasClientBuild) {
  app.use(express.static(clientDistPath));
  console.log(`Serving frontend from ${clientDistPath}`);
}

/* =========================
   HEALTH ROUTES
========================= */
const dbStateLabels = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting'
};

app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    database: dbStateLabels[dbState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    ready: dbReady,
    database: dbStateLabels[mongoose.connection.readyState] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

/* =========================
   API ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);

if (hasClientBuild) {
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Firewood API is running');
  });
}

/* =========================
   ERROR HANDLING
========================= */
app.use(notFound);
app.use(errorHandler);

/* =========================
   SERVER START
========================= */
const PORT = Number(process.env.PORT || 5000);
const SHUTDOWN_TIMEOUT_MS = Number(process.env.SHUTDOWN_TIMEOUT_MS || 10000);

let server;
let isShuttingDown = false;

const shutdown = async (signal, error) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (error) {
    console.error(`${signal} received with error:`);
    console.error(error);
  } else {
    console.log(`${signal} received, shutting down gracefully...`);
  }

  const forceExitTimer = setTimeout(() => {
    console.error(`Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  if (server) {
    await new Promise((resolve) => {
      server.close((closeError) => {
        if (closeError) {
          console.error('HTTP server close error:', closeError);
        }
        resolve();
      });
    });
  }

  try {
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed');
  } catch (dbCloseError) {
    console.error('Error while closing MongoDB connection:', dbCloseError);
  }

  process.exit(error ? 1 : 0);
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (reason) => {
  void shutdown('unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  void shutdown('uncaughtException', error);
});

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();
