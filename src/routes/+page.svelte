<script lang="ts">
	import { analyzeDocument, PLAYER_LABEL } from '$lib';
	import type { GameReport, Outcome } from '$lib';
	import { VALID_GAME } from '$lib/examples';
	import DiceBoard from '$lib/components/DiceBoard.svelte';
	import { page } from '$app/state';
	import { replaceState } from '$app/navigation';

	const presets = [
		{
			id: 'opening',
			label: 'OPENING',
			notation: "A3\nA'2\nB5\nB'4\nC6\nC'3"
		},
		{
			id: 'skirmish',
			label: 'SKIRMISH',
			notation: "1| A3\n2| A'4\n3| B2 (-A'2)\n4| B'5\n5| +B4 xA'\n6| xB\n7| C7\n8| D'6"
		},
		{
			id: 'match',
			label: 'MATCH',
			notation: VALID_GAME
		}
	] as const;

	const initialNotation: string =
		presets.find((p) => p.id === page.url.searchParams.get('doc'))?.notation ?? '';

	let notation = $state(initialNotation);

	function loadPreset(preset: (typeof presets)[number]) {
		notation = preset.notation;
		const url = new URL(page.url);
		url.searchParams.set('doc', preset.id);
		// Same page, only the query changes; the path comes from page.url and is already resolved.
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, {});
	}

	type Result =
		| { kind: 'empty' }
		| { kind: 'invalid'; report: GameReport }
		| { kind: 'valid'; report: GameReport };

	let report = $derived(analyzeDocument(notation));

	let result = $derived.by((): Result => {
		if (!notation.trim()) return { kind: 'empty' };
		return { kind: report.errors.length > 0 ? 'invalid' : 'valid', report };
	});

	function describeOutcome(outcome: Outcome): string {
		if (outcome.kind === 'undecided') return 'UNDECIDED';
		const how = outcome.how === 'start' ? 'START OF TURN' : 'OVERTIME, TURN';
		return `${PLAYER_LABEL[outcome.player]} WINS — ${how} ${outcome.turn}`;
	}

	const placeholder = [
		'; one turn per line, odd turns = first player',
		'; first: WE   (header, optional)',
		'',
		'1| A4 -A1',
		"2| A'4",
		'3| B4 (-B2)',
		'...'
	].join('\n');
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
				>{report.turns.length} turn{report.turns.length !== 1 ? 's' : ''}</span
			>
		</div>
		<textarea
			class="min-h-125 w-full flex-1 resize-none border-none bg-screen p-6 font-terminal text-base leading-[1.9] text-phosphor-bright caret-ok transition-shadow duration-300 outline-none placeholder:text-phosphor-muted focus:shadow-[inset_0_0_40px_rgba(0,255,136,0.02)] max-md:min-h-62.5"
			bind:value={notation}
			{placeholder}
			spellcheck="false"
			autocomplete="off"
		></textarea>
	</section>

	<section class="flex min-h-0 flex-col">
		<div
			class="flex shrink-0 items-center justify-between border-b border-rim bg-panel px-6 py-[0.6rem]"
		>
			<span class="text-[0.72rem] tracking-[0.22em] text-phosphor-dim">OUTPUT.ANALYSIS</span>
			{#if result.kind !== 'empty'}
				<span class="text-[0.72rem] tracking-[0.15em] text-phosphor-dim"
					>FIRST: {PLAYER_LABEL[result.report.first]}</span
				>
			{/if}
		</div>

		<div class="flex-1 overflow-y-auto p-6">
			{#if result.kind === 'empty'}
				<div
					class="flex items-center gap-[0.6rem] py-8 text-[0.85rem] tracking-[0.12em] text-phosphor-muted"
				>
					<span class="animate-blink text-ok">█</span> awaiting input
				</div>
			{:else if result.kind === 'invalid'}
				{@const errors = result.report.errors}
				<div
					class="glow-fail mb-5 flex items-center gap-4 border border-fail/25 bg-fail/8 px-5 py-[0.9rem] font-display text-[1.7rem] tracking-[0.12em] text-fail"
				>
					<span>✗</span>
					<span>INVALID</span>
					<span class="ml-auto text-[0.9rem] tracking-[0.08em] opacity-65"
						>{errors.length} error{errors.length !== 1 ? 's' : ''}</span
					>
				</div>
				<div class="flex flex-col gap-[0.4rem]">
					{#each errors as error, i (`${error.turn}-${i}`)}
						<div
							class="error-row-border flex animate-slide-in items-start gap-3 bg-panel px-[0.9rem] py-[0.65rem]"
							style="animation-delay: {i * 40}ms"
						>
							<span class="shrink-0 font-display text-[1.1rem] text-fail opacity-70"
								>T{String(error.turn).padStart(2, '0')}</span
							>
							<div class="flex min-w-0 flex-col gap-[0.15rem]">
								<span class="text-[0.9rem] tracking-[0.05em] text-phosphor-bright"
									>{error.raw || '(blank)'}</span
								>
								<span class="text-[0.85rem] text-fail opacity-70">{error.reason}</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				{@const { outcome, warnings, state } = result.report}
				<div
					class="glow-ok mb-5 flex items-center gap-4 border border-ok/25 bg-ok/8 px-5 py-[0.9rem] font-display text-[1.7rem] tracking-[0.12em] text-ok"
				>
					<span>✓</span>
					<span>VALID</span>
					<span
						class="ml-auto text-[0.9rem] tracking-[0.08em] {outcome.kind === 'win'
							? 'opacity-90'
							: 'opacity-55'}">{describeOutcome(outcome)}</span
					>
				</div>
				{#each warnings as warning (warning)}
					<div
						class="mb-4 border border-phosphor-dim/40 bg-panel px-4 py-2 text-[0.8rem] tracking-[0.08em] text-phosphor-dim"
					>
						⚠ {warning}
					</div>
				{/each}
				<DiceBoard {state} />
			{/if}
		</div>
	</section>
</main>
