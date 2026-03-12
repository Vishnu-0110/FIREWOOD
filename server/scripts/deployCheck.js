const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const errors = [];
const warnings = [];

const nodeEnv = process.env.NODE_ENV || 'production';
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRE'];

if (nodeEnv === 'production') {
  requiredEnv.push('CORS_ORIGIN');
}

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    errors.push(`Missing required env variable: ${key}`);
  }
});

if (process.env.MONGO_URI && !/^mongodb(\+srv)?:\/\//.test(process.env.MONGO_URI)) {
  errors.push('MONGO_URI must start with mongodb:// or mongodb+srv://');
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  errors.push('JWT_SECRET must be at least 32 characters long');
}

if (process.env.CORS_ORIGIN) {
  const origins = process.env.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.includes('*')) {
    errors.push('CORS_ORIGIN cannot contain "*" because credentials are enabled');
  }

  const invalidOrigins = origins
    .filter((origin) => {
      try {
        const parsed = new URL(origin);
        return !['http:', 'https:'].includes(parsed.protocol);
      } catch (error) {
        return true;
      }
    });

  if (invalidOrigins.length > 0) {
    errors.push(`CORS_ORIGIN has invalid URL(s): ${invalidOrigins.join(', ')}`);
  }
}

if (process.env.PORT && Number.isNaN(Number(process.env.PORT))) {
  errors.push('PORT must be a valid number');
}

if (process.env.RATE_LIMIT_WINDOW_MINUTES && (!Number.isInteger(Number(process.env.RATE_LIMIT_WINDOW_MINUTES)) || Number(process.env.RATE_LIMIT_WINDOW_MINUTES) <= 0)) {
  errors.push('RATE_LIMIT_WINDOW_MINUTES must be a positive integer');
}

if (process.env.RATE_LIMIT_MAX && (!Number.isInteger(Number(process.env.RATE_LIMIT_MAX)) || Number(process.env.RATE_LIMIT_MAX) <= 0)) {
  errors.push('RATE_LIMIT_MAX must be a positive integer');
}

if (process.env.SHUTDOWN_TIMEOUT_MS && (!Number.isInteger(Number(process.env.SHUTDOWN_TIMEOUT_MS)) || Number(process.env.SHUTDOWN_TIMEOUT_MS) <= 0)) {
  errors.push('SHUTDOWN_TIMEOUT_MS must be a positive integer');
}

if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY.toLowerCase();
  const isBooleanText = value === 'true' || value === 'false';
  const numeric = Number(process.env.TRUST_PROXY);
  const isPositiveNumber = Number.isInteger(numeric) && numeric > 0;

  if (!isBooleanText && !isPositiveNumber) {
    errors.push('TRUST_PROXY must be true, false, or a positive integer');
  }
}

const clientDistPath = process.env.CLIENT_DIST_PATH
  ? path.resolve(process.cwd(), process.env.CLIENT_DIST_PATH)
  : path.resolve(__dirname, '../../client/dist');

if (!fs.existsSync(clientDistPath)) {
  warnings.push(`Client build not found at ${clientDistPath}. This is fine for API-only deployment.`);
}

if (errors.length > 0) {
  console.error('Deployment check failed:');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log('Deployment check passed.');
if (warnings.length > 0) {
  warnings.forEach((message) => console.warn(`Warning: ${message}`));
}
