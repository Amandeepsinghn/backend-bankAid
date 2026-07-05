import { AppError } from '../../middleware/error/errorHandler';
import { TIER_CASE_LIMITS, type Tier } from '../../lib/tierValidation';
import { generateLetters } from '../../lib/letterTemplates';
import * as caseDb from './case.db';
import * as authDb from '../auth/auth.db';
import * as subscriptionDb from '../subscription/subscription.db';
import * as formDb from '../form/form.db';
import type { CaseSummary, CaseDetail, HomeSummary } from './case.types';

export async function listCases(
  userId: string,
  limit = 20,
  offset = 0,
): Promise<CaseSummary[]> {
  const cases = await caseDb.getAllCasesWithLetterCounts(userId, limit, offset);

  return cases.map((c) => ({
    id: c.id,
    bankName: c.bankName,
    branchName: c.branchName,
    declaredStuckAmount: c.declaredStuckAmount,
    ncrpNo: c.ncrpNo,
    exchangeName: c.exchangeName,
    createdAt: c.createdAt,
    lettersSent: c.lettersSent,
    lettersTotal: c.lettersTotal,
    isComplete: c.lettersTotal > 0 && c.lettersSent === c.lettersTotal,
  }));
}

export async function getCaseDetail(caseId: string, userId: string): Promise<CaseDetail> {
  const caseRow = await caseDb.getCaseById(caseId, userId);
  if (!caseRow) {
    throw new AppError(404, 'Case not found');
  }

  const profile = await authDb.findProfileById(userId);
  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  const letters = generateLetters({
    fullName: profile.fullName,
    bankName: caseRow.bankName ?? '',
    branchName: caseRow.branchName ?? '',
    accountNumber: caseRow.accountNumber ?? '',
    remainingBalance: caseRow.remainingBalance ?? '',
    freezeDate: caseRow.freezeDate ?? '',
    ncrpNo: caseRow.ncrpNo ?? '',
    declaredStuckAmount: caseRow.declaredStuckAmount,
    cityState: caseRow.cityState ?? '',
    address: caseRow.address ?? '',
    contactNumber: caseRow.contactNumber ?? '',
    exchangeName: caseRow.exchangeName ?? '',
    orderId: caseRow.orderId ?? '',
    counterpartyUsername: caseRow.counterpartyUsername ?? '',
    exchangeUid: caseRow.exchangeUid ?? '',
    rbiRegionalOffice: caseRow.rbiRegionalOffice ?? '',
    emailAddress: caseRow.emailAddress ?? '',
  });

  const statuses = await caseDb.getLettersForCase(caseId);

  const letterPreviews = letters.map((letter) => {
    const status = statuses.find((s) => s.letterType === letter.letterType);
    return {
      statusId: status?.id ?? '',
      letterType: letter.letterType,
      recipientLabel: letter.recipientLabel,
      subject: letter.subject,
      body: letter.body,
      sent: status?.sent ?? false,
      sentAt: status?.sentAt ?? null,
      recipientEmail: status?.recipientEmail ?? null,
    };
  });

  return {
    id: caseRow.id,
    bankName: caseRow.bankName,
    branchName: caseRow.branchName,
    accountNumber: caseRow.accountNumber,
    remainingBalance: caseRow.remainingBalance,
    freezeDate: caseRow.freezeDate,
    ncrpNo: caseRow.ncrpNo,
    declaredStuckAmount: caseRow.declaredStuckAmount,
    cityState: caseRow.cityState,
    address: caseRow.address,
    contactNumber: caseRow.contactNumber,
    exchangeName: caseRow.exchangeName,
    orderId: caseRow.orderId,
    counterpartyUsername: caseRow.counterpartyUsername,
    exchangeUid: caseRow.exchangeUid,
    rbiRegionalOffice: caseRow.rbiRegionalOffice,
    emailAddress: caseRow.emailAddress,
    createdAt: caseRow.createdAt,
    letters: letterPreviews,
  };
}

export async function getHomeSummary(userId: string): Promise<HomeSummary> {
  const [subscription, totalCases, completedCases, allCases] = await Promise.all([
    subscriptionDb.getActiveSubscription(userId),
    caseDb.getTotalCaseCount(userId),
    caseDb.getCompletedCaseCount(userId),
    caseDb.getAllCasesWithLetterCounts(userId),
  ]);
  const recentCases: CaseSummary[] = allCases.slice(0, 5).map((c) => ({
    id: c.id,
    bankName: c.bankName,
    branchName: c.branchName,
    declaredStuckAmount: c.declaredStuckAmount,
    ncrpNo: c.ncrpNo,
    exchangeName: c.exchangeName,
    createdAt: c.createdAt,
    lettersSent: c.lettersSent,
    lettersTotal: c.lettersTotal,
    isComplete: c.lettersTotal > 0 && c.lettersSent === c.lettersTotal,
  }));

  let subscriptionSummary = null;
  if (subscription) {
    const tier = subscription.tier as Tier;
    const casesUsed = await formDb.countCasesBySubscription(subscription.id);
    const caseLimit = TIER_CASE_LIMITS[tier];
    subscriptionSummary = {
      tier,
      casesUsed,
      caseLimit,
      casesRemaining: Math.max(0, caseLimit - casesUsed),
    };
  }

  return {
    subscription: subscriptionSummary,
    totalCases,
    completedCases,
    recentCases,
  };
}
