const { z } = require('zod');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const Item = require('../models/item.model');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');
const { createItemSchema, updateItemSchema } = require('../schema/item.schema');
const QRCode = require('qrcode');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
const Category = require('../models/category.model');
const SubCategory = require('../models/subCategory.model');
const { smartMatcher, generateEmbedding } = require('../utils/smartMatcher');

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

// Helper: build a deep link to an item on the frontend
const buildItemLink = (itemId) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}/items/${itemId}`;
};

// Helper function to send email and notification
const sendNotificationAndEmail = async (userId, emailSubject, emailTemplate, templateData, message, itemId, io, notifType = 'other') => {
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
      type: notifType,
      isRead: false,
    });
    await notification.save();

    if (io) io.to(user._id.toString()).emit('newNotification', notification);
  }
};

// Create a new item
exports.createItem = async (req, res) => {
  try {
    // 1. Validate Input
    const validatedData = createItemSchema.parse(req.body);
    const { title, description, subCategory, category, tags, status, location, coordinates } = validatedData;
    let imageUrl = null;
    let aiMessage = null;

    // 2. Handle Image Upload & AI Verification
    if (req.file) {
      const filePath = req.file.path;
      console.log('Processing file for AI Verification:', filePath);

      try {
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, { folder: 'lost-and-found' });
        imageUrl = uploadResult.secure_url;

        // AI GATEKEEPER CHECK
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const imageData = {
          inlineData: {
            data: (await fs.readFile(filePath)).toString("base64"),
            mimeType: req.file.mimetype,
          },
        };

        const prompt = `
          ACT AS A CAMPUS SECURITY AGENT.
          User claims this image is a: "${title}"
          Target Category: "${category}"
          TASK: Verify if the image matches the claimed item.

          If the image matches the description, reply with: "ACCEPTED: This image appears to be a ${title}."
          If the image does not match or is suspicious, reply with: "REJECTED: This image does not appear to be a ${title}."

          Reply with the full message.
        `;

        const aiResult = await model.generateContent([prompt, imageData]);
        aiMessage = aiResult.response.text().trim();

        console.log(`AI Agent Message for ${title}: ${aiMessage}`);

        if (aiMessage.startsWith("REJECTED")) {
          // Rollback Cloudinary upload if AI rejects it
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`lost-and-found/${publicId}`);

          return res.status(400).json({
            message: aiMessage,
            code: 'AI_VERIFICATION_FAILED'
          });
        } else if (aiMessage.startsWith("ACCEPTED")) {
          // AI accepted, continue
          console.log('AI accepted the image');
        } else {
          // Unexpected response
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`lost-and-found/${publicId}`);
          return res.status(400).json({
            message: 'AI verification failed: Unexpected response from AI.',
            code: 'AI_VERIFICATION_FAILED'
          });
        }
      } catch (innerError) {
        console.error('Upload/AI Error:', innerError.message);
        return res.status(500).json({ message: 'Verification failed', details: innerError.message });
      } finally {
        // Always clean up the local temp file
        const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
        if (path.resolve(filePath).startsWith(UPLOAD_DIR)) {
          await fs.unlink(filePath).catch((err) => console.error('Temp file delete failed:', err));
        }
      }
    }

    // 3. Database Operations (Find Category & Subcategory)
    const categoryDoc = await Category.findOne({ name: category, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({ message: `Category '${category}' not found`, code: 'INVALID_CATEGORY' });
    }

    const subcategoryDoc = await SubCategory.findOne({ name: subCategory, isActive: true });
    if (!subcategoryDoc) {
      return res.status(400).json({ message: `Subcategory '${subCategory}' not found`, code: 'INVALID_SUBCATEGORY' });
    }

    // 4. Generate embedding and final save
    const itemText = `${title} ${description}`;
    const textEmbedding = await generateEmbedding(itemText);

    const newItem = new Item({
      title,
      description,
      embedding: textEmbedding || [],
      category: categoryDoc._id,
      subCategory: subcategoryDoc._id,
      tags,
      status,
      location,
      coordinates,
      image: imageUrl,
      postedBy: req.user.id,
      isActive: true,
    });

    await newItem.save();
    const responseMessage = 'Item created successfully';
    
    // Trigger smart matcher in the background (don't wait for it)
    const populatedItem = await Item.findById(newItem._id)
      .populate('postedBy', 'name email _id')
      .populate('category', 'name')
      .populate('subCategory', 'name');
    
    const io = req.app.get('io');
    if (populatedItem) {
      smartMatcher(populatedItem, io).catch((err) => {
        console.error('Smart Matcher failed:', err);
      });
    }

    // Emit new item event for real-time updates
    if (io) {
      io.emit('newItem', { item: populatedItem });
    }
    
    res.status(201).json({ message: responseMessage, aiMessage, item: newItem });

  } catch (error) {
    console.error('Overall Error:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to create item', code: 'SERVER_ERROR' });
  }
};
//implementing AI coach to suggest improvements to title and description for better searchability and clarity
exports.improveText = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ 
        message: "Title and description are required for improvement." 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      CONTEXT: University Campus Lost & Found System (Reunite).
      USER INPUT: Title: "${title}", Description: "${description}".
      
      TASK: Rewrite these to be clearer and more searchable for students. 
      - Title should be concise (e.g., "Black Dell Laptop Charger").
      - Description should mention key visual identifiers.
      
      RETURN ONLY A JSON OBJECT:
      {
        "suggestedTitle": "...",
        "suggestedDescription": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Safety check to parse JSON even if AI adds markdown backticks
    const cleanedJson = responseText.replace(/```json|```/g, "").trim();
    
    let suggestions;
    try {
      suggestions = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message, "Response:", cleanedJson);
      return res.status(500).json({ message: "AI returned invalid response format." });
    }
    
    res.status(200).json(suggestions);

  } catch (error) {
    console.error("AI Coach Error:", error.message);
    res.status(500).json({ message: "AI was unable to suggest improvements." });
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

    if (item.postedBy.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'keeper') {
      return res.status(403).json({ message: 'You are not authorized to update this item', code: 'FORBIDDEN' });
    }

    const isSensitiveUpdate = updateData.status || updateData.category || updateData.subCategory || updateData.coordinates;
    const isSpecialUser = req.user.role === 'admin' || req.user.role === 'keeper';

    if (isSensitiveUpdate && !isSpecialUser) {
      return res.status(403).json({ 
        message: 'Only admins and keepers can update status, category, or coordinates', 
        code: 'FORBIDDEN' 
      });
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
    item.coordinates = updateData.coordinates !== undefined ? updateData.coordinates : item.coordinates;
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

// Confirm handoff of an item (previously verification of OTP)
exports.confirmHandoff = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy claimedBy keeper', 'name email _id');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.status !== 'Claimed' && item.status !== 'ClaimPending') {
      return res.status(400).json({ message: 'Item is not currently claimed', code: 'INVALID_STATE' });
    }

    if (req.user.id !== item.postedBy._id.toString() && (!item.keeper || req.user.id !== item.keeper._id.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the poster or keeper can confirm handoff', code: 'FORBIDDEN' });
    }

    const User = require('../models/user.model');
    const claimantRef = item.claimedBy ? await User.findById(item.claimedBy).select('name email') : null;

    item.status = 'Returned';
    item.claimedBy = null;
    item.isClaimed = false;
    item.claimApprovalPending = false;
    item.claimOTP = null;
    item.otpExpiresAt = null;
    await item.save();

    // Sync matched counterpart item
    if (item.matchedItemId) {
      await Item.findByIdAndUpdate(item.matchedItemId, {
        status: 'Returned',
        isReturned: true,
        keeperApproval: true,
      });
    }

    const io = req.app.get('io');
    const emailSubject = 'Your Lost Item Has Been Returned';

    // Notify owner/poster
    if (item.postedBy) {
      await sendNotificationAndEmail(
        item.postedBy._id,
        emailSubject,
        'returnNotification',
        { name: item.postedBy.name, itemTitle: item.title },
        `Your item "${item.title}" has been successfully handed over and returned.`,
        item._id,
        io,
        'item_returned'
      );
    }

    // Notify claimant if we captured them
    if (claimantRef) {
      await sendNotificationAndEmail(
        claimantRef._id,
        'Item Successfully Handed Over',
        'claimNotification',
        { name: claimantRef.name, itemTitle: item.title },
        `The handoff for "${item.title}" has been confirmed and the item is marked as returned.`,
        item._id,
        io,
        'item_returned'
      );
    }

    // Notify keeper if assigned
    if (item.keeper) {
      await sendNotificationAndEmail(
        item.keeper._id,
        'Item Handoff Confirmed | Reunite',
        'returnNotification',
        { name: 'Keeper', itemTitle: item.title },
        `The handoff for "${item.title}" was confirmed and the item is now marked as returned.`,
        item._id,
        io,
        'item_returned'
      );
    }

    res.status(200).json({ message: 'Handoff confirmed successfully. Item marked as returned.', item });
  } catch (error) {
    console.error('Error confirming handoff:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid input', code: 'VALIDATION_ERROR', details: error.errors });
    }
    res.status(500).json({ message: 'Failed to confirm handoff', code: 'SERVER_ERROR' });
  }
};

// Claim an item — gates on keeper approval when a keeper is assigned
exports.claimItem = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.isClaimed || item.status === 'Claimed') {
      return res.status(400).json({ message: 'This item has already been claimed', code: 'ALREADY_CLAIMED' });
    }

    if (item.claimApprovalPending || item.status === 'ClaimPending') {
      return res.status(400).json({ message: 'A claim request is already pending approval for this item', code: 'CLAIM_PENDING' });
    }

    const claimant = await User.findById(req.user.id).select('name email');
    const io = req.app.get('io');
    const itemLink = buildItemLink(item._id);

    if (item.keeper) {
      // ── KEEPER-GATED FLOW: set ClaimPending, wait for approval ──────────────
      item.status = 'ClaimPending';
      item.claimedBy = req.user.id;
      item.claimApprovalPending = true;
      await item.save();

      const keeper = await User.findById(item.keeper).select('name email');

      // 1. Notify KEEPER — action required
      if (keeper) {
        await sendNotificationAndEmail(
          keeper._id,
          'Claim Request Pending Your Approval | Reunite',
          'claimPendingApproval',
          { keeperName: keeper.name, claimantName: claimant.name, itemTitle: item.title, itemLink },
          `⚠️ Claim Request: ${claimant.name} wants to claim "${item.title}" — your approval is needed.`,
          item._id,
          io,
          'claimPending'
        );
      }

      // 2. Notify CLAIMANT — pending approval
      await sendNotificationAndEmail(
        req.user.id,
        'Claim Request Submitted | Reunite',
        'claimNotification',
        { name: claimant.name, itemTitle: item.title },
        `Your claim request for "${item.title}" has been submitted and is waiting for keeper approval.`,
        item._id,
        io,
        'claimPending'
      );

      // 3. Notify OWNER/POSTER — someone claimed their item
      await sendNotificationAndEmail(
        item.postedBy._id,
        'Someone Claimed Your Item | Reunite',
        'claimNotification',
        { name: item.postedBy.name, itemTitle: item.title },
        `${claimant.name} has requested to claim your item "${item.title}". Waiting for keeper to approve.`,
        item._id,
        io,
        'claimPending'
      );

      return res.status(200).json({ message: 'Claim request submitted and pending keeper approval', item });

    } else {
      // ── NO KEEPER: immediate claim + OTP ───────────────────────────────────
      item.status = 'Claimed';
      item.claimedBy = req.user.id;
      item.isClaimed = true;
      await item.save();

      // Notify OWNER
      await sendNotificationAndEmail(
        item.postedBy._id,
        'Your Lost Item Has Been Claimed',
        'claimNotification',
        { name: item.postedBy.name, itemTitle: item.title },
        `Your item "${item.title}" has been claimed by ${claimant.name}.`,
        item._id,
        io,
        'item_claimed'
      );

      // Removed OTP generation, just notify CLAIMANT
      await sendNotificationAndEmail(
        req.user.id,
        'Item Successfully Claimed',
        'claimNotification',
        { name: claimant.name, itemTitle: item.title },
        `You have successfully claimed "${item.title}". Please arrange a meeting with the owner (${item.postedBy.name}) to pick it up.`,
        item._id,
        io,
        'item_claimed'
      );

      return res.status(200).json({ message: 'Item claimed successfully', item });
    }
  } catch (error) {
    console.error('Error claiming item:', error);
    res.status(500).json({ message: 'Failed to claim item', code: 'SERVER_ERROR' });
  }
};

// Keeper/Admin approves a pending claim request
exports.approveClaimRequest = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy claimedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Only admin or the assigned keeper may approve
    if (req.user.role !== 'admin' && item.keeper?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin or assigned keeper can approve claim requests', code: 'FORBIDDEN' });
    }

    if (!item.claimApprovalPending) {
      return res.status(400).json({ message: 'No pending claim request for this item', code: 'NO_PENDING_CLAIM' });
    }

    if (!item.claimedBy) {
      return res.status(400).json({ message: 'Claimant data missing', code: 'MISSING_CLAIMANT' });
    }

    // Approve: flip to Claimed
    item.status = 'Claimed';
    item.isClaimed = true;
    item.claimApprovalPending = false;
    await item.save();

    const io = req.app.get('io');
    const itemLink = buildItemLink(item._id);
    const approverName = req.user.name || 'Keeper/Admin';

    // 1. Notify CLAIMANT — approved
    await sendNotificationAndEmail(
      item.claimedBy._id,
      'Your Claim Has Been Approved! | Reunite',
      'claimApproved',
      { claimantName: item.claimedBy.name, itemTitle: item.title, itemLink },
      `✅ Your claim for "${item.title}" was approved by ${approverName}. Please contact the keeper to arrange the handoff.`,
      item._id,
      io,
      'claimApproved'
    );

    // 2. Notify OWNER — official claim confirmed
    await sendNotificationAndEmail(
      item.postedBy._id,
      'Claim Approved for Your Item | Reunite',
      'claimNotification',
      { name: item.postedBy.name, itemTitle: item.title },
      `The claim for "${item.title}" by ${item.claimedBy.name} has been approved by ${approverName}.`,
      item._id,
      io,
      'claimApproved'
    );

    // 3. Confirm to KEEPER/ADMIN themselves
    await sendNotificationAndEmail(
      req.user.id,
      'Claim Approved Confirmation | Reunite',
      'claimNotification',
      { name: approverName, itemTitle: item.title },
      `You approved the claim request for "${item.title}" by ${item.claimedBy.name}. You can now complete the handoff.`,
      item._id,
      io,
      'claimApproved'
    );

    res.status(200).json({ message: 'Claim request approved successfully.', item });
  } catch (error) {
    console.error('Error approving claim:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ message: 'Failed to approve claim', code: 'SERVER_ERROR' });
  }
};

// Keeper/Admin rejects a pending claim request
exports.rejectClaimRequest = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);

    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy claimedBy', 'name email');
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Only admin or the assigned keeper may reject
    if (req.user.role !== 'admin' && item.keeper?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin or assigned keeper can reject claim requests', code: 'FORBIDDEN' });
    }

    if (!item.claimApprovalPending) {
      return res.status(400).json({ message: 'No pending claim request for this item', code: 'NO_PENDING_CLAIM' });
    }

    if (!item.claimedBy) {
      return res.status(400).json({ message: 'Claimant data missing', code: 'MISSING_CLAIMANT' });
    }

    const claimantRef = item.claimedBy;

    // Reject: revert status back to what it was initially (assume Found/Lost based on category mapping or just default to Found if it has a keeper and pending)
    // Actually, look at the other items it matched, or default to checking if it was postedBy a finder or owner.
    // If we don't know for sure, marking it 'Found' or 'Lost' depending on who posted it.
    // Since keepers are usually assigned to Found items, it's mostly Found. To be super robust we can check originalStatus if we added it, but let's derive it:
    // If the person who posted it is an owner, it's Lost. If the person who posted it is a finder, it's Found.
    let revertedStatus = 'Found';
    // Often we don't know the exact previous status without a field, but for handovers, it's safe to revert it to 'Found' or 'Lost' depending on its state.
    // Let's assume if it has a keeper, it was a 'Found' item being managed.
    // We can just revert it to 'Found' (or 'Lost' if the item has no image and was explicitly a lost report, though keepers usually don't keep lost items).
    item.status = 'Found'; // Simplest safe fallback

    item.isClaimed = false;
    item.claimApprovalPending = false;
    item.claimedBy = null;
    await item.save();

    const io = req.app.get('io');
    const approverName = req.user.name || 'Keeper/Admin';
    const itemLink = buildItemLink(item._id);

    // 1. Notify CLAIMANT — rejected
    await sendNotificationAndEmail(
      claimantRef._id,
      'Update on Your Claim Request | Reunite',
      'claimNotification', // Reusing existing template
      { name: claimantRef.name, itemTitle: item.title },
      `❌ Your claim request for "${item.title}" was declined by the keeper/admin. It may not match your description or further verification failed.`,
      item._id,
      io,
      'claimRejected'
    );

    // 2. Notify OWNER 
    await sendNotificationAndEmail(
      item.postedBy._id,
      'Claim Request Declined | Reunite',
      'claimNotification',
      { name: item.postedBy.name, itemTitle: item.title },
      `The claim request for "${item.title}" by ${claimantRef.name} was declined and the item is available again.`,
      item._id,
      io,
      'claimRejected'
    );

    res.status(200).json({ message: 'Claim request rejected successfully.', item });
  } catch (error) {
    console.error('Error rejecting claim:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ message: 'Failed to reject claim', code: 'SERVER_ERROR' });
  }
};

// Confirm a meeting between finder and owner
exports.confirmMeeting = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const item = await Item.findOne({ _id: id, isActive: true });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    if (item.postedBy.toString() === req.user.id) {
      if (item.status === 'Found') {
        item.meetingConfirmedByFinder = true; // For found items, poster is finder
      } else {
        item.meetingConfirmedByOwner = true; // For lost items, poster is owner
      }
    } else if (item.claimedBy?.toString() === req.user.id) {
      if (item.status === 'Found') {
        item.meetingConfirmedByOwner = true; // For found items, claimant is owner
      } else {
        item.meetingConfirmedByFinder = true; // For lost items, claimant is finder
      }
    } else {
      return res.status(403).json({ message: 'You are not authorized to confirm this meeting', code: 'FORBIDDEN' });
    }

    await item.save();
    res.status(200).json({ message: 'Meeting confirmed successfully', item });
  } catch (error) {
    console.error('Error confirming meeting:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ message: 'Failed to confirm meeting', code: 'SERVER_ERROR' });
  }
};

// Keeper gives Stamp of Approval and marks item as returned
exports.keeperApproveHandoff = async (req, res) => {
  try {
    const { id } = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/) }).parse(req.params);
    const item = await Item.findOne({ _id: id, isActive: true }).populate('postedBy claimedBy', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found', code: 'NOT_FOUND' });
    }

    // Must be admin or assigned keeper
    if (req.user.role !== 'admin' && item.keeper?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only admin or assigned keeper can approve handoff', code: 'FORBIDDEN' });
    }

    if (!item.meetingConfirmedByFinder || !item.meetingConfirmedByOwner) {
      return res.status(400).json({ message: 'Both finder and owner must confirm the meeting first', code: 'PENDING_CONFIRMATION' });
    }

    const originalStatus = item.status; // capture BEFORE overwrite
    item.keeperApproval = true;
    item.status = 'Returned';
    item.isReturned = true;
    item.claimApprovalPending = false;
    item.claimOTP = null;
    item.otpExpiresAt = null;
    await item.save();

    // ── Sync the matched counterpart item ────────────────────────────────────
    if (item.matchedItemId) {
      await Item.findByIdAndUpdate(item.matchedItemId, {
        status: 'Returned',
        isReturned: true,
        keeperApproval: true,
      });
      console.log(`[Handoff] Synced matched item ${item.matchedItemId} to Returned.`);
    } else {
      // Fallback: update related items by owner + category (use originalStatus)
      const ownerId = originalStatus === 'Found' ? item.claimedBy?._id : item.postedBy?._id;
      const finderId = originalStatus === 'Found' ? item.postedBy?._id : item.claimedBy?._id;
      if (ownerId && item.category) {
        await Item.updateMany({
          postedBy: ownerId,
          status: { $in: ['Lost', 'Found', 'Claimed', 'ClaimPending'] },
          isActive: true,
          category: item.category
        }, { $set: { status: 'Returned', isReturned: true, keeperApproval: true, claimedBy: finderId } });
      }
    }

    // Increment keeper success count
    if (item.keeper) {
      const keeperUser = await User.findById(item.keeper);
      if (keeperUser) {
        keeperUser.successfulReturnsCount = (keeperUser.successfulReturnsCount || 0) + 1;
        await keeperUser.save();
      }
    }

    // ── Notify all parties ───────────────────────────────────────────────────
    const io = req.app.get('io');
    const approverName = req.user.name || 'Keeper/Admin';
    const itemLink = buildItemLink(item._id);

    if (item.postedBy) {
      await sendNotificationAndEmail(
        item.postedBy._id,
        'Item Successfully Returned | Reunite',
        'returnNotification',
        { name: item.postedBy.name, itemTitle: item.title },
        `✅ Your item "${item.title}" has been marked as returned and handed off by ${approverName}.`,
        item._id, io, 'item_returned'
      );
    }
    if (item.claimedBy) {
      await sendNotificationAndEmail(
        item.claimedBy._id,
        'Item Successfully Returned | Reunite',
        'returnNotification',
        { name: item.claimedBy.name, itemTitle: item.title },
        `✅ The item "${item.title}" you claimed has been successfully returned and confirmed by ${approverName}.`,
        item._id, io, 'item_returned'
      );
    }
    if (item.keeper) {
      await sendNotificationAndEmail(
        item.keeper,
        'Handoff Complete | Reunite',
        'returnNotification',
        { name: approverName, itemTitle: item.title },
        `✅ You successfully facilitated the return of "${item.title}". Your success count has been updated.`,
        item._id, io, 'item_returned'
      );
    }

    res.status(200).json({ message: 'Handoff approved and item marked as returned', item });
  } catch (error) {
    console.error('Error approving handoff:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid item ID', code: 'VALIDATION_ERROR' });
    }
    res.status(500).json({ message: 'Failed to approve handoff', code: 'SERVER_ERROR' });
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

    if (req.user.role !== 'admin' && req.user.role !== 'keeper') {
      return res.status(403).json({ 
        message: 'Only admins and keepers can delete items. You cannot delete your own item after posting.', 
        code: 'FORBIDDEN' 
      });
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