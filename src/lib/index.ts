import { DEFAULT_STATE } from './state.ts';
import type { DiceState } from './state.ts';
import { parseMove } from './parse.ts';
import { validateMove, applyMove } from './rules.ts';

export type { DiceState } from './state.ts';

export type ValidationError = {
	index: number;
	raw: string;
	reason: string;
};

function logState(state: DiceState) {
	console.log(`  w: fixer=[${state.w.fixer}] gigs=[${state.w.gigs}]`);
	console.log(`  t: fixer=[${state.t.fixer}] gigs=[${state.t.gigs}]`);
}

function processDocument(
	doc: string,
	verbose = false
): { state: DiceState; errors: ValidationError[] } {
	const lines = doc
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);
	const errors: ValidationError[] = [];
	let state = structuredClone(DEFAULT_STATE);

	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i];
		const move = parseMove(raw);
		if (!move) {
			errors.push({ index: i, raw, reason: 'invalid notation format' });
			if (verbose) console.log(`[${i}] ${raw} → ERROR: invalid notation format`);
			continue;
		}
		const error = validateMove(move, state);
		if (error) {
			errors.push({ index: i, raw, reason: error });
			if (verbose) console.log(`[${i}] ${raw} → ERROR: ${error}`);
		} else {
			state = applyMove(move, state);
			if (verbose) {
				console.log(`[${i}] ${raw} → valid`);
				logState(state);
			}
		}
	}

	return { state, errors };
}

export function validateDocument(doc: string, verbose = false): ValidationError[] {
	return processDocument(doc, verbose).errors;
}

export function applyDocument(doc: string): DiceState {
	return processDocument(doc).state;
}
