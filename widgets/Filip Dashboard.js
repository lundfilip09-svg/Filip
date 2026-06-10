// Filip Dashboard — Scriptable medium-widget
// =================================================================
// OPPSETT (gjør én gang):
//   1. Installer "Scriptable" fra App Store.
//   2. Åpne Scriptable → trykk + → lim inn HELE denne filen.
//   3. Fyll inn TOKEN under (samme verdi som CRON_SECRET i Vercel).
//   4. Legg widget på hjemmeskjerm: hold inne → + → Scriptable → Medium.
//      Trykk på widgeten → "Edit Widget" → velg dette scriptet.
//
// SIKKERHET: TOKEN her gir KUN lesetilgang via proxyen (api/widget.js).
//   Den gir ikke skrivetilgang og avslører ikke service_role-nøkkelen.
//   OBS: tokenet er CRON_SECRET, som også brukes av Vercel-cron. Roterer du
//   det, må du oppdatere både denne fila, Mac-widgeten og cron-oppsettet.
// =================================================================

const BASE  = "https://filip-dashboard.vercel.app";
const TOKEN = "LIM_INN_CRON_SECRET_HER";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
const DEEPLINK = `${BASE}/ai.html`; // Tap åpner AI-chat

// ---- Farger ----
const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");
const GREEN = new Color("#22c55e"), YELLOW = new Color("#eab308"), RED = new Color("#ef4444");
const ACCENT = new Color("#38bdf8");

function sleepColor(s){ if(s==null) return DIM; return s>=80?GREEN:s>=60?YELLOW:RED; }
function kneeColor(p){ if(p==null) return DIM; return p<=2?GREEN:p<=5?YELLOW:RED; }

function dueLabel(iso){
  if(!iso) return "";
  const d = new Date(iso+"T00:00:00");
  const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d - now)/86400000);
  if(diff < 0)  return `for ${-diff}d siden`;
  if(diff === 0) return "i dag";
  if(diff === 1) return "i morgen";
  if(diff <= 6)  return `${diff}d`;
  return `${d.getDate()}.${d.getMonth()+1}.`;
}
function dueColor(iso){
  if(!iso) return DIM;
  const d = new Date(iso+"T00:00:00"); const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d-now)/86400000);
  return diff < 0 ? RED : diff <= 1 ? YELLOW : DIM;
}

async function getData(){
  const req = new Request(API);
  req.timeoutInterval = 12;
  return await req.loadJSON();
}

function errWidget(msg){
  const w = new ListWidget();
  w.backgroundColor = BG1;
  const t = w.addText("Dashboard utilgjengelig");
  t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

async function build(){
  let data;
  try { data = await getData(); } catch(e){ return errWidget("Nettverksfeil"); }
  if(!data || data.error) return errWidget(data && data.error ? data.error : "Ukjent feil");

  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(12,14,12,14);
  w.url = DEEPLINK;

  // Header
  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("⚡ Dashboard"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  const now = new Date();
  const ts = head.addText(`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`);
  ts.textColor=DIM; ts.font=Font.systemFont(10);
  w.addSpacer(8);

  // Body: to kolonner
  const body = w.addStack(); body.topAlignContent();

  // --- Venstre: søvn + kne ---
  const left = body.addStack(); left.layoutVertically();

  const s = data.sleep;
  const sLbl = left.addText("SØVN"); sLbl.textColor=DIM; sLbl.font=Font.mediumSystemFont(9);
  const sStack = left.addStack(); sStack.bottomAlignContent();
  const sNum = sStack.addText(s && s.score!=null ? `${s.score}` : "–");
  sNum.textColor = sleepColor(s && s.score); sNum.font = Font.boldSystemFont(30);
  if(s && s.hours!=null){ sStack.addSpacer(4); const h=sStack.addText(`${s.hours}t`); h.textColor=DIM; h.font=Font.systemFont(11); }
  left.addSpacer(10);

  const k = data.knee;
  const kLbl = left.addText("KNE (under økt)"); kLbl.textColor=DIM; kLbl.font=Font.mediumSystemFont(9);
  const kStack = left.addStack(); kStack.bottomAlignContent();
  const kVal = (k && k.during!=null) ? k.during : (k && k.after!=null ? k.after : null);
  const kNum = kStack.addText(kVal!=null ? `${kVal}` : "–");
  kNum.textColor = kneeColor(kVal); kNum.font = Font.boldSystemFont(26);
  const kMax = kStack.addText("/10"); kMax.textColor=DIM; kMax.font=Font.systemFont(11);
  if(k && k.session_type){ kStack.addSpacer(4); const stp=kStack.addText(k.session_type); stp.textColor=DIM; stp.font=Font.systemFont(9); stp.lineLimit=1; }

  body.addSpacer(14);

  // --- Høyre: gjøremål ---
  const right = body.addStack(); right.layoutVertically();
  const tLbl = right.addText("GJØREMÅL"); tLbl.textColor=DIM; tLbl.font=Font.mediumSystemFont(9);
  right.addSpacer(3);
  const todos = (data.todos||[]).slice(0,4);
  if(todos.length===0){ const e=right.addText("Ingenting med frist 🎉"); e.textColor=DIM; e.font=Font.systemFont(11); }
  for(const td of todos){
    const row = right.addStack(); row.centerAlignContent();
    const dot = row.addText(td.important ? "★ " : "• ");
    dot.textColor = td.important ? YELLOW : ACCENT; dot.font=Font.systemFont(11);
    const name = row.addText(td.title); name.textColor=FG; name.font=Font.systemFont(11); name.lineLimit=1;
    row.addSpacer();
    const due = row.addText(dueLabel(td.due_date)); due.textColor=dueColor(td.due_date); due.font=Font.mediumSystemFont(10);
    right.addSpacer(2);
  }

  w.addSpacer();
  const foot = w.addText("Tap for å åpne AI-chat →");
  foot.textColor = ACCENT; foot.font = Font.systemFont(9); foot.centerAlignText();
  return w;
}

const widget = await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else { await widget.presentMedium(); }
Script.complete();
