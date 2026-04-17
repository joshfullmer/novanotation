import { regex } from 'arkregex';
import type { Actor, Action, Sides, Owner } from './notation.ts';

export type ParsedMove = {
	actor: Actor;
	action: Action;
	sides: Sides;
	owner: Owner;
	value: number;
	raw: string;
};

const MOVE_REGEX = regex(
	'^(?<actor>[wt])(?<action>\\||\\$|\\+|\\-|\\.|@)(?<sides>4|6|8|10|12|20)(?<owner>[wt])(?<value>[0-9]{1,2})$'
);

export function parseMove(raw: string): ParsedMove | null {
	const result = MOVE_REGEX.exec(raw);
	if (!result) return null;
	const { actor, action, sides, owner, value } = result.groups;
	return { actor, action, sides, owner, value: parseInt(value, 10), raw };
}
