import { describe, it, expect } from 'vitest';
import { validateDocument, applyDocument } from '../index.ts';
import { VALID_EXAMPLE, INVALID_EXAMPLE } from './examples.ts';

const ok = (doc: string) => expect(validateDocument(doc)).toEqual([]);
const err = (doc: string, index: number, reason: string) =>
	expect(validateDocument(doc)).toContainEqual({ index, raw: doc.trim().split('\n')[index].trim(), reason });

describe('validateDocument', () => {
	describe('format', () => {
		it('accepts empty document', () => ok(''));
		it('ignores blank lines', () => ok('\n\nw|4w3\n\n'));
		it('trims whitespace', () => ok('  w|4w3  '));
		it('rejects invalid notation', () =>
			err('GARBAGE', 0, 'invalid notation format'));
		it('collects multiple errors without halting', () => {
			const errors = validateDocument('GARBAGE\nMORE_GARBAGE');
			expect(errors).toHaveLength(2);
		});
	});

	describe('Roll', () => {
		it('valid roll', () => ok('w|4w3'));
		it('rejects owner !== actor', () =>
			err('w|4t3', 0, 'Roll: owner must match actor'));
		it('rejects rolling a die already in gigs', () =>
			err('w|4w3\nw|4w1', 1, 'Roll: d4 not in w\'s fixer'));
		it('rejects d20 before all others claimed', () =>
			err('w|20w10', 0, 'Roll: d20 must be rolled last'));
		it('allows d20 after all others claimed', () =>
			ok('w|4w1\nw|6w2\nw|8w3\nw|10w4\nw|12w5\nw|20w10'));
		it('rejects value 0', () =>
			err('w|6w0', 0, 'Roll: value 0 out of range (1–6)'));
		it('rejects value above sides', () =>
			err('w|4w5', 0, 'Roll: value 5 out of range (1–4)'));
		it('accepts value at max', () => ok('w|4w4'));
		it('accepts value at min', () => ok('w|4w1'));
	});

	describe('Steal', () => {
		it('valid steal', () => ok('w|6w3\nt$6w3'));
		it('rejects stealing from fixer', () =>
			err('w$6t4', 0, 'Steal: d6t not in t\'s gigs'));
		it('rejects value 0', () =>
			err('w|6w3\nt$6w0', 1, 'Steal: value 0 out of range (1–6)'));
		it('rejects value above sides', () =>
			err('w|6w3\nt$6w7', 1, 'Steal: value 7 out of range (1–6)'));
		it('allows stealing back your own die', () =>
			ok('w|6w3\nt$6w3\nw$6w3'));
		it('stolen die appears in actor gigs for subsequent moves', () => {
			const errors = validateDocument('w|6w3\nt$6w3\nt+6w5');
			expect(errors).toEqual([]);
		});
	});

	describe('Increment', () => {
		it('valid increment', () => ok('w|6w3\nw+6w5'));
		it('allows increment by more than 1', () => ok('w|6w1\nw+6w4'));
		it('rejects die not in gigs', () =>
			err('w+6w5', 0, 'Increment: d6w not in any gigs'));
		it('rejects value equal to current', () =>
			err('w|6w3\nw+6w3', 1, 'Increment: value 3 must be greater than current 3'));
		it('rejects value less than current', () =>
			err('w|6w4\nw+6w2', 1, 'Increment: value 2 must be greater than current 4'));
		it('rejects value exceeding max sides', () =>
			err('w|6w5\nw+6w7', 1, 'Increment: value 7 exceeds d6 max (6)'));
		it('can increment a die in opponent gigs', () =>
			ok('t|6t3\nw+6t5'));
	});

	describe('Decrement', () => {
		it('valid decrement', () => ok('w|6w4\nw-6w2'));
		it('allows decrement by more than 1', () => ok('w|6w6\nw-6w3'));
		it('rejects die not in gigs', () =>
			err('w-6w2', 0, 'Decrement: d6w not in any gigs'));
		it('rejects value equal to current', () =>
			err('w|6w3\nw-6w3', 1, 'Decrement: value 3 must be less than current 3'));
		it('rejects value greater than current', () =>
			err('w|6w3\nw-6w5', 1, 'Decrement: value 5 must be less than current 3'));
		it('rejects value 0', () =>
			err('w|6w2\nw-6w0', 1, 'Decrement: value 0 below minimum (1)'));
		it('can decrement a die in opponent gigs', () =>
			ok('t|6t5\nw-6t2'));
	});

	describe('Set', () => {
		it('valid set', () => ok('w|8w7\nw.8w4'));
		it('rejects die not in gigs', () =>
			err('w.8w4', 0, 'Set: d8w not in any gigs'));
		it('rejects value 0', () =>
			err('w|8w7\nw.8w0', 1, 'Set: value 0 out of range (1–8)'));
		it('rejects value above sides', () =>
			err('w|8w7\nw.8w9', 1, 'Set: value 9 out of range (1–8)'));
		it('accepts value at min', () => ok('w|8w7\nw.8w1'));
		it('accepts value at max', () => ok('w|8w7\nw.8w8'));
	});

	describe('Reroll', () => {
		it('valid reroll', () => ok('w|8w7\nw@8w3'));
		it('rejects die not in gigs', () =>
			err('w@8w3', 0, 'Reroll: d8w not in any gigs'));
		it('rejects value 0', () =>
			err('w|8w7\nw@8w0', 1, 'Reroll: value 0 out of range (1–8)'));
		it('rejects value above sides', () =>
			err('w|8w7\nw@8w9', 1, 'Reroll: value 9 out of range (1–8)'));
	});

	describe('state threading', () => {
		it('state advances only on valid moves', () => {
			const errors = validateDocument('w$6t4\nw|4w3');
			expect(errors).toHaveLength(1);
			expect(errors[0].index).toBe(0);
		});
		it('collects all errors across document', () => {
			const errors = validateDocument('w$6t4\nw|4w0\nw|4w3');
			expect(errors).toHaveLength(2);
		});
		it('set value persists for subsequent validation', () =>
			ok('w|6w6\nw.6w1\nw+6w3'));
	});

	describe('applyDocument', () => {
		it('returns default state for empty document', () => {
			const state = applyDocument('');
			expect(state.w.fixer).toHaveLength(6);
			expect(state.w.gigs).toHaveLength(0);
		});
		it('reflects rolled dice in gigs', () => {
			const state = applyDocument('w|6w4\nt|4t2');
			expect(state.w.gigs).toContain('6w4');
			expect(state.t.gigs).toContain('4t2');
			expect(state.w.fixer).not.toContain('6w');
		});
		it('reflects steal: die moves to actor gigs', () => {
			const state = applyDocument('w|6w4\nt$6w4');
			expect(state.w.gigs).not.toContain('6w4');
			expect(state.t.gigs).toContain('6w4');
		});
		it('reflects updated value after increment', () => {
			const state = applyDocument('w|6w2\nw+6w5');
			expect(state.w.gigs).toContain('6w5');
			expect(state.w.gigs).not.toContain('6w2');
		});
		it('skips invalid moves, applies valid ones', () => {
			const state = applyDocument('w$6t4\nw|6w3');
			expect(state.w.gigs).toContain('6w3');
		});
		it('returns correct final state for valid example', () => {
			const state = applyDocument(VALID_EXAMPLE);
			expect(state.w.gigs).toContain('4w3');
			expect(state.w.gigs).toContain('8w4');
			expect(state.t.gigs).toContain('6w3');
			expect(state.t.gigs).toContain('4t3');
			expect(state.t.gigs).toContain('6t4');
		});
	});

	describe('examples', () => {
		it('valid example produces no errors', () => {
			expect(validateDocument(VALID_EXAMPLE)).toEqual([]);
		});
		it('invalid example produces expected errors', () => {
			const errors = validateDocument(INVALID_EXAMPLE);
			expect(errors).toHaveLength(6);
			expect(errors[0]).toMatchObject({ index: 0, reason: expect.stringContaining('Steal') });
			expect(errors[1]).toMatchObject({ index: 2, reason: expect.stringContaining('out of range') });
			expect(errors[2]).toMatchObject({ index: 3, reason: expect.stringContaining('d20') });
			expect(errors[3]).toMatchObject({ index: 4, reason: expect.stringContaining('out of range') });
			expect(errors[4]).toMatchObject({ index: 5, reason: expect.stringContaining('not in any gigs') });
			expect(errors[5]).toMatchObject({ index: 6, reason: 'invalid notation format' });
		});
	});
});
