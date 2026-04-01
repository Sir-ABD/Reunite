const User = require('../models/user.model');
const Item = require('../models/item.model');
const Conversation = require('../models/conversation.model');

// Get a list of available keepers
exports.getKeepers = async (req, res) => {
  try {
    const keepers = await User.find({ role: 'keeper' }, 'name email createdAt'); // Select only necessary fields
    res.status(200).json({ keepers });
  } catch (error) {
    console.error('Error fetching keepers:', error);
    res.status(500).json({ error: 'Failed to fetch keepers' });
  }
};

// Assign a found item to a keeper
exports.assignKeeper = async (req, res) => {
  try {
    const { id } = req.params; // Item ID
    const { keeperId } = req.body; // Keeper's user ID

    // Find the item
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Find the keeper
    const keeper = await User.findById(keeperId);
    if (!keeper || keeper.role !== 'keeper') {
      return res.status(400).json({ error: 'Invalid or unauthorized keeper' });
    }

    // Assign the keeper to the item
    item.keeper = keeperId;
    await item.save();

    res.status(200).json({ message: 'Item assigned to keeper successfully', item });
  } catch (error) {
    console.error('Error assigning keeper:', error);
    res.status(500).json({ error: 'Failed to assign keeper' });
  }
};

// Get items assigned to the keeper
exports.getAssignedItems = async (req, res) => {
  try {
    const keeperId = req.user.id;
    const items = await Item.find({ keeper: keeperId, isActive: true })
      .populate('postedBy', 'name email')
      .populate('category', 'name')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ message: 'Assigned items fetched successfully', items });
  } catch (error) {
    console.error('Error fetching assigned items:', error);
    res.status(500).json({ error: 'Failed to fetch assigned items' });
  }
};

// Facilitate a meeting (create a 3-way conversation)
exports.facilitateMeeting = async (req, res) => {
  try {
    const { id } = req.params; // Item ID
    const keeperId = req.user.id;

    const item = await Item.findOne({ _id: id, isActive: true });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.keeper?.toString() !== keeperId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not the assigned keeper for this item' });
    }

    if (!item.postedBy || !item.claimedBy) {
      return res.status(400).json({ error: 'Item must have both a poster and a claimant to facilitate a meeting' });
    }

    // Use a Set to ensure all participants are unique, then convert back to an array
    const participants = Array.from(new Set([
      item.postedBy.toString(),
      item.claimedBy.toString(),
      keeperId
    ])).sort();
    
    // Check if conversation already exists (order-independent search)
    const existingConversation = await Conversation.findOne({
      item: id,
      participants: { $size: participants.length, $all: participants },
      isActive: true,
    });

    if (existingConversation) {
      return res.status(200).json({ message: 'Meeting conversation already exists', conversation: existingConversation });
    }

    const conversation = new Conversation({
      item: id,
      participants,
      isActive: true,
    });

    await conversation.save();
    console.log('Facilitated meeting and created conversation:', conversation._id);

    res.status(201).json({ message: 'Meeting conversation created successfully', conversation });
  } catch (error) {
    console.error('Error facilitating meeting:', error);
    res.status(500).json({ error: 'Failed to facilitate meeting' });
  }
};