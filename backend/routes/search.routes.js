const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../middlewares/auth.middleware'); // Optional: If authentication is required

// Get a list of available keepers
router.get('/keepers', searchController.getKeepers);

// Assign a found item to a keeper
router.post('/items/:id/assign-keeper', authMiddleware.authenticate, searchController.assignKeeper);

// Search for items
router.get('/items/search', searchController.searchItems);

module.exports = router;