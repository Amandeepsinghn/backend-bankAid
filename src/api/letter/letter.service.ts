import { AppError } from '../../middleware/error/errorHandler';
import { generateLetters } from '../../lib/letterTemplates';
import * as letterDb from './letter.db';
import * as authDb from '../auth/auth.db';

export async function getLettersForSubmission(submissionId: string, userId: string) {
  const submission = await letterDb.getSubmissionWithOwnerCheck(submissionId, userId);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }

  const profile = await authDb.findProfileById(userId);
  if (!profile) {
    throw new AppError(404, 'Profile not found');
  }

  const letters = generateLetters({
    fullName: profile.fullName,
    bankName: submission.bankName ?? '',
    branchName: submission.branchName ?? '',
    accountNumber: submission.accountNumber ?? '',
    remainingBalance: submission.remainingBalance ?? '',
    freezeDate: submission.freezeDate ?? '',
    ncrpNo: submission.ncrpNo ?? '',
    declaredStuckAmount: submission.declaredStuckAmount,
    cityState: submission.cityState ?? '',
    address: submission.address ?? '',
    contactNumber: submission.contactNumber ?? '',
    exchangeName: submission.exchangeName ?? '',
    orderId: submission.orderId ?? '',
    counterpartyUsername: submission.counterpartyUsername ?? '',
    exchangeUid: submission.exchangeUid ?? '',
    rbiRegionalOffice: submission.rbiRegionalOffice ?? '',
    emailAddress: submission.emailAddress ?? '',
  });

  const statuses = await letterDb.getLetterStatusesBySubmission(submissionId);

  return letters.map((letter) => {
    const status = statuses.find((s) => s.letterType === letter.letterType);
    return {
      ...letter,
      statusId: status?.id,
      sent: status?.sent ?? false,
      sentAt: status?.sentAt ?? null,
      recipientEmail: status?.recipientEmail ?? null,
    };
  });
}

export async function markLetterAsSent(letterStatusId: string, userId: string, recipientEmail?: string) {
  const status = await letterDb.getLetterStatusById(letterStatusId);
  if (!status) {
    throw new AppError(404, 'Letter status not found');
  }

  const submission = await letterDb.getSubmissionWithOwnerCheck(status.submissionId, userId);
  if (!submission) {
    throw new AppError(403, 'You do not have access to this letter');
  }

  const updated = await letterDb.markLetterSent(letterStatusId, recipientEmail);
  return updated;
}

export async function getLetterStatuses(submissionId: string, userId: string) {
  const submission = await letterDb.getSubmissionWithOwnerCheck(submissionId, userId);
  if (!submission) {
    throw new AppError(404, 'Submission not found');
  }

  return letterDb.getLetterStatusesBySubmission(submissionId);
}
