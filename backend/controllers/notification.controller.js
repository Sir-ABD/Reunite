const Notification = require('../models/notification.model');

// Get all notifications for the current user with pagination
exports.getNotifications = async (req, res) => {
  try {
    // Verify user exists in request
    if (!req.user?.id) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      });
    }

    const { id: userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Parse and validate pagination parameters
    const pageNumber = parseInt(page, 10);
    const limitNumber = Math.min(parseInt(limit, 10), 50); // Cap limit at 50 for performance

    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      return res.status(400).json({ 
        error: 'Invalid pagination parameters',
        code: 'INVALID_PAGINATION',
        details: 'Page and limit must be positive numbers'
      });
    }

    // Optimized query with index-friendly filtering
    const query = { userId };
    const options = {
      page: pageNumber,
      limit: limitNumber,
      populate: {
        path: 'itemId',
        select: 'title type createdAt' // Select only needed fields
      },
      sort: { createdAt: -1 },
      lean: true // Better performance for read-only data
    };

    const notifications = await Notification.paginate(query, options);

    // Structured response with metadata
    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications.docs,
        pagination: {
          totalPages: notifications.totalPages,
          currentPage: notifications.page,
          totalResults: notifications.totalDocs,
          hasNext: notifications.hasNext,
          hasPrev: notifications.hasPrev
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notifications:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    // Differentiate between types of errors
    if (error.name === 'MongoNetworkError') {
      return res.status(503).json({
        error: 'Database connection failed',
        code: 'DB_UNAVAILABLE',
        retryAfter: 5
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    // Validate inputs
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const { id: notificationId } = req.params;
    const { id: userId } = req.user;

    if (!notificationId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: 'Invalid notification ID format',
        code: 'INVALID_ID'
      });
    }

    // Use findOneAndUpdate for atomic operation
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: notificationId, 
        userId 
      },
      { 
        $set: { isRead: true, updatedAt: new Date() }
      },
      { 
        new: true, // Return updated document
        lean: true,
        select: '_id isRead updatedAt' // Return only necessary fields
      }
    );

    if (!notification) {
      return res.status(404).json({
        error: 'Notification not found or unauthorized',
        code: 'NOT_FOUND_OR_UNAUTHORIZED'
      });
    }

    return res.status(200).json({
      success: true,
      data: { notification },
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', {
      message: error.message,
      stack: error.stack,
      notificationId: req.params.id,
      userId: req.user?.id
    });

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid notification ID',
        code: 'INVALID_ID_CAST'
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: 'Failed to update notification'
    });
  }
};