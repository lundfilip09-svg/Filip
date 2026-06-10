// Widget Søvn — Scriptable (Small + Medium + Large)
// =================================================================
// OPPSETT: Scriptable → + → lim inn → legg widget på hjemmeskjerm,
// velg dette scriptet. Samme script for alle tre størrelser.
// TOKEN/BASE er kopiert fra "Filip Dashboard.js" (CRON_SECRET, kun lese).
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
const DEEPLINK = `${BASE}/sovn.html`;

// ---- Farger ----
const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");
const GREEN = new Color("#22c55e"), YELLOW = new Color("#eab308"), RED = new Color("#ef4444");
// Fase-farger
const C_DEEP = new Color("#1e3a8a");   // dyp = mørkeblå
const C_REM  = new Color("#8b5cf6");   // REM = lilla
const C_LIGHT= new Color("#38bdf8");   // lett = lyseblå
const C_AWAKE= new Color("#64748b");   // våken = grå
const CHIPBG = new Color("#ffffff", 0.08);
const SEP = new Color("#ffffff", 0.10);

function sleepColor(s){ if(s==null) return DIM; return s>=80?GREEN:s>=60?YELLOW:RED; }
function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
// "Xt Ym" fra timer (decimal).
function hoursLabel(h){
  if(h==null) return "–";
  const tot = Math.round(h*60);
  return `${Math.floor(tot/60)}t ${tot%60}m`;
}

async function getData(){
  const req = new Request(API);
  req.timeoutInterval = 12;
  return await req.loadJSON();
}

function addChip(parent, label, value, color){
  const c = parent.addStack();
  c.backgroundColor = CHIPBG; c.cornerRadius = 6; c.setPadding(2,7,2,7); c.centerAlignContent();
  const l = c.addText(`${label} `); l.textColor = DIM; l.font = Font.systemFont(9);
  const v = c.addText(value==null ? "–" : `${value}`); v.textColor = color||FG; v.font = Font.boldSystemFont(10);
  return c;
}

