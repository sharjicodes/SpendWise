import { getDb } from '#lib/server/db.js';
import { moneyProfile, salaryCycle } from '#lib/server/schema.js';
import { financeSnapshot, saveExpense } from '#lib/server/finance.js';
import { eq } from 'drizzle-orm';
import { localDate, paydayCycle } from '#lib/budget.js';
import type { RequestHandler } from './$types';

const jsonError = (message: string, status = 400) => Response.json({ message }, { status });

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return jsonError('Sign in to view your budget.', 401);
	try { return Response.json(await financeSnapshot(locals.user.id)); }
	catch { return jsonError('Could not load your pay plan right now.', 500); }
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return jsonError('Sign in to save your budget.', 401);
	try {
		const body = await request.json();
		if (!/^\d{1,14}$/.test(String(body.salaryMinor)) || !/^\d{1,14}$/.test(String(body.rentLivingMinor)) || !/^\d{1,14}$/.test(String(body.savingsMinor))) return jsonError('Enter valid amounts.');
		if (!/^\d{1,14}$/.test(String(body.creditCardMinor ?? '0')) || !/^\d{1,14}$/.test(String(body.emiMinor ?? '0')) || !/^\d{1,14}$/.test(String(body.othersMinor ?? '0')) || !/^\d{1,14}$/.test(String(body.otherCommitmentsMinor ?? '0'))) return jsonError('Enter valid amounts for your monthly commitments.');
		if (!/^\d{1,14}$/.test(String(body.alreadySpentMinor ?? '0'))) return jsonError('Enter a valid amount already spent this cycle.');
		const salary = BigInt(body.salaryMinor);
		const rent = BigInt(body.rentLivingMinor);
		const savings = BigInt(body.savingsMinor);
		const creditCard = BigInt(body.creditCardMinor ?? '0');
		const emi = BigInt(body.emiMinor ?? '0');
		const others = BigInt(body.othersMinor ?? '0');
		const otherCommitments = BigInt(body.otherCommitmentsMinor ?? '0');
		const alreadySpent = BigInt(body.alreadySpentMinor ?? '0');
		const payday = Number(body.payday);
		if (salary <= 0n || rent + savings + creditCard + emi + others + otherCommitments > salary) return jsonError('Your set-asides and monthly commitments must fit within your take-home salary.');
		if (!Number.isInteger(payday) || payday < 1 || payday > 31) return jsonError('Choose a payday from 1 to 31.');
		const today = localDate('Asia/Kolkata');
		const cycleId = `cycle-${paydayCycle(today, payday).startsOn}`;
		const db = getDb();
		await db.insert(moneyProfile).values({ userId: locals.user.id, expectedIncomeMinor: salary, rentLivingMinor: rent, savingsMinor: savings, creditCardMinor: creditCard, emiMinor: emi, othersMinor: others, otherCommitmentsMinor: otherCommitments, payday, timezone: 'Asia/Kolkata', lastReviewedCycle: cycleId }).onConflictDoUpdate({ target: moneyProfile.userId, set: { expectedIncomeMinor: salary, rentLivingMinor: rent, savingsMinor: savings, creditCardMinor: creditCard, emiMinor: emi, othersMinor: others, otherCommitmentsMinor: otherCommitments, payday, lastReviewedCycle: cycleId, updatedAt: new Date() } });
		const dates = paydayCycle(today, payday);
		await db.insert(salaryCycle).values({ id: cycleId, userId: locals.user.id, startsOn: dates.startsOn, endsOn: dates.endsOn, alreadySpentMinor: alreadySpent }).onConflictDoUpdate({ target: [salaryCycle.userId, salaryCycle.startsOn], set: { endsOn: dates.endsOn, alreadySpentMinor: alreadySpent } });
		return Response.json(await financeSnapshot(locals.user.id));
	} catch { return jsonError('Check the amounts and try saving again.'); }
};

export const PATCH: RequestHandler = async ({ locals }) => {
	if (!locals.user) return jsonError('Sign in to confirm your pay plan.', 401);
	try {
		const db = getDb();
		const [profile] = await db.select().from(moneyProfile).where(eq(moneyProfile.userId, locals.user.id)).limit(1);
		if (!profile?.payday) return jsonError('Set up your pay plan first.');
		const cycleId = `cycle-${paydayCycle(localDate(profile.timezone), profile.payday).startsOn}`;
		await db.update(moneyProfile).set({ lastReviewedCycle: cycleId, updatedAt: new Date() }).where(eq(moneyProfile.userId, locals.user.id));
		return Response.json(await financeSnapshot(locals.user.id));
	} catch { return jsonError('Could not confirm your pay plan. Try again.', 500); }
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) return jsonError('Sign in to save expenses.', 401);
	try {
		const body = await request.json();
		const description = String(body.description ?? '').trim();
		const category = String(body.category ?? 'Personal');
		const amountMinor = String(body.amountMinor ?? '');
		const date = body.date === undefined ? undefined : String(body.date);
		if (!description || description.length > 120) return jsonError('Add a short expense description.');
		if (!['Food', 'Travel', 'Petrol', 'Personal', 'Shopping', 'Bills', 'Health', 'Other'].includes(category)) return jsonError('Choose a valid category.');
		if (!/^\d{1,14}$/.test(amountMinor) || BigInt(amountMinor) <= 0n) return jsonError('Enter an amount greater than zero.');
		if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return jsonError('Choose a valid expense date.');
		return Response.json(await saveExpense(locals.user.id, { description, category, amountMinor, date }));
	} catch (error) { return jsonError(error instanceof Error ? error.message : 'Could not save the expense.'); }
};
