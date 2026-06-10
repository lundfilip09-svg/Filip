// Widget Treningsbelastning — Scriptable (Medium)
// =================================================================
// Stolpediagram: belastning per dag siste 7 dager (sRPE, Foster).
//   sRPE per økt = varighet_min × (RPE/10)   [RPE lagres 1–100 → /10]
//   dag = sum av øktene fra gym + sprint + aktivitet
//   <300 grønn · <500 gul · ≥500 rød
// TOKEN/BASE kopiert fra "Filip Dashboard.js" (kun lese).
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;
const DEEPLINK = `${BASE}/treningsplan.html`;

const BG1 = new Color("#0f172a"), BG2 = new Color("#1e293b");
const FG = new Color("#f1f5f9"), DIM = new Color("#94a3b8");

function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function loadHex(v){ return v >= 500 ? "#ef4444" : v >= 300 ? "#eab308" : "#22c55e"; }
function isoLocal(d){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), da=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

async function getData(){
  const req = new Request(API); req.timeoutInterval = 12;
  return await req.loadJSON();
}

// Bygger 7 dager (eldst→nyest) med summert sRPE.
function buildDays(last7load){
  const days = [];
  const today = new Date(); today.setHours(0,0,0,0);
  for(let i=6;i>=0;i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    days.push({ date: isoLocal(d), dow: d.getDay(), load: 0 });
  }
  const byDate = {}; days.forEach(d => byDate[d.date] = d);
  for(const r of (last7load||[])){
    if(r.rpe == null || r.duration_min == null) continue;
    const srpe = r.duration_min * (r.rpe/10);
    const slot = byDate[r.date];
    if(slot) slot.load += srpe;
  }
  days.forEach(d => d.load = Math.round(d.load));
  return days;
}

function drawBars(days){
  const W = 320, H = 120, padX = 6, labelH = 14, topPad = 14;
  const ctx = new DrawContext();
  ctx.size = new Size(W, H); ctx.opaque = false; ctx.respectScreenScale = true;
  const n = days.length, gap = 10;
  const bw = (W - padX*2 - gap*(n-1)) / n;
  const maxLoad = Math.max(500, ...days.map(d=>d.load)); // hold 500-grensa synlig
  const maxBarH = H - labelH - topPad;

  // referanselinjer for 300 (gul) og 500 (rød)
  [{v:300,c:"#eab308"},{v:500,c:"#ef4444"}].forEach(ref => {
    if(ref.v <= maxLoad){
      const y = (H - labelH) - maxBarH * (ref.v/maxLoad);
      ctx.setStrokeColor(new Color(ref.c, 0.35)); ctx.setLineWidth(1);
      const p = new Path(); p.move(new Point(padX, y)); p.addLine(new Point(W-padX, y));
      ctx.addPath(p); ctx.strokePath();
    }
  });

  days.forEach((d,i)=>{
    const x = padX + i*(bw+gap);
    const bh = d.load>0 ? Math.max(3, Math.round(maxBarH * Math.min(d.load,maxLoad)/maxLoad)) : 2;
    const y = (H-labelH) - bh;
    ctx.setFillColor(d.load>0 ? new Color(loadHex(d.load)) : new Color("#334155"));
    ctx.fillRect(new Rect(x, y, bw, bh));
    if(d.load>0){
      ctx.setFont(Font.boldSystemFont(9)); ctx.setTextColor(new Color("#f1f5f9")); ctx.setTextAlignedCenter();
      ctx.drawTextInRect(`${d.load}`, new Rect(x-6, y-12, bw+12, 11));
    }
    const wd = ["S","M","T","O","T","F","L"][d.dow];
    ctx.setFont(Font.systemFont(10)); ctx.setTextColor(new Color("#94a3b8")); ctx.setTextAlignedCenter();
    ctx.drawTextInRect(wd, new Rect(x-6, H-labelH, bw+12, labelH));
  });
  return ctx.getImage();
}

function errWidget(msg){
  const w = new ListWidget(); w.backgroundColor = BG1;
  const t = w.addText("Belastning utilgjengelig"); t.textColor = FG; t.font = Font.boldSystemFont(14);
  w.addSpacer(4);
  const e = w.addText(String(msg)); e.textColor = DIM; e.font = Font.systemFont(10);
  return w;
}

function build(data){
  const w = new ListWidget();
  const g = new LinearGradient(); g.colors=[BG1,BG2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,11,15); w.url = DEEPLINK;

  const days = buildDays(data.last7load);
  const total = days.reduce((a,d)=>a+d.load,0);
  const avg = Math.round(total/7);

  const head = w.addStack(); head.centerAlignContent();
  const title = head.addText("📊 Belastning 7d"); title.textColor=FG; title.font=Font.boldSystemFont(13);
  head.addSpacer();
  const ts = head.addText(hhmm(new Date())); ts.textColor=DIM; ts.font=Font.systemFont(10);
  w.addSpacer(6);

  const img = w.addImage(drawBars(days)); img.imageSize = new Size(320,120);

  w.addSpacer(6);
  const foot = w.addStack(); foot.centerAlignContent();
  const tot = foot.addText(`Uke: ${total}`); tot.textColor=FG; tot.font=Font.boldSystemFont(11);
  foot.addSpacer(10);
  const av = foot.addText(`Snitt/dag: ${avg}`); av.textColor=DIM; av.font=Font.systemFont(11);
  foot.addSpacer();
  const au = foot.addText("AU (sRPE)"); au.textColor=DIM; au.font=Font.systemFont(9);
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
