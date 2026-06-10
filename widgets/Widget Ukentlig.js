// Widget Ukentlig — Scriptable (Small + Medium)
// =================================================================
// Viser siste ukesrapport (weekly_summaries, norsk tekst).
//   Medium: dato + oppsummering
//   Small:  dato + første 2 setninger
// TOKEN/BASE kopiert fra "Filip Dashboard.js" (kun lese).
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
const DEEPLINK = `${BASE}/ai.html`;

const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8"), ACCENT = new Color("#38bdf8");

const MONTHS = ["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"];
function fmtWeek(iso){
  if(!iso) return "–";
  const d = new Date(iso+"T00:00:00");
  return `Uke fra ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}
// Fjern markdown (**fet**, #, -, ===EN===-rester) for ren widget-tekst.
function stripMd(s){
  if(!s) return "";
  return s
    .replace(/===EN===[\s\S]*$/i, "")     // kutt evt. engelsk hale
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function firstSentences(s, n){
  const clean = stripMd(s).replace(/\n+/g, " ");
  const parts = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  return parts.slice(0, n).join(" ").trim();
}

async function getData(){
  const req = new Request(API); req.timeoutInterval = 12;
  return await req.loadJSON();
}

function errWidget(msg){
  const w = new ListWidget(); w.backgroundColor = BG1;
  const t = w.addText("Ukesrapport utilgjengelig"); t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

function noData(w, family){
  const e = w.addText("Ingen ukesrapport ennå."); e.textColor=DIM; e.font=Font.systemFont(family==="small"?11:13);
  w.addSpacer();
  return w;
}

function buildSmall(ws){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,13,13,13); w.url = DEEPLINK;
  const lbl = w.addText("📋 UKEN"); lbl.textColor=ACCENT; lbl.font=Font.boldSystemFont(11);
  w.addSpacer(2);
  if(!ws) return noData(w, "small");
  const dt = w.addText(fmtWeek(ws.week_start)); dt.textColor=DIM; dt.font=Font.systemFont(9);
  w.addSpacer(6);
  const body = w.addText(firstSentences(ws.summary_no, 2)); body.textColor=FG; body.font=Font.systemFont(11); body.minimumScaleFactor=0.7;
  w.addSpacer();
  return w;
}

function buildMedium(ws){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,12,15); w.url = DEEPLINK;
  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("📋 Ukesrapport"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  if(ws){ const dt = head.addText(fmtWeek(ws.week_start)); dt.textColor=DIM; dt.font=Font.systemFont(10); }
  w.addSpacer(8);
  if(!ws) return noData(w, "medium");
  let txt = stripMd(ws.summary_no);
  if(txt.length > 320) txt = txt.slice(0, 317).trimEnd() + "…";
  const body = w.addText(txt); body.textColor=FG; body.font=Font.systemFont(11); body.minimumScaleFactor=0.65;
  w.addSpacer();
  const foot = w.addText("Åpne AI-chat →"); foot.textColor=ACCENT; foot.font=Font.systemFont(9);
  return w;
}

async function build(){
  let data;
  try { data = await getData(); } catch(e){ return errWidget("Nettverksfeil"); }
  if(!data || data.error) return errWidget(data && data.error ? data.error : "Ukjent feil");
  const ws = data.weekly_summary || null;
  return config.widgetFamily === "small" ? buildSmall(ws) : buildMedium(ws);
}

const widget = await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily === "small"){ await widget.presentSmall(); }
else { await widget.presentMedium(); }
Script.complete();
