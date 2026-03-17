const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2'); // Import the plugin
const { Schema } = mongoose;

const itemSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: 3,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: 10,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: [true, 'Sub Category is required'],
    index: true,
  },
  tags: [{
    type: String,
    validate: {
      validator: (tag) => typeof tag === 'string' && tag.trim().length > 0,
      message: 'Tags must be non-empty strings.',
    },
  }],
  status: {
    type: String,
    enum: ['Lost', 'Found', 'Claimed', 'Returned'],
    required: [true, 'Status is required'],
    index: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    minlength: 3,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Posted by user is required'],
    index: true,
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  returnedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  keeper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  qrCode: { type: String },
  qrCodeExpiresAt: { type: Date },
  claimOTP: { type: String },
  otpExpiresAt: { type: Date },
  isClaimed: { type: Boolean, default: false },
  isReturned: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }, // For soft deletion
}, {
  timestamps: true,
});

// Apply the pagination plugin to the schema
itemSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Item', itemSchema);