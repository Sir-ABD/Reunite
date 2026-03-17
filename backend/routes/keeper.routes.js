const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const keeperController = require('../controllers/keeper.controller');
const { validate } = require('../middlewares/validate.middleware');
const { idSchema } = require('../schema/common.schema'); // Import common validation schema

// Middleware to check admin or authorized user role
const isAdminOrAuthorized = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'keeper') {
    return res.status(403).json({ error: 'Access denied. Admins or authorized users only.' });
  }
  next();
};

// Get a list of available keepers
router.get('/', authMiddleware.authenticate, isAdminOrAuthorized, keeperController.getKeepers);

// Assign a found item to a keeper
router.post('/:id/assign-keeper', 
  authMiddleware.authenticate, 
  isAdminOrAuthorized, 
  validate(idSchema), 
  keeperController.assignKeeper
);

module.exports = router;