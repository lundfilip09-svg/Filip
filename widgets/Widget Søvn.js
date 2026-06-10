// Widget Søvn — Scriptable (Small + Medium + Large)
const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;

const C = {
  bg1:   new Color("#07111e"),
  bg2:   new Color("#0c1829"),
  fg:    new Color("#f1f5f9"),
  s1:    new Color("#94a3b8"),
  s2:    new Color("#475569"),
  sep:   new Color("#1a2a3d"),
  ok:    new Color("#10b981"),
  warn:  new Color("#f59e0b"),
  bad:   new Color("#f43f5e"),
  deep:  new Color("#3b82f6"),
  rem:   new Color("#a78bfa"),
  light: new Color("#7dd3fc"),
  awake: new Color("#475569"),
};

function sleepColor(v){ return v==null?C.s2:v>=80?C.ok:v>=60?C.warn:C.bad; }
function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function hoursLabel(h){
  if(h==null) return "–";
  const m=Math.round(h*60); return `${Math.floor(m/60)}t ${m%60}m`;
}
function minsLabel(m){
  if(m==null) return "–";
  return m<60?`${m}m`:`${Math.floor(m/60)}t ${m%60}m`;
}
function lbl(parent, text){
  const t=parent.addText(text); t.textColor=C.s2; t.font=Font.mediumSystemFont(9); return t;
}
function errWidget(msg){
  const w=new ListWidget(); w.backgroundColor=C.bg1;
  w.addText("Søvn utilgjengelig").textColor=C.fg;
  w.addSpacer(4);
  w.addText(String(msg)).textColor=C.s2;
  return w;
}

// Fargekodet fasestripe
function addPhaseBar(parent, s, barW, barH){
  const phases=[
    {m:s.deep_sleep_minutes,  c:C.deep},
    {m:s.rem_sleep_minutes,   c:C.rem},
    {m:s.light_sleep_minutes, c:C.light},
    {m:s.awake_minutes,       c:C.awake},
  ].filter(p=>p.m!=null&&p.m>0);
  const total=phases.reduce((a,p)=>a+p.m,0);
  const bar=parent.addStack(); bar.size=new Size(barW,barH); bar.cornerRadius=4;
  if(total<=0){ bar.backgroundColor=C.sep; return; }
  for(const p of phases){
    const seg=bar.addStack(); seg.backgroundColor=p.c;
    seg.size=new Size(Math.max(2,Math.round(barW*p.m/total)),barH);
  }
}

// Legende-rad
function addLegend(parent, label, mins, color){
  const row=parent.addStack(); row.centerAlignContent();
  const dot=row.addStack(); dot.backgroundColor=color; dot.size=new Size(7,7); dot.cornerRadius=4;
  row.addSpacer(5);
  const l=row.addText(`${label} `); l.textColor=C.s2; l.font=Font.systemFont(9);
  const v=row.addText(minsLabel(mins)); v.textColor=C.s1; v.font=Font.mediumSystemFont(9);
}

// 7-dagers stolpediagram
function drawWeekBars(last7){
  const W=300,H=76,pad=4,labelH=12;
  const days=last7.slice(0,7).reverse();
  const ctx=new DrawContext();
  ctx.size=new Size(W,H); ctx.opaque=false; ctx.respectScreenScale=true;
  const n=Math.max(days.length,1), gap=8;
  const bw=(W-pad*2-gap*(n-1))/n;
  const maxBarH=H-labelH-6;
  const col=(s)=>s==null?"#334155":s>=80?"#10b981":s>=60?"#f59e0b":"#f43f5e";
  days.forEach((d,i)=>{
    const score=d.sleep_score, x=pad+i*(bw+gap);
    const bh=score!=null?Math.max(3,Math.round(maxBarH*Math.min(score,100)/100)):3;
    const y=(H-labelH)-bh;
    ctx.setFillColor(new Color(col(score)));
    ctx.fillRect(new Rect(x,y,bw,bh));
    if(score!=null){
      ctx.setFont(Font.boldSystemFont(9)); ctx.setTextColor(new Color("#f1f5f9")); ctx.setTextAlignedCenter();
      ctx.drawTextInRect(`${score}`,new Rect(x-4,y-12,bw+8,11));
    }
    const dt=new Date(d.date+"T00:00:00");
    const wd=["S","M","T","O","T","F","L"][dt.getDay()];
    ctx.setFont(Font.systemFont(9)); ctx.setTextColor(new Color("#475569")); ctx.setTextAlignedCenter();
    ctx.drawTextInRect(wd,new Rect(x-4,H-labelH,bw+8,labelH));
  });
  return ctx.getImage();
}

// ── SMALL ─────────────────────────────────────────────────
function buildSmall(s){
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,14,14,14); w.url=`${BASE}/sovn.html`;

  lbl(w, "SØVN");
  w.addSpacer(1);
  const n=w.addText(s&&s.score!=null?`${s.score}`:"–");
  n.textColor=sleepColor(s&&s.score); n.font=Font.boldSystemFont(46);
  w.addSpacer(6);
  const ln=w.addText(`${hoursLabel(s&&s.hours)}  HRV ${s&&s.hrv!=null?s.hrv:"–"}`);
  ln.textColor=C.s1; ln.font=Font.systemFont(11);
  w.addSpacer();
  w.addText(hhmm(new Date())).textColor=C.s2;
  return w;
}

