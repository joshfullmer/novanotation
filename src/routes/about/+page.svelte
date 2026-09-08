<script lang="ts">
	import { analyzeDocument, DIE_LETTERS, PLAYER_LABEL } from '$lib';
	import type { Outcome } from '$lib';
	import { VALID_GAME } from '$lib/examples';
	import DiceBoard from '$lib/components/DiceBoard.svelte';

	const anatomyParts = [
		{ char: 'x', label: 'ACTION', sublabel: 'blank = roll', color: 'text-ok' },
		{ char: 'B', label: 'DIE', sublabel: 'A – F', color: 'text-phosphor-bright' },
		{ char: '’', label: 'OWNER', sublabel: 'blank = ours', color: 'text-they' },
		{ char: '4', label: 'VALUE', sublabel: '1 – max', color: 'text-phosphor' }
	];

	const dieLegend = Object.entries(DIE_LETTERS) as [string, number][];

	// Each demo is a full document so turn parity holds: WE acts on odd turns.
	const actions = [
		{
			symbol: '·',
			name: 'ROLL',
			symbolColor: 'text-ok',
			desc: 'No symbol. Move one of your dice from your fixer into your gigs with its result.',
			setup: [] as string[],
			demo: 'A3'
		},
		{
			symbol: 'x',
			name: 'STEAL',
			symbolColor: 'text-fail',
			desc: "Take a die from the opponent's gigs into yours. It keeps its value; no value is written.",
			setup: ['B3'],
			demo: 'xB'
		},
		{
			symbol: '+',
			name: 'INCREMENT',
			symbolColor: 'text-phosphor-bright',
			desc: 'Raise a gig die. New value must exceed the current one and fit the die.',
			setup: ['B3', '..'],
			demo: '+B5'
		},
		{
			symbol: '-',
			name: 'DECREMENT',
			symbolColor: 'text-phosphor-dim',
			desc: 'Lower a gig die. New value must be below the current one and at least 1.',
			setup: ['B4', '..'],
			demo: '-B2'
		},
		{
			symbol: '=',
			name: 'SET',
			symbolColor: 'text-we',
			desc: 'Set a gig die to any legal value, regardless of what it shows now.',
			setup: ['C7', '..'],
			demo: '=C4'
		},
		{
			symbol: '~',
			name: 'REROLL',
			symbolColor: 'text-they',
			desc: 'Reroll a gig die and record the new result. Same owner, same controller.',
			setup: ['C7', '..'],
			demo: '~C3'
		}
	];

	const actionEntries = actions.map((a) => ({
		...a,
		state: analyzeDocument([...a.setup, a.demo].join('\n')).state
	}));

	const structure = [
		{
			code: 'first: WE',
			note: 'Optional header. Who took turn 1. Defaults to WE.'
		},
		{ code: '3| B4 -B2', note: 'One turn per line. Odd turns belong to the first player.' },
		{ code: '(-A’2)', note: 'Parentheses: the other player acted, right here in the sequence.' },
		{ code: '..', note: 'A pass. A blank line is an error, never a pass.' },
		{ code: 'xB’3', note: 'Value on a steal is optional. If written, it must match.' },
		{ code: '; note', note: 'Semicolon to end of line is a comment.' }
	];

	const constraints = [
		'Roll only your own dice, only from your fixer',
		'The d20 rolls last: it must be the only die left in your fixer',
		'Steal only from the opponent’s gigs. The die keeps its value',
		'Increment, decrement, set, and reroll need the die to be in someone’s gigs',
		'Instants may modify values but never roll or steal',
		'Win: hold 7+ gigs at the start of your turn. From turn 15, a steal that reaches 7 wins at once',
		'16 turns is the soft cap; longer games are flagged, not rejected'
	];

	const traceNotes = [
		'WE rolls d4, drops it to 1',
		'THEY rolls d4',
		'WE rolls d6, drops it to 2',
		'THEY rolls d6',
		'WE rolls d8. THEY’s instant drops their d4',
		'THEY rolls d8, steals WE’s d8',
		'WE rolls d10, steals THEY’s d6 and d4',
		'THEY rolls d10',
		'WE rolls d12, steals two more: 8 dice',
		'THEY rolls d12. WE wins at the start of 11'
	];

	const trace = analyzeDocument(VALID_GAME);
	const traceLines = trace.turns.map((turn, i) => ({ ...turn, note: traceNotes[i] }));

	let step = $state(1);
	let traceState = $derived(trace.turns[step - 1].state);

	function describeOutcome(outcome: Outcome): string {
		if (outcome.kind === 'undecided') return 'undecided';
		const how = outcome.how === 'start' ? 'start of turn' : 'overtime, turn';
		return `${PLAYER_LABEL[outcome.player]} wins — ${how} ${outcome.turn}`;
	}
