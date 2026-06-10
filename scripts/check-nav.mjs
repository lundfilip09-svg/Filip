// scripts/check-nav.mjs
// Verifies that <nav class="main-nav"> is consistent across all 8 HTML pages.
// Exit 0 = OK, exit 1 = drift detected.

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'ai.html', 'dashboard.html', 'gym.html', 'sprint.html',
  'sovn.html', 'gjoremal.html', 'kalender.html', 'treningsplan.html',
];

const NAV_PAGES = ['ai', 'dashboard', 'gym', 'sprint', 'sovn', 'gjoremal', 'kalender', 'treningsplan'];

function extractNav(html) {
  const start = html.indexOf('<nav class="main-nav">');
  if (start === -1) return null;
  let depth = 0, i = start;
  while (i < html.length) {
    if (html.startsWith('<nav', i) && (html[i + 4] === ' ' || html[i + 4] === '>')) depth++;
    if (html.startsWith('</nav>', i)) { depth--; if (depth === 0) return html.slice(start, i + 6); }
    i++;
  }
  return null;
}

let failed = false;

for (const file of FILES) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  const nav  = extractNav(html);
  const errs = [];

  if (!nav) {
    console.error(`FAIL ${file}: no <nav class="main-nav"> found`);
    failed = true;
    continue;
  }

  for (const page of NAV_PAGES) {
    if (!nav.includes(`data-p="${page}"`)) errs.push(`missing data-p="${page}"`);
  }

  if (!nav.includes('id="diaryLink"') || !nav.includes('href="treningsdagbok.html"'))
    errs.push('missing diaryLink (id="diaryLink" href="treningsdagbok.html")');

  if (!nav.includes('id="langBtn"'))
    errs.push('missing langBtn');

  if (!nav.includes('onclick="signOut()"'))
    errs.push('missing signOut button');

  if (errs.length) {
    console.error(`FAIL ${file}:\n${errs.map(e => `  - ${e}`).join('\n')}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('nav OK');
