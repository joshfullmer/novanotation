<script lang="ts">
	import { PLAYER_LABEL, formatDie } from '$lib';
	import type { GameState, Die, Gig, Owner } from '$lib';

	let { state, compact = false }: { state: GameState; compact?: boolean } = $props();

	const players: Owner[] = ['w', 't'];

	const playerTheme: Record<Owner, { header: string; label: string }> = {
		w: { header: 'bg-we/4 border-b border-we/15', label: 'text-we glow-we' },
		t: { header: 'bg-they/4 border-b border-they/15', label: 'text-they glow-they' }
	};

	const ownerTheme: Record<Owner, { fixer: string; gig: string; label: string; value: string }> = {
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
	};

	const dieKey = (die: Die) => formatDie(die);
	const dieLabel = (die: Die) => `d${die.sides}${die.owner === 't' ? '’' : ''}`;
</script>

{#snippet gigChip(gig: Gig, size: 'full' | 'compact')}
	{@const ot = ownerTheme[gig.owner]}
	{#if size === 'full'}
		<div
			class="flex min-w-[2.4rem] cursor-default flex-col items-center justify-center gap-0 border px-[0.6rem] py-1 transition-transform duration-100 hover:-translate-y-0.5 {ot.gig}"
			title={formatDie(gig)}
		>
			<span class="text-center text-[0.62rem] tracking-widest opacity-55 {ot.label}"
				>{dieLabel(gig)}</span
			>
			<span class="text-center font-display text-[1.25rem] leading-[1.1] {ot.value}"
				>{gig.value}</span
			>
		</div>
	{:else}
		<div
			class="flex min-w-[1.8rem] flex-col items-center border px-[0.35rem] py-[0.2rem] {ot.gig}"
			title={formatDie(gig)}
		>
			<span class="text-[0.68rem] opacity-55 {ot.label}">{dieLabel(gig)}</span>
			<span class="font-display text-[1rem] leading-none {ot.value}">{gig.value}</span>
		</div>
	{/if}
{/snippet}

{#if compact}
	<div class="space-y-2">
		{#each players as key (key)}
			<div class="flex items-center gap-2">
				<span
					class="min-w-[1.8rem] shrink-0 text-[0.78rem] tracking-[0.2em] {ownerTheme[key].label}"
					>{PLAYER_LABEL[key]}</span
				>
				<div class="flex flex-wrap gap-1">
					{#each state[key].gigs as gig (dieKey(gig))}
						{@render gigChip(gig, 'compact')}
					{/each}
					{#if state[key].gigs.length === 0}
						<span class="text-[0.8rem] text-phosphor-muted">—</span>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#each players as key (key)}
			{@const pt = playerTheme[key]}
			{@const player = state[key]}
			<div class="border border-rim bg-panel">
				<div class="flex items-center justify-between px-[0.9rem] py-2 {pt.header}">
					<span class="font-display text-[1.35rem] tracking-[0.2em] {pt.label}"
						>{PLAYER_LABEL[key]}</span
					>
					<span class="text-[0.72rem] tracking-[0.15em] text-phosphor-dim">
						{player.gigs.length} gig{player.gigs.length !== 1 ? 's' : ''}
					</span>
				</div>
				<div class="flex items-start gap-[0.9rem] border-b border-rim px-[0.9rem] py-[0.6rem]">
					<span
						class="min-w-10 shrink-0 pt-[0.3rem] text-[0.65rem] tracking-[0.22em] text-phosphor-muted"
						>FIXER</span
					>
					<div class="flex flex-1 flex-wrap gap-[0.4rem]">
						{#each player.fixer as die (dieKey(die))}
							<div
								class="flex cursor-default items-center justify-center border px-[0.45rem] py-[0.15rem] text-[0.82rem] tracking-[0.05em] transition-transform duration-100 hover:-translate-y-0.5 {ownerTheme[
									die.owner
								].fixer}"
								title={formatDie(die)}
							>
								{dieLabel(die)}
							</div>
						{/each}
						{#if player.fixer.length === 0}
							<span class="pt-1 text-[0.82rem] tracking-widest text-phosphor-muted">empty</span>
						{/if}
					</div>
				</div>
				<div class="flex items-start gap-[0.9rem] px-[0.9rem] py-[0.6rem]">
					<span
						class="min-w-10 shrink-0 pt-[0.3rem] text-[0.65rem] tracking-[0.22em] text-phosphor-muted"
						>GIGS</span
					>
					<div class="flex flex-1 flex-wrap gap-[0.4rem]">
						{#each player.gigs as gig (dieKey(gig))}
							{@render gigChip(gig, 'full')}
						{/each}
						{#if player.gigs.length === 0}
							<span class="pt-1 text-[0.82rem] tracking-widest text-phosphor-muted">none</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}