</script>

<main class="flex-1 overflow-y-auto">
	<!-- 01 // SYNTAX -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">01 // SYNTAX</span>
			<div class="h-px flex-1 bg-rim"></div>
		</div>

		<div class="flex flex-wrap items-start gap-12 max-md:gap-8">
			<div class="flex gap-8 max-sm:gap-5">
				{#each anatomyParts as part (part.label)}
					<div class="flex flex-col items-center gap-2">
						<span class="font-display text-[3rem] leading-none {part.color} max-sm:text-[2rem]"
							>{part.char}</span
						>
						<div class="h-5 w-px bg-rim"></div>
						<span class="text-[0.78rem] tracking-[0.18em] text-phosphor">{part.label}</span>
						<span class="text-[0.7rem] tracking-widest text-phosphor-muted">{part.sublabel}</span>
					</div>
				{/each}
			</div>

			<div class="grid grid-cols-6 gap-2 max-sm:grid-cols-3">
				{#each dieLegend as [letter, sides] (letter)}
					<div class="flex flex-col items-center border border-rim bg-panel px-3 py-2">
						<span class="font-display text-[1.6rem] leading-none text-phosphor-bright"
							>{letter}</span
						>
						<span class="text-[0.7rem] tracking-widest text-phosphor-dim">d{sides}</span>
					</div>
				{/each}
			</div>
		</div>

		<p class="mt-8 max-w-xl text-[1rem] leading-[1.8] text-phosphor-dim">
			A move is two to four characters. The letter names the die, a trailing prime marks the
			opponent’s die, and the value is what it now shows. Who acted is never written: it comes from
			the turn.
		</p>
	</section>

	<!-- 02 // ACTIONS -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">02 // ACTIONS</span>
			<div class="h-px flex-1 bg-rim"></div>
		</div>

		<div class="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
			{#each actionEntries as action (action.name)}
				<div class="flex flex-col border border-rim">
					<div class="flex items-center gap-3 border-b border-rim bg-panel px-4 py-[0.6rem]">
						<span class="font-display text-[2rem] leading-none {action.symbolColor}"
							>{action.symbol}</span
						>
						<span class="text-[0.88rem] tracking-[0.22em] text-phosphor">{action.name}</span>
					</div>

					<div class="flex flex-1 flex-col gap-3 p-4">
						<p class="text-[0.95rem] leading-[1.75] text-phosphor-dim">{action.desc}</p>

						<div class="space-y-[0.2rem] border border-rim bg-screen px-3 py-2">
							{#each action.setup as line, i (i)}
								<div class="text-[0.95rem] text-phosphor-muted">
									<span class="mr-2 opacity-60">{i + 1}|</span>{line}
								</div>
							{/each}
							<div class="text-[1rem] text-phosphor-bright">
								<span class="mr-2 text-phosphor-muted opacity-60">{action.setup.length + 1}|</span
								>{action.demo}
							</div>
						</div>

						<div class="mt-auto border-t border-rim pt-3">
							<DiceBoard state={action.state} compact />
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- 03 // STRUCTURE -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">03 // STRUCTURE</span>
			<div class="h-px flex-1 bg-rim"></div>
		</div>

		<div class="grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 max-sm:grid-cols-1 max-sm:gap-y-1">
			{#each structure as row (row.code)}
				<code class="text-[1rem] text-phosphor-bright">{row.code}</code>
				<span class="text-[0.95rem] leading-[1.75] text-phosphor-dim max-sm:mb-3">{row.note}</span>
			{/each}
		</div>
	</section>

	<!-- 04 // CONSTRAINTS -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">04 // CONSTRAINTS</span>
			<div class="h-px flex-1 bg-rim"></div>
		</div>

		<ul class="space-y-3">
			{#each constraints as rule, i (rule)}
				<li class="flex items-start gap-4">
					<span class="shrink-0 font-display text-[1rem] leading-none text-ok opacity-50"
						>{String(i + 1).padStart(2, '0')}</span
					>
					<span class="text-[1rem] leading-[1.75] text-phosphor-dim">{rule}</span>
				</li>
			{/each}
		</ul>
	</section>

	<!-- 05 // TRACE -->
	<section class="px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">05 // TRACE</span>
			<div class="h-px flex-1 bg-rim"></div>
			<div class="flex items-center gap-3">
				<button
					onclick={() => (step = Math.max(1, step - 1))}
					disabled={step === 1}
					class="border border-rim px-3 py-[0.3rem] text-[0.8rem] tracking-[0.2em] text-phosphor-dim transition-colors hover:border-phosphor-dim hover:text-phosphor disabled:pointer-events-none disabled:opacity-25"
				>
					← PREV
				</button>
				<span class="text-[0.8rem] tracking-[0.15em] text-phosphor-muted"
					>{step}/{traceLines.length}</span
				>
				<button
					onclick={() => (step = Math.min(traceLines.length, step + 1))}
					disabled={step === traceLines.length}
					class="border border-rim px-3 py-[0.3rem] text-[0.8rem] tracking-[0.2em] text-phosphor-dim transition-colors hover:border-phosphor-dim hover:text-phosphor disabled:pointer-events-none disabled:opacity-25"
				>
					NEXT →
				</button>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-6 max-md:grid-cols-1">
			<div class="space-y-[0.2rem]">
				{#each traceLines as line, i (line.number)}
					{@const current = i === step - 1}
					{@const past = i < step - 1}
					<div
						class="flex items-center gap-3 border-l-2 px-3 py-[0.45rem] {current
							? 'border-ok bg-ok/5'
							: past
								? 'border-rim'
								: 'border-transparent'}"
					>
						<span
							class="shrink-0 font-display text-[1rem] leading-none {current
								? 'text-ok'
								: past
									? 'text-phosphor-dim'
									: 'text-phosphor-muted'}">{String(line.number).padStart(2, '0')}</span
						>
						<span
							class="w-10 shrink-0 text-[0.7rem] tracking-[0.2em] {current
								? line.actor === 'w'
									? 'text-we'
									: 'text-they'
								: 'text-phosphor-muted'}">{PLAYER_LABEL[line.actor]}</span
						>
						<span
							class="text-[1rem] {current
								? 'text-phosphor-bright'
								: past
									? 'text-phosphor-dim'
									: 'text-phosphor-muted'}">{line.raw.replace(/^\d+\|\s*/, '')}</span
						>
						<span
							class="ml-auto text-right text-[0.85rem] {current
								? 'text-phosphor-dim'
								: past
									? 'text-phosphor-muted opacity-60'
									: 'opacity-0'}">{line.note}</span
						>
					</div>
				{/each}
				<div
					class="mt-3 border-t border-rim pt-3 text-[0.85rem] tracking-[0.1em] {step ===
					traceLines.length
						? 'glow-ok text-ok'
						: 'text-phosphor-muted'}"
				>
					{step === traceLines.length ? describeOutcome(trace.outcome) : '…'}
				</div>
			</div>

			<DiceBoard state={traceState} />
		</div>
	</section>
</main>
