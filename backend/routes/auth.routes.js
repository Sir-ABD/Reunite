const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema, twoFactorSchema, finalizeLoginSchema } = require('../schema/auth.schema');

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

// Finalize Login with 2FA
router.post(
  '/login/finalize',
  validate(finalizeLoginSchema),
  authController.finalizeLogin2FA
);

// Generate 2FA (Requires auth because user must be logged in to enable it)
router.get(
  '/2fa/generate',
  authenticate, 
  authController.generate2FA
);

// Verify 2FA to activate it
router.post(
  '/2fa/verify',
  authenticate,
  validate(twoFactorSchema),
  authController.verify2FA
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

// Google Auth Callback
router.post('/google-login', authController.googleLogin);

module.exports = router;