// Widget Treningsbelastning — Scriptable (Medium)
// Denne uke vs forrige uke (rullende 7d vs forrige 7d). sRPE = varighet × RPE/10.
const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const API   = `${BASE}/api/widget?token=${encodeURIComponent(TOKEN)}`;

const C = {
  bg1:  new Color("#07111e"),
  bg2:  new Color("#0c1829"),
  fg:   new Color("#f1f5f9"),
  s1:   new Color("#94a3b8"),
  s2:   new Color("#475569"),
  sep:  new Color("#1a2a3d"),
  ok:   new Color("#10b981"),
  warn: new Color("#f59e0b"),
  bad:  new Color("#f43f5e"),
  prev: new Color("#1e3a5f"),
};

function loadColor(v){ return v>=3000?C.bad:v>=1500?C.warn:C.ok; }
function srpe(rows){
  return Math.round((rows||[]).reduce((s,r)=>{
    if(r.rpe==null) return s;
    return s+(r.duration_min??(r.source==='sprint'?75:60))*(r.rpe/10);
  },0));
}
function trendText(curr,prev){
  if(prev===0) return {t:"–",c:C.s2};
  const d=Math.round(((curr-prev)/prev)*100);
  if(d>5)  return {t:`↑ ${d}%`,c:C.bad};
  if(d<-5) return {t:`↓ ${-d}%`,c:C.ok};
  return {t:`→ ${Math.abs(d)}%`,c:C.warn};
}
function lbl(parent,text){
  const t=parent.addText(text); t.textColor=C.s2; t.font=Font.mediumSystemFont(9); return t;
}
function errWidget(msg){
  const w=new ListWidget(); w.backgroundColor=C.bg1;
  w.addText("Belastning utilgjengelig").textColor=C.fg;
  w.addSpacer(4);
  w.addText(String(msg)).textColor=C.s2;
  return w;
}

function drawBars(thisWeek, prevWeek){
  const W=300,H=88;
  const ctx=new DrawContext();
  ctx.size=new Size(W,H); ctx.opaque=false; ctx.respectScreenScale=true;
  const maxV=Math.max(thisWeek,prevWeek,500);
  const labelW=62, barMaxW=W-labelW-14, barH=30, gap=18;

  // Forrige uke
  const pw=Math.max(3,Math.round(barMaxW*(prevWeek/maxV)));
  ctx.setFillColor(C.prev);
  ctx.fillRect(new Rect(labelW,0,pw,barH));
  ctx.setFont(Font.systemFont(9)); ctx.setTextColor(new Color("#475569")); ctx.setTextAlignedRight();
  ctx.drawTextInRect("FORRIGE",new Rect(0,9,labelW-8,12));
  if(prevWeek>0){
    ctx.setFont(Font.mediumSystemFont(10)); ctx.setTextColor(new Color("#64748b")); ctx.setTextAlignedLeft();
    ctx.drawTextInRect(`${prevWeek}`,new Rect(labelW+pw+6,9,60,12));
  }

  // Denne uken
  const tw=Math.max(3,Math.round(barMaxW*(thisWeek/maxV)));
  ctx.setFillColor(loadColor(thisWeek));
  ctx.fillRect(new Rect(labelW,barH+gap,tw,barH));
  ctx.setFont(Font.systemFont(9)); ctx.setTextColor(new Color("#94a3b8")); ctx.setTextAlignedRight();
  ctx.drawTextInRect("DENNE",new Rect(0,barH+gap+9,labelW-8,12));
  if(thisWeek>0){
    ctx.setFont(Font.boldSystemFont(11)); ctx.setTextColor(new Color("#f1f5f9")); ctx.setTextAlignedLeft();
    ctx.drawTextInRect(`${thisWeek}`,new Rect(labelW+tw+6,barH+gap+7,60,14));
  }
  return ctx.getImage();
}

async function main(){
  let data;
  try{ const req=new Request(API); req.timeoutInterval=12; data=await req.loadJSON(); }
  catch(e){ return errWidget("Nettverksfeil"); }
  if(!data||data.error) return errWidget(data?.error??"Ukjent feil");

  const thisWeek=srpe(data.last7load);
  const prevWeek=srpe(data.prev7load);
  const trend=trendText(thisWeek,prevWeek);

  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,15,12,15);
  w.url=`${BASE}/treningsplan.html`;

  const head=w.addStack(); head.centerAlignContent();
  lbl(head,"BELASTNING");
  head.addSpacer();
  const tr=head.addText(trend.t); tr.textColor=trend.c; tr.font=Font.boldSystemFont(12);
  w.addSpacer(10);

  const img=w.addImage(drawBars(thisWeek,prevWeek));
  img.imageSize=new Size(300,88);
  w.addSpacer(8);

  const foot=w.addText("sRPE · varighet × RPE/10 · rullende 7 dager");
  foot.textColor=C.s2; foot.font=Font.systemFont(9); foot.centerAlignText();
  return w;
}

const widget=await main();
if(config.runsInWidget){ Script.setWidget(widget); }
else { await widget.presentMedium(); }
Script.complete();
