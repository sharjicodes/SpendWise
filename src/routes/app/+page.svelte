<script lang="ts">
	import { onMount } from 'svelte';
	import { formatMoney, parseMoney, parseNonnegativeMoney } from '#lib/budget.js';
	import type { PageProps } from './$types';
	type Expense = { id: string; description: string; category: string; amountMinor: string; date: string };
	type Snapshot = { profile: { salaryMinor: string | null; payday: number | null; rentLivingMinor: string; savingsMinor: string; creditCardMinor: string; emiMinor: string; othersMinor: string; otherCommitmentsMinor: string } | null; cycle: { startsOn: string; endsOn: string; nextPayday: string; alreadySpentMinor: string } | null; reviewDue?: boolean; summary: { personal: string; dailyGuide: string; remainingToday: string; cycleRemaining: string; upcomingGuide: string; daysLeft: number } | null; expenses: Expense[] };
	let { data }: PageProps = $props();
	let active = $state('Overview');
	const sections = ['Overview', 'Activity', 'Plan'];
	let snapshot = $state<Snapshot | null>(null);
	let loading = $state(false);
	let saving = $state(false);
	let error = $state('');
	let message = $state('');
	let salary = $state('');
	let payday = $state('1');
	let rentLiving = $state('');
	let savings = $state('');
	let creditCard = $state('');
	let emi = $state('');
	let others = $state('');
	let otherCommitments = $state('');
	let alreadySpent = $state('');
	let expenseDescription = $state('');
	let expenseAmount = $state('');
	let expenseCategory = $state('Food');
	let expenseDate = $state(todayLocal());
	let personalPreview = $derived((parseMoney(salary) ?? 0n) - (parseMoney(rentLiving) ?? 0n) - (parseMoney(savings) ?? 0n) - (parseMoney(creditCard) ?? 0n) - (parseMoney(emi) ?? 0n) - (parseMoney(others) ?? 0n) - (parseMoney(otherCommitments) ?? 0n));
	function todayLocal() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

	function fillPlan(profile: NonNullable<Snapshot['profile']>) {
		salary = profile.salaryMinor ? (Number(profile.salaryMinor) / 100).toFixed(2) : '';
		payday = String(profile.payday ?? 1);
		rentLiving = (Number(profile.rentLivingMinor) / 100).toFixed(2);
		savings = (Number(profile.savingsMinor) / 100).toFixed(2);
		creditCard = (Number(profile.creditCardMinor ?? '0') / 100).toFixed(2);
		emi = (Number(profile.emiMinor ?? '0') / 100).toFixed(2);
		others = (Number(profile.othersMinor ?? '0') / 100).toFixed(2);
		otherCommitments = (Number(profile.otherCommitmentsMinor ?? '0') / 100).toFixed(2);
	}
	async function loadSnapshot() {
		if (!data.user) return;
		loading = true;
		try {
			const response = await fetch('/api/finance');
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.message ?? 'Could not load your budget.');
			snapshot = payload;
			if (payload.profile) fillPlan(payload.profile);
			alreadySpent = payload.cycle ? (Number(payload.cycle.alreadySpentMinor) / 100).toFixed(2) : '';
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Could not load your budget.'; }
		finally { loading = false; }
	}
	async function savePlan(event: SubmitEvent) {
		event.preventDefault(); error = ''; message = '';
		const salaryMinor = parseMoney(salary), rentMinor = rentLiving.trim() ? parseNonnegativeMoney(rentLiving) : 0n, savingsMinor = savings.trim() ? parseNonnegativeMoney(savings) : 0n, cardMinor = creditCard.trim() ? parseNonnegativeMoney(creditCard) : 0n, emiMinor = emi.trim() ? parseNonnegativeMoney(emi) : 0n, othersMinor = others.trim() ? parseNonnegativeMoney(others) : 0n, otherCommitmentsMinor = otherCommitments.trim() ? parseNonnegativeMoney(otherCommitments) : 0n, alreadySpentMinor = alreadySpent.trim() ? parseNonnegativeMoney(alreadySpent) : 0n;
		if (!salaryMinor || rentMinor === null || savingsMinor === null || cardMinor === null || emiMinor === null || othersMinor === null || otherCommitmentsMinor === null || alreadySpentMinor === null) { error = 'Enter valid amounts using up to two decimal places.'; return; }
		if (rentMinor + savingsMinor + cardMinor + emiMinor + othersMinor + otherCommitmentsMinor > salaryMinor) { error = 'All set-asides and monthly commitments must fit within your take-home salary.'; return; }
		saving = true;
		try {
			const response = await fetch('/api/finance', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ salaryMinor: String(salaryMinor), rentLivingMinor: String(rentMinor), savingsMinor: String(savingsMinor), creditCardMinor: String(cardMinor), emiMinor: String(emiMinor), othersMinor: String(othersMinor), otherCommitmentsMinor: String(otherCommitmentsMinor), alreadySpentMinor: String(alreadySpentMinor), payday: Number(payday) }) });
			const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? 'Could not save your plan.');
			snapshot = payload; fillPlan(payload.profile); message = 'Your pay plan is saved.';
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Could not save your plan.'; }
		finally { saving = false; }
	}
	async function addExpense(event: SubmitEvent) {
		event.preventDefault(); error = ''; message = '';
		const amountMinor = parseMoney(expenseAmount);
		if (!amountMinor) { error = 'Enter an expense amount greater than zero.'; return; }
		saving = true;
		try {
			const response = await fetch('/api/finance', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: expenseDescription, category: expenseCategory, amountMinor: String(amountMinor), date: expenseDate }) });
			const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? 'Could not save your expense.');
			snapshot = payload; expenseDescription = ''; expenseAmount = ''; expenseDate = todayLocal(); message = 'Expense added to this pay cycle.';
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Could not save your expense.'; }
		finally { saving = false; }
	}
	async function confirmCurrentPlan() {
		error = ''; saving = true;
		try {
			const response = await fetch('/api/finance', { method: 'PATCH' });
			const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? 'Could not confirm your plan.');
			snapshot = payload; message = 'Pay plan confirmed for this salary cycle.';
		} catch (cause) { error = cause instanceof Error ? cause.message : 'Could not confirm your plan.'; }
		finally { saving = false; }
	}
	async function signOut() { await fetch('/api/auth/sign-out', { method: 'POST' }); window.location.href = '/'; }
	function minorInput(minor: string | null | undefined) { return minor ? formatMoney(minor) : '—'; }
	onMount(loadSnapshot);
