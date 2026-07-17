// widget-pakker.js — Large widget, Home Screen (firkantet på iPad).
// Prisoversikt gruppert per scenario: A (løpende drift), B (engangs), C (på vent).
// Trykk på widgeten → åpner business.html rett på «Produkter & priser»-fanen,
// der prisene vises stort. Ingen Supabase-kall (statiske priser).
//
// Design: matcher widget-mrr.js og widget-forskudd.js (samme business-familie):
//   bg #1a1a1a · padding 12/14 · slate-skala · stiplet divider · grønn #4ade80
//   (løpende), amber #fbbf24 (engangs), slate #94a3b8 (på vent).

const BASE = "https://filip-vita.vercel.app";
const URL  = `${BASE}/business.html#priser`;

// ── Fargepalett (delt med de andre business-widgetene) ──
const C = {
  bg:      "#1a1a1a",
  primary: "#e2e8f0",
  name:    "#cbd5e1",
  faint:   "#666666",
  muted:   "#64748b",
  divider: "#333333",
  note:    "#555555",
  green:   "#4ade80",
  amber:   "#fbbf24",
  slate:   "#94a3b8",
};

// ── Scenarier: gruppert prisoversikt for widgeten ──
const SCENARIOS = [
  {
    tag:   "SCENARIO A",
    label: "LØPENDE DRIFT",
    color: C.green,
    items: [
      { navn: "Lav",    pris: "790 kr/mnd" },
      { navn: "Medium", pris: "1 690 kr/mnd" },
      { navn: "Høy",    pris: "2 190 kr/mnd" },
    ],
  },
  {
    tag:   "SCENARIO B",
    label: "ENGANGS",
    color: C.amber,
    items: [
      { navn: "Nettside, gratis hosting", pris: "10–50k kr" },
    ],
  },
  {
    tag:   "SCENARIO C",
    label: "FULL OVERFØRING",
    color: C.slate,
    items: [
      { navn: "Full overføring", pris: "50–100k kr" },
    ],
  },
];

const NOTE = "Priser inkl. mva · 790 kr/t · trykk for full oversikt";

function addDivider(w) {
  const d = w.addText("╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌");
  d.textColor = new Color(C.divider);
  d.font = Font.systemFont(8);
  d.lineLimit = 1;
  d.minimumScaleFactor = 0.5;
}

// Splitter "790 kr/mnd" → fet "790 kr" + dempet/mindre "/mnd".
// Priser uten "/" (f.eks. "10–50k kr") rendres som én tekst.
function addPrice(row, pris, color) {
  const slash = pris.indexOf('/');
  if (slash === -1) {
    const t = row.addText(pris);
    t.textColor = new Color(color);
    t.font = Font.semiboldSystemFont(13);
    t.lineLimit = 1;
    return;
  }
  const stack = row.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  const main = stack.addText(pris.slice(0, slash));
  main.textColor = new Color(color);
  main.font = Font.semiboldSystemFont(13);
  main.lineLimit = 1;
  const suffix = stack.addText(pris.slice(slash));
  suffix.textColor = new Color(C.muted);
  suffix.font = Font.systemFont(10);
  suffix.lineLimit = 1;
}

function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color(C.bg);
  w.setPadding(14, 15, 14, 15);
  w.url = URL; // trykk → åpne prisoversikten på dashboardet

  // Header
  const head = w.addStack();
  head.layoutHorizontally();
  head.centerAlignContent();
  const title = head.addText("Nettside-pakker");
  title.textColor = new Color(C.primary);
  title.font = Font.boldSystemFont(16);
  head.addSpacer();
  const count = head.addText(`${SCENARIOS.length} modeller`);
  count.textColor = new Color(C.faint);
  count.font = Font.systemFont(10);

  w.addSpacer(10);
  addDivider(w);

  SCENARIOS.forEach((s, si) => {
    w.addSpacer(10);

    const tag = w.addText(`${s.tag} · ${s.label}`);
    tag.textColor = new Color(s.color);
    tag.font = Font.semiboldSystemFont(9.5);
    tag.lineLimit = 1;
    tag.minimumScaleFactor = 0.6;

    w.addSpacer(8);

    s.items.forEach((item, ii) => {
      const row = w.addStack();
      row.layoutHorizontally();
      row.centerAlignContent();

      const navn = row.addText(item.navn);
      navn.textColor = new Color(C.name);
      navn.font = Font.mediumSystemFont(13);
      navn.lineLimit = 1;

      row.addSpacer();
      addPrice(row, item.pris, s.color);

      if (ii < s.items.length - 1) w.addSpacer(9);
    });

    if (si < SCENARIOS.length - 1) {
      w.addSpacer(10);
      addDivider(w);
    }
  });

  w.addSpacer();
  addDivider(w);
  w.addSpacer(6);
  const note = w.addText(NOTE);
  note.textColor = new Color(C.note);
  note.font = Font.systemFont(9);
  note.lineLimit = 1;
  note.minimumScaleFactor = 0.7;

  return w;
}

const widget = buildWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  // Åpnet manuelt i Scriptable → vis stor forhåndsvisning
  await widget.presentLarge();
}
Script.complete();