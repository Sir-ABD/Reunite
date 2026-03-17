const User = require('../models/user.model');
const Item = require('../models/item.model');

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

// Search for items with optional filters
exports.searchItems = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search = '', status } = req.query;
    const skip = (page - 1) * limit;

    const pipeline = [];

    // --- Lookup and Unwind Stages ---
    // Look up and unwind Category
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryData',
      },
    });
    pipeline.push({ $unwind: '$categoryData' });

    // Look up and unwind SubCategory
    pipeline.push({
      $lookup: {
        from: 'subcategories', // Ensure this matches your collection name
        localField: 'subCategory',
        foreignField: '_id',
        as: 'subCategoryData',
      },
    });
    pipeline.push({ $unwind: '$subCategoryData' });

    // Look up and unwind PostedBy
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'postedBy',
        foreignField: '_id',
        as: 'postedByData',
      },
    });
    pipeline.push({ $unwind: '$postedByData' });

    // --- Match Stage for Filtering ---
    const matchConditions = { isActive: true };
    if (status && status !== 'All' && ['Lost', 'Found', 'Claimed', 'Returned'].includes(status)) {
      matchConditions.status = status;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      matchConditions.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }, // Correctly searches an array of strings
        { location: searchRegex },
        { 'categoryData.name': searchRegex },
        { 'subCategoryData.name': searchRegex }, // Search by subcategory name
      ];
    }
    pipeline.push({ $match: matchConditions });

    // --- Pagination and Sorting Stages ---
    // Count total documents before pagination
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalResultsAgg = await Item.aggregate(countPipeline);
    const totalResults = totalResultsAgg.length > 0 ? totalResultsAgg[0].total : 0;
    
    // Sort, skip, and limit for fetching results
    pipeline.push({ $sort: { [sortBy]: order === 'asc' ? 1 : -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit, 10) });
    
    // --- Final Project Stage ---
    pipeline.push({
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        category: { _id: '$categoryData._id', name: '$categoryData.name' },
        subCategory: { _id: '$subCategoryData._id', name: '$subCategoryData.name' }, // Project subCategory data
        tags: 1,
        status: 1,
        location: 1,
        image: 1,
        postedBy: { _id: '$postedByData._id', name: '$postedByData.name', email: '$postedByData.email' },
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    const items = await Item.aggregate(pipeline);
    const totalPages = Math.ceil(totalResults / limit);

    res.status(200).json({
      message: 'Items fetched successfully',
      items,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalResults,
      },
    });
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
};