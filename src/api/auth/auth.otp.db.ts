import { db } from '../../db';
import { otps } from '../../db/schema';
import { eq, and, gt } from 'drizzle-orm';

type OtpType = 'phone_verification' | 'password_reset';

export async function createOtp(phone: string, code: string, type: OtpType, expiryMinutes: number) {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const [otp] = await db.insert(otps).values({ phone, code, type, expiresAt }).returning();
  return otp!;
}

export async function findValidOtp(phone: string, code: string, type: OtpType) {
  const [otp] = await db
    .select()
    .from(otps)
    .where(
      and(
        eq(otps.phone, phone),
        eq(otps.code, code),
        eq(otps.type, type),
        eq(otps.verified, false),
        gt(otps.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return otp;
}

export async function markOtpVerified(otpId: string) {
  const [updated] = await db
    .update(otps)
    .set({ verified: true })
    .where(eq(otps.id, otpId))
    .returning();
  return updated;
}

export async function consumeResetToken(otpId: string) {
  const [consumed] = await db
    .update(otps)
    .set({ resetTokenUsed: true })
    .where(
      and(
        eq(otps.id, otpId),
        eq(otps.type, 'password_reset'),
        eq(otps.verified, true),
        eq(otps.resetTokenUsed, false),
      ),
    )
    .returning();
  return consumed;
}
