// Lance le test de non-régression (?demo&smoke) dans un vrai navigateur, sans écran.
// Utilisé par l'action GitHub (.github/workflows/smoke.yml) ; en local :
//   npm install --no-save playwright@1.48.2 && npx playwright install chromium
//   python3 -m http.server 8000 &   puis   node tests/run-smoke.mjs
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_URL || 'http://localhost:8000/';
const browser = await chromium.launch();
let failed = false;
for (const lang of ['fr', 'en']) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}?demo&smoke&lang=${lang}`);
  const result = await page.waitForFunction(() => window.SMOKE_RESULT, null, { timeout: 60000 }).then(h => h.jsonValue());
  console.log(`[${lang}] ${result.passed} / ${result.total} OK`);
  for (const f of result.failed) console.log(`  ✗ ${f.name} : ${f.err}`);
  for (const e of errors) console.log(`  erreur JavaScript : ${e}`);
  if (result.failed.length || errors.length) failed = true;
  await page.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
