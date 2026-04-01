const { z, string } = require('zod');

// Schema for user registration
const registerSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['user', 'keeper', 'admin']).optional().default('user'),
});

// Schema for user login
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Schema for forgot password (email only)
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Schema for verifying OTP (email and OTP)
const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only digits'),
});

// Schema for resetting password (email and new password)
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

// Schema for checking 2FA token
const twoFactorSchema = z.object({
  token: z.string().length(6, '2FA token must be exactly 6 characters')
});

const finalizeLoginSchema = z.object({
  userId: z.string(),
  token: z.string().length(6, '2FA token must be exactly 6 characters')
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  twoFactorSchema,
  finalizeLoginSchema
};