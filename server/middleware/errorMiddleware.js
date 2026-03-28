const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (statusCode >= 500) {
    console.error(
      `[ERROR] ${req.method} ${req.originalUrl} status=${statusCode} message=${err.message || 'Internal server error'}`
    );
  }

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : (err.message || 'Internal server error'),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { notFound, errorHandler };
