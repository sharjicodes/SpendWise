import { and, desc, eq } from 'drizzle-orm';
import { paydayCycle, localDate, budgetSummary } from '#lib/budget.js';
import { getDb } from './db';
import { moneyProfile, salaryCycle, transaction } from './schema';

export async function financeSnapshot(userId: string) {
	const db = getDb();
	const [profile] = await db.select().from(moneyProfile).where(eq(moneyProfile.userId, userId)).limit(1);
	if (!profile?.payday || !profile.expectedIncomeMinor) return { profile: profile ? serializeProfile(profile) : null, cycle: null, summary: null, expenses: [] };
	const today = localDate(profile.timezone);
	const dates = paydayCycle(today, profile.payday);
	const id = `cycle-${dates.startsOn}`;
	await db.insert(salaryCycle).values({ id, userId, startsOn: dates.startsOn, endsOn: dates.endsOn, alreadySpentMinor: 0n }).onConflictDoNothing();
	const [cycle] = await db.select().from(salaryCycle).where(and(eq(salaryCycle.userId, userId), eq(salaryCycle.startsOn, dates.startsOn))).limit(1);
	const expenses = await db.select().from(transaction).where(and(eq(transaction.userId, userId), eq(transaction.cycleId, id), eq(transaction.kind, 'expense'))).orderBy(desc(transaction.occurredOn), desc(transaction.createdAt));
	const total = expenses.reduce((sum, item) => sum + item.amountMinor, 0n) + (cycle?.alreadySpentMinor ?? 0n);
	const todaySpent = expenses.filter((item) => item.occurredOn === today).reduce((sum, item) => sum + item.amountMinor, 0n);
	const summary = budgetSummary({ today, endsOn: dates.endsOn, salary: profile.expectedIncomeMinor, reserved: profile.rentLivingMinor + profile.savingsMinor + profile.creditCardMinor + profile.emiMinor + profile.othersMinor + profile.otherCommitmentsMinor, spentToday: todaySpent, cycleSpent: total });
	return {
		profile: serializeProfile(profile),
		cycle: { ...dates, id, alreadySpentMinor: (cycle?.alreadySpentMinor ?? 0n).toString() },
		reviewDue: today >= dates.startsOn && profile.lastReviewedCycle !== id,
		summary: Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, typeof value === 'bigint' ? value.toString() : value])),
		expenses: expenses.map((item) => ({ id: item.id, description: item.note ?? item.merchant ?? item.category, category: item.category, amountMinor: item.amountMinor.toString(), date: item.occurredOn }))
	};
}

export function serializeProfile(profile: typeof moneyProfile.$inferSelect) {
	return { salaryMinor: profile.expectedIncomeMinor?.toString() ?? null, payday: profile.payday, rentLivingMinor: profile.rentLivingMinor.toString(), savingsMinor: profile.savingsMinor.toString(), creditCardMinor: profile.creditCardMinor.toString(), emiMinor: profile.emiMinor.toString(), othersMinor: profile.othersMinor.toString(), otherCommitmentsMinor: profile.otherCommitmentsMinor.toString(), timezone: profile.timezone };
}

export async function saveExpense(userId: string, body: { description: string; category: string; amountMinor: string; date?: string }) {
	const db = getDb();
	const [profile] = await db.select().from(moneyProfile).where(eq(moneyProfile.userId, userId)).limit(1);
	if (!profile?.payday || !profile.expectedIncomeMinor) throw new Error('Complete your pay plan before adding expenses.');
	const today = localDate(profile.timezone);
	const dates = paydayCycle(today, profile.payday);
	const occurredOn = body.date ?? today;
	if (occurredOn < dates.startsOn || occurredOn > today) throw new Error('Choose a date in the current pay cycle, up to today.');
	const id = `cycle-${dates.startsOn}`;
	await db.insert(salaryCycle).values({ id, userId, startsOn: dates.startsOn, endsOn: dates.endsOn, alreadySpentMinor: 0n }).onConflictDoNothing();
	await db.insert(transaction).values({ id: crypto.randomUUID(), userId, cycleId: id, kind: 'expense', amountMinor: BigInt(body.amountMinor), category: body.category, note: body.description, occurredOn });
	return financeSnapshot(userId);
}