function errWidget(msg){
  const w = new ListWidget(); w.backgroundColor = BG1;
  const t = w.addText("Søvn utilgjengelig"); t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

// Fargekodet fasestripe. Bredde w, høyde h. Segmenter proporsjonalt med minutter.
function addPhaseBar(parent, s, w, h){
  const phases = [
    { m: s.deep_sleep_minutes,  c: C_DEEP  },
    { m: s.rem_sleep_minutes,   c: C_REM   },
    { m: s.light_sleep_minutes, c: C_LIGHT },
    { m: s.awake_minutes,       c: C_AWAKE },
  ].filter(p => p.m != null && p.m > 0);
  const total = phases.reduce((a,p)=>a+p.m, 0);
  const bar = parent.addStack(); bar.size = new Size(w, h); bar.cornerRadius = 4;
  if(total <= 0){ bar.backgroundColor = CHIPBG; return; }
  for(const p of phases){
    const seg = bar.addStack();
    seg.backgroundColor = p.c;
    seg.size = new Size(Math.max(1, Math.round(w * p.m / total)), h);
  }
}

// Formaterer minutter som "Xt Ym" hvis >= 60, ellers "Ym".
function minsLabel(mins){
  if(mins==null) return "–";
  if(mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}t ${mins%60}m`;
}

// Liten legende-rad: farget prikk + minutter.
function addLegend(parent, label, mins, color){
  const row = parent.addStack(); row.centerAlignContent();
  const dot = row.addStack(); dot.backgroundColor = color; dot.size = new Size(8,8); dot.cornerRadius = 4;
  row.addSpacer(4);
  const l = row.addText(`${label} `); l.textColor = DIM; l.font = Font.systemFont(9);
  const v = row.addText(minsLabel(mins)); v.textColor = FG; v.font = Font.mediumSystemFont(9);
}

// 7-dagers søvnscore som mini-stolpediagram (DrawContext). last7 = nyeste først.
function drawWeekBars(last7){
  const W = 300, H = 76, pad = 4, labelH = 12;
  const days = last7.slice(0,7).reverse(); // eldst til venstre
  const ctx = new DrawContext();
  ctx.size = new Size(W, H); ctx.opaque = false; ctx.respectScreenScale = true;
  const n = Math.max(days.length, 1);
  const gap = 8;
  const bw = (W - pad*2 - gap*(n-1)) / n;
  const maxBarH = H - labelH - 6;
  const hexColor = (s)=> s==null ? "#475569" : s>=80 ? "#22c55e" : s>=60 ? "#eab308" : "#ef4444";
  days.forEach((d, i) => {
    const score = d.sleep_score;
    const x = pad + i*(bw+gap);
    const bh = score!=null ? Math.max(3, Math.round(maxBarH * Math.min(score,100)/100)) : 3;
    const y = (H - labelH) - bh;
    ctx.setFillColor(new Color(hexColor(score)));
    const r = new Rect(x, y, bw, bh);
    ctx.fillRect(r);
    // score-tall over stolpen
    if(score!=null){
      ctx.setFont(Font.boldSystemFont(9));
      ctx.setTextColor(new Color("#f1f5f9"));
      ctx.setTextAlignedCenter();
      ctx.drawTextInRect(`${score}`, new Rect(x-4, y-12, bw+8, 11));
    }
    // ukedagsbokstav
    const dt = new Date(d.date+"T00:00:00");
    const wd = ["S","M","T","O","T","F","L"][dt.getDay()];
    ctx.setFont(Font.systemFont(9));
    ctx.setTextColor(new Color("#94a3b8"));
    ctx.setTextAlignedCenter();
    ctx.drawTextInRect(wd, new Rect(x-4, H-labelH, bw+8, labelH));
  });
  return ctx.getImage();
}

function header(w, title){
  const head = w.addStack(); head.centerAlignContent();
  const t = head.addText(title); t.textColor=FG; t.font=Font.boldSystemFont(13);
  head.addSpacer();
  const ts = head.addText(hhmm(new Date())); ts.textColor=DIM; ts.font=Font.systemFont(10);
}

// =================================================================
// SMALL — score stor + "Xt Ym · HRV Z"
// =================================================================
function buildSmall(s){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,14,14,14); w.url = DEEPLINK;

  const lbl = w.addText("SØVN"); lbl.textColor=DIM; lbl.font=Font.mediumSystemFont(9);
  const num = w.addText(s && s.score!=null ? `${s.score}` : "–");
  num.textColor = sleepColor(s && s.score); num.font = Font.boldSystemFont(46);
  w.addSpacer(6);
  const line = `${hoursLabel(s && s.hours)} · HRV ${s && s.hrv!=null ? s.hrv : "–"}`;
  const ln = w.addText(line); ln.textColor=FG; ln.font=Font.systemFont(12);
  w.addSpacer();
  const foot = w.addText(`Oppdatert ${hhmm(new Date())}`); foot.textColor=DIM; foot.font=Font.systemFont(8);
  return w;
}

// =================================================================
// MEDIUM — score + fasestripe + søvntid + HRV/RHR
// =================================================================
function buildMedium(s){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,12,15); w.url = DEEPLINK;
  header(w, "💤 Søvn");
  w.addSpacer(8);

  const body = w.addStack(); body.centerAlignContent();
  // venstre: score + timer
  const left = body.addStack(); left.layoutVertically();
  const num = left.addText(s && s.score!=null ? `${s.score}` : "–");
  num.textColor = sleepColor(s && s.score); num.font = Font.boldSystemFont(40);
  const hl = left.addText(hoursLabel(s && s.hours)); hl.textColor=DIM; hl.font=Font.systemFont(12);
  body.addSpacer(14);
  // høyre: stripe + søvntid + chips
  const right = body.addStack(); right.layoutVertically();
  if(s) addPhaseBar(right, s, 200, 14);
  right.addSpacer(6);
  if(s && (s.sleep_start || s.sleep_end)){
    const tr = right.addText(`${s.sleep_start || "–"} → ${s.sleep_end || "–"}`);
    tr.textColor=FG; tr.font=Font.mediumSystemFont(11);
  }
  right.addSpacer(6);
  const chips = right.addStack(); chips.centerAlignContent();
  addChip(chips, "HRV", s ? s.hrv : null, FG); chips.addSpacer(5);
  addChip(chips, "RHR", s ? s.rhr : null, FG);

  w.addSpacer(8);
  const lg = w.addStack(); lg.centerAlignContent();
  if(s){
    addLegend(lg, "Dyp", s.deep_sleep_minutes, C_DEEP);  lg.addSpacer(8);
    addLegend(lg, "REM", s.rem_sleep_minutes, C_REM);    lg.addSpacer(8);
    addLegend(lg, "Lett", s.light_sleep_minutes, C_LIGHT); lg.addSpacer(8);
    addLegend(lg, "Våken", s.awake_minutes, C_AWAKE);
  }
  return w;
}

// =================================================================
// LARGE — medium + 7-dagers søvnscore-stolper
// =================================================================
function buildLarge(data){
  const s = data.sleep;
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(15,16,14,16); w.url = DEEPLINK;
  header(w, "💤 Søvn");
  w.addSpacer(10);

  const body = w.addStack(); body.centerAlignContent();
  const left = body.addStack(); left.layoutVertically();
  const num = left.addText(s && s.score!=null ? `${s.score}` : "–");
  num.textColor = sleepColor(s && s.score); num.font = Font.boldSystemFont(46);
  const hl = left.addText(hoursLabel(s && s.hours)); hl.textColor=DIM; hl.font=Font.systemFont(13);
  body.addSpacer(16);
  const right = body.addStack(); right.layoutVertically();
  if(s) addPhaseBar(right, s, 230, 16);
  right.addSpacer(6);
  if(s && (s.sleep_start || s.sleep_end)){
    const tr = right.addText(`${s.sleep_start || "–"} → ${s.sleep_end || "–"}`);
    tr.textColor=FG; tr.font=Font.mediumSystemFont(12);
  }
  right.addSpacer(6);
  const chips = right.addStack(); chips.centerAlignContent();
  addChip(chips, "HRV", s ? s.hrv : null, FG); chips.addSpacer(5);
  addChip(chips, "RHR", s ? s.rhr : null, FG);

  w.addSpacer(8);
  const lg = w.addStack(); lg.centerAlignContent();
  if(s){
    addLegend(lg, "Dyp", s.deep_sleep_minutes, C_DEEP);  lg.addSpacer(10);
    addLegend(lg, "REM", s.rem_sleep_minutes, C_REM);    lg.addSpacer(10);
    addLegend(lg, "Lett", s.light_sleep_minutes, C_LIGHT); lg.addSpacer(10);
    addLegend(lg, "Våken", s.awake_minutes, C_AWAKE);
  }

  w.addSpacer(10);
  const sep = w.addStack(); sep.backgroundColor=SEP; sep.size=new Size(300,1);
  w.addSpacer(8);
  const cap = w.addText("SISTE 7 NETTER"); cap.textColor=DIM; cap.font=Font.mediumSystemFont(9);
  w.addSpacer(6);
  const img = w.addImage(drawWeekBars(data.last7sleep || []));
  img.imageSize = new Size(300, 76);
  return w;
}

async function build(){
  let data;
  try { data = await getData(); } catch(e){ return errWidget("Nettverksfeil"); }
  if(!data || data.error) return errWidget(data && data.error ? data.error : "Ukjent feil");
  if(config.widgetFamily === "small") return buildSmall(data.sleep);
  if(config.widgetFamily === "large") return buildLarge(data);
  return buildMedium(data.sleep);
}

const widget = await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily === "small"){ await widget.presentSmall(); }
else if(config.widgetFamily === "large"){ await widget.presentLarge(); }
else { await widget.presentMedium(); }
Script.complete();
