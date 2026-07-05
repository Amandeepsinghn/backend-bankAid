export type LetterType =
  | 'branch_manager'
  | 'investigating_officer'
  | 'nodal_officer'
  | 'exchange_compliance'
  | 'rbi_ombudsman';

export interface MarkSentInput {
  recipientEmail?: string;
}

export interface LetterStatusResponse {
  id: string;
  submissionId: string;
  letterType: LetterType;
  sent: boolean;
  sentAt: Date | null;
  recipientEmail: string | null;
}
