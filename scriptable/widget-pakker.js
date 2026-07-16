// widget-pakker.js — Medium/Large widget, vist i kundemøter (manuelt)
// Ingen Supabase-kall. Statiske priser hentet fra business.html sin sales-seksjon.
// Vis i Scriptable: kjør skriptet og velg presentMedium() / presentLarge().

// ── Statiske pakkedata (sync med business.html TIER_PRICES + sales-cards) ──
const PAKKER = [
  {
    scenario: "A — Lav",
    tittel: "Full Driftsavtale",
    type: "690 kr/mnd",
    pris: 690,
    features: ["Hosting · SSL · oppetid"],
    farge: "#10b981",
  },
  {
    scenario: "A — Medium",
    tittel: "Full Driftsavtale",
    type: "1 190 kr/mnd",
    pris: 1190,
    features: ["Alt i Lav + 3 endringer/mnd", "Overforbruk: 890 kr/t"],
    farge: "#10b981",
  },
  {
    scenario: "A — Høy",
    tittel: "Full Driftsavtale",
    type: "1 990 kr/mnd",
    pris: 1990,
    features: ["Alt i Medium + ukentlige oppdateringer", "Overforbruk: 890 kr/t"],
    farge: "#10b981",
  },
  {
    scenario: "B",
    tittel: "Serverløs Hosting",
    type: "Engangsleveranse",
    pris: null,
    features: [
      "Gratis hosting på Vercel / Netlify",
      "SSL-sertifikat + tilpasset domene",
      "Ingen månedskostnad",
      "Endringer etter 90 dager: 490 kr oppstart + 890 kr/t",
    ],
    farge: "#8b5cf6",
  },
  {
    scenario: "C",
    tittel: "Prosjektoverføring",
    type: "Engangsleveranse",
    pris: null, // engangspris, varierer
    features: [
      "Komplett nettside etter dine krav",
      "Skriftlig godkjenning før overføring",
      "Kunden eier kildekoden 100%",
      "Fremtidige endringer: 890 kr/t",
    ],
    farge: "#3b82f6",
  },
];

const NOTE = "MVA-fritt (Privat frilansfaktura) · Timesats 890 kr/t";

function buildWidget(size) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#111111");
  w.setPadding(12, 14, 12, 14);

  const hdr = w.addText("Nettside-pakker");
  hdr.textColor = new Color("#e2e8f0");
  hdr.font = Font.boldSystemFont(14);
  w.addSpacer(6);

  const items = size === "large" ? PAKKER : PAKKER.slice(0, 3);

  for (const p of items) {
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

    // Features (første to)
    const shown = p.features.slice(0, size === "large" ? p.features.length : 1);
    for (const f of shown) {
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

// Kjør og presenter
const size = config.widgetFamily || "medium";
const widget = buildWidget(size);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else if (size === "large") {
  widget.presentLarge();
} else {
  widget.presentMedium();
}
Script.complete();
