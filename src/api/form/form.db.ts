import { db } from '../../db';
import { formSubmissions, letterStatus } from '../../db/schema';
import { eq, and, desc, count } from 'drizzle-orm';

const LETTER_TYPES = [
  'branch_manager',
  'investigating_officer',
  'nodal_officer',
  'exchange_compliance',
  'rbi_ombudsman',
] as const;

export async function createFormSubmission(data: {
  userId: string;
  subscriptionId: string;
  bankName: string;
  branchName: string;
  accountNumber: string;
  remainingBalance: string;
  freezeDate: string;
  ncrpNo: string;
  declaredStuckAmount: string;
  cityState: string;
  address: string;
  contactNumber: string;
  exchangeName: string;
  orderId: string;
  counterpartyUsername: string;
  exchangeUid: string;
  rbiRegionalOffice: string;
  emailAddress: string;
}) {
  const [submission] = await db.insert(formSubmissions).values(data).returning();
  const created = submission!;

  await db.insert(letterStatus).values(
    LETTER_TYPES.map((type) => ({
      submissionId: created.id,
      letterType: type,
    }))
  );

  return created;
}

export async function getSubmissionsByUserId(userId: string, limit = 20, offset = 0) {
  return db
    .select()
    .from(formSubmissions)
    .where(eq(formSubmissions.userId, userId))
    .orderBy(desc(formSubmissions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getSubmissionById(submissionId: string, userId: string) {
  const [submission] = await db
    .select()
    .from(formSubmissions)
    .where(and(eq(formSubmissions.id, submissionId), eq(formSubmissions.userId, userId)))
    .limit(1);
  return submission;
}

export async function countCasesBySubscription(subscriptionId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(formSubmissions)
    .where(eq(formSubmissions.subscriptionId, subscriptionId));
  return result?.total ?? 0;
}
