import { db } from '../../db';
import { letterStatus, formSubmissions } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export async function getLetterStatusesBySubmission(submissionId: string) {
  return db
    .select()
    .from(letterStatus)
    .where(eq(letterStatus.submissionId, submissionId));
}

export async function getLetterStatusById(id: string) {
  const [status] = await db
    .select()
    .from(letterStatus)
    .where(eq(letterStatus.id, id))
    .limit(1);
  return status;
}

export async function markLetterSent(id: string, recipientEmail?: string) {
  const [updated] = await db
    .update(letterStatus)
    .set({
      sent: true,
      sentAt: new Date(),
      ...(recipientEmail ? { recipientEmail } : {}),
    })
    .where(eq(letterStatus.id, id))
    .returning();
  return updated;
}

export async function getSubmissionWithOwnerCheck(submissionId: string, userId: string) {
  const [submission] = await db
    .select()
    .from(formSubmissions)
    .where(and(eq(formSubmissions.id, submissionId), eq(formSubmissions.userId, userId)))
    .limit(1);
  return submission;
}
