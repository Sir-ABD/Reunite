const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Item = require('../models/item.model');

// Get current user's profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Use req.user.id instead of req.user._id
    console.log('Fetching profile for user ID:', userId);

    const user = await User.findOne({ _id: userId, isActive: true }).select('-password');
    console.log('Profile query result:', user);
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive', code: 'NOT_FOUND' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile', code: 'SERVER_ERROR' });
  }
};

// Get current user's items (posted or claimed)
exports.getItems = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const userId = req.user.id; // Use req.user.id instead of req.user._id
    console.log('Authenticated user ID:', userId, typeof userId);

    const userWithoutActiveFilter = await User.findOne({ _id: userId });
    console.log('User (without isActive filter):', userWithoutActiveFilter);

    const user = await User.findOne({ _id: userId, isActive: true });
    console.log('User (with isActive filter):', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found or inactive', code: 'NOT_FOUND' });
    }

    const items = await Item.find({
      $or: [
        { postedBy: userId },
        { claimedBy: userId }
      ],
      isActive: true
    })
      .populate('postedBy', 'name email')
      .populate('claimedBy', 'name email')
      .populate('category', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Item.countDocuments({
      $or: [
        { postedBy: userId },
        { claimedBy: userId }
      ],
      isActive: true
    });

    res.status(200).json({
      message: 'User items fetched successfully',
      items,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Error fetching user items:', error);
    res.status(500).json({ message: 'Failed to fetch user items', code: 'SERVER_ERROR' });
  }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Use req.user.id instead of req.user._id
    console.log('Updating profile for user ID:', userId);

    const { name, email } = req.body;

    const user = await User.findOneAndUpdate(
      { _id: userId, isActive: true },
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('Updated user:', user);
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive', code: 'NOT_FOUND' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile', code: 'SERVER_ERROR' });
  }
};

// Delete current user's account
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; // Use req.user.id instead of req.user._id
    console.log('Deleting account for user ID:', userId);

    const user = await User.findOneAndUpdate(
      { _id: userId, isActive: true },
      { isActive: false },
      { new: true }
    );

    console.log('Deleted user:', user);
    if (!user) {
      return res.status(404).json({ error: 'User not found or already inactive', code: 'NOT_FOUND' });
    }

    res.status(200).json({ message: 'Account deactivated successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account', code: 'SERVER_ERROR' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Updating password for user ID:', userId);

    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({ _id: userId, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found or inactive', code: 'NOT_FOUND' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password); // Assuming User model has comparePassword method
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
    }

    user.password = newPassword; // Hashing should be handled by User model's pre-save hook
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password', code: 'SERVER_ERROR' });
  }
};

module.exports = exports;