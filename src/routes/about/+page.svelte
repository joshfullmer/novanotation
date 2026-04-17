<script lang="ts">
	import { applyDocument } from '$lib';

	const anatomyParts = [
		{ char: 'w', label: 'ACTOR', sublabel: 'we / they', color: 'text-we' },
		{ char: '|', label: 'ACTION', sublabel: 'one of 6', color: 'text-ok' },
		{ char: '4', label: 'SIDES', sublabel: 'd4 – d20', color: 'text-phosphor-bright' },
		{ char: 'w', label: 'OWNER', sublabel: 'we / they', color: 'text-we' },
		{ char: '3', label: 'VALUE', sublabel: '1 – max', color: 'text-phosphor' }
	];

	const actions = [
		{
			symbol: '|',
			name: 'ROLL',
			symbolColor: 'text-ok',
			desc: 'Move a die from your fixer into your gigs with a result. Owner must equal actor.',
			setup: [] as string[],
			demo: 'w|4w3'
		},
		{
			symbol: '$',
			name: 'STEAL',
			symbolColor: 'text-fail',
			desc: "Take an opponent's die from their gigs. It joins your gigs keeping its value.",
			setup: ['w|4w3'],
			demo: 't$4w3'
		},
		{
			symbol: '+',
			name: 'INCREMENT',
			symbolColor: 'text-phosphor-bright',
			desc: 'Increase a gig die value. New value must exceed current and stay within die max.',
			setup: ['w|4w3'],
			demo: 'w+4w4'
		},
		{
			symbol: '-',
			name: 'DECREMENT',
			symbolColor: 'text-phosphor-dim',
			desc: 'Decrease a gig die value. New value must be below current and at least 1.',
			setup: ['w|4w3'],
			demo: 'w-4w2'
		},
		{
			symbol: '.',
			name: 'SET',
			symbolColor: 'text-we',
			desc: 'Set a gig die to any valid value directly, regardless of current value.',
			setup: ['w|4w3'],
			demo: 'w.4w1'
		},
		{
			symbol: '@',
			name: 'REROLL',
			symbolColor: 'text-they',
			desc: 'Assign a new value to a gig die. Stays in gigs with the same owner.',
			setup: ['w|4w3'],
			demo: 'w@4w2'
		}
	];

	const actionEntries = actions.map((a) => ({
		...a,
		state: applyDocument([...a.setup, a.demo].join('\n'))
	}));

	const traceLines = [
		{ notation: 'w|4w3', note: 'we rolls d4 → 3' },
		{ notation: 't|4t4', note: 'they rolls d4 → 4' },
		{ notation: 'w|6w2', note: 'we rolls d6 → 2' },
		{ notation: 't|6t4', note: 'they rolls d6 → 4' },
		{ notation: 'w+6w5', note: 'we increments d6w: 2→5' },
		{ notation: 't$6w5', note: 'they steals d6w(5)' },
		{ notation: 'w|8w7', note: 'we rolls d8 → 7' },
		{ notation: 't-6w3', note: 'they decrements d6w: 5→3' },
		{ notation: 'w.8w4', note: 'we sets d8w: 7→4' },
		{ notation: 't@4t3', note: 'they rerolls d4t: 4→3' }
	];

	let step = $state(1);
	let traceState = $derived(
		applyDocument(
			traceLines
				.slice(0, step)
				.map((l) => l.notation)
				.join('\n')
		)
	);

	function parseFixer(entry: string) {
		const m = /^(4|6|8|10|12|20)([wt])$/.exec(entry);
		return m ? { sides: m[1], owner: m[2] as 'w' | 't' } : null;
	}

	function parseGig(entry: string) {
		const m = /^(4|6|8|10|12|20)([wt])(\d+)$/.exec(entry);
		return m ? { sides: m[1], owner: m[2] as 'w' | 't', value: parseInt(m[3]) } : null;
	}

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

	const playerTheme = {
		w: { header: 'bg-we/4 border-b border-we/15', label: 'text-we glow-we' },
		t: { header: 'bg-they/4 border-b border-they/15', label: 'text-they glow-they' }
	} as const;

	const players = [
		{ key: 'w' as const, label: 'WE' },
		{ key: 't' as const, label: 'THEY' }
	];

	const constraints = [
		'Roll owner must equal actor — you can only roll dice from your own fixer',
		'd20 can only be rolled after all d4, d6, d8, d10, and d12 are in your gigs',
		'Steal only works on dice in gigs — fixer dice cannot be stolen',
		'Increment, decrement, set, and reroll require the die to exist in some gigs',
		'All values must be within 1 – (die sides)'
	];
</script>

