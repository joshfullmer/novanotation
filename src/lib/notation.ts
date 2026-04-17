export const Actor = {
	We: 'w',
	They: 't'
} as const;
export type Actor = (typeof Actor)[keyof typeof Actor];

export const Action = {
	Roll: '|',
	Steal: '$',
	Increment: '+',
	Decrement: '-',
	Set: '.',
	Reroll: '@'
} as const;
export type Action = (typeof Action)[keyof typeof Action];

export const Sides = {
	'4': '4',
	'6': '6',
	'8': '8',
	'10': '10',
	'12': '12',
	'20': '20'
} as const;
export type Sides = (typeof Sides)[keyof typeof Sides];

export const Owner = {
	We: 'w',
	They: 't'
} as const;
export type Owner = (typeof Owner)[keyof typeof Owner];
