const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');
const { validate } = require('../middlewares/validate.middleware');
const { updateUserSchema, updatePasswordSchema } = require('../schema/user.schema');
const { idSchema } = require('../schema/common.schema.js');

// Get current user's profile
router.get(
  '/me',
  authMiddleware.authenticate,
  userController.getProfile
);

// Get current user's items (posted or claimed)
router.get(
  '/me/items',
  authMiddleware.authenticate,
  userController.getItems
);

// Update current user's profile (name, email)
router.put(
  '/me',
  authMiddleware.authenticate,
  validate(updateUserSchema), // Validate name and email
  userController.updateProfile
);

// Update current user's password
router.put(
  '/me/password',
  authMiddleware.authenticate,
  validate(updatePasswordSchema),
  userController.updatePassword
);

// Delete current user's account
router.delete(
  '/me',
  authMiddleware.authenticate,
  userController.deleteAccount
);

module.exports = router;