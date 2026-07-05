import type { Tier } from '../../lib/tierValidation';

export interface CaseSummary {
  id: string;
  bankName: string | null;
  branchName: string | null;
  declaredStuckAmount: string;
  ncrpNo: string | null;
  exchangeName: string | null;
  createdAt: Date;
  lettersSent: number;
  lettersTotal: number;
  isComplete: boolean;
}

export interface CaseDetail {
  id: string;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  remainingBalance: string | null;
  freezeDate: string | null;
  ncrpNo: string | null;
  declaredStuckAmount: string;
  cityState: string | null;
  address: string | null;
  contactNumber: string | null;
  exchangeName: string | null;
  orderId: string | null;
  counterpartyUsername: string | null;
  exchangeUid: string | null;
  rbiRegionalOffice: string | null;
  emailAddress: string | null;
  createdAt: Date;
  letters: CaseLetterPreview[];
}

export interface CaseLetterPreview {
  statusId: string;
  letterType: string;
  recipientLabel: string;
  subject: string;
  body: string;
  sent: boolean;
  sentAt: Date | null;
  recipientEmail: string | null;
}

export interface HomeSummary {
  subscription: {
    tier: Tier;
    casesUsed: number;
    caseLimit: number;
    casesRemaining: number;
  } | null;
  totalCases: number;
  completedCases: number;
  recentCases: CaseSummary[];
}
