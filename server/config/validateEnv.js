const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRE'];

if (process.env.NODE_ENV === 'production') {
  requiredEnv.push('CORS_ORIGIN');
}

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`Missing required env variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

if (process.env.CORS_ORIGIN) {
  const origins = process.env.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.includes('*')) {
    console.error('CORS_ORIGIN cannot contain "*" because credentials are enabled.');
    process.exit(1);
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
    console.error(`Invalid CORS_ORIGIN value(s): ${invalidOrigins.join(', ')}`);
    process.exit(1);
  }
}

const positiveIntegerEnv = ['PORT', 'RATE_LIMIT_WINDOW_MINUTES', 'RATE_LIMIT_MAX', 'SHUTDOWN_TIMEOUT_MS'];
for (const key of positiveIntegerEnv) {
  if (!process.env[key]) continue;
  const value = Number(process.env[key]);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`${key} must be a positive integer.`);
    process.exit(1);
  }
}

if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY.toLowerCase();
  const isBooleanText = value === 'true' || value === 'false';
  const numeric = Number(process.env.TRUST_PROXY);
  const isPositiveNumber = Number.isInteger(numeric) && numeric > 0;

  if (!isBooleanText && !isPositiveNumber) {
    console.error('TRUST_PROXY must be true, false, or a positive integer.');
    process.exit(1);
  }
}