<main class="flex-1 overflow-y-auto">
	<!-- 01 // SYNTAX -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">01 // SYNTAX</span>
			<div class="h-px flex-1 bg-rim"></div>
		</div>

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

		<p class="mt-8 max-w-xl text-[1rem] leading-[1.8] text-phosphor-dim">
			Each move is a single line. Actor and owner can differ — actor performs the move, owner
			identifies which die. Blank lines are ignored.
		</p>
	</section>

	<!-- 02 // ACTIONS -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">02 // ACTIONS</span>
			<div class="h-px flex-1 bg-rim"></div>
		</div>

		<div class="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
			{#each actionEntries as action (action.symbol)}
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
							{#each action.setup as line (line)}
								<div class="text-[0.95rem] text-phosphor-muted">{line}</div>
							{/each}
							<div class="text-[1rem] text-phosphor-bright">{action.demo}</div>
						</div>

						<div class="mt-auto space-y-2 border-t border-rim pt-3">
							{#each players as { key, label } (key)}
								<div class="flex items-center gap-2">
									<span
										class="min-w-[1.8rem] shrink-0 text-[0.78rem] tracking-[0.2em] {key === 'w'
											? 'text-we'
											: 'text-they'}">{label}</span
									>
									<div class="flex flex-wrap gap-1">
										{#each action.state[key].gigs as entry (entry)}
											{@const die = parseGig(entry)}
											{#if die}
												<div
													class="flex min-w-[1.8rem] flex-col items-center border px-[0.35rem] py-[0.2rem] {ownerTheme[
														die.owner
													].gig}"
												>
													<span class="text-[0.68rem] opacity-55 {ownerTheme[die.owner].label}"
														>d{die.sides}</span
													>
													<span
														class="font-display text-[1rem] leading-none {ownerTheme[die.owner]
															.value}">{die.value}</span
													>
												</div>
											{/if}
										{/each}
										{#if action.state[key].gigs.length === 0}
											<span class="text-[0.8rem] text-phosphor-muted">—</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- 03 // CONSTRAINTS -->
	<section class="border-b border-rim px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">03 // CONSTRAINTS</span>
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

	<!-- 04 // TRACE -->
	<section class="px-10 py-10 max-md:px-5">
		<div class="mb-8 flex items-center gap-4">
			<span class="text-[0.8rem] tracking-[0.25em] text-phosphor-dim">04 // TRACE</span>
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
				{#each traceLines as line, i (line.notation)}
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
									: 'text-phosphor-muted'}">{String(i + 1).padStart(2, '0')}</span
						>
						<span
							class="text-[1rem] {current
								? 'text-phosphor-bright'
								: past
									? 'text-phosphor-dim'
									: 'text-phosphor-muted'}">{line.notation}</span
						>
						<span
							class="ml-auto text-[0.88rem] {current
								? 'text-phosphor-dim'
								: past
									? 'text-phosphor-muted opacity-60'
									: 'opacity-0'}">{line.note}</span
						>
					</div>
				{/each}
			</div>

			<div class="flex flex-col gap-3">
				{#each players as { key, label } (key)}
					{@const pt = playerTheme[key]}
					<div class="border border-rim bg-panel">
						<div class="flex items-center justify-between px-[0.9rem] py-2 {pt.header}">
							<span class="font-display text-[1.35rem] tracking-[0.2em] {pt.label}">{label}</span>
							<span class="text-[0.88rem] tracking-[0.15em] text-phosphor-dim">
								{traceState[key].gigs.length} gig{traceState[key].gigs.length !== 1 ? 's' : ''}
							</span>
						</div>
						<div class="flex items-start gap-[0.9rem] border-b border-rim px-[0.9rem] py-[0.6rem]">
							<span
								class="min-w-10 shrink-0 pt-[0.3rem] text-[0.8rem] tracking-[0.22em] text-phosphor-muted"
								>FIXER</span
							>
							<div class="flex flex-1 flex-wrap gap-[0.4rem]">
								{#each traceState[key].fixer as entry (entry)}
									{@const die = parseFixer(entry)}
									{#if die}
										<div
											class="flex cursor-default items-center justify-center border px-[0.45rem] py-[0.15rem] text-[0.95rem] tracking-[0.05em] {ownerTheme[
												die.owner
											].fixer}"
										>
											d{die.sides}
										</div>
									{/if}
								{/each}
								{#if traceState[key].fixer.length === 0}
									<span class="pt-1 text-[0.95rem] tracking-widest text-phosphor-muted">empty</span>
								{/if}
							</div>
						</div>
						<div class="flex items-start gap-[0.9rem] px-[0.9rem] py-[0.6rem]">
							<span
								class="min-w-10 shrink-0 pt-[0.3rem] text-[0.8rem] tracking-[0.22em] text-phosphor-muted"
								>GIGS</span
							>
							<div class="flex flex-1 flex-wrap gap-[0.4rem]">
								{#each traceState[key].gigs as entry (entry)}
									{@const die = parseGig(entry)}
									{#if die}
										{@const ot = ownerTheme[die.owner]}
										<div
											class="flex min-w-[2.4rem] cursor-default flex-col items-center justify-center gap-0 border px-[0.6rem] py-1 {ot.gig}"
										>
											<span class="text-center text-[0.78rem] tracking-widest opacity-55 {ot.label}"
												>d{die.sides}</span
											>
											<span class="text-center font-display text-[1.25rem] leading-[1.1] {ot.value}"
												>{die.value}</span
											>
										</div>
									{/if}
								{/each}
								{#if traceState[key].gigs.length === 0}
									<span class="pt-1 text-[0.95rem] tracking-widest text-phosphor-muted">none</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</section>
</main>
