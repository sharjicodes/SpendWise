<script lang="ts">
	import { onMount } from 'svelte';
	import { budgetSummary, formatMoney, paydayCycle, parseMoney, parseNonnegativeMoney } from '#lib/budget.js';
	type LocalExpense = { id: string; title: string; category: string; amountMinor: number; spentOn: string; createdAt: number };
	type LocalPlan = { id: 'current'; salaryMinor: number; payday: number; rentLivingMinor: number; savingsMinor: number; creditCardMinor?: number; emiMinor?: number; othersMinor?: number; otherCommitmentsMinor?: number; alreadySpentMinor?: number; alreadySpentCycleId?: string; lastReviewedCycle?: string };
	let entries = $state<LocalExpense[]>([]);
	let plan = $state<LocalPlan | null>(null);
	let title = $state('');
	let amount = $state('');
	let category = $state('Food');
	let spentOn = $state(today());
	let online = $state(true);
	let saving = $state(false);
	let message = $state('');
	let error = $state('');
	let salary = $state('');
	let payday = $state('1');
	let rentLiving = $state('');
	let savings = $state('');
	let creditCard = $state('');
	let emi = $state('');
	let others = $state('');
	let otherCommitments = $state('');
	let alreadySpent = $state('');
	let planMessage = $state('');
	let reviewEditing = $state(false);
	let database: IDBDatabase | undefined;
	let cycleInfo = $derived(plan ? paydayCycle(today(), plan.payday) : null);
	let localSummary = $derived.by(() => {
		if (!plan || !cycleInfo) return null;
		const cycleEntries = entries.filter((item) => item.spentOn >= cycleInfo.startsOn && item.spentOn <= cycleInfo.endsOn);
		const spentToday = cycleEntries.filter((item) => item.spentOn === today()).reduce((sum, item) => sum + item.amountMinor, 0);
		const cycleSpent = cycleEntries.reduce((sum, item) => sum + item.amountMinor, 0) + (plan.alreadySpentCycleId === `cycle-${cycleInfo.startsOn}` ? (plan.alreadySpentMinor ?? 0) : 0);
		return budgetSummary({ today: today(), endsOn: cycleInfo.endsOn, salary: BigInt(plan.salaryMinor), reserved: BigInt(plan.rentLivingMinor + plan.savingsMinor + (plan.creditCardMinor ?? 0) + (plan.emiMinor ?? 0) + (plan.othersMinor ?? 0) + (plan.otherCommitmentsMinor ?? 0)), spentToday: BigInt(spentToday), cycleSpent: BigInt(cycleSpent) });
	});
	let reviewDue = $derived(Boolean(plan && cycleInfo && plan.lastReviewedCycle !== `cycle-${cycleInfo.startsOn}`));

	function today() {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	}

	function openDatabase(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open('spendwise-device-log', 2);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains('expenses')) request.result.createObjectStore('expenses', { keyPath: 'id' });
				if (!request.result.objectStoreNames.contains('profile')) request.result.createObjectStore('profile', { keyPath: 'id' });
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error('Could not open the local spending log.'));
		});
	}

	function loadEntries() {
		if (!database) return;
		const request = database.transaction('expenses', 'readonly').objectStore('expenses').getAll();
		request.onsuccess = () => entries = (request.result as LocalExpense[]).sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.createdAt - a.createdAt);
		request.onerror = () => error = 'Could not read the local spending log.';
		const profileRequest = database.transaction('profile', 'readonly').objectStore('profile').get('current');
		profileRequest.onsuccess = () => {
			plan = profileRequest.result as LocalPlan | undefined ?? null;
			if (plan) {
				salary = (plan.salaryMinor / 100).toFixed(2);
				payday = String(plan.payday);
				rentLiving = (plan.rentLivingMinor / 100).toFixed(2);
				savings = (plan.savingsMinor / 100).toFixed(2);
				otherCommitments = ((plan.otherCommitmentsMinor ?? 0) / 100).toFixed(2);
				alreadySpent = (plan.alreadySpentCycleId === `cycle-${paydayCycle(today(), plan.payday).startsOn}` ? (plan.alreadySpentMinor ?? 0) / 100 : 0).toFixed(2);
				creditCard = ((plan.creditCardMinor ?? 0) / 100).toFixed(2);
				emi = ((plan.emiMinor ?? 0) / 100).toFixed(2);
				others = ((plan.othersMinor ?? 0) / 100).toFixed(2);
			}
		};
	}

	function savePlan(event: SubmitEvent) {
		event.preventDefault(); error = ''; planMessage = '';
		if (!database) return;
		const salaryMinor = parseMoney(salary);
		const rentMinor = rentLiving.trim() ? parseNonnegativeMoney(rentLiving) : 0n;
		const savingsMinor = savings.trim() ? parseNonnegativeMoney(savings) : 0n;
		const creditCardMinor = creditCard.trim() ? parseNonnegativeMoney(creditCard) : 0n;
		const emiMinor = emi.trim() ? parseNonnegativeMoney(emi) : 0n;
		const othersMinor = others.trim() ? parseNonnegativeMoney(others) : 0n;
		const otherCommitmentsMinor = otherCommitments.trim() ? parseNonnegativeMoney(otherCommitments) : 0n;
		const alreadySpentMinor = alreadySpent.trim() ? parseNonnegativeMoney(alreadySpent) : 0n;
		const payDay = Number(payday);
		if (!salaryMinor || rentMinor === null || savingsMinor === null || creditCardMinor === null || emiMinor === null || othersMinor === null || otherCommitmentsMinor === null || alreadySpentMinor === null || rentMinor + savingsMinor + creditCardMinor + emiMinor + othersMinor + otherCommitmentsMinor > salaryMinor || !Number.isInteger(payDay) || payDay < 1 || payDay > 31) {
			error = 'Check the amounts and choose a payday between 1 and 31. All set-asides must fit within your salary.';
			return;
		}
		const currentCycleId = `cycle-${paydayCycle(today(), payDay).startsOn}`;
		const value: LocalPlan = { id: 'current', salaryMinor: Number(salaryMinor), payday: payDay, rentLivingMinor: Number(rentMinor), savingsMinor: Number(savingsMinor), creditCardMinor: Number(creditCardMinor), emiMinor: Number(emiMinor), othersMinor: Number(othersMinor), otherCommitmentsMinor: Number(otherCommitmentsMinor), alreadySpentMinor: Number(alreadySpentMinor), alreadySpentCycleId: currentCycleId, lastReviewedCycle: currentCycleId };
		const tx = database.transaction('profile', 'readwrite');
		tx.objectStore('profile').put(value);
		tx.oncomplete = () => { plan = value; planMessage = 'Pay plan saved on this device.'; reviewEditing = false; };
		tx.onerror = () => error = 'Could not save your pay plan in local storage.';
	}

	function confirmPlan() {
		if (!database || !plan || !cycleInfo) return;
		const value = { ...plan, lastReviewedCycle: `cycle-${cycleInfo.startsOn}` };
		const tx = database.transaction('profile', 'readwrite');
		tx.objectStore('profile').put(value);
		tx.oncomplete = () => { plan = value; planMessage = 'Pay plan confirmed for this salary cycle.'; };
		tx.onerror = () => error = 'Could not confirm your pay plan in local storage.';
	}

	function addEntry(event: SubmitEvent) {
		event.preventDefault();
		if (!database) return;
		const match = amount.trim().match(/^(\d{1,10})(?:\.(\d{1,2}))?$/);
		if (!match) {
			error = 'Enter an amount with up to two decimal places.';
			return;
		}
		const whole = Number(match[1]);
		const fraction = Number((match[2] ?? '').padEnd(2, '0'));
		const amountMinor = whole * 100 + fraction;
		if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) {
			error = 'Enter an amount greater than zero.';
			return;
		}
		error = '';
		saving = true;
		const item: LocalExpense = { id: crypto.randomUUID(), title: title.trim(), category, amountMinor, spentOn, createdAt: Date.now() };
		const tx = database.transaction('expenses', 'readwrite');
		tx.objectStore('expenses').add(item);
		tx.oncomplete = () => {
			entries = [item, ...entries].sort((a, b) => b.spentOn.localeCompare(a.spentOn) || b.createdAt - a.createdAt);
			title = '';
			amount = '';
			message = 'Saved on this device.';
			saving = false;
		};
		tx.onerror = () => {
			error = 'Could not save. Check available device storage and try again.';
			saving = false;
		};
	}

	function deleteEntry(id: string) {
		if (!database || !confirm('Delete this local entry?')) return;
		const tx = database.transaction('expenses', 'readwrite');
		tx.objectStore('expenses').delete(id);
		tx.oncomplete = () => entries = entries.filter((item) => item.id !== id);
	}

	function exportCsv() {
		const rows = [['Date', 'Description', 'Category', 'Amount (INR)'], ...entries.map((item) => [item.spentOn, item.title, item.category, (item.amountMinor / 100).toFixed(2)])];
		const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\r\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'spendwise-device-log.csv';
		link.click();
		URL.revokeObjectURL(url);
	}

	function formatMinor(minor: number | bigint) { return formatMoney(minor); }

	onMount(() => {
		const refreshNetwork = () => online = navigator.onLine;
		window.addEventListener('online', refreshNetwork);
		window.addEventListener('offline', refreshNetwork);
		refreshNetwork();
		openDatabase().then((db) => {
			database = db;
			loadEntries();
		}).catch(() => error = 'Local storage is not available in this browser. Try opening SpendWise in Safari or Chrome.');
		return () => {
			window.removeEventListener('online', refreshNetwork);
			window.removeEventListener('offline', refreshNetwork);
			database?.close();
		};
	});
