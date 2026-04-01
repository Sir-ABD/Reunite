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
router.get('/', authMiddleware.authenticate, keeperController.getKeepers);

// Get items assigned to the keeper
router.get('/assigned-items', authMiddleware.authenticate, isAdminOrAuthorized, keeperController.getAssignedItems);

// Assign a found item to a keeper
router.post('/:id/assign-keeper', 
  authMiddleware.authenticate, 
  isAdminOrAuthorized, 
  validate(idSchema, 'params'), 
  keeperController.assignKeeper
);

// Facilitate meeting
router.post('/items/:id/facilitate-meeting',
  authMiddleware.authenticate, 
  isAdminOrAuthorized, 
  validate(idSchema, 'params'), 
  keeperController.facilitateMeeting
);

module.exports = router;