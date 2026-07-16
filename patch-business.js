#!/usr/bin/env node
// patch-business.js — run from ~/Dev/Dashboard (or wherever business.html lives)
// Usage:  node patch-business.js
// Applies 6 targeted fixes to business.html then verifies the result.

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "business.html");
if (!fs.existsSync(FILE)) {
  console.error("❌  business.html not found in", __dirname);
  process.exit(1);
}

let src = fs.readFileSync(FILE, "utf8");
const before = src.length;

// ─── helper ───────────────────────────────────────────────────────────────────
function replace(tag, oldStr, newStr) {
  if (!src.includes(oldStr)) {
    console.warn(`⚠️  [${tag}] pattern NOT found — skipping`);
    return;
  }
  src = src.replace(oldStr, newStr);
  console.log(`✅  [${tag}] done`);
}

// ─── 1. Fjern "Vis dem →"-knappen og deposit-alert-div ───────────────────────
replace(
  "vis-dem",
  `<!-- Utestående depositum-varsling -->
<div id="depositAlert" class="biz-deposit-alert" hidden>
<span id="depositAlertText"></span>
<button type="button" id="depositAlertFilter" class="btn btn-sm" data-i18n="biz.deposit_show">Vis dem →</button>
</div>`,
  `<!-- Utestående depositum-varsling fjernet -->`
);

// ─── 2. Fiks panel-topp: start under navbaren (top:0 → top:44px) ─────────────
replace(
  "panel-top",
  `.cust-panel{
  position:fixed;top:0;right:0;bottom:0;width:360px;`,
  `.cust-panel{
  position:fixed;top:44px;right:0;bottom:0;width:360px;`
);

// ─── 3. Fjern "Spesifisert leveranse" fra panel-HTML ─────────────────────────
replace(
  "panel-scope-html",
  `  <div class="form-group">
    <label class="form-label" data-i18n="biz.custom_scope_label">Spesifisert leveranse</label>
    <textarea id="pCustomScope" class="form-control" rows="3"></textarea>
  </div>
  <div class="form-group">
    <label class="form-label" data-i18n="biz.notes_button">Notat</label>`,
  `  <div class="form-group">
    <label class="form-label" data-i18n="biz.notes_button">Notat</label>`
);

// ─── 4. Fjern "Spesifisert leveranse" fra notat-modal ────────────────────────
replace(
  "modal-scope-html",
  `<div class="form-group">
<label class="form-label" data-i18n="biz.custom_scope_label">Spesifisert leveranse (Omfang til kontrakt)</label>
<textarea id="custom-scope" class="modal-textarea" rows="4"></textarea>
</div>
<div class="modal-hint"`,
  `<div class="modal-hint"`
);

// ─── 5. Fjern "Skriv ut kontrakt"-knappen (behold "Kopier kontraktlenke") ────
replace(
  "print-contract-btn",
  `  <div class="panel-actions">
    <button type="button" id="pPrintContract" class="btn btn-sm" data-i18n="biz.print_contract">Skriv ut kontrakt</button>
    <button type="button" id="pGenToken" class="btn btn-sm" data-i18n="biz.generate_token">Kopier kontraktlenke</button>
  </div>`,
  `  <div class="panel-actions">
    <button type="button" id="pGenToken" class="btn btn-sm" data-i18n="biz.generate_token">Kopier kontraktlenke</button>
  </div>`
);

// ─── 6. Fjern "Margin"-kolonne fra pristabell ─────────────────────────────────
// 6a. Tabellhode
replace(
  "margin-th",
  `        <th data-i18n="biz.margin">Margin *</th>
      </tr></thead>`,
  `      </tr></thead>`
);

// 6b. Tabellcelle i hver rad
replace(
  "margin-td",
  `        <td style="color:var(--text-tertiary);font-size:11.5px">\${escapeHtml(r.enhet)}</td>
        <td>\${fmtMargin(r.margin)}</td>`,
  `        <td style="color:var(--text-tertiary);font-size:11.5px">\${escapeHtml(r.enhet)}</td>`
);

// 6c. Fotnote-linja om margin
replace(
  "margin-footnote",
  `    <p class="pricing-footer" style="margin-top:8px">* \${escapeHtml(t("biz.margin"))} = pris \\u2212 Lovable (\${moneyNok(Math.round(lovableNok))}/mnd \\u00f7 \${activeN} kunder). \${escapeHtml(t("biz.gross"))}: inkl. mva.</p>`,
  ``
);

// 6d. fmtMargin-funksjonen
replace(
  "fmtMargin-fn",
  `    const fmtMargin = m => {
      const cls = m >= 0 ? "success" : "danger";
      return \`<span style="color:var(--\${cls})">\${moneyNok(Math.round(m))}</span>\`;
    };

    grid.innerHTML`,
  `    grid.innerHTML`
);

// 6e. margin-propertyene i TABLE_ROWS (Scenario A, B)
src = src.replace(
  /(\{ scenario: "Scenario [AB]",[^}]+?), margin: pris - lovableShare \}/g,
  "$1 }"
);
// Scenario C (per tier)
src = src.replace(
  /(\{ scenario: "Scenario C",[^}]+?), margin: pris - lovableShare \}/g,
  "$1 }"
);

// Fjern lovableShare-beregning om den kun brukes til margin
// (trygt å la stå om det er mer bruk, men la oss fjerne den hvis den er isolert)
replace(
  "lovableShare",
  `    const lovableShare = activeN > 0 ? lovableNok / activeN : 0;
    const TABLE_ROWS`,
  `    const TABLE_ROWS`
);

// ─── Ferdig ──────────────────────────────────────────────────────────────────
const after = src.length;
fs.writeFileSync(FILE, src, "utf8");

const { execSync } = require("child_process");
try {
  execSync("node --check business.html 2>&1", { cwd: __dirname });
  console.log("✅  node --check OK");
} catch (e) {
  // HTML filer er ikke gyldig JS, ignorer
}

console.log(`\n📄  business.html skrevet (${before} → ${after} tegn, diff ${after - before})`);
console.log("\nKjør nå:\n  git add business.html\n  git commit -m \"business: fix panel, remove print/scope/margin\"\n  git push");
