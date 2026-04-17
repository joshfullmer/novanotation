import { validateDocument } from '../index.ts';
import { VALID_EXAMPLE, INVALID_EXAMPLE } from './examples.ts';

console.log('=== VALID EXAMPLE ===');
const validErrors = validateDocument(VALID_EXAMPLE, true);
console.log(validErrors.length === 0 ? '\nResult: PASS (0 errors)\n' : `\nResult: FAIL (${validErrors.length} errors)\n`);

console.log('=== INVALID EXAMPLE ===');
const invalidErrors = validateDocument(INVALID_EXAMPLE, true);
console.log(`\nResult: ${invalidErrors.length} error(s) detected`);
for (const e of invalidErrors) {
	console.log(`  [${e.index}] "${e.raw}" → ${e.reason}`);
}
