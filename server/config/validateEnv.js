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
  const invalidOrigins = process.env.CORS_ORIGIN
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .filter((origin) => {
      if (origin === '*') return false;
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
