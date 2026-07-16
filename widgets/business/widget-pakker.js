// widget-pakker.js — Large widget, Home Screen.
// Trykk på widgeten for å åpne en interaktiv meny (i Scriptable-appen) med
// ALLE scenarioer + fulle feature-lister. Selve home screen-widgeten viser
// alltid full (large) oversikt — legg den til som Large på hjemskjermen.
// Ingen Supabase-kall. Statiske priser hentet fra business.html sin sales-seksjon.

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
    farge: "#10b981",
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
    farge: "#10b981",
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
    farge: "#10b981",
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
    farge: "#8b5cf6",
  },
  {
    scenario: "C — på vent",
    tittel: "Prosjektoverføring",
    type: "50 000–100 000 kr (avventes)",
    pris: null, // engangspris, varierer — fokuser salg på A/B inntil videre
    features: [
      "Engangs 50 000–100 000 kr (25 % forskudd)",
      "Overføres til kundens egen Lovable-konto",
      "Skriftlig godkjenning før overføring",
      "Support etter overføring: 790 kr/t",
    ],
    farge: "#3b82f6",
  },
];

const NOTE = "MVA-fritt (Privat frilansfaktura) · Timesats 790 kr/t · A: 1 mnd gjensidig oppsigelse";

// ── Home screen-widget: alltid full (large) oversikt ──
function buildWidget() {
  const w = new ListWidget();
  w.backgroundColor = new Color("#111111");
  w.setPadding(12, 14, 12, 14);

  const hdr = w.addText("Nettside-pakker");
  hdr.textColor = new Color("#e2e8f0");
  hdr.font = Font.boldSystemFont(14);
  w.addSpacer(6);

  for (const p of PAKKER) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.spacing = 6;

    // Fargebrikke
    const chip = row.addStack();
    chip.backgroundColor = new Color(p.farge + "33");
    chip.cornerRadius = 4;
    chip.setPadding(2, 5, 2, 5);
    const chipTxt = chip.addText(p.scenario);
    chipTxt.textColor = new Color(p.farge);
    chipTxt.font = Font.boldSystemFont(9);

    // Tittel + type
    const info = row.addStack();
    info.layoutVertically();
    const titleTxt = info.addText(p.tittel);
    titleTxt.textColor = new Color("#e2e8f0");
    titleTxt.font = Font.mediumSystemFont(11);
    titleTxt.lineLimit = 1;
    const typeTxt = info.addText(p.type);
    typeTxt.textColor = new Color(p.farge);
    typeTxt.font = Font.boldSystemFont(10);

    w.addSpacer(2);

    // Alle features
    for (const f of p.features) {
      const fRow = w.addStack();
      fRow.layoutHorizontally();
      fRow.spacing = 3;
      const bullet = fRow.addText("·");
      bullet.textColor = new Color(p.farge);
      bullet.font = Font.systemFont(10);
      const fTxt = fRow.addText(f);
      fTxt.textColor = new Color("#94a3b8");
      fTxt.font = Font.systemFont(10);
      fTxt.lineLimit = 1;
    }

    w.addSpacer(5);
  }

  w.addSpacer();
  const note = w.addText(NOTE);
  note.textColor = new Color("#475569");
  note.font = Font.systemFont(9);

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
    const row = new UITableRow();
    row.height = 60;
    row.dismissOnSelect = false;

    const chip = row.addText(p.scenario);
    chip.widthWeight = 24;
    chip.titleColor = new Color(p.farge);
    chip.titleFont = Font.boldSystemFont(13);

    const info = row.addText(p.tittel, p.type);
    info.widthWeight = 56;

    const priceTxt = row.addText(p.pris ? p.pris.toLocaleString("nb-NO") + " kr" : "Engangs");
    priceTxt.widthWeight = 20;
    priceTxt.rightAligned();

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
