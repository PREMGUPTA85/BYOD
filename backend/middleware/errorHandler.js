// middleware/errorHandler.js
// Global error handling middleware
// Must have 4 arguments: (err, req, res, next) — Express recognizes this as an error handler

function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // If response is already being sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
