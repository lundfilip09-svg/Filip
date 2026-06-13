// Filip Dashboard — Scriptable (Medium + Small)
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
  acc:  new Color("#818cf8"),
};

function sleepColor(v){ return v==null?C.s2:v>=80?C.ok:v>=60?C.warn:C.bad; }
function kneeColor(v){  return v==null?C.s2:v<=2?C.ok:v<=5?C.warn:C.bad; }
function worstKnee(k){
  if(!k) return null;
  const v=[k.before,k.during,k.after,k.day_after].filter(x=>x!=null);
  return v.length?Math.max(...v):null;
}
// Per-skade (data.injuries fra /api/widget). Faller tilbake til kne-kompatfeltet.
const _BODY_NO={ 'body.knee':'Kne','body.hamstring':'Hamstring','body.glute':'Glute','body.hipflexor':'Hoftebøyer','body.hip':'Hofte','body.shoulder':'Skulder','body.back':'Rygg','body.neck':'Nakke','body.ankle':'Ankel','body.calf':'Legg','body.achilles':'Akilles','body.foot':'Fot','body.other':'Annet' };
const _SIDE_NO={ left:'v.', right:'h.', both:'beg.' };
function injName(inj){ const b=_BODY_NO[inj.body_part]||inj.body_part||''; const s=inj.side&&_SIDE_NO[inj.side]?(' '+_SIDE_NO[inj.side]):''; return (b+s).toUpperCase(); }
function injPain(inj){ const p=inj&&inj.latest_pain; return p?{session_type:p.session_type,before:p.before,during:p.during,after:p.after,day_after:p.day_after}:null; }
function worstInjuries(data){
  let worst=null;
  for(const inj of (data.injuries||[])){ const w=worstKnee(injPain(inj)); if(w!=null&&(worst==null||w>worst)) worst=w; }
  return worst!=null?worst:worstKnee(data.knee);
}
function hoursLabel(h){
  if(h==null) return "–";
  const m=Math.round(h*60);
  return `${Math.floor(m/60)}t ${m%60}m`;
}
function dueLabel(iso){
  if(!iso) return "";
  const d=new Date(iso+"T00:00:00"), now=new Date(); now.setHours(0,0,0,0);
  const diff=Math.round((d-now)/86400000);
  if(diff<0)  return `${-diff}d siden`;
  if(diff===0) return "i dag";
  if(diff===1) return "i morgen";
  if(diff<=6)  return `${diff}d`;
  return `${d.getDate()}.${d.getMonth()+1}.`;
}
function dueColor(iso){
  const d=new Date(iso+"T00:00:00"),now=new Date(); now.setHours(0,0,0,0);
  const diff=Math.round((d-now)/86400000);
  return diff<0?C.bad:diff<=1?C.warn:C.s1;
}
function dateStr(){
  const d=new Date();
  const days=["Søn","Man","Tir","Ons","Tor","Fre","Lør"];
  const months=["jan","feb","mar","apr","mai","jun","jul","aug","sep","okt","nov","des"];
  return `${days[d.getDay()]} ${d.getDate()}. ${months[d.getMonth()]}`;
}
function hhmm(d){ return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }
function lbl(parent, text){
  const t=parent.addText(text); t.textColor=C.s2; t.font=Font.mediumSystemFont(9); return t;
}
function errWidget(msg){
  const w=new ListWidget(); w.backgroundColor=C.bg1;
  const t=w.addText("Dashboard utilgjengelig"); t.textColor=C.fg; t.font=Font.boldSystemFont(13);
  w.addSpacer(4);
  w.addText(String(msg)).textColor=C.s2;
  return w;
}

