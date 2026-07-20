import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  date,
  unique,
  index,
} from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  fullName: text('full_name').notNull(),
  // Optional — only used as an identity-check field on forgot-password.
  phone: text('phone').unique(),
  // Verified via emailed OTP at registration — see auth.service.ts.
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id).notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('refresh_tokens_user_id_idx').on(table.userId)]
);

export const otps = pgTable(
  'otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Always an email address (column kept as `phone` to avoid an ambiguous rename migration).
    phone: text('phone').notNull(),
    code: text('code').notNull(),
    type: text('type', {
      enum: ['password_reset', 'email_verification'],
    }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    verified: boolean('verified').default(false).notNull(),
    resetTokenUsed: boolean('reset_token_used').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('otps_lookup_idx').on(table.phone, table.type, table.verified, table.expiresAt),
  ]
);

// Single-use, short-lived tokens emailed to a user who hit SUBSCRIPTION_REQUIRED in the
// app, letting them attach their identity to a website checkout without re-logging-in.
// Deliberately separate from `otps`/refresh-token auth — see auth.service.ts's `type`
// discriminator pattern, which this mirrors with its own `checkout` JWT type rather than
// reusing `type: 'auth'`.
export const magicLinkTokens = pgTable(
  'magic_link_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id).notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    // NULL until consumed by a successful /magic-link/verify call.
    usedAt: timestamp('used_at'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('magic_link_tokens_user_id_idx').on(table.userId)]
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id).notNull(),
    tier: text('tier', { enum: ['basic', 'standard', 'premium'] }).notNull(),
    razorpayOrderId: text('razorpay_order_id'),
    razorpayPaymentId: text('razorpay_payment_id'),
    amountPaise: integer('amount_paise').notNull(),
    status: text('status', { enum: ['pending', 'paid', 'failed'] }).default('pending').notNull(),
    // Set only when this purchase originated from a magic-link checkout — the audit
    // trail linking a payment back to the link that produced it.
    magicLinkTokenId: uuid('magic_link_token_id').references(() => magicLinkTokens.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('subscriptions_user_status_idx').on(table.userId, table.status),
    index('subscriptions_razorpay_order_id_idx').on(table.razorpayOrderId),
  ]
);

export const formSubmissions = pgTable(
  'form_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => profiles.id).notNull(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id),

    bankName: text('bank_name'),
    branchName: text('branch_name'),
    accountNumber: text('account_number'),
    remainingBalance: text('remaining_balance'),
    freezeDate: date('freeze_date'),

    ncrpNo: text('ncrp_no'),
    declaredStuckAmount: numeric('declared_stuck_amount').notNull(),
    cityState: text('city_state'),
    address: text('address'),
    contactNumber: text('contact_number'),

    exchangeName: text('exchange_name'),
    orderId: text('order_id'),
    counterpartyUsername: text('counterparty_username'),
    exchangeUid: text('exchange_uid'),

    rbiRegionalOffice: text('rbi_regional_office'),
    emailAddress: text('email_address'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('form_submissions_user_id_idx').on(table.userId),
    index('form_submissions_subscription_id_idx').on(table.subscriptionId),
  ]
);

export const letterStatus = pgTable(
  'letter_status',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    submissionId: uuid('submission_id').references(() => formSubmissions.id).notNull(),
    letterType: text('letter_type', {
      enum: [
        'branch_manager',
        'investigating_officer',
        'nodal_officer',
        'exchange_compliance',
        'rbi_ombudsman',
      ],
    }).notNull(),
    sent: boolean('sent').default(false).notNull(),
    sentAt: timestamp('sent_at'),
    recipientEmail: text('recipient_email'),
  },
  (table) => [
    unique('letter_status_submission_type_unique').on(table.submissionId, table.letterType),
    index('letter_status_submission_sent_idx').on(table.submissionId, table.sent),
  ]
);
