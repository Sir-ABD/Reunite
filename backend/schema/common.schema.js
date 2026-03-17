const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

// Schema for validating MongoDB ObjectIds in params (e.g., req.params)
const idSchema = z.object({
  id: z.string().refine(val => isValidObjectId(val), { message: 'Invalid ObjectId' }),
});

module.exports = { idSchema };