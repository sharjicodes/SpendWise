<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import InstallPrompt from '#lib/InstallPrompt.svelte';
	import '../app.css';
	import '../auth.css';
	import '../offline.css';
	import '../finance.css';
	import '../install.css';
	import type { LayoutProps } from './$types';
	let { children }: LayoutProps = $props();
</script>
<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="icon" href="/spendwise-192.png" type="image/png" sizes="192x192" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#f6f8f6" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="SpendWise" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
</svelte:head>
<InstallPrompt />
{@render children()}
