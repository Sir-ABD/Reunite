const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const itemController = require('../controllers/item.controller');
const { validate } = require('../middlewares/validate.middleware');
const { createItemSchema, updateItemSchema} = require('../schema/item.schema');
const { checkOwnership } = require('../middlewares/checkOwner.middleware');
const fileUploadMiddleware = require('../middlewares/fileUpload.middleware');
const { rateLimiter } = require('../middlewares/rateLimit.middleware');
const { idSchema } = require('../schema/common.schema');

// Create a new item (with file upload validation)
router.post(
  '/',
  authMiddleware.authenticate,
  fileUploadMiddleware.uploadFile, // Validate and handle file upload
  validate(createItemSchema),
  itemController.createItem
);

// Update an item
router.put(
  '/:id',
  authMiddleware.authenticate,
  fileUploadMiddleware.uploadFile,
  validate(updateItemSchema),
  checkOwnership,
  itemController.updateItem
);

// Get all items (with optional filters)
router.get('/', itemController.getItems);

// Get details of a specific item
router.get('/:id', validate(idSchema, 'params'), itemController.getItemById);

// Delete an item
router.delete('/:id', authMiddleware.authenticate, validate(idSchema, 'params'), checkOwnership, itemController.deleteItem);

// Claim an item (with rate limiting)
router.post('/:id/claim', authMiddleware.authenticate, validate(idSchema, 'params'), rateLimiter, itemController.claimItem);

// Keeper/Admin approves a pending claim request
router.post('/:id/approve-claim', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.approveClaimRequest);

// Keeper/Admin rejects a pending claim request
router.post('/:id/reject-claim', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.rejectClaimRequest);

// implementing AI coach to suggest improvements to title and description for better searchability and clarity
router.post('/improve-text', authMiddleware.authenticate, itemController.improveText);
// Mark an item as returned
// router.post('/:id/return', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.returnItem);

// Generate a QR code for the claimant
router.post('/:id/generate-qr', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.generateQRCode);

// Scan the QR code to verify ownership
router.post('/:id/scan-qr', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.scanQRCode);

// Confirm the handoff of a claimed item without OTP
router.post('/:id/confirm-handoff', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.confirmHandoff);


// Assign a found item to a keeper
router.post('/:id/assign-keeper', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.assignKeeper);

// Confirm a meeting between finder and owner
router.post('/:id/confirm-meeting', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.confirmMeeting);

// Keeper gives Stamp of Approval and marks item as returned
router.post('/:id/approve-handoff', authMiddleware.authenticate, validate(idSchema, 'params'), itemController.keeperApproveHandoff);

module.exports = router;