// Widget Viktige gjøremål — Scriptable (Medium)
// =================================================================
// Viser kun gjøremål merket viktig (★), sortert etter frist.
// Tap på widgeten åpner scriptet "Legg til gjøremål".
// TOKEN/BASE kopiert fra "Filip Dashboard.js" (kun lese).
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
// Tap → kjør "Legg til gjøremål"-scriptet (må hete nøyaktig dette i Scriptable).
const ADD_LINK = `scriptable:///run/${encodeURIComponent("Legg til gjøremål")}`;

const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");
const YELLOW = new Color("#eab308"), RED = new Color("#ef4444");
const GOLD = new Color("#fbbf24"), ACCENT = new Color("#38bdf8");

function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function dueLabel(iso){
  if(!iso) return "";
  const d = new Date(iso+"T00:00:00"); const now = new Date(); now.setHours(0,0,0,0);
  const diff = Math.round((d-now)/86400000);
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
  const req = new Request(API); req.timeoutInterval = 12;
  return await req.loadJSON();
}

function errWidget(msg){
  const w = new ListWidget(); w.backgroundColor = BG1;
  const t = w.addText("Gjøremål utilgjengelig"); t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

function build(data){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,12,15);
  w.url = ADD_LINK;

  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("★ Viktige gjøremål"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  const plus = head.addText("＋"); plus.textColor=ACCENT; plus.font=Font.boldSystemFont(15);
  w.addSpacer(8);

  // Kun viktige, allerede sortert etter frist fra API.
  const todos = (data.todos || []).filter(t => t.important).slice(0,5);
  if(todos.length === 0){
    const e = w.addText("Ingen viktige gjøremål 🎉"); e.textColor=DIM; e.font=Font.systemFont(12);
    w.addSpacer();
  } else {
    for(const td of todos){
      const row = w.addStack(); row.centerAlignContent();
      const dot = row.addText("★ "); dot.textColor=GOLD; dot.font=Font.systemFont(12);
      const name = row.addText(td.title); name.textColor=FG; name.font=Font.systemFont(12); name.lineLimit=1;
      row.addSpacer();
      const due = row.addText(dueLabel(td.due_date)); due.textColor=dueColor(td.due_date); due.font=Font.mediumSystemFont(11);
      w.addSpacer(7);
    }
    w.addSpacer();
  }

  const foot = w.addStack(); foot.centerAlignContent();
  const fu = foot.addText(`Oppdatert ${hhmm(new Date())}`); fu.textColor=DIM; fu.font=Font.systemFont(9);
  foot.addSpacer();
  const fl = foot.addText("Trykk for å legge til →"); fl.textColor=ACCENT; fl.font=Font.systemFont(9);
  return w;
}

async function main(){
  let data;
  try { data = await getData(); } catch(e){ return errWidget("Nettverksfeil"); }
  if(!data || data.error) return errWidget(data && data.error ? data.error : "Ukjent feil");
  return build(data);
}

const widget = await main();
if(config.runsInWidget){ Script.setWidget(widget); }
else { await widget.presentMedium(); }
Script.complete();
