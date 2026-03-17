const { z } = require('zod');
const { isValidObjectId } = require('mongoose');

const sendMessageSchema = z.object({
  sender: z.string().refine(val => isValidObjectId(val), { message: 'Invalid sender ID' }),
  content: z.string().min(1, 'Message content cannot be empty'),
});

const getMessagesSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a positive integer').transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a positive integer').transform(Number).default('10'),
}).strict();

module.exports = { sendMessageSchema, getMessagesSchema };