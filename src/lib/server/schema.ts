import {
	boolean,
	date,
	index,
	foreignKey,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	bigint,
	integer
} from 'drizzle-orm/pg-core';

// Better Auth's PostgreSQL schema. Keep field names aligned with its defaults.
export const user = pgTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
}, (table) => [index('session_user_id_idx').on(table.userId)]);

export const account = pgTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('account_user_id_idx').on(table.userId)]);

export const verification = pgTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('verification_identifier_idx').on(table.identifier)]);

// Domain data is private to its owner. Money is stored in integer paise, never float.
export const moneyProfile = pgTable('money_profile', {
	userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
	currency: text('currency').notNull().default('INR'),
	timezone: text('timezone').notNull().default('Asia/Kolkata'),
	payday: integer('payday'),
	expectedIncomeMinor: bigint('expected_income_minor', { mode: 'bigint' }),
	rentLivingMinor: bigint('rent_living_minor', { mode: 'bigint' }).notNull(),
	savingsMinor: bigint('savings_minor', { mode: 'bigint' }).notNull(),
	creditCardMinor: bigint('credit_card_minor', { mode: 'bigint' }).notNull(),
	emiMinor: bigint('emi_minor', { mode: 'bigint' }).notNull(),
	othersMinor: bigint('others_minor', { mode: 'bigint' }).notNull(),
	otherCommitmentsMinor: bigint('other_commitments_minor', { mode: 'bigint' }).notNull(),
	lastReviewedCycle: text('last_reviewed_cycle'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const salaryCycle = pgTable('salary_cycle', {
	id: text('id').notNull(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	startsOn: date('starts_on', { mode: 'string' }).notNull(),
	endsOn: date('ends_on', { mode: 'string' }).notNull(),
	alreadySpentMinor: bigint('already_spent_minor', { mode: 'bigint' }).notNull(),
	label: text('label'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [primaryKey({ columns: [table.userId, table.id] }), index('salary_cycle_owner_dates_idx').on(table.userId, table.startsOn, table.endsOn), uniqueIndex('salary_cycle_owner_start_uq').on(table.userId, table.startsOn)]);

export const transaction = pgTable('transaction', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	cycleId: text('cycle_id'),
	kind: text('kind').notNull(), // income | expense | refund | transfer
	amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
	category: text('category').notNull(),
	merchant: text('merchant'),
	note: text('note'),
	occurredOn: date('occurred_on', { mode: 'string' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('transaction_owner_day_idx').on(table.userId, table.occurredOn), index('transaction_cycle_idx').on(table.userId, table.cycleId), foreignKey({ columns: [table.userId, table.cycleId], foreignColumns: [salaryCycle.userId, salaryCycle.id], name: 'transaction_cycle_owner_fk' })]);

export const allocation = pgTable('allocation', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	cycleId: text('cycle_id').notNull(),
	name: text('name').notNull(),
	kind: text('kind').notNull(), // bill | savings | other
	amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('allocation_owner_cycle_idx').on(table.userId, table.cycleId), foreignKey({ columns: [table.userId, table.cycleId], foreignColumns: [salaryCycle.userId, salaryCycle.id], name: 'allocation_cycle_owner_fk' })]);

export const bill = pgTable('bill', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
	dueOn: date('due_on', { mode: 'string' }).notNull(),
	recurrence: text('recurrence').notNull().default('once'),
	paidAt: timestamp('paid_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [index('bill_owner_due_idx').on(table.userId, table.dueOn)]);

export const schema = { user, session, account, verification, moneyProfile, salaryCycle, transaction, allocation, bill };
