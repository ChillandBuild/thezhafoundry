// Manual smoke against real APIs (costs money, needs full env):
//   npx tsx scripts/assay-live.ts <github-url> <email>
import 'dotenv/config';
import { defaultDeps } from '../src/lib/assay/deps';
import { runAssayPipeline } from '../src/lib/assay/pipeline';

const [link, email] = process.argv.slice(2);
if (!link || !email) throw new Error('usage: npx tsx scripts/assay-live.ts <github-url> <email>');

const deps = defaultDeps();
const id = await deps.store.insert({ kind: 'assay', email, link, name: '', message: '', status: 'pending' });
await runAssayPipeline(deps, id);
console.error('[assay] live run complete for', id);
