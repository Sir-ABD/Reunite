const { z } = require('zod');
const Item = require('../models/item.model');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');
const { createItemSchema, updateItemSchema } = require('../schema/item.schema');
const QRCode = require('qrcode');
const otpGenerator = require('otp-generator');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const Category = require('../models/category.model');
const SubCategory = require('../models/subCategory.model');

// Validation schemas for query parameters and body
const querySchema = z.object({
  page: z.string().regex(/^\d+$/).default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).default('10').transform(Number),
  sortBy: z.enum(['createdAt', 'title', 'status']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().max(100).optional(),
});

const assignKeeperSchema = z.object({
  keeperId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid keeper ID'),
  keeperName: z.string().trim().min(1).max(100),
});

// Helper function to send email and notification
const sendNotificationAndEmail = async (userId, emailSubject, emailTemplate, templateData, message, itemId, io) => {
  const user = await User.findById(userId).select('name email');
  if (user) {
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        await sendEmail(user.email, emailSubject, emailTemplate, templateData);
        console.log('Email sent', { userEmail: user.email });
      } else {
        console.warn('Email credentials missing, skipping email notification');
      }
    } catch (emailError) {
      console.error('Failed to send email', { error: emailError.message });
    }

    const notification = new Notification({
      userId: user._id,
      message,
      itemId,
      type: 'conversation',
      isRead: false,
    });
    await notification.save();

    io.to(user._id.toString()).emit('newNotification', notification);
  }
};

// Create a new item
exports.createItem = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const validatedData = createItemSchema.parse(req.body);
    const { title, description, subCategory, category, tags, status, location } = validatedData;
    let imageUrl = null;

    if (req.file) {
      const filePath = req.file.path;
      console.log('Uploading file to Cloudinary:', filePath);
      try {
        const result = await cloudinary.uploader.upload(filePath, { folder: 'lost-and-found' });
        imageUrl = result.secure_url;
        console.log('Cloudinary upload success:', imageUrl);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError.message);
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary', code: 'CLOUDINARY_ERROR', details: cloudinaryError.message });
      } finally {
        // Only delete files within the upload directory
        const UPLOAD_DIR = path.resolve(__dirname, '../../uploads'); // adjust as needed
        const resolvedPath = path.resolve(filePath);
        if (resolvedPath.startsWith(UPLOAD_DIR)) {
          await fs.unlink(resolvedPath).catch((err) => console.error('Failed to delete temp file:', err));
        } else {
          console.error('Attempted to delete file outside of upload directory:', resolvedPath);
        }
      }
    }

    const categoryDoc = await Category.findOne({ name: category, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({ message: `Category '${category}' not found`, code: 'INVALID_CATEGORY' });
    }
    const subcategoryDoc = await SubCategory.findOne({ name: subCategory, isActive: true });
    if (!subcategoryDoc) {
      return res.status(400).json({ message: `Category '${subCategory}' not found`, code: 'INVALID_CATEGORY' });
    }

    const newItem = new Item({
      title,
      description,
      category: categoryDoc._id,
      subCategory: subcategoryDoc._id,
      tags,
      status,
      location,
      image: imageUrl,
      postedBy: req.user.id,
      isActive: true,
    });

    await newItem.save();
    res.status(201).json({ message: 'Item created successfully', item: newItem });
  } catch (error) {
    console.error('Error creating item:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to create item', code: 'SERVER_ERROR' });
  }
};

// Get all items (with optional filters)
exports.getItems = async (req, res) => {
  try {
    const validatedQuery = querySchema.parse(req.query);
    const { page, limit, sortBy, order, search } = validatedQuery;

    const buildSearchQuery = async () => {
      const query = { isActive: true };
      const searchRegex = new RegExp(search, 'i');

      if (search) {
        // Find categories whose names match the search term
        const categories = await Category.find({ name: { $regex: searchRegex } }).select('_id');
        const categoryIds = categories.map(cat => cat._id);

        // Find subcategories whose names match the search term
        const subcategories = await SubCategory.find({ name: { $regex: searchRegex } }).select('_id');
        const subcategoryIds = subcategories.map(subcat => subcat._id);

        // Use the found IDs to build the main query
        query.$or = [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
          { category: { $in: categoryIds } },
          { subCategory: { $in: subcategoryIds } },
        ];
      }
      return query;
    };

    const finalQuery = await buildSearchQuery();

    const items = await Item.find(finalQuery)
      .populate('postedBy', 'name email')
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('keeper', 'name')
      .populate('claimedBy', 'name')
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalItems = await Item.countDocuments(finalQuery);

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
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalResults: totalItems,
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid query parameters', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to fetch items', code: 'SERVER_ERROR' });
  }
};

