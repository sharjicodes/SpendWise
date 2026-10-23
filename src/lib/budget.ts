export type CycleDates = { startsOn: string; endsOn: string; nextPayday: string };

function isoDate(date: Date) {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function paydayInMonth(year: number, month: number, payday: number) {
	const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
	return new Date(Date.UTC(year, month, Math.min(payday, lastDay)));
}

export function localDate(timezone = 'Asia/Kolkata', now = new Date()) {
	const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
	const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
	return `${values.year}-${values.month}-${values.day}`;
}

export function paydayCycle(today: string, payday: number): CycleDates {
	const [year, month, day] = today.split('-').map(Number);
	let start = paydayInMonth(year, month - 1, payday);
	if (day < start.getUTCDate()) start = paydayInMonth(year, month - 2, payday);
	let next = paydayInMonth(year, month, payday);
	if (next <= new Date(`${today}T00:00:00Z`)) next = paydayInMonth(year, month + 1, payday);
	const end = new Date(next.getTime() - 86400000);
	return { startsOn: isoDate(start), endsOn: isoDate(end), nextPayday: isoDate(next) };
}

export function budgetSummary(input: { today: string; endsOn: string; salary: bigint; reserved: bigint; spentToday: bigint; cycleSpent: bigint }) {
	const personal = input.salary - input.reserved;
	const priorSpent = input.cycleSpent - input.spentToday;
	const daysLeft = Math.max(1, Math.floor((Date.parse(`${input.endsOn}T00:00:00Z`) - Date.parse(`${input.today}T00:00:00Z`)) / 86400000) + 1);
	const futureDays = Math.max(0, daysLeft - 1);
	const dailyGuide = (personal > priorSpent ? personal - priorSpent : 0n) / BigInt(daysLeft);
	const remainingToday = dailyGuide - input.spentToday;
	const cycleRemaining = personal - input.cycleSpent;
	const upcomingGuide = futureDays && cycleRemaining > 0n ? cycleRemaining / BigInt(futureDays) : 0n;
	return { personal, dailyGuide, remainingToday, cycleRemaining, upcomingGuide, daysLeft, futureDays };
}

export function parseMoney(value: string): bigint | null {
	const match = value.trim().match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
	if (!match) return null;
	const result = BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
	return result > 0n ? result : null;
}

export function parseNonnegativeMoney(value: string): bigint | null {
	const match = value.trim().match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
	if (!match) return null;
	return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}

export function formatMoney(minor: string | number | bigint) {
	const value = typeof minor === 'bigint' ? Number(minor) : Number(minor);
	return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value / 100);
}
