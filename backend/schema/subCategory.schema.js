const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

// Schema for adding a new subcategory
const addSubCategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required').trim(),
  description: z.string().optional(),
  // Validate that categoryId is a valid ObjectId using refine
  categoryId: z.string().refine(val => isValidObjectId(val), {
    message: 'Invalid parent category ID',
  }),
});

// Schema for updating a subcategory
const updateSubCategorySchema = z.object({
  name: z.string().min(1, 'Subcategory name is required').trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

module.exports = {
  addSubCategorySchema,
  updateSubCategorySchema,
};