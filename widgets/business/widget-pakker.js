// widget-pakker.js — Large widget, Home Screen (firkantet på iPad).
// Kompakt prisoversikt: én rad per pakke (produkt + scenario + pris).
// Trykk på widgeten → åpner business.html rett på «Produkter & priser»-fanen,
// der prisene vises stort. Ingen Supabase-kall (statiske priser).
//
// Design: matcher widget-mrr.js og widget-forskudd.js (samme business-familie):
//   bg #1a1a1a · padding 12/14 · slate-skala · ASCII-divider · grønn #4ade80 for
//   løpende priser (kr/mnd), nøytral slate for engangs/på vent.

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
  slate:   "#94a3b8",
};

// ── Pakker: kort visning for widgeten (full detalj ligger på dashboardet) ──
const PAKKER = [
  { scenario: "A — Lav",     navn: "Full Driftsavtale",  pris: "790 kr/mnd",   lopende: true  },
  { scenario: "A — Medium",  navn: "Full Driftsavtale",  pris: "1 690 kr/mnd", lopende: true  },
  { scenario: "A — Høy",     navn: "Full Driftsavtale",  pris: "2 190 kr/mnd", lopende: true  },
  { scenario: "B",           navn: "Serverløs Hosting",  pris: "Engangs",      lopende: false },
  { scenario: "C — på vent", navn: "Prosjektoverføring", pris: "50–100k kr",   lopende: false },
];

const NOTE = "MVA-fritt · 790 kr/t · trykk for full prisoversikt";

function addDivider(w) {
  const d = w.addText("──────────────────────────────");
  d.textColor = new Color(C.divider);
  d.font = Font.systemFont(8);
  d.lineLimit = 1;
  d.minimumScaleFactor = 0.5;
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
  const count = head.addText(PAKKER.length + " pakker");
  count.textColor = new Color(C.faint);
  count.font = Font.systemFont(10);

  w.addSpacer(10);
  addDivider(w);
  w.addSpacer(10);

  PAKKER.forEach((p, i) => {
    const accent = p.lopende ? C.green : C.slate;

    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    // Venstre: produktnavn + scenario
    const left = row.addStack();
    left.layoutVertically();
    left.spacing = 1;
    const navn = left.addText(p.navn);
    navn.textColor = new Color(C.name);
    navn.font = Font.mediumSystemFont(13);
    navn.lineLimit = 1;
    const sc = left.addText(p.scenario);
    sc.textColor = new Color(C.faint);
    sc.font = Font.systemFont(9.5);

    row.addSpacer();

    // Høyre: pris
    const price = row.addText(p.pris);
    price.textColor = new Color(accent);
    price.font = Font.semiboldSystemFont(13);
    price.lineLimit = 1;

    if (i < PAKKER.length - 1) w.addSpacer(9);
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
