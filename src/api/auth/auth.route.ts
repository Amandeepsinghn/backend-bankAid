import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncRouter';
import { verifyToken } from '../../middleware/security/verifyToken';
import {
  authAttemptLimiter,
  otpRequestLimiter,
  otpVerifyLimiter,
} from '../../middleware/security/rateLimit';
import {
  registerController,
  verifyPhoneController,
  loginController,
  forgotPasswordController,
  verifyResetOtpController,
  resetPasswordController,
  meController,
  refreshController,
  logoutController,
} from './auth.routeController';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates an account and sends OTP to phone for verification via Twilio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, phone, fullName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: MySecure123
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               fullName:
 *                 type: string
 *                 example: Uttam Yadav
 *     responses:
 *       201:
 *         description: Account created, OTP sent
 *       409:
 *         description: Email or phone already registered
 */
router.post('/register', authAttemptLimiter, asyncHandler(registerController));

/**
 * @swagger
 * /api/auth/verify-phone:
 *   post:
 *     tags: [Auth]
 *     summary: Verify phone OTP
 *     description: Verifies the OTP sent to the user's phone during registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Phone verified, returns JWT token
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-phone', otpVerifyLimiter, asyncHandler(verifyPhoneController));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: MySecure123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Phone not verified
 */
router.post('/login', authAttemptLimiter, asyncHandler(loginController));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset OTP
 *     description: Sends an OTP to the registered phone number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP sent to registered phone
 *       404:
 *         description: No account found
 */
router.post('/forgot-password', otpRequestLimiter, asyncHandler(forgotPasswordController));

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify reset OTP
 *     description: Verifies the OTP and returns a short-lived reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Returns reset token
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-reset-otp', otpVerifyLimiter, asyncHandler(verifyResetOtpController));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password
 *     description: Sets a new password using the reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resetToken, newPassword, confirmPassword]
 *             properties:
 *               resetToken:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token or passwords don't match
 */
router.post('/reset-password', authAttemptLimiter, asyncHandler(resetPasswordController));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', verifyToken, asyncHandler(meController));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchanges a valid refresh token for a new access token and refresh token (rotation)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns new access and refresh tokens
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', asyncHandler(refreshController));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     description: Revokes the given refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', asyncHandler(logoutController));

export default router;
