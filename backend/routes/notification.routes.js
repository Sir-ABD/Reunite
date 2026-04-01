const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');
const { validate } = require('../middlewares/validate.middleware');
const { markAsReadSchema } = require('../schema/notification.schema');

// Get all notifications for the current user
router.get(
  '/',
  authMiddleware.authenticate,
  notificationController.getNotifications
);

// Get the count of unread notifications
router.get(
  '/unread-count',
  authMiddleware.authenticate,
  notificationController.getUnreadCount
);

// Mark a notification as read
router.put(
  '/:id/read',
  authMiddleware.authenticate,
  validate(markAsReadSchema, 'params'), // Validate request params
  notificationController.markAsRead
);

module.exports = router;