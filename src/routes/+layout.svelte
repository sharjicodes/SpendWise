<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';
	import '../auth.css';
	import '../offline.css';
	import '../finance.css';
	import type { LayoutProps } from './$types';
	let { children }: LayoutProps = $props();
</script>
<svelte:head>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content="#f6f8f6" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-title" content="SpendWise" />
	<meta name="apple-mobile-web-app-status-bar-style" content="default" />
	<link rel="apple-touch-icon" href="/spendwise-icon.svg" />
</svelte:head>
{@render children()}
