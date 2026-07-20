// scripts/check-nav.mjs
// Nav har ÉN kilde: NAV_TABS/injectNav() i utils.js. Sidene har bare en
// placeholder. Denne sjekken verifiserer at:
//   1) alle 10 sider har <nav class="main-nav" data-nav> (gym også data-unit)
//   2) ingen side har gammel inline nav-markup (nav-tab utenfor utils.js)
//   3) utils.js lastes ETTER nav-elementet (ellers finner injectNav() den ikke)
//   4) utils.js-templaten dekker alle 10 faner + diary/lang/unit/logout-knappene
// Exit 0 = OK, exit 1 = drift.

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const FILES = [
  'ai.html', 'dashboard.html', 'gym.html', 'sprint.html',
  'sovn.html', 'gjoremal.html', 'kalender.html', 'treningsplan.html',
  'investments.html', 'business.html', 'musikk.html',
];
const NAV_PAGES = ['ai', 'dashboard', 'gym', 'sprint', 'sovn', 'gjoremal', 'kalender', 'treningsplan', 'investments', 'business', 'musikk'];

let failed = false;
const err = (m) => { console.error('FAIL ' + m); failed = true; };

for (const file of FILES) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  if (!/<nav class="main-nav" data-nav( data-unit)?><\/nav>/.test(html))
    err(`${file}: mangler tom <nav class="main-nav" data-nav>-placeholder`);
  if (file === 'gym.html' && !html.includes('data-nav data-unit'))
    err('gym.html: mangler data-unit (kg/lbs-knappen)');
  if (html.includes('class="nav-tab"'))
    err(`${file}: har fortsatt inline nav-markup — skal kun ligge i utils.js`);
  const navPos = html.indexOf('<nav class="main-nav"');
  const utilsPos = html.indexOf('src="utils.js"');
  if (navPos >= 0 && utilsPos >= 0 && utilsPos < navPos)
    err(`${file}: utils.js lastes før nav — injectNav() finner den ikke`);
}

const utils = readFileSync(join(ROOT, 'utils.js'), 'utf8');
for (const p of NAV_PAGES) {
  if (!utils.includes(`'${p}.html', '${p}', 'nav.${p}'`))
    err(`utils.js: NAV_TABS mangler/avviker for «${p}»`);
}
for (const frag of ['function injectNav', 'id="diaryLink"', 'id="langBtn"', 'id="unitBtn"', 'signOut()'])
  if (!utils.includes(frag)) err(`utils.js: nav-templaten mangler «${frag}»`);

if (failed) process.exit(1);
console.log(`nav OK — én kilde i utils.js, placeholder i alle ${FILES.length} sider`);
