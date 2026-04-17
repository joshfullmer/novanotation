<script lang="ts">
	import { validateDocument, applyDocument } from '$lib';
	import type { DiceState, ValidationError } from '$lib';
	import { page } from '$app/state';

	const presets = [
		{
			id: 'opening',
			label: 'OPENING',
			notation: 'w|4w3\nt|4t2\nw|6w5\nt|6t4\nw|8w6\nt|8t3'
		},
		{
			id: 'skirmish',
			label: 'SKIRMISH',
			notation: 'w|4w3\nt|4t4\nw|6w2\nt|6t5\nw+6w4\nt-4t2\nw|8w7\nt$6w4\nw@4w2\nt|8t6'
		},
		{
			id: 'showcase',
			label: 'SHOWCASE',
			notation: 'w|4w3\nt|4t2\nw|6w5\nt|6t4\nw+4w4\nt$4w4\nw-6w3\nt.6t1\nw@6w4\nt|8t7'
		}
	] as const;

	const initialNotation: string =
		presets.find((p) => p.id === page.url.searchParams.get('doc'))?.notation ?? '';

	let notation = $state(initialNotation);

	function loadPreset(preset: (typeof presets)[number]) {
		notation = preset.notation;
		const url = new URL(window.location.href);
		url.searchParams.set('doc', preset.id);
		window.history.replaceState(null, '', url.pathname + url.search);
	}

	type Result =
		| { kind: 'empty' }
		| { kind: 'invalid'; errors: ValidationError[] }
		| { kind: 'valid'; state: DiceState };

	let result = $derived.by((): Result => {
		if (!notation.trim()) return { kind: 'empty' };
		const errors = validateDocument(notation);
		if (errors.length > 0) return { kind: 'invalid', errors };
		return { kind: 'valid', state: applyDocument(notation) };
	});

	const players = [
		{ key: 'w' as const, label: 'WE' },
		{ key: 't' as const, label: 'THEY' }
	];

	let lineCount = $derived(
		notation.trim() ? notation.trim().split('\n').filter(Boolean).length : 0
	);

	function parseFixer(entry: string) {
		const m = /^(4|6|8|10|12|20)([wt])$/.exec(entry);
		return m ? { sides: m[1], owner: m[2] as 'w' | 't' } : null;
	}

	function parseGig(entry: string) {
		const m = /^(4|6|8|10|12|20)([wt])(\d+)$/.exec(entry);
		return m ? { sides: m[1], owner: m[2] as 'w' | 't', value: parseInt(m[3]) } : null;
	}

	const playerTheme = {
		w: {
			header: 'bg-we/4 border-b border-we/15',
			label: 'text-we glow-we'
		},
		t: {
			header: 'bg-they/4 border-b border-they/15',
			label: 'text-they glow-they'
		}
	} as const;

	const ownerTheme = {
		w: {
			fixer: 'border-we/20 text-we/35',
			gig: 'die-gig-we',
			label: 'text-we',
			value: 'text-we glow-die-we'
		},
		t: {
			fixer: 'border-they/20 text-they/35',
			gig: 'die-gig-they',
			label: 'text-they',
			value: 'text-they glow-die-they'
		}
	} as const;
</script>

