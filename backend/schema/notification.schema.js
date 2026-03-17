const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

const markAsReadSchema = z.object({
  id: z.string().refine(val => isValidObjectId(val), { message: 'Invalid notification ID' }),
});

module.exports = { markAsReadSchema };