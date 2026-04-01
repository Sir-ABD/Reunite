const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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

        // Send OTP via email (Non-blocking fallback)
        try {
          await sendEmail(
            email,
            'Account Reactivation OTP - Lost and Found Platform',
            'passwordResetOtp',
            { name: existingUser.name, otp }
          );
        } catch (mailError) {
          console.error('Email sending failed during reactivation:', mailError.message);
          console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
        }

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

    // Send OTP via email (Non-blocking fallback)
    try {
      await sendEmail(
        email,
        'Account Verification OTP - Lost and Found Platform',
        'accountVerificationOtp',
        { name, otp }
      );
    } catch (mailError) {
      console.error('Email sending failed during registration:', mailError.message);
      console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
    }

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

    // Check if user has 2FA enabled
    if (user.isTwoFactorEnabled) {
      // Require the frontend to hit finalizeLogin with the OTP
      return res.status(200).json({
        message: '2FA Required',
        requires2FA: true,
        userId: user._id
      });
    }

    // Generate JWT token if 2FA is not enabled
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Login successful',
      authorization: `Bearer ${token}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture || '' },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Failed to login', code: 'SERVER_ERROR' });
  }
};

// Finalize Login using 2FA token
exports.finalizeLogin2FA = async (req, res) => {
  try {
    const { userId, token } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA token', code: 'INVALID_TOKEN' });
    }

    // Generate and send standard JWT token
    const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Login successful',
      authorization: `Bearer ${jwtToken}`,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture || '' },
    });
  } catch (error) {
    console.error('Finalize 2FA Login Error:', error.message);
    res.status(500).json({ message: 'Failed to verify 2FA', code: 'SERVER_ERROR' });
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

    // Send OTP via email (Non-blocking fallback)
    try {
      await sendEmail(
        email,
        'Password Reset OTP - Lost and Found Platform',
        'passwordResetOtp',
        { name: user.name, otp }
      );
    } catch (mailError) {
      console.error('Email sending failed during forgot password:', mailError.message);
      console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
    }

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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture || '' },
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

// Generate 2FA Secret and QR Code for a User
exports.generate2FA = async (req, res) => {
  try {
    const userId = req.user.id; // Requires authentication middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Generate a new secret
    const secret = speakeasy.generateSecret({
      name: `Reunite FUD (${user.email})`
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    // Generate a QR code for the user to scan
    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ message: 'Error generating QR code', code: 'SERVER_ERROR' });
      }

      res.status(200).json({
        message: '2FA Secret generated successfully',
        secret: secret.base32,
        qrCode: data_url
      });
    });
  } catch (error) {
    console.error('Generate 2FA Error:', error.message);
    res.status(500).json({ message: 'Failed to generate 2FA', code: 'SERVER_ERROR' });
  }
};

// Verify 2FA to enable it natively
exports.verify2FA = async (req, res) => {
  try {
    const userId = req.user.id; // Requires auth middleware
    const { token } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not generated yet', code: 'TWO_FACTOR_NOT_SETUP' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();
      return res.status(200).json({ message: 'Two-Factor Authentication successfully enabled' });
    } else {
      return res.status(400).json({ message: 'Invalid 2FA token', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    console.error('Verify 2FA Error:', error.message);
    res.status(500).json({ message: 'Failed to verify 2FA', code: 'SERVER_ERROR' });
  }
};

// Google Login/Signup
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID Token is required', code: 'MISSING_TOKEN' });
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, ensure they are active
      if (!user.isActive) {
        user.isActive = true;
        await user.save();
      }
      // Optionally update profile picture if missing
      if (!user.profilePicture && picture) {
        user.profilePicture = picture;
        await user.save();
      }
    } else {
      // Create new user
      const randomPassword = crypto.randomBytes(16).toString('hex');
      user = new User({
        name,
        email,
        password: randomPassword,
        profilePicture: picture,
        isActive: true,
        role: 'user',
      });
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful via Google',
      authorization: `Bearer ${token}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || '',
      },
    });
  } catch (error) {
    console.error('Google Login Error:', error.message, error.stack);
    res.status(401).json({ message: 'Invalid Google Token', code: 'INVALID_TOKEN' });
  }
};

module.exports = exports;