// Widget Readiness — Scriptable (Small + Medium)
// =================================================================
// Daglig beredskap 0–100 fra søvn, kne og HRV.
//   worst_knee = max(før,under,etter,d+1) fra siste kne-logg
//   hrv_norm   = min(hrv/70*100, 100)
//   readiness  = sleep_score*0.4 + (10-worst_knee)*6 + hrv_norm*0.2
// (Vektsum 1.2 → teoretisk maks 120; klippes til 0–100.)
// TOKEN/BASE kopiert fra "Filip Dashboard.js" (kun lese).
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
const DEEPLINK = `${BASE}/dashboard.html`;

const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");
const GREEN = new Color("#22c55e"), YELLOW = new Color("#eab308"), RED = new Color("#ef4444");
const TRACK = new Color("#ffffff", 0.10);

function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }

// Returnerer {score, word, color, rec, parts:{sleep,knee,hrv}} eller null hvis
// søvnscore mangler (kan ikke beregne).
function computeReadiness(data){
  const s = data.sleep;
  if(!s || s.score == null) return null;
  const k = data.knee;
  const vals = k ? [k.before, k.during, k.after, k.day_after].filter(v => v!=null) : [];
  const worstKnee = vals.length ? Math.max(...vals) : 0; // ingen logg = ingen smerte
  const hrv = s.hrv;
  const hrvNorm = hrv != null ? Math.min(hrv/70*100, 100) : 0;

  const pSleep = s.score * 0.4;          // maks 40
  const pKnee  = (10 - worstKnee) * 6;   // maks 60
  const pHrv   = hrvNorm * 0.2;          // maks 20
  let score = Math.round(pSleep + pKnee + pHrv);
  score = Math.max(0, Math.min(100, score));

  let word, color, colorHex, rec;
  if(score > 75){ word = "KLAR";    color = GREEN;  colorHex = "#22c55e"; rec = "Tren hardt"; }
  else if(score >= 50){ word = "MODERAT"; color = YELLOW; colorHex = "#eab308"; rec = "Moderat økt"; }
  else { word = "HVIL"; color = RED; colorHex = "#ef4444"; rec = "Hvil"; }

  return {
    score, word, color, colorHex, rec,
    hrvMissing: hrv == null,
    parts: {
      sleep: { val: pSleep, max: 40 },
      knee:  { val: pKnee,  max: 60 },
      hrv:   { val: pHrv,   max: 20, missing: hrv == null },
    },
  };
}

async function getData(){
  const req = new Request(API); req.timeoutInterval = 12;
  return await req.loadJSON();
}

function errWidget(msg){
  const w = new ListWidget(); w.backgroundColor = BG1;
  const t = w.addText("Readiness utilgjengelig"); t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

// Horisontal komponent-stolpe: label + spor + fyll (val/max), med tall.
function addBar(parent, label, val, max, color, w){
  const row = parent.addStack(); row.centerAlignContent();
  const l = row.addStack(); l.size = new Size(46, 12);
  const lt = l.addText(label); lt.textColor=DIM; lt.font=Font.systemFont(10);
  const track = row.addStack(); track.backgroundColor=TRACK; track.size=new Size(w,10); track.cornerRadius=5;
  const fillW = Math.max(2, Math.round(w * Math.min(val/max,1)));
  const fill = track.addStack(); fill.backgroundColor=color; fill.size=new Size(fillW,10); fill.cornerRadius=5;
  row.addSpacer(6);
  const v = row.addText(`${Math.round(val)}`); v.textColor=FG; v.font=Font.mediumSystemFont(10);
}

// =================================================================
// SMALL — stor score + ett ord
// =================================================================
function buildSmall(r){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,14,14,14); w.url = DEEPLINK;

  const lbl = w.addText("BEREDSKAP"); lbl.textColor=DIM; lbl.font=Font.mediumSystemFont(9);
  if(!r){
    const num = w.addText("–"); num.textColor=DIM; num.font=Font.boldSystemFont(46);
    w.addSpacer();
    return w;
  }
  const num = w.addText(`${r.score}`); num.textColor=r.color; num.font=Font.boldSystemFont(50);
  w.addSpacer(2);
  const word = w.addText(r.word); word.textColor=r.color; word.font=Font.boldSystemFont(20);
  w.addSpacer();
  const foot = w.addText(`Oppdatert ${hhmm(new Date())}`); foot.textColor=DIM; foot.font=Font.systemFont(8);
  return w;
}

// =================================================================
// MEDIUM — score + tre bidrag (stolper) + anbefaling
// =================================================================
function buildMedium(r){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,12,15); w.url = DEEPLINK;

  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("🎯 Beredskap"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  const ts = head.addText(hhmm(new Date())); ts.textColor=DIM; ts.font=Font.systemFont(10);
  w.addSpacer(8);

  if(!r){
    const e = w.addText("Mangler søvndata for å beregne."); e.textColor=DIM; e.font=Font.systemFont(12);
    w.addSpacer();
    return w;
  }

  const body = w.addStack(); body.centerAlignContent();
  // venstre: stor score + ord
  const left = body.addStack(); left.layoutVertically();
  const num = left.addText(`${r.score}`); num.textColor=r.color; num.font=Font.boldSystemFont(44);
  const word = left.addText(r.word); word.textColor=r.color; word.font=Font.boldSystemFont(15);
  body.addSpacer(16);
  // høyre: tre stolper
  const right = body.addStack(); right.layoutVertically();
  const bw = 120;
  addBar(right, "Søvn", r.parts.sleep.val, r.parts.sleep.max, GREEN, bw); right.addSpacer(6);
  addBar(right, "Kne", r.parts.knee.val, r.parts.knee.max, YELLOW, bw); right.addSpacer(6);
  addBar(right, r.parts.hrv.missing ? "HRV –" : "HRV", r.parts.hrv.val, r.parts.hrv.max, new Color("#38bdf8"), bw);

  w.addSpacer(9);
  const recRow = w.addStack(); recRow.centerAlignContent();
  const chip = recRow.addStack(); chip.backgroundColor=new Color(r.colorHex, 0.18); chip.cornerRadius=6; chip.setPadding(3,8,3,8);
  const rt = chip.addText(r.rec); rt.textColor=r.color; rt.font=Font.boldSystemFont(12);
  return w;
}

async function build(){
  let data;
  try { data = await getData(); } catch(e){ return errWidget("Nettverksfeil"); }
  if(!data || data.error) return errWidget(data && data.error ? data.error : "Ukjent feil");
  const r = computeReadiness(data);
  return config.widgetFamily === "small" ? buildSmall(r) : buildMedium(r);
}

const widget = await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily === "small"){ await widget.presentSmall(); }
else { await widget.presentMedium(); }
Script.complete();