// Get details of a specific item
exports.getItemById = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true })
      .populate('postedBy', 'name email')
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .populate('keeper', 'name')
      .populate('claimedBy', 'name');

    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    const transformedItem = {
      ...item.toObject(),
      keeperId: item.keeper ? item.keeper._id : null,
      keeperName: item.keeper ? item.keeper.name : null,
      claimedById: item.claimedBy ? item.claimedBy._id : null,
      claimedByName: item.claimedBy ? item.claimedBy.name : null,
    };

    res.status(200).json({ item: transformedItem });
  } catch (error) {
    console.error('Error fetching item:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to fetch item', code: 'SERVER_ERROR' });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const updateData = updateItemSchema.parse(req.body);

    const item = await Item.findOne({ _id: id, isActive: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this item', code: 'FORBIDDEN' });
    }

    let imageUrl = item.image;
    if (req.file) {
      const filePath = req.file.path;
      console.log('Uploading new image to Cloudinary:', filePath);
      try {
        if (item.image) {
          const publicId = item.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`lost-and-found/${publicId}`);
          console.log('Old image deleted from Cloudinary:', publicId);
        }
        const result = await cloudinary.uploader.upload(filePath, { folder: 'lost-and-found' });
        imageUrl = result.secure_url;
        console.log('New image uploaded to Cloudinary:', imageUrl);
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError.message);
        await fs.unlink(filePath).catch((err) => console.error('Failed to delete temp file:', err));
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary', code: 'CLOUDINARY_ERROR', details: cloudinaryError.message });
      } finally {
        await fs.unlink(filePath).catch((err) => console.error('Failed to delete temp file:', err));
      }
    } else if (updateData.image) {
      imageUrl = updateData.image;
    }

    item.title = updateData.title || item.title;
    item.description = updateData.description || item.description;
    item.category = updateData.category ? (await Category.findOne({ name: updateData.category, isActive: true }))?._id : item.category;
    item.Subcategory = updateData.Subcategory ? (await Subcategory.findOne({ name: updateData.Subcategory, isActive: true }))?._id : item.category;
    item.tags = updateData.tags || item.tags;
    item.status = updateData.status || item.status;
    item.location = updateData.location || item.location;
    item.image = imageUrl;

    await item.save();

    res.status(200).json({ message: 'Item updated successfully', item });
  } catch (error) {
    console.error('Error updating item:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to update item', code: 'SERVER_ERROR' });
  }
};

// Generate a QR Code for an item
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const item = await Item.findOne({ _id: id, isActive: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    const qrData = JSON.stringify({ itemId: item._id, status: item.status });
    const qrCode = await QRCode.toDataURL(qrData);
    res.status(200).json({ message: 'QR code generated successfully', qrCode });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Failed to generate QR code', code: 'SERVER_ERROR' });
  }
};

// Scan a QR Code to verify ownership or status
exports.scanQRCode = async (req, res) => {
  try {
    const { qrData } = z.object({ qrData: z.string().min(1) }).parse(req.body);
    const parsedData = JSON.parse(qrData);

    const item = await Item.findOne({ _id: parsedData.itemId, isActive: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.status !== parsedData.status) {
      return res.status(400).json({ message: 'QR code data is invalid or outdated', code: 'INVALID_QR' });
    }

    res.status(200).json({ message: 'QR code verified successfully', item });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ message: 'Failed to scan QR code', code: 'SERVER_ERROR' });
  }
};

// Generate an OTP for claiming an item
exports.generateOTP = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy claimedBy', 'name email _id');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (req.user.id !== item.postedBy._id.toString() && (item.keeper && req.user.id !== item.keeper.toString())) {
      return res.status(403).json({
        message: 'Only the poster or keeper can generate OTP',
        code: 'FORBIDDEN',
        debug: {
          userId: req.user.id,
          postedById: item.postedBy._id.toString(),
          keeperId: item.keeper ? item.keeper.toString() : null,
        },
      });
    }

    if (item.claimOTP && item.otpExpiresAt && Date.now() < item.otpExpiresAt) {
      console.log('Valid OTP already exists', { otp: item.claimOTP });
      const emailSubject = 'Claim Transaction Verification';
      const io = req.app.get('io');
      if (item.claimedBy) {
        await sendNotificationAndEmail(
          item.claimedBy,
          emailSubject,
          'claimTransaction',
          {
            name: item.claimedBy.name,
            itemTitle: item.title,
            otp: item.claimOTP,
            ownerName: item.postedBy.name,
          },
          `To complete the transaction of item "${item.title}" please verify the OTP ${item.claimOTP} with the owner or keeper of the item posted by ${item.postedBy.name}.`,
          item._id,
          io
        );
      }
      return res.status(200).json({ message: 'Using existing valid OTP', otp: item.claimOTP });
    }

    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    item.claimOTP = otp;
    item.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await item.save();
    console.log('New OTP generated:', otp);

    const emailSubject = 'Claim Transaction Verification';
    const io = req.app.get('io');
    if (item.claimedBy) {
      await sendNotificationAndEmail(
        item.claimedBy,
        emailSubject,
        'claimTransaction',
        {
          name: item.claimedBy.name,
          itemTitle: item.title,
          otp,
          ownerName: item.postedBy.name,
        },
        `To complete the transaction of item "${item.title}" please verify the OTP ${otp} with the owner or keeper of the item posted by ${item.postedBy.name}.`,
        item._id,
        io
      );
    } else {
      console.warn('No claimant found for OTP generation');
    }

    res.status(200).json({ message: 'OTP generated successfully', otp });
  } catch (error) {
    console.error('Error generating OTP:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to generate OTP', code: 'SERVER_ERROR' });
  }
};

