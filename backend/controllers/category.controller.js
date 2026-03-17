const Category = require('../models/category.model');

// Get all categories (public, only active categories)
exports.getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 }) // Alphabetical order
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('subcategories');
    const total = await Category.countDocuments({ isActive: true });
    res.status(200).json({
      message: 'Categories fetched successfully',
      categories,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Error fetching categories:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch categories', code: 'FETCH_ERROR' });
  }
};

// Get all categories for admin (both active and inactive, admin-only)
exports.getAllCategoriesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const categories = await Category.find() // Fetch all categories, regardless of isActive
      .sort({ name: 1 }) // Alphabetical order
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Category.countDocuments();
    res.status(200).json({
      message: 'All categories fetched successfully for admin',
      categories,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Error fetching all categories for admin:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch categories for admin', code: 'FETCH_ERROR' });
  }
};

// Add a new category (admin-only)
exports.addCategory = async (req, res) => {
  try {
    // Check if user is authorized (admin role is already checked by middleware)
    // Validate request body using middleware (req.validatedBody)
    const { name, description } = req.validatedBody;

    const existingCategory = await Category.findOne({ name: name.toLowerCase() });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists', code: 'CATEGORY_EXISTS' });
    }

    const category = new Category({ 
      name, 
      description, 
      isPredefined: false // Explicitly user-added
    });
    await category.save();

    res.status(201).json({ message: 'Category added successfully', category });
  } catch (error) {
    console.error('Error adding category:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to add category', code: 'SERVER_ERROR' });
  }
};

// Update a category (admin-only)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.validatedBody;

    // Find the category by ID
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found', code: 'NOT_FOUND' });
    }

    // If name is provided, check for duplicates (excluding the current category)
    if (name) {
      const existingCategory = await Category.findOne({ name: name.toLowerCase(), _id: { $ne: id } });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists', code: 'CATEGORY_EXISTS' });
      }
      category.name = name;
    }

    // Update description if provided
    if (description !== undefined) {
      category.description = description;
    }

    // Toggle isActive if provided
    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    res.status(200).json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update category', code: 'SERVER_ERROR' });
  }
};

// Delete a category (admin-only, soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and update the category to inactive (soft delete)
    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found', code: 'NOT_FOUND' });
    }

    res.status(200).json({ message: 'Category deactivated successfully' });
  } catch (error) {
    console.error('Error deleting category:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to deactivate category', code: 'SERVER_ERROR' });
  }
};

module.exports = exports;