</script>

<svelte:head><title>SpendWise — Your money overview</title><meta name="description" content="Plan your payday cycle and track daily spending." /></svelte:head>
<div class="workspace">
	<header class="workspace-header"><a class="brand" href="/" aria-label="SpendWise home"><span class="brand-mark" aria-hidden="true">S</span><span>SpendWise</span></a>{#if data.user}<button class="mobile-signout" onclick={signOut}>Sign out</button>{:else}<a class="back-link" href="/">Back to home <span aria-hidden="true">↗</span></a>{/if}</header>
	<div class="workspace-body">
		<aside class="side-rail" aria-label="SpendWise sections"><p class="rail-label">YOUR MONEY</p>{#each sections as section}<button class:active={active === section} class="rail-item" onclick={() => active = section}><span class="rail-icon" aria-hidden="true">{section === 'Overview' ? '⌂' : section === 'Activity' ? '↔' : '◷'}</span>{section}</button>{/each}<div class="rail-bottom"><span class="avatar">{data.user?.name?.[0]?.toUpperCase() ?? 'S'}</span><div class="rail-user"><strong>{data.user?.name ?? 'Your account'}</strong><small>{data.user?.email ?? (data.configured ? 'Private workspace' : 'Setup needed')}</small></div>{#if data.user}<button class="sign-out" onclick={signOut}>Sign out</button>{:else}<a class="sign-out" href="/signin">Sign in</a>{/if}</div></aside>
		<main class="dashboard"><div class="dashboard-topline"><div><p class="eyebrow">YOUR SPENDING SPACE</p><h1>{active}{data.user ? `, ${data.user.name.split(' ')[0]}` : ''}</h1><p class="dashboard-subtitle">Your salary, set-asides and everyday spending in one place.</p></div><span class="date-chip"><span class="date-dot"></span> {snapshot?.cycle ? `Payday ${snapshot.profile?.payday}` : 'Payday plan'}</span></div>
			{#if data.user}<a class="offline-banner" href="/offline"><span aria-hidden="true">◉</span><span><strong>Need to go offline?</strong><small>Keep a separate local spending plan on this device</small></span><span aria-hidden="true">→</span></a>{/if}
			{#if data.user && snapshot?.reviewDue}<section class="payday-review" aria-labelledby="payday-review-title"><span class="review-icon" aria-hidden="true">₹</span><div class="review-copy"><p class="eyebrow">NEW PAY CYCLE · {snapshot.cycle?.startsOn}</p><h2 id="payday-review-title">It’s payday. Review your plan for this month.</h2><p>Your salary and set-asides carry forward. Confirm them or update the amounts if anything changed.</p></div><div class="review-actions"><button class="button button-outline" onclick={() => active = 'Plan'}>Review pay plan</button><button class="button button-primary" onclick={confirmCurrentPlan} disabled={saving}>{saving ? 'Saving…' : 'Keep current plan'}</button></div></section>{/if}
			{#if !data.configured}<section class="config-notice"><span class="config-icon">⌑</span><div><strong>Connect your local database to begin.</strong><p>Account-based pay plans need PostgreSQL configured. You can still use the local-only offline page.</p><a class="text-link" href="/offline">Open offline budget →</a></div></section>{:else if !data.user}<section class="section-empty"><span class="section-empty-icon">₹</span><p class="eyebrow">YOUR PAYDAY PLAN</p><h2>Sign in to save your budget</h2><p>Your salary, payday and expense history are private to your account. To continue without an account, use the separate local-only offline budget.</p><a class="button button-primary" href="/signin">Sign in or create an account →</a><a class="text-link" href="/offline">Continue offline on this device →</a></section>
			{:else if loading}<section class="budget-loading">Loading your budget…</section>
			{:else if active === 'Plan'}<section class="budget-panel"><div class="budget-panel-heading"><span class="budget-icon">◷</span><div><p class="eyebrow">YOUR PAY CYCLE</p><h2>Plan your take-home pay</h2><p>Set aside bills, savings and commitments first. Your personal budget is calculated from what remains.</p></div></div><form class="budget-form" onsubmit={savePlan}><label>Take-home salary <span>₹</span><input bind:value={salary} inputmode="decimal" placeholder="e.g. 45000" required /></label><label>Salary arrives on day<input bind:value={payday} type="number" min="1" max="31" required /><small>For months without that date, payday uses the last day of the month.</small></label><label>Rent & living expenses <span>₹</span><input bind:value={rentLiving} inputmode="decimal" placeholder="e.g. 16000" /></label><label>Savings <span>₹</span><input bind:value={savings} inputmode="decimal" placeholder="e.g. 5000" /></label><label>Credit card bill <span>₹</span><input bind:value={creditCard} inputmode="decimal" placeholder="Monthly payment amount" /></label><label>EMI <span>₹</span><input bind:value={emi} inputmode="decimal" placeholder="Monthly installment" /></label><label>Money to give others <span>₹</span><input bind:value={others} inputmode="decimal" placeholder="Monthly amount to set aside" /><small>Money you plan to lend or give to someone this cycle.</small></label><label>Other monthly commitments <span>₹</span><input bind:value={otherCommitments} inputmode="decimal" placeholder="Utilities, subscriptions, insurance…" /><small>Electricity, phone, internet, insurance, subscriptions, or other regular costs.</small></label><label class="current-cycle-field">Already spent this cycle <span>₹</span><input bind:value={alreadySpent} inputmode="decimal" placeholder="Spent before starting to track" /><small>Enter spending since payday that you have not logged as individual expenses. This amount resets next payday.</small></label><div class="personal-preview"><span>Available for personal expenses</span><strong>{personalPreview >= 0n ? formatMoney(personalPreview) : 'Set-asides exceed salary'}</strong><small>Food, travel, petrol and other everyday spending</small></div>{#if error}<p class="finance-error" role="alert">{error}</p>{/if}{#if message}<p class="finance-success" role="status">✓ {message}</p>{/if}<button class="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save pay plan →'}</button></form></section>
			{:else if active === 'Activity'}<section class="activity-layout"><div class="budget-panel"><div class="budget-panel-heading"><span class="budget-icon">＋</span><div><p class="eyebrow">DAILY SPENDING</p><h2>Log an expense</h2><p>Each expense updates the allowance for the rest of this pay cycle.</p></div></div>{#if !snapshot?.profile}<button class="button button-primary" onclick={() => active = 'Plan'}>Set up your pay plan →</button>{:else}<form class="budget-form" onsubmit={addExpense}><label>Description<input bind:value={expenseDescription} maxlength="120" placeholder="e.g. Lunch" required /></label><div class="budget-form-row"><label>Amount (₹)<input bind:value={expenseAmount} inputmode="decimal" placeholder="0.00" required /></label><label>Category<select bind:value={expenseCategory}><option>Food</option><option>Travel</option><option>Petrol</option><option>Personal</option><option>Shopping</option><option>Bills</option><option>Health</option><option>Other</option></select></label></div><label>Date<input bind:value={expenseDate} type="date" required /></label>{#if error}<p class="finance-error" role="alert">{error}</p>{/if}{#if message}<p class="finance-success" role="status">✓ {message}</p>{/if}<button class="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Add expense →'}</button></form>{/if}</div><section class="budget-panel expense-history"><div class="budget-panel-heading"><span class="budget-icon">↔</span><div><p class="eyebrow">THIS PAY CYCLE</p><h2>Expense activity</h2><p>{snapshot?.cycle ? `${snapshot.cycle.startsOn} to ${snapshot.cycle.endsOn}` : 'Your current cycle entries'}</p></div></div>{#if snapshot?.expenses.length || (snapshot?.cycle && BigInt(snapshot.cycle.alreadySpentMinor) > 0n)}<ul class="expense-list">{#if snapshot?.cycle && BigInt(snapshot.cycle.alreadySpentMinor) > 0n}<li><span class="expense-dot">↺</span><span class="expense-copy"><strong>Already spent before tracking</strong><small>Starting amount for this cycle</small></span><strong class="expense-total">−{formatMoney(snapshot.cycle.alreadySpentMinor)}</strong></li>{/if}{#each snapshot?.expenses ?? [] as expense (expense.id)}<li><span class="expense-dot">{expense.category === 'Food' ? '◉' : expense.category === 'Travel' || expense.category === 'Petrol' ? '↗' : '◇'}</span><span class="expense-copy"><strong>{expense.description}</strong><small>{expense.category} · {expense.date}</small></span><strong class="expense-total">−{formatMoney(expense.amountMinor)}</strong></li>{/each}</ul>{:else}<div class="device-empty"><span>◈</span><strong>No expenses in this cycle yet</strong><p>Add your first purchase and your allowance will recalculate automatically.</p></div>{/if}</section></section>
			{:else if !snapshot?.profile}<section class="payday-empty"><div class="setup-art"><div class="art-sun"></div><div class="art-coin">₹</div><div class="art-spark">✳</div></div><div class="setup-copy"><span class="setup-label">START WITH YOUR NEXT PAYDAY</span><h2>Give every part of your salary a place.</h2><p>Add your take-home salary and salary day. Then set aside rent and savings to get a daily personal spending guide.</p><button class="button button-primary" onclick={() => active = 'Plan'}>Set up my pay plan →</button></div></section><div class="empty-grid"><article class="empty-card"><span class="empty-card-icon">◷</span><div><h3>Daily spending guide</h3><p>Adjusts to the days remaining before payday.</p></div></article><article class="empty-card"><span class="empty-card-icon">↔</span><div><h3>Everyday expenses</h3><p>Log purchases and see your remaining allowance.</p></div></article></div>
			{:else}<section class="budget-overview"><div class="daily-hero"><div><span class="setup-label">TODAY’S SPENDING GUIDE</span><strong>{minorInput(snapshot.summary?.dailyGuide)}</strong><p>{snapshot.summary?.daysLeft} days including today until your next payday</p></div><span class="daily-hero-icon">₹</span></div><div class="allowance-grid"><article class="allowance-card"><span>Available for today</span><strong class:over={BigInt(snapshot.summary?.remainingToday ?? '0') < 0n}>{formatMoney(BigInt(snapshot.summary?.remainingToday ?? '0'))}</strong><small>{BigInt(snapshot.summary?.remainingToday ?? '0') < 0n ? 'Over today’s guide' : 'After today’s logged expenses'}</small></article><article class="allowance-card"><span>Daily guide for upcoming days</span><strong>{minorInput(snapshot.summary?.upcomingGuide)}</strong><small>Recalculates using your remaining cycle budget</small></article><article class="allowance-card"><span>Personal budget remaining</span><strong class:over={BigInt(snapshot.summary?.cycleRemaining ?? '0') < 0n}>{formatMoney(BigInt(snapshot.summary?.cycleRemaining ?? '0'))}</strong><small>For {snapshot.summary?.daysLeft} days until payday</small></article><article class="allowance-card"><span>Next salary date</span><strong>{snapshot.cycle?.nextPayday}</strong><small>Personal budget {minorInput(snapshot.summary?.personal)} this cycle</small></article></div><div class="overview-actions"><button class="button button-primary" onclick={() => active = 'Activity'}>＋ Log an expense</button><button class="button button-outline" onclick={() => active = 'Plan'}>Edit pay plan</button></div></section><section class="budget-panel recent-expenses"><div class="budget-panel-heading"><span class="budget-icon">↔</span><div><p class="eyebrow">RECENT ACTIVITY</p><h2>Your expenses</h2><p>{snapshot.expenses.length} expenses in this pay cycle</p></div><button class="text-link" onclick={() => active = 'Activity'}>View all →</button></div>{#if snapshot.expenses.length}<ul class="expense-list">{#each snapshot.expenses.slice(0, 5) as expense (expense.id)}<li><span class="expense-dot">◇</span><span class="expense-copy"><strong>{expense.description}</strong><small>{expense.category} · {expense.date}</small></span><strong class="expense-total">−{formatMoney(expense.amountMinor)}</strong></li>{/each}</ul>{:else}<p class="no-expenses">Nothing logged yet. Add today’s expenses to keep your daily guide accurate.</p>{/if}</section>{/if}
			{#if error && active === 'Overview' && snapshot?.profile}<p class="finance-error" role="alert">{error}</p>{/if}
			<p class="privacy-note"><span aria-hidden="true">◇</span> Your account budget is private. Offline entries are stored separately on this device.</p>
		</main>
	</div>
	<nav class="mobile-nav" aria-label="SpendWise sections">{#each sections as section}<button class:active={active === section} aria-current={active === section ? 'page' : undefined} onclick={() => active = section}><span aria-hidden="true">{section === 'Overview' ? '⌂' : section === 'Activity' ? '↔' : '◷'}</span><small>{section}</small></button>{/each}</nav>
</div>