// Verify an OTP for claiming an item
exports.verifyOTP = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const { otp } = z.object({ otp: z.string().length(6).regex(/^\d+$/) }).parse(req.body);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy claimedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.claimOTP !== otp || Date.now() > item.otpExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP', code: 'INVALID_OTP' });
    }

    item.status = 'Returned';
    item.claimedBy = null;
    item.isClaimed = false;
    item.claimOTP = null;
    item.otpExpiresAt = null;
    await item.save();

    const emailSubject = 'Your Lost Item Has Been Returned';
    const io = req.app.get('io');

    await sendNotificationAndEmail(
      item.postedBy,
      emailSubject,
      'returnNotification',
      { name: item.postedBy.name, itemTitle: item.title },
      `Your item "${item.title}" has been marked as returned.`,
      item._id,
      io
    );

    if (item.claimedBy) {
      await sendNotificationAndEmail(
        item.claimedBy,
        'Claim Transaction Completed',
        'claimNotification',
        { name: item.claimedBy.name, itemTitle: item.title },
        `Your claim for "${item.title}" has been completed and the item is marked as returned.`,
        item._id,
        io
      );
    }

    res.status(200).json({ message: 'OTP verified successfully. Item marked as returned.', item });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid input', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to verify OTP', code: 'SERVER_ERROR' });
  }
};

// Claim an item
exports.claimItem = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.isClaimed) {
      return res.status(400).json({ message: 'This item has already been claimed', code: 'ALREADY_CLAIMED' });
    }

    item.status = 'Claimed';
    item.claimedBy = req.user.id;
    item.isClaimed = true;
    await item.save();

    const emailSubject = 'Your Lost Item Has Been Claimed';
    const io = req.app.get('io');

    await sendNotificationAndEmail(
      item.postedBy,
      emailSubject,
      'claimNotification',
      { name: item.postedBy.name, itemTitle: item.title },
      `Your item "${item.title}" has been claimed.`,
      item._id,
      io
    );

    const otp = otpGenerator.generate(6, { digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false });
    item.claimOTP = otp;
    item.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await item.save();

    const claimant = await User.findById(req.user.id).select('name email');
    await sendNotificationAndEmail(
      req.user.id,
      'Claim Transaction Verification',
      'claimTransaction',
      {
        name: claimant.name,
        itemTitle: item.title,
        otp,
        ownerName: item.postedBy.name,
      },
      `To complete the transaction of item "${item.title}" please verify the OTP ${otp} with the owner or keeper of the item posted by ${item.postedBy.name}.`,
      item._id,
      io
    );

    res.status(200).json({ message: 'Item claimed successfully', item });
  } catch (error) {
    console.error('Error claiming item:', error);
    res.status(500).json({ message: 'Failed to claim item', code: 'SERVER_ERROR' });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true });
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this item', code: 'FORBIDDEN' });
    }

    item.isActive = false;
    await item.save();

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to delete item', code: 'SERVER_ERROR' });
  }
};

// Assign a keeper to an item
exports.assignKeeper = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const { keeperId, keeperName } = assignKeeperSchema.parse(req.body);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.keeper) {
      return res.status(400).json({ message: 'This item already has a keeper assigned', code: 'KEEPER_ALREADY_ASSIGNED' });
    }

    const keeperExists = await User.findById(keeperId);
    if (!keeperExists) {
      return res.status(404).json({ message: 'Keeper not found', code: 'KEEPER_NOT_FOUND' });
    }

    item.keeper = keeperId;
    await item.save();

    const emailSubject = 'A Keeper Has Been Assigned to Your Lost Item';
    await sendNotificationAndEmail(
      item.postedBy,
      emailSubject,
      'keeperAssignedNotification',
      { name: item.postedBy.name, itemTitle: item.title, keeperName },
      `A keeper (${keeperName}) has been assigned to your item "${item.title}".`,
      item._id,
      req.app.get('io')
    );

    res.status(200).json({ message: 'Keeper assigned successfully', item });
  } catch (error) {
    console.error('Error assigning keeper:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid input', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to assign keeper', code: 'SERVER_ERROR' });
  }
};