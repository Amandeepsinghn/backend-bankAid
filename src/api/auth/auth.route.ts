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
  verifyEmailOtpController,
  resendEmailOtpController,
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
 *     description: Creates an account with email + password and sends an OTP to that email for verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
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
 *                 description: Optional — not collected at registration, just a data field used later
 *                 example: "+919876543210"
 *               fullName:
 *                 type: string
 *                 example: Uttam Yadav
 *     responses:
 *       201:
 *         description: Account created, OTP sent to email
 *       409:
 *         description: Email already registered
 */
router.post('/register', authAttemptLimiter, asyncHandler(registerController));

/**
 * @swagger
 * /api/auth/verify-email-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email OTP
 *     description: Verifies the OTP sent to the user's email during registration
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified, returns access + refresh tokens
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-email-otp', otpVerifyLimiter, asyncHandler(verifyEmailOtpController));

/**
 * @swagger
 * /api/auth/resend-email-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend registration email OTP
 *     description: Reissues a fresh OTP to the email if the account exists and isn't yet verified. Invalidates any previously issued unverified code. Rate-limited to one send per 60 seconds per email.
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
 *         description: OTP resent to email
 *       400:
 *         description: Email is already verified
 *       404:
 *         description: No account found
 *       429:
 *         description: Resend cooldown still active
 */
router.post('/resend-email-otp', otpRequestLimiter, asyncHandler(resendEmailOtpController));

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
 *         description: Email not verified
 */
router.post('/login', authAttemptLimiter, asyncHandler(loginController));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request (or resend) password reset OTP
 *     description: Sends an OTP to the registered email address via ZeptoMail. If the account has a phone number on file, the supplied phone must match it. Calling this again acts as "resend" — invalidates the previous code and issues a new one, subject to a 60-second cooldown per email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, phone]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *     responses:
 *       200:
 *         description: OTP sent to registered email
 *       404:
 *         description: No account found, or phone doesn't match records
 *       429:
 *         description: Resend cooldown still active
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
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
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
