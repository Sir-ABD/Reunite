const authMiddleware = require('./auth.middleware');
const validateMiddleware = require('./validate.middleware');
const errorMiddleware = require('./error.middleware');
const loggerMiddleware = require('./logger.middleware');
const corsMiddleware = require('./cors.middleware');
const notFoundMiddleware = require('./notFound.middleware');
const rateLimitMiddleware = require('./rateLimit.middleware');
const fileUploadMiddleware = require('./fileUpload.middleware');
const checkOwnershipMiddleware = require('./checkOwner.middleware');

module.exports = {
  authMiddleware,
  validateMiddleware,
  errorMiddleware,
  loggerMiddleware,
  corsMiddleware,
  notFoundMiddleware,
  rateLimitMiddleware,
  fileUploadMiddleware,
  checkOwnershipMiddleware,
};