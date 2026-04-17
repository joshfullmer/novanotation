import { Action, Actor } from './notation.ts';
import type { Sides, Owner } from './notation.ts';
import type { ParsedMove } from './parse.ts';
import type { DiceState } from './state.ts';

function opponent(actor: Actor): Actor {
	return actor === Actor.We ? Actor.They : Actor.We;
}

function findGigValue(gigs: string[], sides: Sides, owner: Owner): number | null {
	const prefix = `${sides}${owner}`;
	const entry = gigs.find((g) => g.startsWith(prefix));
	return entry != null ? parseInt(entry.slice(prefix.length), 10) : null;
}

export function validateMove(move: ParsedMove, state: DiceState): string | null {
	const { actor, action, sides, owner, value } = move;
	const max = parseInt(sides, 10);
	const opp = opponent(actor);

	switch (action) {
		case Action.Roll: {
			if (owner !== actor) return `Roll: owner must match actor`;
			if (!(state[actor].fixer as string[]).includes(`${sides}${actor}`))
				return `Roll: d${sides} not in ${actor}'s fixer`;
			if (sides === '20') {
				const others: Sides[] = ['4', '6', '8', '10', '12'];
				if (!others.every((s) => state[actor].gigs.some((g) => g.startsWith(`${s}${actor}`))))
					return `Roll: d20 must be rolled last`;
			}
			if (value < 1 || value > max) return `Roll: value ${value} out of range (1–${max})`;
			break;
		}
		case Action.Steal: {
			if (findGigValue(state[opp].gigs, sides, owner) === null)
				return `Steal: d${sides}${owner} not in ${opp}'s gigs`;
			if (value < 1 || value > max) return `Steal: value ${value} out of range (1–${max})`;
			break;
		}
		case Action.Increment: {
			const current =
				findGigValue(state['w'].gigs, sides, owner) ?? findGigValue(state['t'].gigs, sides, owner);
			if (current === null) return `Increment: d${sides}${owner} not in any gigs`;
			if (value <= current)
				return `Increment: value ${value} must be greater than current ${current}`;
			if (value > max) return `Increment: value ${value} exceeds d${sides} max (${max})`;
			break;
		}
		case Action.Decrement: {
			const current =
				findGigValue(state['w'].gigs, sides, owner) ?? findGigValue(state['t'].gigs, sides, owner);
			if (current === null) return `Decrement: d${sides}${owner} not in any gigs`;
			if (value >= current) return `Decrement: value ${value} must be less than current ${current}`;
			if (value < 1) return `Decrement: value ${value} below minimum (1)`;
			break;
		}
		case Action.Set:
		case Action.Reroll: {
			const inW = findGigValue(state['w'].gigs, sides, owner);
			const inT = findGigValue(state['t'].gigs, sides, owner);
			if (inW === null && inT === null)
				return `${action === Action.Set ? 'Set' : 'Reroll'}: d${sides}${owner} not in any gigs`;
			if (value < 1 || value > max)
				return `${action === Action.Set ? 'Set' : 'Reroll'}: value ${value} out of range (1–${max})`;
			break;
		}
	}

	return null;
}

export function applyMove(move: ParsedMove, state: DiceState): DiceState {
	const { actor, action, sides, owner, value } = move;
	const opp = opponent(actor);
	const next: DiceState = {
		w: { fixer: [...state.w.fixer], gigs: [...state.w.gigs] },
		t: { fixer: [...state.t.fixer], gigs: [...state.t.gigs] }
	};
	const prefix = `${sides}${owner}`;
	const newEntry = `${sides}${owner}${value}` as `${Sides}${Owner}${number}`;

	switch (action) {
		case Action.Roll:
			next[actor].fixer = next[actor].fixer.filter(
				(d) => d !== (`${sides}${actor}` as `${Sides}${Owner}`)
			);
			next[actor].gigs.push(newEntry);
			break;
		case Action.Steal:
			next[opp].gigs = next[opp].gigs.filter((g) => !g.startsWith(prefix));
			next[actor].gigs.push(newEntry);
			break;
		case Action.Increment:
		case Action.Decrement:
		case Action.Set:
		case Action.Reroll:
			for (const player of ['w', 't'] as const) {
				const idx = next[player].gigs.findIndex((g) => g.startsWith(prefix));
				if (idx !== -1) {
					next[player].gigs[idx] = newEntry;
					break;
				}
			}
			break;
	}

	return next;
}