// ── MEDIUM ────────────────────────────────────────────────
function buildMedium(data){
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,15,12,15);
  w.url=`${BASE}/ai.html`;

  // Header
  const head=w.addStack(); head.centerAlignContent();
  const hn=head.addText("Filip"); hn.textColor=C.fg; hn.font=Font.boldSystemFont(14);
  head.addSpacer();
  const hd=head.addText(dateStr()); hd.textColor=C.s1; hd.font=Font.systemFont(10);
  w.addSpacer(10);

  const body=w.addStack(); body.topAlignContent();

  // ── Venstre: Søvn + Kne ──
  const left=body.addStack(); left.layoutVertically();
  const s=data.sleep;

  lbl(left, "SØVN");
  left.addSpacer(2);
  const sr=left.addStack(); sr.bottomAlignContent();
  const sn=sr.addText(s&&s.score!=null?`${s.score}`:"–");
  sn.textColor=sleepColor(s&&s.score); sn.font=Font.boldSystemFont(36);
  if(s&&s.hours!=null){
    sr.addSpacer(5);
    const sh=sr.addText(hoursLabel(s.hours)); sh.textColor=C.s1; sh.font=Font.systemFont(11);
  }
  left.addSpacer(5);
  if(s){
    const hr=left.addStack(); hr.centerAlignContent();
    const h1=hr.addText(`HRV ${s.hrv??'–'}`); h1.textColor=C.s1; h1.font=Font.systemFont(10);
    hr.addSpacer(8);
    const h2=hr.addText(`RHR ${s.rhr??'–'}`); h2.textColor=C.s1; h2.font=Font.systemFont(10);
  }
  left.addSpacer(10);
  const divL=left.addStack(); divL.backgroundColor=C.sep; divL.size=new Size(130,1);
  left.addSpacer(10);

  // SMERTE — per alvorlig skade (data.injuries). Fallback: kne-kompatfeltet.
  const _injList=(data.injuries||[]).filter(x=>x&&x.latest_pain);
  const painBlocks = _injList.length
    ? _injList.map(inj=>({ name:injName(inj), p:injPain(inj) }))
    : [{ name:"KNE", p:data.knee }];
  painBlocks.forEach((blk,bi)=>{
    if(bi>0) left.addSpacer(8);
    const k=blk.p;
    const kh=left.addStack(); kh.centerAlignContent();
    lbl(kh, blk.name);
    if(k&&k.session_type){
      kh.addSpacer(5);
      const st=kh.addText(k.session_type); st.textColor=C.s2; st.font=Font.systemFont(9); st.lineLimit=1;
    }
    left.addSpacer(4);
    const kr=left.addStack(); kr.centerAlignContent();
    [{l:"før",v:k?k.before:null},{l:"und",v:k?k.during:null},{l:"etter",v:k?k.after:null},{l:"d+1",v:k?k.day_after:null}]
      .forEach((p,i)=>{
        if(i>0){ const dot=kr.addText("·"); dot.textColor=C.s2; dot.font=Font.systemFont(10); kr.addSpacer(3); }
        const cell=kr.addStack(); cell.layoutVertically(); cell.centerAlignContent();
        const cl=cell.addText(p.l); cl.textColor=C.s2; cl.font=Font.systemFont(8); cl.centerAlignText();
        const cv=cell.addText(p.v!=null?`${p.v}`:"–"); cv.textColor=kneeColor(p.v); cv.font=Font.boldSystemFont(15); cv.centerAlignText();
        if(i<3) kr.addSpacer(3);
      });
  });

  body.addSpacer(16);

  // ── Høyre: Gjøremål ──
  const right=body.addStack(); right.layoutVertically();
  lbl(right, "GJØREMÅL");
  right.addSpacer(4);
  const todos=(data.todos||[]).slice(0,4);
  if(todos.length===0){
    const e=right.addText("Alt klart"); e.textColor=C.s2; e.font=Font.systemFont(11);
  }
  for(const td of todos){
    const row=right.addStack(); row.centerAlignContent();
    const dot=row.addText("—  "); dot.textColor=C.s2; dot.font=Font.systemFont(10);
    const tn=row.addText(td.title);
    tn.textColor=td.important?C.fg:C.s1; tn.font=Font.systemFont(11); tn.lineLimit=1;
    row.addSpacer();
    if(td.due_date){
      const due=row.addText(dueLabel(td.due_date)); due.textColor=dueColor(td.due_date); due.font=Font.mediumSystemFont(10);
    }
    right.addSpacer(5);
  }

  w.addSpacer();
  const foot=w.addStack(); foot.centerAlignContent();
  foot.addText(hhmm(new Date())).textColor=C.s2;
  (foot.addText(" · ")).textColor=C.s2;
  const ai=foot.addText("AI →"); ai.textColor=C.acc; ai.font=Font.mediumSystemFont(9);
  return w;
}

// ── SMALL ─────────────────────────────────────────────────
function buildSmall(data){
  const w=new ListWidget();
  const g=new LinearGradient(); g.colors=[C.bg1,C.bg2]; g.locations=[0,1]; w.backgroundGradient=g;
  w.setPadding(14,14,13,14);
  w.url=`${BASE}/dashboard.html`;

  const s=data.sleep;
  lbl(w, "SØVN");
  w.addSpacer(1);
  const sn=w.addText(s&&s.score!=null?`${s.score}`:"–");
  sn.textColor=sleepColor(s&&s.score); sn.font=Font.boldSystemFont(42);

  w.addSpacer(7);
  const worst=worstInjuries(data);
  const kr=w.addStack(); kr.centerAlignContent();
  const kn=kr.addText(worst!=null?`${worst}/10`:"–"); kn.textColor=kneeColor(worst); kn.font=Font.boldSystemFont(15);
  kr.addSpacer(4);
  kr.addText("smerte").textColor=C.s2;

  w.addSpacer(4);
  const n=(data.todos||[]).length;
  const tr=w.addStack(); tr.centerAlignContent();
  const tn=tr.addText(`${n}`); tn.textColor=C.fg; tn.font=Font.boldSystemFont(15);
  tr.addSpacer(4);
  tr.addText("gjøremål").textColor=C.s2;

  w.addSpacer();
  w.addText(hhmm(new Date())).textColor=C.s2;
  return w;
}

async function build(){
  let data;
  try{ const req=new Request(API); req.timeoutInterval=12; data=await req.loadJSON(); }
  catch(e){ return errWidget("Nettverksfeil"); }
  if(!data||data.error) return errWidget(data?.error??"Ukjent feil");
  return config.widgetFamily==="small"?buildSmall(data):buildMedium(data);
}

const widget=await build();
if(config.runsInWidget){ Script.setWidget(widget); }
else if(config.widgetFamily==="small"){ await widget.presentSmall(); }
else { await widget.presentMedium(); }
Script.complete();
