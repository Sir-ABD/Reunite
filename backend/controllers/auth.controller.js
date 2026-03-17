const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();
const crypto = require('crypto');
// Register a new user or reactivate a deactivated account
exports.register = async (req, res) => {
  try {
    // Use validated body from middleware
    const { name, email, password, role = 'user' } = req.validatedBody;

    // Extract JWT token from Authorization header to verify the requesting user's role
    const authHeader = req.headers.authorization;
    let requestingUserRole = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded);
        requestingUserRole = decoded.role; // Extract role from token
      } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token', code: 'INVALID_TOKEN' });
      }
    }

    // Role-based access control: Only admins can create "keeper" or "admin" accounts
    if (role === 'keeper' || role === 'admin') {
      if (!requestingUserRole || requestingUserRole !== 'admin') {
        console.log(requestingUserRole);
        return res.status(403).json({ message: 'Only admins can create keeper or admin accounts', code: 'UNAUTHORIZED' });
      }
    }

    // Check if a user with the same email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isActive) {
        // If the account is active, return an error
        return res.status(400).json({ message: 'User already exists', code: 'USER_EXISTS' });
      } else {
        // If the account is deactivated, reactivate it (but only after OTP verification)
        existingUser.isActive = false; // Keep inactive until verified
        await existingUser.save();

        // Generate initial OTP for reactivation
        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        existingUser.resetPasswordOtp = otp;
        existingUser.resetPasswordOtpExpiresAt = otpExpiresAt;
        await existingUser.save();

        // Send OTP via email
        await sendEmail(
          email,
          'Account Reactivation OTP - Lost and Found Platform',
          'passwordResetOtp',
          { name: existingUser.name, otp }
        );

        return res.status(200).json({
          message: 'Account reactivation initiated. Please verify OTP.',
          email,
        });
      }
    }

    // If no user exists, create a new user with isActive: false
    const user = new User({ name, email, password, role, isActive: false });
    await user.save();

    // Generate initial OTP for new registration
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP via email
    await sendEmail(
      email,
      'Account Verification OTP - Lost and Found Platform',
      'accountVerificationOtp',
      { name, otp }
    );

    res.status(200).json({
      message: 'Registration initiated. Please verify OTP to activate your account.',
      email,
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: 'Failed to register user', code: 'SERVER_ERROR' });
  }
};

// Authenticate a user
exports.login = async (req, res) => {
  try {
    // Use validated body from middleware
    const { email, password } = req.validatedBody;

    // Find the user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or user inactive', code: 'INVALID_CREDENTIALS' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Login successful',
      authorization: `Bearer ${token}`, // Fixed syntax
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Failed to login', code: 'SERVER_ERROR' });
  }
};

// Forgot Password - Generate and send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.validatedBody;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Generate a 6-digit OTP (cryptographically secure)
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Set OTP expiration (10 minutes from now)
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP and expiration to user document
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiresAt = otpExpiresAt;
    await user.save();

    // Send OTP via email using the existing sendEmail function
    await sendEmail(
      email,
      'Password Reset OTP - Lost and Found Platform',
      'passwordResetOtp',
      { name: user.name, otp }
    );

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to reset your password.',
      email,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    res.status(500).json({ message: 'Failed to process forgot password request', code: 'SERVER_ERROR' });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.validatedBody;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpiresAt) {
      return res.status(400).json({ message: 'No OTP found or OTP has expired', code: 'INVALID_OTP' });
    }

    if (user.resetPasswordOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP', code: 'INVALID_OTP' });
    }

    if (user.resetPasswordOtpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired', code: 'EXPIRED_OTP' });
    }

    // OTP is valid, activate the account and generate JWT
    user.isActive = true;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiresAt = null;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'OTP verified successfully. Account activated.',
      authorization: `Bearer ${token}`, // Provide token after verification
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({ message: 'Failed to verify OTP', code: 'SERVER_ERROR' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.validatedBody;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Update the password
    user.password = newPassword; // Hashing handled in user model
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully. You can now log in with your new password.',
      email,
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ message: 'Failed to reset password', code: 'SERVER_ERROR' });
  }
};

module.exports = exports;