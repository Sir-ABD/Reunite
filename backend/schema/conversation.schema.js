const { z } = require('zod');

const createConversationSchema = z.object({
  itemId: z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: 'Invalid itemId format',
  }),
  participants: z.array(z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
    message: 'Invalid participant ID format',
  })).min(2, 'At least 2 participants are required'),
});

const getConversationsSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().transform(val => parseInt(val, 10)),
  limit: z.string().regex(/^\d+$/).optional().transform(val => parseInt(val, 10)),
});

module.exports = {
  createConversationSchema,
  getConversationsSchema,
};