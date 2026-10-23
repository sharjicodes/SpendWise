<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let createAccount = $state(page.url.searchParams.get('mode') === 'signup');
	let busy = $state(false);
	let error = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		busy = true;
		error = '';
		try {
			const response = await fetch(`/api/auth/${createAccount ? 'sign-up/email' : 'sign-in/email'}`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(createAccount ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password })
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.message || result.error || 'Could not complete sign-in.');
			const next = page.url.searchParams.get('next');
			await goto(next?.startsWith('/') ? next : '/app');
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not connect. Try again.';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head><title>{createAccount ? 'Create account' : 'Sign in'} — SpendWise</title><meta name="description" content="Sign in to your private SpendWise workspace." /></svelte:head>
<main class="auth-page">
	<a class="brand auth-brand" href="/"><span class="brand-mark" aria-hidden="true">S</span><span>SpendWise</span></a>
	<section class="auth-card">
		<p class="eyebrow">YOUR MONEY, ON YOUR TERMS</p>
		<h1>{createAccount ? 'Start with a clear view.' : 'Welcome back.'}</h1>
		<p class="auth-intro">{createAccount ? 'Create your private workspace to begin building a payday-to-payday plan.' : 'Sign in to continue to your money overview.'}</p>
		<form onsubmit={submit}>
			{#if createAccount}<label>Your name<input bind:value={name} autocomplete="name" required maxlength="100" /></label>{/if}
			<label>Email address<input bind:value={email} type="email" autocomplete="email" required maxlength="254" /></label>
			<label>Password<input bind:value={password} type="password" autocomplete={createAccount ? 'new-password' : 'current-password'} required minlength="8" maxlength="128" /></label>
			{#if error}<p class="auth-error" role="alert">{error}</p>{/if}
			<button class="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : createAccount ? 'Create your account' : 'Sign in'} <span aria-hidden="true">→</span></button>
		</form>
		<p class="auth-switch">{createAccount ? 'Already have an account?' : 'New to SpendWise?'} <button onclick={() => { createAccount = !createAccount; error = ''; }}> {createAccount ? 'Sign in' : 'Create an account'}</button></p>
		<a class="offline-continue" href="/offline"><span aria-hidden="true">◉</span><span><strong>Continue offline</strong><small>Use a private, local log on this device</small></span><span aria-hidden="true">→</span></a>
		<p class="auth-footnote">Your account is separate from your bank. No payments or subscriptions are needed.</p>
	</section>
	<a class="auth-home" href="/">← Back to SpendWise</a>
</main>
