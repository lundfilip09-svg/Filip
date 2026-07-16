// widget-forskudd.js — Small widget, Home Screen
// Viser antall ubetalte forskudd for Scenario A/B-kunder.
// Grønn hake = 0 ubetalte. Rødt tall = antall ubetalte.
//
// Henter data via /api/widget (samme proxy som de andre widgetene) —
// bruker service_role server-side, så anon-nøkkelen trengs ikke og RLS
// (som stenger anon ute på business_customers) er ikke et problem her.

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;

async function fetchUnpaidCount() {
  const req = new Request(API);
  req.timeoutInterval = 12;
  const data = await req.loadJSON();
  if (!data || data.error || !data.business) return null;
  return data.business.unpaid_deposits;
}

function buildWidget(unpaid) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#1a1a1a");
  w.url = `${BASE}/business.html`;

  if (unpaid === null) {
    const err = w.addText("⚠️ Feil");
    err.textColor = Color.red();
    err.font = Font.boldSystemFont(14);
    return w;
  }

  const titleTxt = w.addText("Forskudd");
  titleTxt.textColor = new Color("#888888");
  titleTxt.font = Font.mediumSystemFont(11);
  w.addSpacer(6);

  if (unpaid === 0) {
    const icon = w.addText("✓");
    icon.textColor = new Color("#4ade80");
    icon.font = Font.boldSystemFont(36);
    w.addSpacer(4);
    const sub = w.addText("Alle betalt");
    sub.textColor = new Color("#4ade80");
    sub.font = Font.mediumSystemFont(11);
  } else {
    const num = w.addText(String(unpaid));
    num.textColor = new Color("#f26d6d");
    num.font = Font.boldSystemFont(44);
    w.addSpacer(2);
    const sub = w.addText(unpaid === 1 ? "ubetalt" : "ubetalte");
    sub.textColor = new Color("#f26d6d");
    sub.font = Font.mediumSystemFont(11);
  }

  return w;
}

let unpaid;
try {
  unpaid = await fetchUnpaidCount();
} catch (e) {
  unpaid = null;
}
const widget = buildWidget(unpaid);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();
