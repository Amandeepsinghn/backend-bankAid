import { db } from '../../db';
import { otps } from '../../db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';

export type OtpType = 'password_reset' | 'email_verification';

// `identifier` is always an email address — the underlying column is still
// named `phone` (see schema.ts) to avoid an ambiguous rename migration.
export async function createOtp(identifier: string, code: string, type: OtpType, expiryMinutes: number) {
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const [otp] = await db.insert(otps).values({ phone: identifier, code, type, expiresAt }).returning();
  return otp!;
}

export async function findValidOtp(identifier: string, code: string, type: OtpType) {
  const [otp] = await db
    .select()
    .from(otps)
    .where(
      and(
        eq(otps.phone, identifier),
        eq(otps.code, code),
        eq(otps.type, type),
        eq(otps.verified, false),
        gt(otps.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return otp;
}

export async function findLatestOtp(identifier: string, type: OtpType) {
  const [otp] = await db
    .select()
    .from(otps)
    .where(and(eq(otps.phone, identifier), eq(otps.type, type)))
    .orderBy(desc(otps.createdAt))
    .limit(1);
  return otp;
}

// Immediately expires any not-yet-verified OTPs for this identifier+type so a
// freshly issued code is the only one that still works.
export async function invalidatePendingOtps(identifier: string, type: OtpType) {
  await db
    .update(otps)
    .set({ expiresAt: new Date() })
    .where(and(eq(otps.phone, identifier), eq(otps.type, type), eq(otps.verified, false)));
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
