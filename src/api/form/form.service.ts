import { AppError } from '../../middleware/error/errorHandler';
import { validateAmountAgainstTier, TIER_CASE_LIMITS, type Tier } from '../../lib/tierValidation';
import * as formDb from './form.db';
import * as subscriptionDb from '../subscription/subscription.db';
import type { FormSubmitInput } from './form.types';

export async function submitForm(userId: string, input: FormSubmitInput) {
  const subscription = await subscriptionDb.getActiveSubscription(userId);
  if (!subscription) {
    throw new AppError(403, 'Active subscription required to submit form', 'SUBSCRIPTION_REQUIRED');
  }

  const tier = subscription.tier as Tier;

  const casesUsed = await formDb.countCasesBySubscription(subscription.id);
  const caseLimit = TIER_CASE_LIMITS[tier];
  if (casesUsed >= caseLimit) {
    throw new AppError(
      403,
      `You have reached your case limit (${caseLimit} cases for ${tier} plan). Please upgrade your plan to file more cases.`,
    );
  }

  const validation = validateAmountAgainstTier(tier, input.declaredStuckAmount);

  if (!validation.valid) {
    if (validation.reason === 'exceeds_tier') {
      throw new AppError(400, 'Your stuck amount exceeds your current plan range. Please upgrade your plan.');
    }
  }

  const submission = await formDb.createFormSubmission({
    userId,
    subscriptionId: subscription.id,
    bankName: input.bankName,
    branchName: input.branchName,
    accountNumber: input.accountNumber,
    remainingBalance: input.remainingBalance,
    freezeDate: input.freezeDate,
    ncrpNo: input.ncrpNo,
    declaredStuckAmount: input.declaredStuckAmount.toString(),
    cityState: input.cityState,
    address: input.address,
    contactNumber: input.contactNumber,
    exchangeName: input.exchangeName,
    orderId: input.orderId,
    counterpartyUsername: input.counterpartyUsername,
    exchangeUid: input.exchangeUid,
    rbiRegionalOffice: input.rbiRegionalOffice,
    emailAddress: input.emailAddress,
  });

  return submission;
}

export async function getSubmissions(userId: string, limit = 20, offset = 0) {
  return formDb.getSubmissionsByUserId(userId, limit, offset);
}

export async function getSubmissionById(submissionId: string, userId: string) {
  const submission = await formDb.getSubmissionById(submissionId, userId);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }
  return submission;
}