</script>

<svelte:head><title>Offline spending log — SpendWise</title><meta name="description" content="Keep a spending log on this device, even when you are offline." /></svelte:head>
<main class="device-page">
	<header class="device-header"><a class="brand" href="/app"><span class="brand-mark" aria-hidden="true">S</span><span>SpendWise</span></a><a class="device-back" href="/app">Back to overview <span aria-hidden="true">↗</span></a></header>
	<div class="device-content">
		<div class="device-heading"><div><p class="eyebrow">ON THIS DEVICE</p><h1>Offline spending log</h1><p>Keep recording purchases without an internet connection.</p></div><span class:offline={!online} class="network-pill"><i></i>{online ? 'Online · local log' : 'Offline · ready'}</span></div>
		<div class="local-notice"><span aria-hidden="true">⌑</span><p><strong>Device-only storage.</strong> Entries stay in this browser and do not sync to your online account. Export a CSV to keep a copy before clearing browser data or changing devices.</p></div>
		<section class="device-card local-plan"><div class="device-card-heading"><span class="offline-symbol">₹</span><div><h2>Your payday budget</h2><p>Salary, payday and set-asides stay in this browser.</p></div></div>
			{#if reviewDue}<section class="local-payday-review"><div><strong>New salary cycle</strong><p>Review your salary and set-asides for this month, or keep the current plan.</p></div><button class="device-export" onclick={() => reviewEditing = true}>Review plan</button><button class="device-export" onclick={confirmPlan}>Keep current plan</button></section>{/if}
			{#if localSummary && plan && cycleInfo}<div class="local-budget-summary"><div><small>DAILY GUIDE</small><strong>{formatMinor(localSummary.dailyGuide)}</strong><span>{localSummary.daysLeft} days until payday · {cycleInfo.nextPayday}</span></div><div><small>LEFT TODAY</small><strong class:over-budget={localSummary.remainingToday < 0n}>{formatMinor(localSummary.remainingToday)}</strong><span>After today’s logged expenses</span></div><div><small>UPCOMING DAILY GUIDE</small><strong>{formatMinor(localSummary.upcomingGuide)}</strong><span>Adjusts when spending is above or below guide</span></div><div><small>PERSONAL BUDGET LEFT</small><strong class:over-budget={localSummary.cycleRemaining < 0n}>{formatMinor(localSummary.cycleRemaining)}</strong><span>Personal budget this pay cycle</span></div></div>{/if}
			<details class="local-plan-details" open={!plan || reviewEditing}><summary>{plan ? 'Edit salary and set-asides' : 'Set salary and payday'}</summary><form class="device-form-row local-plan-form" onsubmit={savePlan}><label>Take-home salary (₹)<input bind:value={salary} inputmode="decimal" placeholder="e.g. 45000" required /></label><label>Salary day of month<input bind:value={payday} type="number" min="1" max="31" required /></label><label>Rent & living (₹)<input bind:value={rentLiving} inputmode="decimal" placeholder="e.g. 16000" /></label><label>Savings (₹)<input bind:value={savings} inputmode="decimal" placeholder="e.g. 5000" /></label><label>Credit card bill (₹)<input bind:value={creditCard} inputmode="decimal" placeholder="Monthly payment amount" /></label><label>EMI (₹)<input bind:value={emi} inputmode="decimal" placeholder="Monthly installment" /></label><label>Money to give others (₹)<input bind:value={others} inputmode="decimal" placeholder="Monthly amount to set aside" /></label><label>Other monthly commitments (₹)<input bind:value={otherCommitments} inputmode="decimal" placeholder="Utilities, subscriptions, insurance…" /></label><label>Already spent this cycle (₹)<input bind:value={alreadySpent} inputmode="decimal" placeholder="Spent before starting to track" /><small>Unlogged spending since payday. Resets at the next payday.</small></label><div class="local-personal">Available for personal expenses <strong>{formatMinor((parseMoney(salary) ?? 0n) - (parseMoney(rentLiving) ?? 0n) - (parseMoney(savings) ?? 0n) - (parseMoney(creditCard) ?? 0n) - (parseMoney(emi) ?? 0n) - (parseMoney(others) ?? 0n) - (parseMoney(otherCommitments) ?? 0n))}</strong><small>Food, travel, petrol and other everyday spending</small></div><button class="button button-primary device-submit">Save pay plan on this device →</button></form></details>
			{#if error}<p class="auth-error" role="alert">{error}</p>{/if}{#if planMessage}<p class="device-success" role="status">✓ {planMessage}</p>{/if}
		</section>
		<div class="device-columns">
			<section class="device-card add-expense"><div class="device-card-heading"><span class="offline-symbol">＋</span><div><h2>Add a purchase</h2><p>Saved locally as soon as you add it.</p></div></div>
				<form onsubmit={addEntry}>
					<label>Description<input bind:value={title} maxlength="80" placeholder="e.g. Lunch" required /></label>
					<div class="device-form-row"><label>Amount (₹)<input bind:value={amount} type="text" inputmode="decimal" placeholder="0.00" required /></label><label>Category<select bind:value={category}><option>Food</option><option>Travel</option><option>Shopping</option><option>Bills</option><option>Health</option><option>Other</option></select></label></div>
					<label>Date<input bind:value={spentOn} type="date" required /></label>
					{#if error}<p class="auth-error" role="alert">{error}</p>{/if}
					{#if message}<p class="device-success" role="status">✓ {message}</p>{/if}
					<button class="button button-primary device-submit" disabled={saving}>{saving ? 'Saving…' : 'Save to this device'} <span aria-hidden="true">→</span></button>
				</form>
			</section>
			<section class="device-card local-history"><div class="device-card-heading"><span class="offline-symbol">↔</span><div><h2>Your local entries</h2><p>{entries.length} {entries.length === 1 ? 'purchase' : 'purchases'} stored in this browser.</p></div><button class="device-export" onclick={exportCsv} disabled={entries.length === 0}>Export CSV</button></div>
				{#if entries.length}<ul class="local-list">{#each entries as item (item.id)}<li><div class="local-date">{new Date(`${item.spentOn}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div><div class="local-details"><strong>{item.title}</strong><small>{item.category} · {item.spentOn}</small></div><strong class="local-amount">{formatMoney(item.amountMinor)}</strong><button class="local-delete" aria-label={`Delete ${item.title}`} onclick={() => deleteEntry(item.id)}>×</button></li>{/each}</ul>{:else}<div class="device-empty"><span aria-hidden="true">◈</span><strong>Your log is ready</strong><p>Add a purchase and it will stay available on this device, even if you go offline.</p></div>{/if}
			</section>
		</div>
		<a class="device-signin" href="/signin">Sign in to use your online account <span aria-hidden="true">→</span></a>
	</div>
</main>
