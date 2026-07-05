export interface FormSubmitInput {
  bankName: string;
  branchName: string;
  accountNumber: string;
  remainingBalance: string;
  freezeDate: string;
  ncrpNo: string;
  declaredStuckAmount: number;
  cityState: string;
  address: string;
  contactNumber: string;
  exchangeName: string;
  orderId: string;
  counterpartyUsername: string;
  exchangeUid: string;
  rbiRegionalOffice: string;
  emailAddress: string;
}

export interface FormSubmissionResponse {
  id: string;
  bankName: string | null;
  branchName: string | null;
  accountNumber: string | null;
  declaredStuckAmount: string;
  createdAt: Date;
}
