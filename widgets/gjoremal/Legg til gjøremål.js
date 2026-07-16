// Legg til gjøremål — Scriptable
// =================================================================
// Spør om tittel + (valgfri) dato via Alert.prompt() og POSTer til
// api/widget-todo-add.js. Gjøremålet lagres som VIKTIG (★).
//
// VIKTIG: Scriptet MÅ hete nøyaktig "Legg til gjøremål" i Scriptable,
// ellers finner ikke "Viktige gjøremål"-widgeten det ved tap.
// TOKEN/BASE kopiert fra "Filip Dashboard.js".
// =================================================================

const BASE  = "https://filip-vita.vercel.app";
const TOKEN = "fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5";
const ADD_API = `${BASE}/api/widget-todo-add`;

// Gjør en fri tekst til YYYY-MM-DD. Godtar:
//   "" → ingen frist
//   "i dag" / "i morgen"
//   "12" → den 12. i inneværende (eller neste) måned
//   "12.6" / "12.06" / "2026-06-12"
function parseDate(input){
  const s = (input || "").trim().toLowerCase();
  if(!s) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const iso = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const da = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${da}`;
  };
  if(s === "i dag" || s === "idag") return iso(today);
  if(s === "i morgen" || s === "imorgen"){ const d=new Date(today); d.setDate(d.getDate()+1); return iso(d); }
  // Allerede ISO
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // dag.måned (.år valgfritt)
  const dm = s.match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?$/);
  if(dm){
    const day = +dm[1], mon = +dm[2]-1;
    let yr = dm[3] ? +dm[3] : today.getFullYear();
    if(yr < 100) yr += 2000;
    const d = new Date(yr, mon, day); d.setHours(0,0,0,0);
    return iso(d);
  }
  // Bare dag-tall
  const dnum = s.match(/^(\d{1,2})$/);
  if(dnum){
    const day = +dnum[1];
    let d = new Date(today.getFullYear(), today.getMonth(), day);
    if(d < today){ d = new Date(today.getFullYear(), today.getMonth()+1, day); } // neste måned hvis passert
    d.setHours(0,0,0,0);
    return iso(d);
  }
  return null; // ukjent format → ingen frist
}

async function notify(title, body){
  const n = new Notification();
  n.title = title; n.body = body;
  await n.schedule();
}

async function main(){
  // 1) Tittel
  const a = new Alert();
  a.title = "Nytt viktig gjøremål";
  a.message = "Hva skal gjøres?";
  a.addTextField("Tittel", "");
  a.addAction("Neste");
  a.addCancelAction("Avbryt");
  const r1 = await a.presentAlert();
  if(r1 === -1) return; // avbrutt
  const title = (a.textFieldValue(0) || "").trim();
  if(!title){ await notify("Ingenting lagret", "Tittel manglet."); return; }

  // 2) Dato (valgfri)
  const b = new Alert();
  b.title = "Frist (valgfritt)";
  b.message = "Tom = ingen frist. Eks: i morgen, 12, 12.6, 2026-06-12";
  b.addTextField("Frist", "");
  b.addAction("Lagre");
  b.addCancelAction("Hopp over");
  const r2 = await b.presentAlert();
  const dueRaw = r2 === -1 ? "" : (b.textFieldValue(0) || "");
  const due_date = parseDate(dueRaw);

  // 3) POST
  const req = new Request(ADD_API);
  req.method = "POST";
  req.headers = { "Content-Type": "application/json", "x-widget-token": TOKEN };
  req.body = JSON.stringify({ title, due_date });
  req.timeoutInterval = 15;
  try {
    const res = await req.loadJSON();
    if(res && res.ok){
      await notify("★ Lagt til", due_date ? `${title} · frist ${due_date}` : title);
    } else {
      await notify("Feil", (res && res.error) ? res.error : "Ukjent feil");
    }
  } catch(e){
    await notify("Nettverksfeil", String(e));
  }
}

await main();
Script.complete();
