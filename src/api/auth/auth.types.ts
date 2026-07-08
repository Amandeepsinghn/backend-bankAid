export interface RegisterInput {
  email: string;
  password: string;
  phone: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface VerifyEmailOtpInput {
  email: string;
  code: string;
}

export interface ResendEmailOtpInput {
  email: string;
}

export interface ForgotPasswordInput {
  email: string;
  phone: string;
}

export interface VerifyResetOtpInput {
  email: string;
  code: string;
}

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  emailVerified: boolean;
  createdAt: Date;
}
