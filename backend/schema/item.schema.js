const { z } = require('zod');

const createItemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description is too short'), 
  category: z.string().min(1, 'Category name is required'),
  
  // FIX: Make subCategory optional so it doesn't crash if empty
  subCategory: z.string().optional().default('General'), 
  
  tags: z.array(z.string()).optional(),
  status: z.enum(['Lost', 'Found', 'Claimed', 'Returned']),
  location: z.string().min(3, 'Location is required'),
  
  coordinates: z.string().optional().transform(val => {
    if (!val) return undefined;
    try { 
      const parsed = JSON.parse(val); 
      return { lat: Number(parsed.lat), lng: Number(parsed.lng) };
    } catch(e) { return undefined; }
  }),
  image: z.any().optional(), 
});

const updateItemSchema = createItemSchema.partial(); // This makes all fields optional for updates

module.exports = { createItemSchema, updateItemSchema };