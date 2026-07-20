import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/security/verifyToken';
import * as authService from './auth.service';
import {
  registerSchema,
  loginSchema,
  verifyEmailOtpSchema,
  resendEmailOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
} from './auth.requestHygiene';

export async function registerController(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await authService.register(data);
  res.status(201).json(result);
}

export async function loginController(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);
  res.json(result);
}

export async function verifyEmailOtpController(req: Request, res: Response) {
  const data = verifyEmailOtpSchema.parse(req.body);
  const result = await authService.verifyEmailOtp(data);
  res.json(result);
}

export async function resendEmailOtpController(req: Request, res: Response) {
  const data = resendEmailOtpSchema.parse(req.body);
  const result = await authService.resendEmailOtp(data);
  res.json(result);
}

export async function forgotPasswordController(req: Request, res: Response) {
  const data = forgotPasswordSchema.parse(req.body);
  const result = await authService.forgotPassword(data);
  res.json(result);
}

export async function verifyResetOtpController(req: Request, res: Response) {
  const data = verifyResetOtpSchema.parse(req.body);
  const result = await authService.verifyResetOtp(data);
  res.json(result);
}

export async function resetPasswordController(req: Request, res: Response) {
  const data = resetPasswordSchema.parse(req.body);
  const result = await authService.resetPassword(data);
  res.json(result);
}

export async function meController(req: AuthRequest, res: Response) {
  const result = await authService.getProfile(req.userId!);
  res.json(result);
}

export async function refreshController(req: Request, res: Response) {
  const data = refreshSchema.parse(req.body);
  const result = await authService.refreshSession(data.refreshToken);
  res.json(result);
}

export async function logoutController(req: Request, res: Response) {
  const data = logoutSchema.parse(req.body);
  const result = await authService.logout(data.refreshToken);
  res.json(result);
}

export async function deleteAccountController(req: AuthRequest, res: Response) {
  const result = await authService.deleteAccount(req.userId!);
  res.json(result);
}
