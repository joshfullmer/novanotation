<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const navItems = [
		{ href: '/', label: 'VALIDATOR' },
		{ href: '/about', label: 'ABOUT' }
	] as const;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap"
		rel="stylesheet"
	/>
	<title>novanotation.net</title>
</svelte:head>

<div
	class="relative flex min-h-screen flex-col overflow-x-hidden bg-screen font-terminal text-phosphor"
>
	<div class="scanlines pointer-events-none fixed inset-0 z-100" aria-hidden="true"></div>

	<header
		class="flex shrink-0 items-baseline gap-8 border-b border-rim bg-[linear-gradient(180deg,rgba(0,255,136,0.025)_0%,transparent_100%)] px-10 pt-7 pb-5 max-md:flex-wrap max-md:gap-x-6 max-md:gap-y-2 max-md:px-5 max-md:pt-5 max-md:pb-4"
	>
		<div
			class="glow-title font-display text-[2.8rem] leading-none tracking-[0.04em] text-ok max-md:text-[2.2rem]"
		>
			<span class="text-phosphor-dim text-shadow-none">[</span>NOVA NOTATION<span
				class="text-phosphor-dim text-shadow-none">]</span
			>
		</div>
		<div class="text-[0.75rem] tracking-[0.25em] text-phosphor-dim max-md:hidden">
			CYBERPUNK TCG // GAME STATE VALIDATOR
		</div>
		<nav class="ml-auto flex items-center gap-6 max-md:ml-0">
			{#each navItems as { href, label } (href)}
				{@const resolved = resolve(href)}
				{@const active = page.url.pathname === resolved}
				<a
					href={resolved}
					class="text-[0.75rem] tracking-[0.22em] transition-colors duration-150 {active
						? 'glow-ok text-ok'
						: 'text-phosphor-dim hover:text-phosphor'}">{label}</a
				>
			{/each}
		</nav>
	</header>

	{@render children()}

	<footer
		class="flex shrink-0 gap-4 border-t border-rim bg-panel px-10 py-[0.6rem] text-[0.68rem] tracking-[0.22em] text-phosphor-muted"
	>
		<span>NOVA NOTATION v0.1</span>
		<span>//</span>
		<span>CYBERPUNK TCG</span>
	</footer>
</div>
