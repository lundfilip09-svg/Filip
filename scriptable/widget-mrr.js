// widget-mrr.js — Medium widget, Home Screen
// Viser MRR (sum av price for aktive Scenario C-kunder) + liste per kunde.
//
// Henter data via /api/widget (samme proxy som de andre widgetene) —
// bruker service_role server-side, så anon-nøkkelen trengs ikke og RLS
// (som stenger anon ute på business_customers) er ikke et problem her.

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;

async function fetchMrrData() {
  const req = new Request(API);
  req.timeoutInterval = 12;
  const data = await req.loadJSON();
  if (!data || data.error || !data.business) return null;
  return { mrr: data.business.mrr, subscriptions: data.business.subscriptions || [] };
}

function tierLabel(tier) {
  if (tier === "Lav") return "Lav";
  if (tier === "Medium") return "Med";
  if (tier === "Høy") return "Høy";
  return tier || "—";
}

function buildWidget(result) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#1a1a1a");
  w.setPadding(12, 14, 12, 14);
  w.url = `${BASE}/business.html`;

  if (!result) {
    const err = w.addText("⚠️ Feil ved henting");
    err.textColor = Color.red();
    err.font = Font.boldSystemFont(13);
    return w;
  }

  const { mrr, subscriptions } = result;

  // Header
  const hdr = w.addText("MRR");
  hdr.textColor = new Color("#888888");
  hdr.font = Font.mediumSystemFont(10);

  const mrrTxt = w.addText(mrr.toLocaleString("nb-NO") + " kr");
  mrrTxt.textColor = new Color("#e2e8f0");
  mrrTxt.font = Font.boldSystemFont(26);
  mrrTxt.minimumScaleFactor = 0.7;

  w.addSpacer(8);

  const divider = w.addText("─────────────────");
  divider.textColor = new Color("#333333");
  divider.font = Font.systemFont(8);

  w.addSpacer(4);

  if (subscriptions.length === 0) {
    const none = w.addText("Ingen aktive abonnementer");
    none.textColor = new Color("#666666");
    none.font = Font.systemFont(11);
  } else {
    for (const c of subscriptions) {
      const stack = w.addStack();
      stack.layoutHorizontally();
      stack.spacing = 4;

      const nameTxt = stack.addText(c.name || "—");
      nameTxt.textColor = new Color("#cbd5e1");
      nameTxt.font = Font.systemFont(11);
      nameTxt.lineLimit = 1;
      stack.addSpacer();

      const tierTxt = stack.addText(tierLabel(c.tier));
      tierTxt.textColor = new Color("#64748b");
      tierTxt.font = Font.systemFont(10);

      stack.addSpacer(4);

      const priceTxt = stack.addText(Number(c.price).toLocaleString("nb-NO") + " kr");
      priceTxt.textColor = new Color("#94a3b8");
      priceTxt.font = Font.mediumSystemFont(11);

      w.addSpacer(2);
    }
  }

  return w;
}

let result;
try {
  result = await fetchMrrData();
} catch (e) {
  result = null;
}
const widget = buildWidget(result);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();
