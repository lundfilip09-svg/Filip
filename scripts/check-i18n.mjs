// scripts/check-i18n.mjs — feiler hvis TRANSLATIONS.no og .en ikke har identiske nøkkelsett.
// Kjør: npm run check:i18n  (kjøres også av pre-commit-hooken)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const s = readFileSync(join(root, 'utils.js'), 'utf8');

const o = s.indexOf('{', s.indexOf('const TRANSLATIONS'));
let depth = 0, end = -1;
for (let i = o; i < s.length; i++) {
  if (s[i] === '{') depth++;
  if (s[i] === '}') { depth--; if (!depth) { end = i; break; } }
}
if (o < 0 || end < 0) { console.error('check-i18n: fant ikke TRANSLATIONS i utils.js'); process.exit(1); }

const T = (0, eval)('(' + s.slice(o, end + 1) + ')');
const no = new Set(Object.keys(T.no)), en = new Set(Object.keys(T.en));
const onlyNo = [...no].filter(k => !en.has(k));
const onlyEn = [...en].filter(k => !no.has(k));

if (onlyNo.length || onlyEn.length) {
  if (onlyNo.length) console.error(`✗ Mangler i EN (${onlyNo.length}): ${onlyNo.join(', ')}`);
  if (onlyEn.length) console.error(`✗ Mangler i NO (${onlyEn.length}): ${onlyEn.join(', ')}`);
  process.exit(1);
}
console.log(`i18n OK — ${no.size} nøkler, identiske sett i begge språk`);
