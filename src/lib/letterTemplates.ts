interface SubmissionData {
  fullName: string;
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
}

export interface GeneratedLetter {
  letterType: 'branch_manager' | 'investigating_officer' | 'nodal_officer' | 'exchange_compliance' | 'rbi_ombudsman';
  recipientLabel: string;
  subject: string;
  body: string;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function maskAccount(accountNumber: string): string {
  if (accountNumber.length <= 3) return accountNumber;
  return 'XXX' + accountNumber.slice(-3);
}

export function generateLetters(data: SubmissionData): GeneratedLetter[] {
  const date = formatDate();

  return [
    {
      letterType: 'branch_manager',
      recipientLabel: 'Bank Branch Manager',
      subject: `Request to Lift Lien/Hold on Account No: ${data.accountNumber}`,
      body: `Date: ${date}

To,
The Branch Manager,
${data.bankName},
${data.branchName}

Subject: Request to Lift Lien/Hold on Account No: ${data.accountNumber}

Respected Sir/Madam,

I am writing to formally request the removal of a lien/hold of INR ${data.declaredStuckAmount} placed on my savings account. I was informed that this hold was initiated following a request from a law enforcement agency (Ref: ${data.ncrpNo}).

I am a regular user of this account for my personal and household expenses. The hold on these funds is causing significant inconvenience. I wish to state that I am a law-abiding citizen and the transaction in question was a legitimate P2P trade on a recognized platform. I request you to provide me with the 'Freeze Order' or 'Lien Notice' copy so I can approach the relevant authorities to clear my name.

Yours faithfully,

${data.fullName}
${data.contactNumber}`,
    },
    {
      letterType: 'investigating_officer',
      recipientLabel: 'Investigating Officer (Cyber Cell)',
      subject: `Submission of Evidence for Transaction under NCRP No: ${data.ncrpNo}`,
      body: `Date: ${date}

To,
The Investigating Officer (IO),
Cyber Crime Police Station,
${data.cityState}

Subject: Submission of Evidence for Transaction under NCRP No: ${data.ncrpNo}

Sir,

I am the holder of ${data.bankName} Account ${maskAccount(data.accountNumber)}, which has been partially frozen following a complaint registered in your jurisdiction. I would like to clarify that I am a third-party victim in this case.

The disputed amount of INR ${data.declaredStuckAmount} was received by me in exchange for digital assets sold on a P2P exchange. I have no knowledge of the sender's source of funds. I am attaching the trade receipt, buyer's KYC details, and chat logs as proof of my innocence. I request you to kindly review this evidence and issue an 'Unfreeze Order' to my bank.

Sincerely,

${data.fullName}
${data.address}`,
    },
    {
      letterType: 'nodal_officer',
      recipientLabel: 'Principal Nodal Officer (Bank HQ)',
      subject: `Escalation regarding Unauthorized/Prolonged Freeze on Account No: ${data.accountNumber}`,
      body: `Date: ${date}

To,
The Principal Nodal Officer,
${data.bankName}, Customer Care Wing,
Head Office.

Subject: Escalation regarding Unauthorized/Prolonged Freeze on Account No: ${data.accountNumber}

Dear Sir/Madam,

I am writing to escalate a grievance regarding a hold placed on my account since ${data.freezeDate}. Despite multiple requests to my home branch, I have not received the official freeze notice or contact details of the requesting agency.

According to banking norms, a bank must provide the customer with the reason for a debit freeze. I request you to intervene and ensure that the branch either provides the legal documentation or releases the hold on my remaining balance of INR ${data.remainingBalance} immediately.

Respectfully,

${data.fullName}`,
    },
    {
      letterType: 'exchange_compliance',
      recipientLabel: 'Exchange Compliance/Support Team',
      subject: `Urgent Assistance Required - Bank Account Frozen due to Order ID: ${data.orderId}`,
      body: `Date: ${date}

To,
Compliance/Security Department,
${data.exchangeName}

Subject: Urgent Assistance Required - Bank Account Frozen due to Order ID: ${data.orderId}

Dear Support Team,

I am writing to report that my bank account in India has been frozen by police authorities due to a P2P transaction completed on your platform with User: ${data.counterpartyUsername}.

The authorities claim the funds I received were linked to a crime. As a verified merchant/trader on your platform, I followed all rules. I request you to provide a 'Trade Certification' or 'Verification Letter' confirming this was a legitimate trade on your platform, which I can present to the Indian Cyber Cell to prove my innocence.

Regards,

${data.fullName}
User ID: ${data.exchangeUid}`,
    },
    {
      letterType: 'rbi_ombudsman',
      recipientLabel: 'Banking Ombudsman (RBI)',
      subject: `Complaint Against ${data.bankName} for Deficiency in Service regarding Account Freeze`,
      body: `Date: ${date}

To,
The Banking Ombudsman,
Reserve Bank of India,
${data.rbiRegionalOffice}

Subject: Complaint Against ${data.bankName} for Deficiency in Service regarding Account Freeze

Respected Sir,

I am filing this complaint against ${data.bankName}, ${data.branchName}, for failing to assist me regarding a lien mark on my account. The bank has frozen my funds without providing a written notice or the copy of the police order despite my verbal and written requests.

This lack of transparency is a violation of my rights as a consumer. I request the Ombudsman to direct the bank to provide the necessary legal documents and to limit the freeze strictly to the disputed amount only, allowing me access to my legitimate savings.

Yours sincerely,

${data.fullName}
${data.emailAddress}`,
    },
  ];
}
