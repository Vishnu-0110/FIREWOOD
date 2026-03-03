const requiredEnv = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRE',
  'CORS_ORIGIN'
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
});
