const express = require('express');
const router = express.Router();

// Import necessary files for subcategory routes
const authMiddleware = require('../middlewares/auth.middleware');
const subCategoryController = require('../controllers/subCategory.controller');
const { validate } = require('../middlewares/validate.middleware');
const { idSchema } = require('../schema/common.schema.js');
const { addSubCategorySchema, updateSubCategorySchema } = require('../schema/subCategory.schema'); // You'll need to create these schemas

// Middleware to check admin role (can be a shared middleware)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

// 1. Add a new subcategory (admin-only)
// The request body will contain the categoryId
router.post('/', authMiddleware.authenticate, isAdmin, validate(addSubCategorySchema), subCategoryController.addSubCategory);

// 2. Get all subcategories for a specific category (public)
// This route is nested under a category ID to get subcategories for that parent.
router.get('/by-category/:categoryId', validate(idSchema, 'params'), subCategoryController.getSubCategories);

// 3. Get all subcategories for admin (both active and inactive, admin-only)
router.get('/admin', authMiddleware.authenticate, isAdmin, subCategoryController.getAllSubCategoriesForAdmin);

// 4. Update a subcategory (admin-only)
router.put('/:id', authMiddleware.authenticate, isAdmin, validate(idSchema, 'params'), validate(updateSubCategorySchema), subCategoryController.updateSubCategory);

// 5. Delete a subcategory (admin-only, soft delete)
router.delete('/:id', authMiddleware.authenticate, isAdmin, validate(idSchema, 'params'), subCategoryController.deleteSubCategory);

module.exports = router;