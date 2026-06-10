// Filip Dashboard — Scriptable widget (Medium + Small)
// =================================================================
// OPPSETT (gjør én gang):
//   1. Installer "Scriptable" fra App Store.
//   2. Åpne Scriptable → trykk + → lim inn HELE denne filen.
//   3. Fyll inn TOKEN under (samme verdi som CRON_SECRET i Vercel).
//   4. Legg widget på hjemmeskjerm: hold inne → + → Scriptable →
//      Medium ELLER Small. Trykk på widgeten → "Edit Widget" → velg
//      dette scriptet. Begge størrelser bruker samme script.
//
// SIKKERHET: TOKEN her gir KUN lesetilgang via proxyen (api/widget.js).
//   Den gir ikke skrivetilgang og avslører ikke service_role-nøkkelen.
//   OBS: tokenet er CRON_SECRET, som også brukes av Vercel-cron. Roterer du
//   det, må du oppdatere både denne fila, Mac-widgeten og cron-oppsettet.
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
const DEEPLINK = `${BASE}/ai.html`; // Tap åpner AI-chat

// ---- Farger ----
const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");
const GREEN = new Color("#22c55e"), YELLOW = new Color("#eab308"), RED = new Color("#ef4444");
const ACCENT = new Color("#38bdf8"), GOLD = new Color("#fbbf24");
const CHIPBG = new Color("#ffffff", 0.08);
const SEP = new Color("#ffffff", 0.10);

function sleepColor(s){ if(s==null) return DIM; return s>=80?GREEN:s>=60?YELLOW:RED; }
function kneeColor(p){ if(p==null) return DIM; return p<=2?GREEN:p<=5?YELLOW:RED; }

// Verste (høyeste) kne-verdi på tvers av de fire feltene.
function worstKnee(k){
  if(!k) return null;
  const vals = [k.before, k.during, k.after, k.day_after].filter(v => v!=null);
  return vals.length ? Math.max(...vals) : null;
}

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
function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }

async function getData(){
  const req = new Request(API);
  req.timeoutInterval = 12;
  return await req.loadJSON();
}

// ---- Gjenbrukbare bygge-elementer ----

// Liten "chip": grå label + farget verdi i avrundet boks.
function addChip(parent, label, value, color){
  const c = parent.addStack();
  c.backgroundColor = CHIPBG;
  c.cornerRadius = 6;
  c.setPadding(2, 7, 2, 7);
  c.centerAlignContent();
  const l = c.addText(`${label} `); l.textColor = DIM; l.font = Font.systemFont(9);
  const v = c.addText(value==null ? "–" : `${value}`); v.textColor = color||FG; v.font = Font.boldSystemFont(10);
  return c;
}

// Én kne-celle: liten grå label over farget tall.
function addKneeCell(parent, label, v){
  const cell = parent.addStack(); cell.layoutVertically(); cell.centerAlignContent();
  const l = cell.addText(label); l.textColor=DIM; l.font=Font.systemFont(8); l.centerAlignText();
  const n = cell.addText(v!=null?`${v}`:"–"); n.textColor=kneeColor(v); n.font=Font.boldSystemFont(16); n.centerAlignText();
  return cell;
}

