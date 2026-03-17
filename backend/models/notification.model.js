const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    minlength: 5,
    trim: true,
  },
  itemId: {
    type: Schema.Types.ObjectId,
    ref: 'Item',
    required: false, // Updated to false
    index: true,
  },
  type: {
    type: String,
    enum: ['item_claimed', 'item_returned', 'new_message', 'conversation', 'other'], // Added 'conversation'
    default: 'other',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ userId: 1, createdAt: -1 }); // Sort notifications by time descending
notificationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Notification', notificationSchema);