const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const itemRoutes = require('./item.routes');
const categoryRoutes = require('./category.routes');
const subCategoryRoutes = require('./subCategory.routes');
const conversationRoutes = require('./conversation.routes');
const messageRoutes = require('./message.routes');
const notificationRoutes = require('./notification.routes');
const searchRoutes = require('./search.routes');
const keeperRoutes = require('./keeper.routes');
const adminRoutes = require('./admin.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subCategoryRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/keepers', keeperRoutes);
router.use('/admin', adminRoutes);

module.exports = router;