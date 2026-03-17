const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const adminController = require('../controllers/admin.controller');
const { validate } = require('../middlewares/validate.middleware');
const { idSchema } = require('../schema/common.schema.js');

router.get('/users', authMiddleware.authenticate, authMiddleware.isAdmin, adminController.getAllUsers);
router.get('/users/:id', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.getUserById);
router.get('/users/:id/items', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.getUserItems);
router.delete('/users/:id', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.deleteUser);
router.put('/users/:id/activate', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.toggleUserActivation);

router.get('/items', authMiddleware.authenticate, authMiddleware.isAdmin, adminController.getAllItems);
router.get('/items/:id', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.getItemById);
router.delete('/items/:id', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.deleteItem);
router.put('/items/:id/activate', authMiddleware.authenticate, authMiddleware.isAdmin, validate(idSchema, 'params'), adminController.toggleItemActivation);

router.get('/dashboard-stats', authMiddleware.authenticate, authMiddleware.isAdmin, adminController.getAdminDashboardStats);
router.get('/conversations', authMiddleware.authenticate, authMiddleware.isAdmin, adminController.getConversationsAndMessages);

module.exports = router;