// Tynn horisontal skillelinje.
function addSeparator(parent, w){
  const line = parent.addStack();
  line.backgroundColor = SEP;
  line.size = new Size(w, 1);
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

// =================================================================
// MEDIUM
// =================================================================
function buildMedium(data){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,11,15);
  w.url = DEEPLINK;

  // Header
  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("⚡ Dashboard"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  const ts = head.addText(hhmm(new Date())); ts.textColor=DIM; ts.font=Font.systemFont(10);
  w.addSpacer(9);

  const body = w.addStack(); body.topAlignContent();

  // --- Venstre: søvn + kne ---
  const left = body.addStack(); left.layoutVertically();

  const s = data.sleep;
  const sLbl = left.addText("SØVN"); sLbl.textColor=DIM; sLbl.font=Font.mediumSystemFont(9);
  left.addSpacer(2);
  const sRow = left.addStack(); sRow.bottomAlignContent();
  const sNum = sRow.addText(s && s.score!=null ? `${s.score}` : "–");
  sNum.textColor = sleepColor(s && s.score); sNum.font = Font.boldSystemFont(34);
  if(s && s.hours!=null){ sRow.addSpacer(5); const h=sRow.addText(`${s.hours}t`); h.textColor=DIM; h.font=Font.systemFont(12); }
  // HRV / RHR chips
  left.addSpacer(5);
  const chips = left.addStack(); chips.centerAlignContent();
  addChip(chips, "HRV", s ? s.hrv : null, FG);
  chips.addSpacer(5);
  addChip(chips, "RHR", s ? s.rhr : null, FG);

  left.addSpacer(9);
  addSeparator(left, 130);
  left.addSpacer(9);

  const k = data.knee;
  const kHead = left.addStack(); kHead.centerAlignContent();
  const kLbl = kHead.addText("KNE"); kLbl.textColor=DIM; kLbl.font=Font.mediumSystemFont(9);
  if(k && k.session_type){ kHead.addSpacer(5); const stp=kHead.addText(k.session_type); stp.textColor=DIM; stp.font=Font.systemFont(9); stp.lineLimit=1; }
  left.addSpacer(4);
  // Fire verdier som rad
  const kRow = left.addStack(); kRow.centerAlignContent();
  addKneeCell(kRow, "før", k ? k.before : null); kRow.addSpacer(10);
  addKneeCell(kRow, "under", k ? k.during : null); kRow.addSpacer(10);
  addKneeCell(kRow, "etter", k ? k.after : null); kRow.addSpacer(10);
  addKneeCell(kRow, "d+1", k ? k.day_after : null);

  body.addSpacer(16);

  // --- Høyre: gjøremål ---
  const right = body.addStack(); right.layoutVertically();
  const tLbl = right.addText("GJØREMÅL"); tLbl.textColor=DIM; tLbl.font=Font.mediumSystemFont(9);
  right.addSpacer(4);
  const todos = (data.todos||[]).slice(0,4);
  if(todos.length===0){ const e=right.addText("Ingenting med frist 🎉"); e.textColor=DIM; e.font=Font.systemFont(11); }
  for(const td of todos){
    if(td.list_name){
      const ln = right.addText(td.list_name.toUpperCase());
      ln.textColor=DIM; ln.font=Font.mediumSystemFont(8); ln.lineLimit=1;
    }
    const row = right.addStack(); row.centerAlignContent();
    const dot = row.addText(td.important ? "★ " : "• ");
    dot.textColor = td.important ? GOLD : ACCENT; dot.font=Font.systemFont(11);
    const name = row.addText(td.title); name.textColor=FG; name.font=Font.systemFont(11); name.lineLimit=1;
    row.addSpacer();
    const due = row.addText(dueLabel(td.due_date)); due.textColor=dueColor(td.due_date); due.font=Font.mediumSystemFont(10);
    right.addSpacer(6);
  }

  w.addSpacer();
  const foot = w.addStack(); foot.centerAlignContent();
  const fu = foot.addText(`Oppdatert ${hhmm(new Date())}`); fu.textColor=DIM; fu.font=Font.systemFont(9);
  foot.addSpacer();
  const fl = foot.addText("AI-chat →"); fl.textColor=ACCENT; fl.font=Font.systemFont(9);
  return w;
}

// =================================================================
// SMALL — søvnscore + verste kne + antall gjøremål
// =================================================================
function buildSmall(data){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,14,13,14);
  w.url = DEEPLINK;

  const s = data.sleep;
  const sLbl = w.addText("SØVN"); sLbl.textColor=DIM; sLbl.font=Font.mediumSystemFont(9);
  const sNum = w.addText(s && s.score!=null ? `${s.score}` : "–");
  sNum.textColor = sleepColor(s && s.score); sNum.font = Font.boldSystemFont(42);

  w.addSpacer(8);

  const worst = worstKnee(data.knee);
  const kRow = w.addStack(); kRow.centerAlignContent();
  const kIcon = kRow.addText("🦵 "); kIcon.font=Font.systemFont(13);
  const kNum = kRow.addText(worst!=null ? `${worst}/10` : "–");
  kNum.textColor = kneeColor(worst); kNum.font=Font.boldSystemFont(15);
  const kc = kRow.addText("  verste"); kc.textColor=DIM; kc.font=Font.systemFont(9);

  w.addSpacer(4);

  const n = (data.todos||[]).length;
  const tRow = w.addStack(); tRow.centerAlignContent();
  const tIcon = tRow.addText("📋 "); tIcon.font=Font.systemFont(13);
  const tNum = tRow.addText(`${n}`); tNum.textColor=FG; tNum.font=Font.boldSystemFont(15);
  const tc = tRow.addText(n===1 ? "  gjøremål" : "  gjøremål"); tc.textColor=DIM; tc.font=Font.systemFont(9);

  w.addSpacer();
  const foot = w.addText(`Oppdatert ${hhmm(new Date())}`); foot.textColor=DIM; foot.font=Font.systemFont(8);
  return w;
}

async function build(){
  let data;
  try { data = await getData(); } catch(e){ return errWidget("Nettverksfeil"); }
  if(!data || data.error) return errWidget(data && data.error ? data.error : "Ukjent feil");
  return config.widgetFamily === "small" ? buildSmall(data) : buildMedium(data);
}

const widget = await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily === "small"){ await widget.presentSmall(); }
else { await widget.presentMedium(); }
Script.complete();
