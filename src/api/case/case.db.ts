import { db } from '../../db';
import { formSubmissions, letterStatus, subscriptions } from '../../db/schema';
import { eq, and, desc, count, sql, getTableColumns } from 'drizzle-orm';

export async function getAllCasesWithLetterCounts(
  userId: string,
  limit = 100,
  offset = 0,
) {
  return db
    .select({
      ...getTableColumns(formSubmissions),
      lettersSent: sql<number>`count(*) filter (where ${letterStatus.sent} = true)::int`,
      lettersTotal: sql<number>`count(${letterStatus.id})::int`,
    })
    .from(formSubmissions)
    .leftJoin(letterStatus, eq(letterStatus.submissionId, formSubmissions.id))
    .where(eq(formSubmissions.userId, userId))
    .groupBy(formSubmissions.id)
    .orderBy(desc(formSubmissions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getCaseById(caseId: string, userId: string) {
  const [caseRow] = await db
    .select()
    .from(formSubmissions)
    .where(and(eq(formSubmissions.id, caseId), eq(formSubmissions.userId, userId)))
    .limit(1);
  return caseRow;
}

export async function getLettersForCase(caseId: string) {
  return db
    .select()
    .from(letterStatus)
    .where(eq(letterStatus.submissionId, caseId));
}

export async function getCompletedCaseCount(userId: string): Promise<number> {
  const rows = await db
    .select({ id: formSubmissions.id })
    .from(formSubmissions)
    .innerJoin(letterStatus, eq(letterStatus.submissionId, formSubmissions.id))
    .where(eq(formSubmissions.userId, userId))
    .groupBy(formSubmissions.id)
    .having(sql`count(*) filter (where ${letterStatus.sent} = false) = 0`);

  return rows.length;
}

export async function getTotalCaseCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(formSubmissions)
    .where(eq(formSubmissions.userId, userId));
  return result?.total ?? 0;
}
