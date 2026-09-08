import { Action, opponent } from './notation.ts';
import type { Owner } from './notation.ts';
import { initialState } from './state.ts';
import type { GameState } from './state.ts';
import { parseDocument } from './parse.ts';
import { applyMove, validateMove } from './rules.ts';

export const WIN_DICE = 7;
export const OVERTIME_START = 15;
export const SOFT_CAP = 16;

export type ValidationError = { turn: number; raw: string; reason: string };

export type Outcome =
	| { kind: 'win'; player: Owner; turn: number; how: 'start' | 'overtime' }
	| { kind: 'undecided' };

export type TurnReport = { number: number; actor: Owner; raw: string; state: GameState };

export type GameReport = {
	first: Owner;
	turns: TurnReport[];
	state: GameState;
	errors: ValidationError[];
	warnings: string[];
	outcome: Outcome;
};

export function analyzeDocument(text: string): GameReport {
	const doc = parseDocument(text);
	const errors: ValidationError[] = [...doc.errors];
	const actorOf = (turn: number): Owner => (turn % 2 === 1 ? doc.first : opponent(doc.first));

	let state = initialState();
	let outcome: Outcome = { kind: 'undecided' };
	const turns: TurnReport[] = [];

	const checkTurnStart = (turn: number) => {
		const actor = actorOf(turn);
		if (state[actor].gigs.length >= WIN_DICE)
			outcome = { kind: 'win', player: actor, turn, how: 'start' };
	};

	for (const turn of doc.turns) {
		const actor = actorOf(turn.number);
		if (outcome.kind === 'undecided') checkTurnStart(turn.number);
		const fail = (raw: string, reason: string) => errors.push({ turn: turn.number, raw, reason });

		if (outcome.kind === 'win' && turn.entries.length === 0) fail('..', 'turn after game end');

		for (const { move, reaction } of turn.entries) {
			if (outcome.kind === 'win') {
				fail(move.raw, 'move after game end');
				continue;
			}
			const ctx = { actor: reaction ? opponent(actor) : actor, reaction };
			const error = validateMove(move, ctx, state);
			if (error) {
				fail(move.raw, error);
				continue;
			}
			state = applyMove(move, ctx, state);
			if (
				move.action === Action.Steal &&
				turn.number >= OVERTIME_START &&
				state[ctx.actor].gigs.length >= WIN_DICE
			)
				outcome = { kind: 'win', player: ctx.actor, turn: turn.number, how: 'overtime' };
		}

		turns.push({ number: turn.number, actor, raw: turn.raw, state });
	}

	// A win is declared at the start of a turn, so it can land on a row never written.
	if (outcome.kind === 'undecided') checkTurnStart(doc.turns.length + 1);

	const warnings: string[] = [];
	if (doc.turns.length > SOFT_CAP)
		warnings.push(`game ran ${doc.turns.length} turns; ${SOFT_CAP} is the soft cap`);

	errors.sort((a, b) => a.turn - b.turn);
	return { first: doc.first, turns, state, errors, warnings, outcome };
}
