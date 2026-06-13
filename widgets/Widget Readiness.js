// Widget Readiness — Scriptable (Small + Medium)
// Beredskap 0–100: søvnscore×0.4 + (10−smerte)×6 + HRV-norm×0.2
// smerte = verste verdi på tvers av alle alvorlige skader (kne + hamstring …)
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
  track: new Color("#ffffff", 0.08),
};

function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function lbl(parent,text){
  const t=parent.addText(text); t.textColor=C.s2; t.font=Font.mediumSystemFont(9); return t;
}
function errWidget(msg){
  const w=new ListWidget(); w.backgroundColor=C.bg1;
  w.addText("Beredskap utilgjengelig").textColor=C.fg;
  w.addSpacer(4);
  w.addText(String(msg)).textColor=C.s2;
  return w;
}

function compute(data){
  const s=data.sleep;
  if(!s||s.score==null) return null;
  // Verste smerte på tvers av alle alvorlige skader; fallback til kne-kompatfeltet.
  let worstK=0;
  const _inj=(data.injuries||[]).filter(x=>x&&x.latest_pain);
  if(_inj.length){
    for(const inj of _inj){
      const p=inj.latest_pain;
      const vs=[p.before,p.during,p.after,p.day_after].filter(v=>v!=null);
      if(vs.length) worstK=Math.max(worstK,...vs);
    }
  } else {
    const k=data.knee;
    const vals=k?[k.before,k.during,k.after,k.day_after].filter(v=>v!=null):[];
    worstK=vals.length?Math.max(...vals):0;
  }
  const hrv=s.hrv;
  const hrvN=hrv!=null?Math.min(hrv/70*100,100):0;
  let score=Math.round(s.score*0.4+(10-worstK)*6+hrvN*0.2);
  score=Math.max(0,Math.min(100,score));
  let word,color,colorHex,rec;
  if(score>75){   word="KLAR";    color=C.ok;   colorHex="#10b981"; rec="Tren hardt"; }
  else if(score>=50){ word="MODERAT"; color=C.warn; colorHex="#f59e0b"; rec="Moderat økt"; }
  else{           word="HVIL";    color=C.bad;  colorHex="#f43f5e"; rec="Hvil i dag"; }
  return {score,word,color,colorHex,rec,
    parts:{
      sleep:{val:s.score*0.4,max:40},
      pain: {val:(10-worstK)*6,max:60},
      hrv:  {val:hrvN*0.2,max:20,missing:hrv==null},
    }};
}

function addBar(parent,label,val,max,color,barW){
  const row=parent.addStack(); row.centerAlignContent();
  const labelBox=row.addStack(); labelBox.size=new Size(44,12);
  labelBox.addText(label).textColor=C.s2;
  const track=row.addStack(); track.backgroundColor=C.track; track.size=new Size(barW,8); track.cornerRadius=4;
  const fw=Math.max(2,Math.round(barW*Math.min(val/max,1)));
  const fill=track.addStack(); fill.backgroundColor=color; fill.size=new Size(fw,8); fill.cornerRadius=4;
  row.addSpacer(6);
  row.addText(`${Math.round(val)}`).textColor=C.s1;
}

// ── SMALL ─────────────────────────────────────────────────
function buildSmall(r){
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,14,14,14); w.url=`${BASE}/dashboard.html`;

  lbl(w,"BEREDSKAP");
  w.addSpacer(1);
  if(!r){
    w.addText("–").textColor=C.s2;
    w.addSpacer();
    return w;
  }
  const n=w.addText(`${r.score}`); n.textColor=r.color; n.font=Font.boldSystemFont(50);
  w.addSpacer(2);
  const wrd=w.addText(r.word); wrd.textColor=r.color; wrd.font=Font.boldSystemFont(18);
  w.addSpacer();
  w.addText(hhmm(new Date())).textColor=C.s2;
  return w;
}

// ── MEDIUM ────────────────────────────────────────────────
function buildMedium(r){
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(13,15,12,15); w.url=`${BASE}/dashboard.html`;

  const head=w.addStack(); head.centerAlignContent();
  lbl(head,"BEREDSKAP");
  head.addSpacer();
  head.addText(hhmm(new Date())).textColor=C.s2;
  w.addSpacer(8);

  if(!r){
    w.addText("Mangler søvndata for å beregne.").textColor=C.s2;
    w.addSpacer();
    return w;
  }

  const body=w.addStack(); body.centerAlignContent();
  const left=body.addStack(); left.layoutVertically();
  const n=left.addText(`${r.score}`); n.textColor=r.color; n.font=Font.boldSystemFont(46);
  const wrd=left.addText(r.word); wrd.textColor=r.color; wrd.font=Font.boldSystemFont(14);
  body.addSpacer(16);
  const right=body.addStack(); right.layoutVertically();
  const bw=128;
  addBar(right,"Søvn",r.parts.sleep.val,r.parts.sleep.max,C.ok,bw);   right.addSpacer(7);
  addBar(right,"Smerte", r.parts.pain.val, r.parts.pain.max, C.warn,bw); right.addSpacer(7);
  addBar(right,r.parts.hrv.missing?"HRV –":"HRV",r.parts.hrv.val,r.parts.hrv.max,new Color("#60a5fa"),bw);

  w.addSpacer(9);
  const chip=w.addStack();
  const inner=chip.addStack(); inner.backgroundColor=new Color(r.colorHex,0.15); inner.cornerRadius=6; inner.setPadding(3,10,3,10);
  const rt=inner.addText(r.rec); rt.textColor=r.color; rt.font=Font.boldSystemFont(12);
  return w;
}

async function build(){
  let data;
  try{ const req=new Request(API); req.timeoutInterval=12; data=await req.loadJSON(); }
  catch(e){ return errWidget("Nettverksfeil"); }
  if(!data||data.error) return errWidget(data?.error??"Ukjent feil");
  const r=compute(data);
  return config.widgetFamily==="small"?buildSmall(r):buildMedium(r);
}

const widget=await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily==="small"){ await widget.presentSmall(); }
else { await widget.presentMedium(); }
Script.complete();
