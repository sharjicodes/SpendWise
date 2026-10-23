<script lang="ts">
	import { onMount } from 'svelte';

	type InstallPromptEvent = Event & {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	};

	let promptEvent: InstallPromptEvent | null = null;
	let isInstalled = $state(false);
	let visible = $state(false);
	let helpDialog: HTMLDialogElement;

	onMount(() => {
		const ua = navigator.userAgent;
		const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		const isAndroid = /Android/i.test(ua);
		let dismissed = false;
		try { dismissed = localStorage.getItem('spendwise-install-dismissed') === '1'; } catch { /* Storage can be unavailable in restricted browser modes. */ }
		const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
		const refresh = () => {
			isInstalled = standalone();
			visible = !isInstalled && !dismissed && (Boolean(promptEvent) || isIOS || isAndroid);
		};
		const onBeforeInstall = (event: Event) => {
			event.preventDefault();
			promptEvent = event as InstallPromptEvent;
			refresh();
		};
		const onInstalled = () => {
			promptEvent = null;
			dismissed = false;
			try { localStorage.removeItem('spendwise-install-dismissed'); } catch { /* Installation state still hides the banner. */ }
			refresh();
		};
		window.addEventListener('beforeinstallprompt', onBeforeInstall);
		window.addEventListener('appinstalled', onInstalled);
		const displayMode = window.matchMedia('(display-mode: standalone)');
		displayMode.addEventListener('change', refresh);
		refresh();
		return () => {
			window.removeEventListener('beforeinstallprompt', onBeforeInstall);
			window.removeEventListener('appinstalled', onInstalled);
			displayMode.removeEventListener('change', refresh);
		};
	});

	async function install() {
		if (!promptEvent) {
			helpDialog.showModal();
			return;
		}
		const event = promptEvent;
		await event.prompt();
		const choice = await event.userChoice;
		if (choice.outcome === 'accepted') {
			promptEvent = null;
			visible = false;
		}
	}

	function dismiss() {
		try { localStorage.setItem('spendwise-install-dismissed', '1'); } catch { /* Dismiss for the current page even if storage is unavailable. */ }
		visible = false;
	}
</script>

{#if visible && !isInstalled}
	<aside class="install-banner" aria-label="Install SpendWise">
		<div class="install-icon"><img src="/spendwise-192.png" alt="" width="40" height="40" /></div>
		<div class="install-copy">
			<strong>Install SpendWise</strong>
			<span>Add it to your device for quick, app-like access.</span>
		</div>
		<button class="install-action" onclick={install}>{promptEvent ? 'Install app' : 'How to install'}</button>
		<button class="install-dismiss" aria-label="Dismiss install banner" onclick={dismiss}>×</button>
	</aside>
	<dialog class="install-help" bind:this={helpDialog}>
		<div class="install-help-head"><img src="/spendwise-192.png" alt="" width="44" height="44" /><button class="install-dismiss" aria-label="Close" onclick={() => helpDialog.close()}>×</button></div>
		<h2>Add SpendWise to your Home Screen</h2>
		<p class="install-device-note">{#if /iPad|iPhone|iPod/.test(typeof navigator === 'undefined' ? '' : navigator.userAgent)}Use Safari on your iPhone or iPad:{:else if /Android/i.test(typeof navigator === 'undefined' ? '' : navigator.userAgent)}Use Chrome on your Android device:{:else}Use your browser’s install menu:{/if}</p>
		<ol>
			{#if /iPad|iPhone|iPod/.test(typeof navigator === 'undefined' ? '' : navigator.userAgent)}
				<li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
			{:else if /Android/i.test(typeof navigator === 'undefined' ? '' : navigator.userAgent)}
				<li>Open Chrome’s <strong>⋮ menu</strong>.</li><li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</li>
			{:else}
				<li>Open your browser menu or the install icon in the address bar.</li><li>Choose <strong>Install SpendWise</strong> and confirm.</li>
			{/if}
		</ol>
		<button class="install-action install-help-done" onclick={() => helpDialog.close()}>Got it</button>
	</dialog>
{/if}
