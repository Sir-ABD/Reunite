const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Utility function to extract token from headers
const extractToken = (req) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    console.log('No Authorization header provided');
    return null;
  }

  const cleanedHeader = authHeader.replace(/"/g, '').trim();

  if (!cleanedHeader.toLowerCase().startsWith('bearer ')) {
    console.log('No valid Bearer prefix found');
    return null;
  }

  const token = cleanedHeader.split(/\s+/)[1];
  if (!token || token.trim() === '' || token.split('.').length !== 3) {
    console.log(`Invalid token format: "${token}"`);
    return null;
  }

  return token;
};

// Middleware to authenticate users
exports.authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No valid token provided.', code: 'NO_TOKEN' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token payload:', decoded); // Log the decoded token

    const user = await User.findOne({ _id: decoded.id, isActive: true });
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({ message: 'User not found or inactive', code: 'INVALID_USER' });
    }

    // Set req.user with detailed info for debugging
    req.user = {
      id: user._id.toString(),
      originalIdFromToken: decoded.id, // Log the token's ID for comparison
      role: user.role,
      name: user.name,
      email: user.email,
    };
    console.log('Set req.user:', req.user); // Log the assigned user object

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid or malformed token.', code: 'INVALID_TOKEN' });
    }
    res.status(500).json({ message: 'Authentication failed.', code: 'SERVER_ERROR' });
  }
};

// Middleware to restrict access by role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of: ${roles.join(', ')}`, code: 'FORBIDDEN' });
    }
    next();
  };
};

// Middleware to check if the user is an admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.', code: 'FORBIDDEN' });
  }
  next();
};