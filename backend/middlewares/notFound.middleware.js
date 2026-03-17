// Middleware to handle undefined routes
exports.notFound = (req, res, next) => {
    res.status(404).json({ error: 'Route not found' });
  };