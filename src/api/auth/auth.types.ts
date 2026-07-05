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

export interface VerifyPhoneInput {
  phone: string;
  code: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface VerifyResetOtpInput {
  phone: string;
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
  phone: string;
  phoneVerified: boolean;
  createdAt: Date;
}
