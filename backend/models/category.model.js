const mongoose = require('mongoose');
const { Schema } = mongoose;

const categorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  isPredefined: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true }, // Ensure virtuals are included when converting to JSON
  toObject: { virtuals: true }, // Ensure virtuals are included when converting to a plain object
});

// Add the virtual field for subcategories
categorySchema.virtual('subcategories', {
  ref: 'SubCategory', // The model to use for population
  localField: '_id', // The field in the Category model
  foreignField: 'category', // The field in the SubCategory model that links to the Category
});

module.exports = mongoose.model('Category', categorySchema);