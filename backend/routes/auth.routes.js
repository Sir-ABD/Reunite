const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema } = require('../schema/auth.schema');

// Register a new user
router.post(
  '/register',
  validate(registerSchema), // Validate request body
  authController.register
);

// Authenticate a user
router.post(
  '/login',
  validate(loginSchema), // Validate request body
  authController.login
);

// Forgot Password - Send OTP
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema), // Validate request body
  authController.forgotPassword
);

// Verify OTP
router.post(
  '/verify-otp',
  validate(verifyOtpSchema), // Validate request body
  authController.verifyOtp
);

// Reset Password
router.post(
  '/reset-password',
  validate(resetPasswordSchema), // Validate request body
  authController.resetPassword
);

module.exports = router;