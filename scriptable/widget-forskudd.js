// widget-forskudd.js — Small widget, Home Screen
// Viser antall ubetalte forskudd for Scenario A/B-kunder.
// Grønn hake = 0 ubetalte. Rødt tall = antall ubetalte.
//
// Oppsett (kjør én gang i Scriptable):
//   Keychain.set("sb_url",  "https://<din-prosjekt>.supabase.co")
//   Keychain.set("sb_anon", "<din-anon-nøkkel>")

const BASE_URL = Keychain.get("sb_url");
const ANON_KEY = Keychain.get("sb_anon");

async function fetchUnpaidCount() {
  const url =
    BASE_URL +
    "/rest/v1/business_customers" +
    "?select=id,deposit_paid,business_model" +
    "&business_model=in.(A,B)" +
    "&status=eq.Aktiv";

  const req = new Request(url);
  req.headers = {
    apikey: ANON_KEY,
    Authorization: "Bearer " + ANON_KEY,
  };

  const data = await req.loadJSON();
  return Array.isArray(data)
    ? data.filter((r) => r.deposit_paid === false).length
    : null;
}

async function buildWidget(unpaid) {
  const w = new ListWidget();
  w.backgroundColor = new Color("#1a1a1a");
  w.url = BASE_URL.replace(".supabase.co", "") + "/business.html"; // best-effort

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

const unpaid = await fetchUnpaidCount();
const widget = await buildWidget(unpaid);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}
Script.complete();
