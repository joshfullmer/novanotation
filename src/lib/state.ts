import type { Sides, Owner } from './notation.ts';

export type DiceState = {
	w: {
		fixer: `${Sides}${Owner}`[];
		gigs: `${Sides}${Owner}${number}`[];
	};
	t: {
		fixer: `${Sides}${Owner}`[];
		gigs: `${Sides}${Owner}${number}`[];
	};
};

export const DEFAULT_STATE: DiceState = {
	w: {
		fixer: ['4w', '6w', '8w', '10w', '12w', '20w'],
		gigs: []
	},
	t: {
		fixer: ['4t', '6t', '8t', '10t', '12t', '20t'],
		gigs: []
	}
};
