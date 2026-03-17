const User = require('../models/user.model');
const Item = require('../models/item.model');
const Category = require('../models/category.model');
const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');

// Get a list of all users (admin-only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (page - 1) * limit;

    // Build the aggregation pipeline
    const pipeline = [];
    const matchConditions = { }; // Default to active users

    if (search) {
      matchConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
      ];
    }

    pipeline.push({ $match: matchConditions });
    pipeline.push({ $project: { name: 1, email: 1, role: 1, createdAt: 1, isActive: 1 } });
    pipeline.push({ $sort: { [sortBy]: order === 'asc' ? 1 : -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit, 10) });

    const users = await User.aggregate(pipeline);
    const total = await User.countDocuments(matchConditions);

    res.status(200).json({
      message: 'Users fetched successfully',
      users,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', code: 'SERVER_ERROR' });
  }
};

// Toggle user activation status (admin-only)
exports.toggleUserActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, [{ $set: { isActive: { $eq: [false, '$isActive'] } } }], { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    }
    res.status(200).json({ message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    console.error('Error toggling user activation:', error);
    res.status(500).json({ message: 'Failed to toggle user activation', code: 'SERVER_ERROR' });
  }
};

// Get a single user by ID (admin-only)
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, 'name email role createdAt isActive').lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    }
    res.status(200).json({ message: 'User fetched successfully', user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user', code: 'SERVER_ERROR' });
  }
};

// Get all items posted or claimed by a user (admin-only)
exports.getUserItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found or inactive', code: 'NOT_FOUND' });
    }

    const items = await Item.find({
      $or: [{ postedBy: id }, { claimedBy: id }],
      isActive: true
    })
      .populate('postedBy', 'name email')
      .populate('claimedBy', 'name email')
      .populate('category', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Item.countDocuments({
      $or: [{ postedBy: id }, { claimedBy: id }],
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

// Delete a user (admin-only) - Kept as is for now
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'NOT_FOUND' });
    }
    await Item.updateMany({ postedBy: id }, { postedBy: null });
    res.status(200).json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to deactivate user', code: 'SERVER_ERROR' });
  }
};

// Get a list of all items (admin-only)
// Get all items (with optional filters) - Updated to include extra details
exports.getItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search = '' } = req.query;

    // Build query for filtering items
    const query = { isActive: true }; // Only active items (adjust based on admin needs)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch paginated and sorted items
    const items = await Item.find(query)
      .populate('postedBy', 'name email') // Populate poster details
      .populate('category', 'name') // Populate category details
      .populate('keeper', 'name') // Populate keeper details
      .populate('claimedBy', 'name') // Populate claimant details
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 }) // Sort by field and order
      .limit(parseInt(limit)) // Limit results per page
      .skip((parseInt(page) - 1) * parseInt(limit)); // Skip items for pagination

    // Count total items for pagination metadata
    const totalItems = await Item.countDocuments(query);

    // Transform items to include keeperId, keeperName, claimedById, and claimedByName
    const transformedItems = items.map(item => ({
      ...item.toObject(),
      keeperId: item.keeper ? item.keeper._id : null,
      keeperName: item.keeper ? item.keeper.name : null,
      claimedById: item.claimedBy ? item.claimedBy._id : null,
      claimedByName: item.claimedBy ? item.claimedBy.name : null,
    }));

    res.status(200).json({
      message: 'Items fetched successfully',
      items: transformedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalResults: totalItems,
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items', code: 'SERVER_ERROR' });
  }
};

// New route handler for /admin/items (can reuse getItems logic or add admin-specific filters)
exports.getAllItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search = '' } = req.query;

    // Build query for filtering items (admin might see all items, including inactive)
    const query = {}; // No isActive filter for admin (adjust based on requirements)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch paginated and sorted items
    const items = await Item.find(query)
      .populate('postedBy', 'name email') // Populate poster details
      .populate('category', 'name') // Populate category details
      .populate('keeper', 'name') // Populate keeper details
      .populate('claimedBy', 'name') // Populate claimant details
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 }) // Sort by field and order
      .limit(parseInt(limit)) // Limit results per page
      .skip((parseInt(page) - 1) * parseInt(limit)); // Skip items for pagination

    // Count total items for pagination metadata
    const totalItems = await Item.countDocuments(query);

    // Transform items to include keeperId, keeperName, claimedById, and claimedByName
    const transformedItems = items.map(item => ({
      ...item.toObject(),
      keeperId: item.keeper ? item.keeper._id : null,
      keeperName: item.keeper ? item.keeper.name : null,
      claimedById: item.claimedBy ? item.claimedBy._id : null,
      claimedByName: item.claimedBy ? item.claimedBy.name : null,
    }));

    res.status(200).json({
      message: 'Items fetched successfully',
      items: transformedItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalResults: totalItems,
      },
    });
  } catch (error) {
    console.error('Error fetching all items:', error);
    res.status(500).json({ message: 'Failed to fetch items', code: 'SERVER_ERROR' });
  }
};

// Toggle item activation status (admin-only)
exports.toggleItemActivation = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndUpdate(id, [{ $set: { isActive: { $eq: [false, '$isActive'] } } }], { new: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }
    res.status(200).json({ message: `Item ${item.isActive ? 'activated' : 'deactivated'} successfully`, item });
  } catch (error) {
    console.error('Error toggling item activation:', error);
    res.status(500).json({ message: 'Failed to toggle item activation', code: 'SERVER_ERROR' });
  }
};

// Get a single item by ID (admin-only)
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ _id: id, isActive: true })
      .populate('postedBy', 'name email')
      .populate('category', 'name')
      .lean();
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }
    res.status(200).json({ message: 'Item fetched successfully', item });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Failed to fetch item', code: 'SERVER_ERROR' });
  }
};

// Delete an item (admin-only) - Kept as is for now
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }
    res.status(200).json({ message: 'Item deactivated successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to deactivate item', code: 'SERVER_ERROR' });
  }
};

// Get admin dashboard statistics
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments({ isActive: true });
    const claimedItems = await Item.countDocuments({ isClaimed: true, isActive: true });
    const unclaimedItems = await Item.countDocuments({ isClaimed: false, isActive: true });
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalCategories = await Category.countDocuments();

    const mostActiveUsers = await Item.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$postedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userDetails.name',
          email: '$userDetails.email',
          itemCount: '$count',
        },
      },
    ]);

    res.status(200).json({
      message: 'Admin dashboard stats fetched successfully',
      stats: {
        totalItems,
        claimedItems,
        unclaimedItems,
        totalUsers,
        totalCategories,
        mostActiveUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error.message);
    res.status(500).json({ message: 'Failed to fetch admin dashboard stats', code: 'SERVER_ERROR' });
  }
};

// Get conversations and messages (admin-only)
exports.getConversationsAndMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const conversations = await Conversation.find({ isActive: true })
      .populate('participants', 'name email')
      .populate('item', 'title status')
      .populate('lastMessage', 'content sender createdAt isRead')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const conversationIds = conversations.map(conv => conv._id);
    const messages = await Message.find({ conversation: { $in: conversationIds }, isActive: true })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 });

    const conversationsWithMessages = conversations.map(conv => ({
      ...conv.toObject(),
      messages: messages.filter(msg => msg.conversation.toString() === conv._id.toString()),
    }));

    const total = await Conversation.countDocuments({ isActive: true });
    res.status(200).json({
      message: 'Conversations and messages fetched successfully',
      conversations: conversationsWithMessages,
      pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.error('Error fetching conversations and messages:', error);
    res.status(500).json({ message: 'Failed to fetch conversations and messages', code: 'SERVER_ERROR' });
  }
};