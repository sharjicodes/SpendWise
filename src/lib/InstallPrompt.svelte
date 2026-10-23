<script lang="ts">
	import { onMount } from 'svelte';

	type InstallPromptEvent = Event & {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	};

	let promptEvent: InstallPromptEvent | null = null;
	let isInstalled = $state(false);
	let visible = $state(false);
	let device = $state<'ios' | 'android' | 'other'>('other');
	let helpDialog: HTMLDialogElement;

	onMount(() => {
		const ua = navigator.userAgent;
		const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
		const isAndroid = /Android/i.test(ua);
		device = isIOS ? 'ios' : isAndroid ? 'android' : 'other';
		let installedEvent = false;
		let dismissed = false;
		try { dismissed = localStorage.getItem('spendwise-install-dismissed') === '1'; } catch { /* Storage can be unavailable in restricted browser modes. */ }
		const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
		const refresh = () => {
			isInstalled = standalone() || installedEvent;
			visible = !isInstalled && !dismissed && (Boolean(promptEvent) || isIOS || isAndroid);
		};
		const onBeforeInstall = (event: Event) => {
			event.preventDefault();
			promptEvent = event as InstallPromptEvent;
			refresh();
		};
		const onInstalled = () => {
			promptEvent = null;
			installedEvent = true;
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
		<div class="install-icon" aria-hidden="true">
			{#if device === 'android'}
				<svg viewBox="0 0 24 24"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" /></svg>
			{:else if device === 'ios'}
				<svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" /></svg>
			{:else}
				<img src="/spendwise-192.png" alt="" width="40" height="40" />
			{/if}
		</div>
		<div class="install-copy">
			<strong>{device === 'ios' ? 'Add SpendWise to Home Screen' : 'Install SpendWise'}</strong>
			<span>{device === 'ios' ? 'Use Safari’s Share menu to add the app.' : 'Add it to your device for quick, app-like access.'}</span>
		</div>
		<button class="install-action" onclick={install}>
			{#if device === 'android'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" /></svg>{/if}
			{device === 'ios' ? 'How to add' : promptEvent ? 'Install app' : device === 'android' ? 'Install app' : 'How to install'}
		</button>
		<button class="install-dismiss" aria-label="Dismiss install banner" onclick={dismiss}>×</button>
	</aside>
	<dialog class="install-help" bind:this={helpDialog}>
		<div class="install-help-head"><img src="/spendwise-192.png" alt="" width="44" height="44" /><button class="install-dismiss" aria-label="Close" onclick={() => helpDialog.close()}>×</button></div>
		<h2>{device === 'ios' ? 'Add SpendWise to your Home Screen' : 'Install SpendWise'}</h2>
		<p class="install-device-note">{#if device === 'ios'}Use Safari on your iPhone or iPad:{:else if device === 'android'}Use Chrome on your Android device:{:else}Use your browser’s install menu:{/if}</p>
		<ol>
			{#if device === 'ios'}
				<li>Tap the <strong>Share</strong> button in Safari.</li><li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
			{:else if device === 'android'}
				{#if promptEvent}<li>Tap <strong>Install app</strong> below and confirm the prompt.</li>{:else}<li>Open Chrome’s <strong>⋮ menu</strong>.</li><li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</li>{/if}
			{:else}
				<li>Open your browser menu or the install icon in the address bar.</li><li>Choose <strong>Install SpendWise</strong> and confirm.</li>
			{/if}
		</ol>
		<button class="install-action install-help-done" onclick={() => helpDialog.close()}>Got it</button>
	</dialog>
{/if}
