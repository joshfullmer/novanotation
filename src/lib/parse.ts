import { regex } from 'arkregex';
import { Action, DIE_LETTERS } from './notation.ts';
import type { Die, DieLetter, Owner } from './notation.ts';

export type ParsedMove = {
	action: Action;
	die: Die;
	/** Absent only on a steal, where it is an optional checksum. */
	value?: number;
	raw: string;
};

export type Entry = { move: ParsedMove; reaction: boolean };

/** A turn with no entries is a pass. */
export type RawTurn = { number: number; raw: string; entries: Entry[] };

export type SyntaxError = { turn: number; raw: string; reason: string };

export type ParsedDocument = { first: Owner; turns: RawTurn[]; errors: SyntaxError[] };

const MOVE = regex("^(?<action>[+\\-=~x])?(?<die>[A-F])(?<theirs>')?(?<value>[0-9]{1,2})?$");
const HEADER = /^first:\s*(we|they)$/i;
const TURN_PREFIX = /^(\d+)[|.]?\s*/;
const TOKEN = /\(|\)|[^\s()]+/g;

export function parseMove(raw: string): ParsedMove | null {
	const match = MOVE.exec(raw);
	if (!match) return null;
	const { action, die, theirs, value } = match.groups;
	const move: ParsedMove = {
		action: (action ?? Action.Roll) as Action,
		die: { sides: DIE_LETTERS[die as DieLetter], owner: theirs ? 't' : 'w' },
		raw
	};
	if (value !== undefined) move.value = parseInt(value, 10);
	return move;
}

const COMMENT_ONLY = /^\s*;/;

function stripComment(line: string): string {
	return line.replace(/;.*$/, '').trim();
}

export function parseDocument(text: string): ParsedDocument {
	// Comment-only lines are not turns; blank lines are (and get flagged).
	const lines = text
		.split('\n')
		.filter((l) => !COMMENT_ONLY.test(l))
		.map(stripComment);
	let start = 0;
	let end = lines.length;
	while (start < end && lines[start] === '') start++;
	while (end > start && lines[end - 1] === '') end--;

	let first: Owner = 'w';
	const header = start < end ? HEADER.exec(lines[start]) : null;
	if (header) {
		first = header[1].toLowerCase() === 'we' ? 'w' : 't';
		start++;
		while (start < end && lines[start] === '') start++;
	}

	const turns: RawTurn[] = [];
	const errors: SyntaxError[] = [];

	for (let i = start; i < end; i++) {
		const number = turns.length + 1;
		const raw = lines[i];
		const fail = (token: string, reason: string) =>
			errors.push({ turn: number, raw: token, reason });

		if (raw === '') {
			fail('', 'empty turn — write .. to pass');
			turns.push({ number, raw, entries: [] });
			continue;
		}

		let line = raw;
		const prefix = TURN_PREFIX.exec(line);
		if (prefix) {
			const written = parseInt(prefix[1], 10);
			if (written !== number)
				fail(prefix[1], `turn number ${written} does not match position ${number}`);
			line = line.slice(prefix[0].length);
		}

		if (line === '..') {
			turns.push({ number, raw, entries: [] });
			continue;
		}

		const entries: Entry[] = [];
		let reaction = false;
		let reactionSize = 0;
		for (const token of line.match(TOKEN) ?? []) {
			if (token === '(') {
				if (reaction) fail(token, 'instants cannot nest');
				reaction = true;
				reactionSize = 0;
				continue;
			}
			if (token === ')') {
				if (!reaction) fail(token, 'unmatched )');
				else if (reactionSize === 0) fail('()', 'empty instant');
				reaction = false;
				continue;
			}
			if (token === '..') {
				fail(token, '.. must be the only entry in a turn');
				continue;
			}
			const move = parseMove(token);
			if (!move) {
				fail(token, 'invalid move syntax');
				continue;
			}
			if (move.action !== Action.Steal && move.value === undefined) {
				fail(token, 'missing value');
				continue;
			}
			entries.push({ move, reaction });
			reactionSize++;
		}
		if (reaction) fail('(', 'unclosed (');

		turns.push({ number, raw, entries });
	}

	return { first, turns, errors };
}
