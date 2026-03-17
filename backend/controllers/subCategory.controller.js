const SubCategory = require('../models/subCategory.model');
const Category = require('../models/category.model');

// Get all subcategories for a specific category (public, only active)
exports.getSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const subCategories = await SubCategory.find({ isActive: true, category: categoryId })
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await SubCategory.countDocuments({ isActive: true, category: categoryId });

    res.status(200).json({
      message: 'SubCategories fetched successfully',
      subCategories,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Error fetching subcategories:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch subcategories', code: 'FETCH_ERROR' });
  }
};

// Get all subcategories for admin (both active and inactive)
exports.getAllSubCategoriesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // We can populate the parent category's name for a better admin view
    const subCategories = await SubCategory.find()
      .populate('category', 'name') // Only get the 'name' field from the Category
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await SubCategory.countDocuments();

    res.status(200).json({
      message: 'All subcategories fetched successfully for admin',
      subCategories,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Error fetching all subcategories for admin:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch subcategories for admin', code: 'FETCH_ERROR' });
  }
};

// Add a new subcategory (admin-only)
exports.addSubCategory = async (req, res) => {
  try {
    const { name, description, categoryId } = req.validatedBody;

    // Check if the parent category exists and is active
    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      return res.status(404).json({ message: 'Parent category not found', code: 'CATEGORY_NOT_FOUND' });
    }
    if (!parentCategory.isActive) {
        return res.status(400).json({ message: 'Cannot add subcategory to an inactive category', code: 'CATEGORY_INACTIVE' });
    }

    // Check for duplicate subcategory name within the same parent category
    const existingSubCategory = await SubCategory.findOne({ name: name.toLowerCase(), category: categoryId });
    if (existingSubCategory) {
      return res.status(400).json({ message: 'Subcategory already exists in this category', code: 'SUBCATEGORY_EXISTS' });
    }

    const subCategory = new SubCategory({
      name,
      description,
      category: categoryId // Link the subcategory to its parent
    });
    await subCategory.save();

    res.status(201).json({ message: 'SubCategory added successfully', subCategory });
  } catch (error) {
    console.error('Error adding subcategory:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to add subcategory', code: 'SERVER_ERROR' });
  }
};

// Update a subcategory (admin-only)
exports.updateSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.validatedBody;

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found', code: 'NOT_FOUND' });
    }

    // If name is updated, check for duplicates in the same parent category
    if (name && name !== subCategory.name) {
      const existingSubCategory = await SubCategory.findOne({
        name: name.toLowerCase(),
        category: subCategory.category,
        _id: { $ne: id }
      });
      if (existingSubCategory) {
        return res.status(400).json({ message: 'SubCategory name already exists in this category', code: 'SUBCATEGORY_EXISTS' });
      }
      subCategory.name = name;
    }

    if (description !== undefined) {
      subCategory.description = description;
    }

    if (isActive !== undefined) {
      subCategory.isActive = isActive;
    }

    await subCategory.save();

    res.status(200).json({ message: 'SubCategory updated successfully', subCategory });
  } catch (error) {
    console.error('Error updating subcategory:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update subcategory', code: 'SERVER_ERROR' });
  }
};

// Delete a subcategory (admin-only, soft delete)
exports.deleteSubCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subCategory = await SubCategory.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found', code: 'NOT_FOUND' });
    }

    res.status(200).json({ message: 'SubCategory deactivated successfully' });
  } catch (error) {
    console.error('Error deleting subcategory:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to deactivate subcategory', code: 'SERVER_ERROR' });
  }
};

module.exports = exports;