<main class="grid min-h-0 flex-1 grid-cols-2 max-md:grid-cols-1">
	<section
		class="flex min-h-0 flex-col border-r border-rim last:border-r-0 max-md:border-r-0 max-md:border-b max-md:border-b-rim"
	>
		<div class="flex shrink-0 items-center gap-3 border-b border-rim bg-panel px-6 py-[0.6rem]">
			<span class="shrink-0 text-[0.72rem] tracking-[0.22em] text-phosphor-dim">INPUT.NOTATION</span
			>
			<div class="flex flex-1 items-center justify-end gap-2">
				<span class="text-[0.65rem] tracking-[0.18em] text-phosphor-muted max-sm:hidden"
					>EXAMPLES:</span
				>
				{#each presets as preset (preset.id)}
					<button
						type="button"
						onclick={() => loadPreset(preset)}
						class="border border-rim px-2 py-[0.15rem] text-[0.65rem] tracking-[0.18em] text-phosphor-dim transition-colors hover:border-phosphor-dim hover:text-phosphor max-sm:hidden"
						>{preset.label}</button
					>
				{/each}
			</div>
			<span class="shrink-0 text-[0.72rem] tracking-widest text-phosphor-dim"
				>{lineCount} move{lineCount !== 1 ? 's' : ''}</span
			>
		</div>
		<textarea
			class="min-h-125 w-full flex-1 resize-none border-none bg-screen p-6 font-terminal text-base leading-[1.9] text-phosphor-bright caret-ok transition-shadow duration-300 outline-none placeholder:text-phosphor-muted focus:shadow-[inset_0_0_40px_rgba(0,255,136,0.02)] max-md:min-h-62.5"
			bind:value={notation}
			placeholder="; paste notation document&#10;; one move per line&#10;&#10;w|4w3&#10;t|4t2&#10;..."
			spellcheck="false"
			autocomplete="off"
		></textarea>
	</section>

	<section class="flex min-h-0 flex-col">
		<div
			class="flex shrink-0 items-center justify-between border-b border-rim bg-panel px-6 py-[0.6rem]"
		>
			<span class="text-[0.72rem] tracking-[0.22em] text-phosphor-dim">OUTPUT.ANALYSIS</span>
		</div>

		<div class="flex-1 overflow-y-auto p-6">
			{#if result.kind === 'empty'}
				<div
					class="flex items-center gap-[0.6rem] py-8 text-[0.85rem] tracking-[0.12em] text-phosphor-muted"
				>
					<span class="animate-blink text-ok">█</span> awaiting input
				</div>
			{:else if result.kind === 'invalid'}
				<div
					class="glow-fail mb-5 flex items-center gap-4 border border-fail/25 bg-fail/8 px-5 py-[0.9rem] font-display text-[1.7rem] tracking-[0.12em] text-fail"
				>
					<span>✗</span>
					<span>INVALID</span>
					<span class="ml-auto text-[0.9rem] tracking-[0.08em] opacity-65"
						>{result.errors.length} error{result.errors.length !== 1 ? 's' : ''}</span
					>
				</div>
				<div class="flex flex-col gap-[0.4rem]">
					{#each result.errors as error, i (error.index)}
						<div
							class="error-row-border flex animate-slide-in items-start gap-3 bg-panel px-[0.9rem] py-[0.65rem]"
							style="animation-delay: {i * 40}ms"
						>
							<span class="shrink-0 font-display text-[1.1rem] text-fail opacity-70"
								>L{String(error.index + 1).padStart(2, '0')}</span
							>
							<div class="flex min-w-0 flex-col gap-[0.15rem]">
								<span class="text-[0.9rem] tracking-[0.05em] text-phosphor-bright">{error.raw}</span
								>
								<span class="text-[0.85rem] text-fail opacity-70">{error.reason}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div
					class="glow-ok mb-5 flex items-center gap-4 border border-ok/25 bg-ok/8 px-5 py-[0.9rem] font-display text-[1.7rem] tracking-[0.12em] text-ok"
				>
					<span>✓</span>
					<span>VALID</span>
				</div>
				<div class="flex flex-col gap-4">
					{#each players as { key, label } (key)}
						{@const pt = playerTheme[key]}
						<div class="border border-rim bg-panel">
							<div class="flex items-center justify-between px-[0.9rem] py-2 {pt.header}">
								<span class="font-display text-[1.35rem] tracking-[0.2em] {pt.label}">{label}</span>
								<span class="text-[0.72rem] tracking-[0.15em] text-phosphor-dim">
									{result.state[key].gigs.length} gig{result.state[key].gigs.length !== 1
										? 's'
										: ''}
								</span>
							</div>
							<div
								class="flex items-start gap-[0.9rem] border-b border-rim px-[0.9rem] py-[0.6rem]"
							>
								<span
									class="min-w-10 shrink-0 pt-[0.3rem] text-[0.65rem] tracking-[0.22em] text-phosphor-muted"
									>FIXER</span
								>
								<div class="flex flex-1 flex-wrap gap-[0.4rem]">
									{#each result.state[key].fixer as entry (entry)}
										{@const die = parseFixer(entry)}
										{#if die}
											<div
												class="flex cursor-default items-center justify-center border px-[0.45rem] py-[0.15rem] text-[0.82rem] tracking-[0.05em] transition-transform duration-100 hover:-translate-y-0.5 {ownerTheme[
													die.owner
												].fixer}"
											>
												d{die.sides}
											</div>
										{/if}
									{/each}
									{#if result.state[key].fixer.length === 0}
										<span class="pt-1 text-[0.82rem] tracking-widest text-phosphor-muted"
											>empty</span
										>
									{/if}
								</div>
							</div>
							<div class="flex items-start gap-[0.9rem] px-[0.9rem] py-[0.6rem]">
								<span
									class="min-w-10 shrink-0 pt-[0.3rem] text-[0.65rem] tracking-[0.22em] text-phosphor-muted"
									>GIGS</span
								>
								<div class="flex flex-1 flex-wrap gap-[0.4rem]">
									{#each result.state[key].gigs as entry (entry)}
										{@const die = parseGig(entry)}
										{#if die}
											{@const ot = ownerTheme[die.owner]}
											<div
												class="flex min-w-[2.4rem] cursor-default flex-col items-center justify-center gap-0 border px-[0.6rem] py-1 transition-transform duration-100 hover:-translate-y-0.5 {ot.gig}"
											>
												<span
													class="text-center text-[0.62rem] tracking-widest opacity-55 {ot.label}"
													>d{die.sides}</span
												>
												<span
													class="text-center font-display text-[1.25rem] leading-[1.1] {ot.value}"
													>{die.value}</span
												>
											</div>
										{/if}
									{/each}
									{#if result.state[key].gigs.length === 0}
										<span class="pt-1 text-[0.82rem] tracking-widest text-phosphor-muted">none</span
										>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</main>
