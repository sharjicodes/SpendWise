<script lang="ts">
	const features = [
		{ number: '01', title: 'Plan around payday', text: 'Build a budget around the day you’re actually paid, not an arbitrary calendar month.' },
		{ number: '02', title: 'Know what is free to spend', text: 'Keep bills and savings in view so your available balance means what it says.' },
		{ number: '03', title: 'Make daily choices easier', text: 'See today’s spending alongside a practical allowance for the rest of your cycle.' }
	];
	const steps = [
		{ title: 'Set your cycle', text: 'Add your pay schedule and choose the dates that shape your month.' },
		{ title: 'Protect the essentials', text: 'Set aside the bills and savings you want to take care of first.' },
		{ title: 'Spend with context', text: 'Record everyday purchases and see what remains, wherever you are.' }
	];
</script>
<svelte:head>
	<title>SpendWise — Know your money. Own your month.</title>
	<meta name="description" content="A calmer way to plan your salary, bills, savings and day-to-day spending around payday." />
</svelte:head>
<div class="landing">
	<header class="site-header page-wrap">
		<a class="brand" href="/" aria-label="SpendWise home"><span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M7 22.5 13.2 16l4.2 4.2L25 11.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.5 11.5H25V17" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>SpendWise</span></a>
		<nav class="desktop-nav" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="#features">What you can track</a><a href="#privacy">Privacy</a></nav>
		<a class="button button-small button-outline" href="/app">Open SpendWise <span aria-hidden="true">↗</span></a>
	</header>
	<main>
		<section class="hero page-wrap">
			<div class="hero-copy">
				<p class="eyebrow"><span class="eyebrow-dot"></span> YOUR MONEY, ON YOUR TERMS</p>
				<h1>Know your money.<br /><span>Own your month.</span></h1>
				<p class="hero-lede">A clear view of your salary, bills, savings and everyday spending — planned from one payday to the next.</p>
				<div class="hero-actions"><a class="button button-primary" href="/app">Get started <span aria-hidden="true">→</span></a><a class="text-link" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a></div>
				<div class="hero-note"><span class="check-dot">✓</span><span>No bank connection required</span><span class="note-divider"></span><span>No subscription billing</span></div>
			</div>
			<div class="preview-wrap" aria-label="Illustrative example of the SpendWise dashboard">
				<div class="preview-orbit orbit-one"></div><div class="preview-orbit orbit-two"></div>
				<div class="money-card">
					<div class="money-card-head"><div><span class="card-kicker">SALARY CYCLE</span><strong>Oct 07 <span>—</span> Nov 06</strong></div><span class="cycle-pill"><i></i> Example</span></div>
					<div class="balance-label">AVAILABLE TO SPEND</div><div class="balance-value">₹18,450</div><div class="balance-caption">Illustrative amount · not a real account</div>
					<div class="balance-track"><span></span></div><div class="track-labels"><span>₹18,450 available</span><span>₹45,000 plan</span></div>
					<div class="preview-rule"></div><div class="mini-metrics"><div class="mini-metric"><span>Spent this cycle</span><strong>₹12,450</strong></div><div class="mini-metric"><span>Set aside</span><strong>₹14,100</strong></div></div>
				</div>
				<div class="today-chip"><span class="today-icon">↗</span><div><small>TODAY’S GUIDE</small><strong>₹760 left today</strong></div></div>
				<div class="preview-caption"><span>✳</span> Example view — your dashboard starts empty.</div>
			</div>
		</section>
		<section class="trust-strip"><div class="page-wrap trust-inner"><span>BUILT FOR REAL LIFE</span><i></i><p>Salary days don’t always match the calendar. Your budget shouldn’t have to.</p></div></section>
		<section class="section page-wrap" id="features">
			<div class="section-heading"><div><p class="eyebrow">A LITTLE MORE CLARITY</p><h2>Your money has a plan.<br /><span>Now you can see it.</span></h2></div><p class="section-intro">SpendWise brings the numbers that matter into one calm, useful view — so you can make decisions with the whole month in mind.</p></div>
			<div class="feature-grid">{#each features as feature}<article class="feature-card"><span class="feature-number">{feature.number}</span><div class="feature-icon" aria-hidden="true">{feature.number === '01' ? '↻' : feature.number === '02' ? '◈' : '↗'}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>{/each}</div>
		</section>
		<section class="how-section" id="how-it-works"><div class="page-wrap how-inner"><div class="how-heading"><p class="eyebrow">A SIMPLE ROUTINE</p><h2>Make payday<br />feel like a fresh start.</h2><p>Set things up once. Then keep your plan in sight as life happens.</p><a class="button button-dark" href="/app">Take a look inside <span aria-hidden="true">→</span></a></div><div class="steps">{#each steps as step, i}<article class="step"><span class="step-number">0{i + 1}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><span class="step-arrow" aria-hidden="true">↗</span></article>{/each}</div></div></section>
		<section class="privacy-section page-wrap" id="privacy"><div class="privacy-card"><div class="privacy-symbol" aria-hidden="true">⌑</div><div><p class="eyebrow">YOUR MONEY IS PERSONAL</p><h2>Built for your choices.<br /><span>Clear by design.</span></h2><p class="privacy-copy">SpendWise is a manual tracker: it won’t connect to your bank or invent balances for you. Account storage is being set up now; add only the records you want to track.</p><a class="text-link" href="/app">See the empty starting view <span aria-hidden="true">→</span></a></div><div class="privacy-side"><span class="privacy-line"></span><p>NO BANK LINKING</p><p>NO PURCHASES</p><p>NO SUBSCRIPTION BILLING</p></div></div></section>
		<section class="closing page-wrap"><p class="eyebrow">A CLEARER WAY THROUGH THE MONTH</p><h2>Make room for what<br /><span>matters to you.</span></h2><a class="button button-primary" href="/app">Explore SpendWise <span aria-hidden="true">→</span></a></section>
	</main>
	<footer class="site-footer page-wrap"><a class="brand footer-brand" href="/"><span class="brand-mark" aria-hidden="true">S</span><span>SpendWise</span></a><p>Know your money. Own your month.</p><div class="footer-credit">Developed by <a href="https://sharjithaportfolio.vercel.app/" target="_blank" rel="noreferrer">Sharjith Ambadi <span aria-hidden="true">↗</span></a></div></footer>
</div>