// ── MEDIUM ────────────────────────────────────────────────
function buildMedium(s){
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,12,15); w.url=`${BASE}/sovn.html`;

  // Header
  const head=w.addStack(); head.centerAlignContent();
  lbl(head, "SØVN");
  head.addSpacer();
  head.addText(hhmm(new Date())).textColor=C.s2;
  w.addSpacer(8);

  const body=w.addStack(); body.centerAlignContent();
  // Venstre: score + timer
  const left=body.addStack(); left.layoutVertically();
  const sn=left.addText(s&&s.score!=null?`${s.score}`:"–");
  sn.textColor=sleepColor(s&&s.score); sn.font=Font.boldSystemFont(42);
  const hl=left.addText(hoursLabel(s&&s.hours)); hl.textColor=C.s1; hl.font=Font.systemFont(12);
  body.addSpacer(14);
  // Høyre: fasestripe + tid + HRV/RHR
  const right=body.addStack(); right.layoutVertically();
  if(s) addPhaseBar(right,s,200,12);
  right.addSpacer(6);
  if(s&&(s.sleep_start||s.sleep_end)){
    const tr=right.addText(`${s.sleep_start||"–"} → ${s.sleep_end||"–"}`);
    tr.textColor=C.s1; tr.font=Font.mediumSystemFont(11);
  }
  right.addSpacer(6);
  const chips=right.addStack(); chips.centerAlignContent();
  const h1=chips.addText(`HRV ${s?s.hrv??'–':'–'}`); h1.textColor=C.s1; h1.font=Font.systemFont(10);
  chips.addSpacer(10);
  const h2=chips.addText(`RHR ${s?s.rhr??'–':'–'}`); h2.textColor=C.s1; h2.font=Font.systemFont(10);

  w.addSpacer(8);
  const lg=w.addStack(); lg.centerAlignContent();
  if(s){
    addLegend(lg,"Dyp",s.deep_sleep_minutes,C.deep);   lg.addSpacer(8);
    addLegend(lg,"REM",s.rem_sleep_minutes,C.rem);     lg.addSpacer(8);
    addLegend(lg,"Lett",s.light_sleep_minutes,C.light); lg.addSpacer(8);
    addLegend(lg,"Våken",s.awake_minutes,C.awake);
  }
  return w;
}

// ── LARGE ─────────────────────────────────────────────────
function buildLarge(data){
  const s=data.sleep;
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(15,16,14,16); w.url=`${BASE}/sovn.html`;

  const head=w.addStack(); head.centerAlignContent();
  lbl(head, "SØVN");
  head.addSpacer();
  head.addText(hhmm(new Date())).textColor=C.s2;
  w.addSpacer(10);

  const body=w.addStack(); body.centerAlignContent();
  const left=body.addStack(); left.layoutVertically();
  const sn=left.addText(s&&s.score!=null?`${s.score}`:"–");
  sn.textColor=sleepColor(s&&s.score); sn.font=Font.boldSystemFont(48);
  const hl=left.addText(hoursLabel(s&&s.hours)); hl.textColor=C.s1; hl.font=Font.systemFont(13);
  body.addSpacer(16);
  const right=body.addStack(); right.layoutVertically();
  if(s) addPhaseBar(right,s,230,14);
  right.addSpacer(6);
  if(s&&(s.sleep_start||s.sleep_end)){
    const tr=right.addText(`${s.sleep_start||"–"} → ${s.sleep_end||"–"}`);
    tr.textColor=C.s1; tr.font=Font.mediumSystemFont(12);
  }
  right.addSpacer(6);
  const chips=right.addStack(); chips.centerAlignContent();
  chips.addText(`HRV ${s?s.hrv??'–':'–'}`).textColor=C.s1;
  chips.addSpacer(10);
  chips.addText(`RHR ${s?s.rhr??'–':'–'}`).textColor=C.s1;

  w.addSpacer(8);
  const lg=w.addStack(); lg.centerAlignContent();
  if(s){
    addLegend(lg,"Dyp",s.deep_sleep_minutes,C.deep);    lg.addSpacer(10);
    addLegend(lg,"REM",s.rem_sleep_minutes,C.rem);      lg.addSpacer(10);
    addLegend(lg,"Lett",s.light_sleep_minutes,C.light); lg.addSpacer(10);
    addLegend(lg,"Våken",s.awake_minutes,C.awake);
  }
  w.addSpacer(10);
  const divLine=w.addStack(); divLine.backgroundColor=C.sep; divLine.size=new Size(300,1);
  w.addSpacer(8);
  lbl(w, "SISTE 7 NETTER");
  w.addSpacer(6);
  const img=w.addImage(drawWeekBars(data.last7sleep||[]));
  img.imageSize=new Size(300,76);
  return w;
}

async function build(){
  let data;
  try{ const req=new Request(API); req.timeoutInterval=12; data=await req.loadJSON(); }
  catch(e){ return errWidget("Nettverksfeil"); }
  if(!data||data.error) return errWidget(data?.error??"Ukjent feil");
  if(config.widgetFamily==="small") return buildSmall(data.sleep);
  if(config.widgetFamily==="large") return buildLarge(data);
  return buildMedium(data.sleep);
}

const widget=await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily==="small"){ await widget.presentSmall(); }
else if(config.widgetFamily==="large"){ await widget.presentLarge(); }
else { await widget.presentMedium(); }
Script.complete();
