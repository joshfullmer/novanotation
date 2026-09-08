import { analyzeDocument, formatDie, formatGig, PLAYER_LABEL } from '../index.ts';
import type { GameReport } from '../index.ts';
import { VALID_GAME, INVALID_GAME } from '../examples.ts';

function describeOutcome(report: GameReport): string {
	const { outcome } = report;
	if (outcome.kind === 'undecided') return 'undecided';
	const how = outcome.how === 'start' ? 'start of turn' : 'overtime, turn';
	return `${PLAYER_LABEL[outcome.player]} wins — ${how} ${outcome.turn}`;
}

function print(title: string, doc: string) {
	const report = analyzeDocument(doc);
	console.log(`=== ${title} ===`);
	for (const turn of report.turns) {
		const label = `${String(turn.number).padStart(2)} ${PLAYER_LABEL[turn.actor].padEnd(4)}`;
		console.log(`${label} ${turn.raw}`);
		for (const p of ['w', 't'] as const) {
			const fixer = turn.state[p].fixer.map(formatDie).join(' ');
			const gigs = turn.state[p].gigs.map(formatGig).join(' ');
			console.log(`        ${PLAYER_LABEL[p].padEnd(4)} fixer=[${fixer}] gigs=[${gigs}]`);
		}
	}
	console.log(`\nOutcome: ${describeOutcome(report)}`);
	for (const w of report.warnings) console.log(`Warning: ${w}`);
	console.log(`Errors: ${report.errors.length}`);
	for (const e of report.errors) console.log(`  T${e.turn} "${e.raw}" → ${e.reason}`);
	console.log('');
}

print('VALID GAME', VALID_GAME);
print('INVALID GAME', INVALID_GAME);
