const { z } = require('zod');

// Schema for adding a new category
const addCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  description: z.string().optional(),
});

// Schema for updating a category
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(), // Allow toggling active/inactive status
});

module.exports = {
  addCategorySchema,
  updateCategorySchema,
};