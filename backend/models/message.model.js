const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2'); // Import the plugin
const { Schema } = mongoose;

const messageSchema = new Schema({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: [true, 'Conversation is required'],
    index: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    index: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    minlength: 1,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true, // For soft deletion
  },
}, {
  timestamps: true,
});

messageSchema.plugin(mongoosePaginate); // Apply the pagination plugin to the schema
messageSchema.index({ conversation: 1, createdAt: -1 }); // Sort messages by creation time descending

module.exports = mongoose.model('Message', messageSchema);