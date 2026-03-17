const { z } = require('zod');

const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category name is required'),
  subCategory: z.string().min(1, 'Sub Category name is required'),
  tags: z.array(z.string()).optional(),
  status: z.enum(['Lost', 'Found', 'Claimed', 'Returned'], 'Status must be "Lost", "Found", "Claimed", or "Returned"'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  image: z.url('Image must be a valid URL').optional(),
});

const updateItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  category: z.string().min(1, 'Category name is required').optional(),
  subCategory: z.string().min(1, 'Sub Category name is required').optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['Lost', 'Found', 'Claimed', 'Returned']).optional(),
  location: z.string().min(3, 'Location must be at least 3 characters').optional(),
  image: z.url('Image must be a valid URL').optional(),
});

module.exports = { createItemSchema, updateItemSchema };