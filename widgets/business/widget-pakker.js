// widget-pakker.js — Large widget, Home Screen.
// Trykk på widgeten for å åpne en interaktiv meny (i Scriptable-appen) med
// ALLE scenarioer + fulle feature-lister. Selve home screen-widgeten viser
// alltid full (large) oversikt — legg den til som Large på hjemskjermen.
// Ingen Supabase-kall. Statiske priser hentet fra business.html sin sales-seksjon.
//
// Design: matcher widget-mrr.js og widget-forskudd.js (samme business-familie).
//   bg #1a1a1a · padding 12/14 · slate-skala · ASCII-divider · grønn #4ade80 for
//   løpende priser (kr/mnd), nøytral slate for engangsleveranser.

// ── Fargepalett (delt med de andre business-widgetene) ──
const C = {
  bg:        "#1a1a1a",
  label:     "#888888",
  primary:   "#e2e8f0",
  name:      "#cbd5e1",
  secondary: "#94a3b8",
  muted:     "#64748b",
  faint:     "#666666",
  divider:   "#333333",
  note:      "#555555",
  green:     "#4ade80",
  red:       "#f26d6d",
};

// ── Statiske pakkedata (sync med business.html TIER_PRICES + sales-cards) ──
const PAKKER = [
  {
    scenario: "A — Lav",
    tittel: "Full Driftsavtale",
    type: "790 kr/mnd",
    pris: 790,
    features: [
      "Oppstart 10 000–50 000 kr (25 % forskudd)",
      "Hosting · SSL · oppetid",
      "0 innholdsendringer inkl. — support 790 kr/t",
    ],
  },
  {
    scenario: "A — Medium",
    tittel: "Full Driftsavtale",
    type: "1 690 kr/mnd",
    pris: 1690,
    features: [
      "Oppstart 10 000–50 000 kr (25 % forskudd)",
      "Alt i Lav + maks 2 mikroendringer/mnd",
      "Overforbruk: 790 kr/t",
    ],
  },
  {
    scenario: "A — Høy",
    tittel: "Full Driftsavtale",
    type: "2 190 kr/mnd",
    pris: 2190,
    features: [
      "Oppstart 10 000–50 000 kr (25 % forskudd)",
      "Alt i Medium + ukentlige justeringer (maks 1 økt/uke)",
      "Overforbruk: 790 kr/t",
    ],
  },
  {
    scenario: "B",
    tittel: "Serverløs Hosting",
    type: "Engangsleveranse",
    pris: null,
    features: [
      "Bygd i Lovable → nedlastet til Cloudflare Pages",
      "SSL-sertifikat + tilpasset domene",
      "Ingen månedskostnad, ingen kodetilgang for kunde",
      "Reaktivering etter 90+ dager: 490 kr + 790 kr/t",
    ],
  },
  {
    scenario: "C — på vent",
    tittel: "Prosjektoverføring",
    type: "50 000–100 000 kr",
    pris: null, // engangspris, varierer — fokuser salg på A/B inntil videre
    features: [
      "Engangs 50 000–100 000 kr (25 % forskudd)",
      "Overføres til kundens egen Lovable-konto",
      "Skriftlig godkjenning før overføring",
      "Support etter overføring: 790 kr/t",
    ],
  },
];

const NOTE = "MVA-fritt (Privat frilansfaktura) · Timesats 790 kr/t · A: 1 mnd gjensidig oppsigelse";

// Grønn for løpende inntekt (kr/mnd), nøytral slate for engangs/på vent.
function accentFor(p) {
  return p.pris ? C.green : C.secondary;
}

function addDivider(w) {
  const d = w.addText("──────────────────────────────");
  d.textColor = new Color(C.divider);
  d.font = Font.systemFont(8);
  d.lineLimit = 1;
  d.minimumScaleFactor = 0.5;
}

// ── Home screen-widget: alltid full (large) oversikt ──
function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color(C.bg);
  w.setPadding(12, 14, 12, 14);

  // Header
  const head = w.addStack();
  head.layoutHorizontally();
  head.centerAlignContent();
  const title = head.addText("Nettside-pakker");
  title.textColor = new Color(C.primary);
  title.font = Font.boldSystemFont(15);
  head.addSpacer();
  const count = head.addText(PAKKER.length + " pakker");
  count.textColor = new Color(C.faint);
  count.font = Font.systemFont(10);

  w.addSpacer(8);
  addDivider(w);
  w.addSpacer(7);

  PAKKER.forEach((p, i) => {
    const accent = accentFor(p);

    // Scenario-tag (venstre) + pris (høyre)
    const top = w.addStack();
    top.layoutHorizontally();
    top.centerAlignContent();

    const tag = top.addText(p.scenario.toUpperCase());
    tag.textColor = new Color(C.faint);
    tag.font = Font.mediumSystemFont(9);
    tag.lineLimit = 1;

    top.addSpacer();

    const price = top.addText(p.type);
    price.textColor = new Color(accent);
    price.font = Font.semiboldSystemFont(11);
    price.lineLimit = 1;

    w.addSpacer(2);

    // Produkttittel
    const name = w.addText(p.tittel);
    name.textColor = new Color(C.name);
    name.font = Font.mediumSystemFont(12.5);
    name.lineLimit = 1;

    w.addSpacer(3);

    // Features
    for (const f of p.features) {
      const fRow = w.addStack();
      fRow.layoutHorizontally();
      fRow.spacing = 5;
      fRow.topAlignContent();

      const dot = fRow.addText("·");
      dot.textColor = new Color(accent);
      dot.font = Font.boldSystemFont(10);

      const ft = fRow.addText(f);
      ft.textColor = new Color(C.muted);
      ft.font = Font.systemFont(9.5);
      ft.lineLimit = 1;

      w.addSpacer(1);
    }

    if (i < PAKKER.length - 1) w.addSpacer(8);
  });

  w.addSpacer();
  addDivider(w);
  w.addSpacer(5);
  const note = w.addText(NOTE);
  note.textColor = new Color(C.note);
  note.font = Font.systemFont(8.5);
  note.lineLimit = 2;

  return w;
}

// ── Interaktiv meny: åpnes i Scriptable-appen når du trykker på widgeten ──
async function showDetail(p) {
  const a = new Alert();
  a.title = `${p.scenario} — ${p.tittel}`;
  a.message =
    `${p.type}` +
    (p.pris ? ` (${p.pris.toLocaleString("nb-NO")} kr)` : "") +
    "\n\n" +
    p.features.join("\n") +
    `\n\n${NOTE}`;
  a.addAction("Lukk");
  await a.presentAlert();
}

async function presentMenu() {
  const table = new UITable();
  table.showSeparators = true;

  for (const p of PAKKER) {
    const accent = accentFor(p);
    const row = new UITableRow();
    row.height = 60;
    row.dismissOnSelect = false;

    const chip = row.addText(p.scenario);
    chip.widthWeight = 24;
    chip.titleColor = new Color(accent);
    chip.titleFont = Font.boldSystemFont(13);

    const info = row.addText(p.tittel, p.type);
    info.widthWeight = 56;
    info.titleColor = new Color(C.name);
    info.subtitleColor = new Color(C.muted);

    const priceTxt = row.addText(p.pris ? p.pris.toLocaleString("nb-NO") + " kr" : "Engangs");
    priceTxt.widthWeight = 20;
    priceTxt.rightAligned();
    priceTxt.titleColor = new Color(accent);

    row.onSelect = () => showDetail(p);
    table.addRow(row);
  }

  await table.present(false);
}

const widget = buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await presentMenu();
}
Script.complete();
