const Item = require('../models/item.model');
const mongoose = require('mongoose');

// Middleware to check if the user owns the item
exports.checkOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ID format (move to separate middleware if preferred)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid item ID', code: 'INVALID_ID' });
    }

    const item = await Item.findOne({ _id: id, isActive: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found or inactive', code: 'ITEM_NOT_FOUND' });
    }

    // Allow admins to bypass ownership check
    if (req.user.role !== 'admin' && item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to perform this action', code: 'FORBIDDEN' });
    }

    req.item = item; // Optionally attach item for downstream use
    next();
  } catch (error) {
    console.error('Ownership Check Error:', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to check ownership', code: 'SERVER_ERROR' });
  }
};

module.exports = exports;