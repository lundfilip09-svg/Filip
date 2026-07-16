#!/bin/bash
# Filip Dashboard — SwiftBar (menylinje-widget for Mac)
# =================================================================
# HVORFOR SwiftBar (ikke Übersicht):
#   macOS har ingen enkel "hjemmeskjerm" for skript. SwiftBar legger
#   widgeten i MENYLINJEN øverst — alltid synlig, null koding, bare
#   slipp denne fila i SwiftBar-mappa. Übersicht krever CoffeeScript +
#   egen desktop-layer; mer jobb for samme resultat.
#
# OPPSETT (én gang):
#   1. Installer SwiftBar:  brew install --cask swiftbar
#      (eller last ned fra github.com/swiftbar/SwiftBar/releases)
#   2. Start SwiftBar → velg en plugin-mappe (f.eks. ~/SwiftBar).
#   3. Kopier denne fila dit. Filnavnet ".15m." = oppdater hvert 15. min.
#   4. chmod +x ~/SwiftBar/filip-dashboard.15m.sh
#   5. Fyll inn TOKEN under (samme som CRON_SECRET i Vercel).
#
# OBS: tokenet er CRON_SECRET, delt med Vercel-cron. Roterer du det, må
#      både denne fila, iPhone-widgeten og cron-oppsettet oppdateres.
#
# Avhengigheter: kun curl + osascript — begge følger med macOS. Ingen jq.
# =================================================================

BASE="https://filip-vita.vercel.app"
TOKEN="fc30c9a6442f64e4272c86b7d92ba12d50a49e8ee8a6ea7dd1876a684dd4cac5"

TMP="$(mktemp)"
HTTP=$(curl -s --max-time 12 -w "%{http_code}" "$BASE/api/widget?token=$TOKEN" -o "$TMP")

if [ "$HTTP" != "200" ]; then
  echo "⚠️ Dashboard | color=red"
  echo "---"
  echo "Kunne ikke hente data (HTTP $HTTP)"
  echo "Sjekk token / nett | color=gray"
  echo "🔄 Prøv igjen | refresh=true"
  rm -f "$TMP"
  exit 0
fi

# All formatering gjøres i JavaScript (JXA) — robust JSON-parsing uten jq.
osascript -l JavaScript - "$TMP" "$BASE" <<'JXA'
function run(argv) {
  const path = argv[0], base = argv[1];
  const raw = $.NSString.stringWithContentsOfFileEncodingError($(path), $.NSUTF8StringEncoding, null);
  let d;
  try { d = JSON.parse(raw.js); } catch (e) {
    return "⚠️ Dashboard | color=red\n---\nUgyldig svar fra server";
  }
  if (d.error) return "⚠️ Dashboard | color=red\n---\n" + d.error;

  const out = [];
  const s = d.sleep, k = d.knee, todos = (d.todos || []);

  // --- Farger ---
  const sleepCol = (v) => v == null ? "gray" : v >= 80 ? "green" : v >= 60 ? "orange" : "red";
  const kneeCol  = (v) => v == null ? "gray" : v <= 2 ? "green" : v <= 5 ? "orange" : "red";

  // Verste (høyeste) kne-verdi på tvers av de fire feltene i en rad.
  const worstKnee = (r) => {
    if (!r) return null;
    const vals = [r.before, r.during, r.after, r.day_after].filter((v) => v != null);
    return vals.length ? Math.max.apply(null, vals) : null;
  };

  const kneeVal = k ? (k.during != null ? k.during : (k.after != null ? k.after : null)) : null;

  // Per-skade (d.injuries fra /api/widget). Faller tilbake til kne-kompatfeltet.
  const BODY_NO = { 'body.knee':'Kne','body.hamstring':'Hamstring','body.glute':'Glute','body.hipflexor':'Hoftebøyer','body.hip':'Hofte','body.shoulder':'Skulder','body.back':'Rygg','body.neck':'Nakke','body.ankle':'Ankel','body.calf':'Legg','body.achilles':'Akilles','body.foot':'Fot','body.other':'Annet' };
  const SIDE_NO = { left:'v.', right:'h.', both:'beg.' };
  const injName = (inj) => (BODY_NO[inj.body_part] || inj.body_part || '') + (inj.side && SIDE_NO[inj.side] ? ' ' + SIDE_NO[inj.side] : '');
  const injPain = (inj) => { const p = inj && inj.latest_pain; return p ? { session_type:p.session_type, before:p.before, during:p.during, after:p.after, day_after:p.day_after, date:p.date } : null; };
  const severeInj = (d.injuries || []).filter((x) => x && x.latest_pain);
  let worstAll = null;
  for (const inj of severeInj) { const w = worstKnee(injPain(inj)); if (w != null && (worstAll == null || w > worstAll)) worstAll = w; }
  if (worstAll == null) worstAll = worstKnee(k);

  // --- Menylinje (kompakt) ---
  const sTxt = s && s.score != null ? "💤" + s.score : "💤–";
  const kTxt = worstAll != null ? "🦵" + worstAll : "🦵–";
  const cTxt = "📋" + todos.length;
  out.push(sTxt + "  " + kTxt + "  " + cTxt + " | size=13");
  out.push("---");

  // --- Søvn ---
  out.push("Søvn siste natt | size=14 color=" + sleepCol(s && s.score));
  if (s) {
    let line = "💤 " + (s.score != null ? s.score : "–");
    if (s.hours != null) line += " · " + s.hours + "t";
    if (s.hrv != null)   line += " · HRV " + s.hrv;
    if (s.rhr != null)   line += " · RHR " + s.rhr;
    out.push(line + " | color=" + sleepCol(s.score));
    if (s.date) out.push(s.date + " | size=11 color=gray");
  } else out.push("Ingen data | color=gray");
  out.push("---");

  // --- Smerte (per alvorlig skade; fallback til kne-kompatfeltet) ---
  const painBlocks = severeInj.length
    ? severeInj.map((inj) => ({ name: injName(inj), p: injPain(inj) }))
    : [{ name: "Kne", p: k }];
  out.push("Smerte (siste logg) | size=14 color=" + kneeCol(worstAll));
  for (const blk of painBlocks) {
    const p = blk.p;
    if (!p) { out.push(blk.name + ": ingen data | color=gray"); continue; }
    const v = p.during != null ? p.during : (p.after != null ? p.after : null);
    let line = "🦵 " + blk.name + ": " + (v != null ? v + "/10" : "–");
    if (p.session_type) line += " · " + p.session_type;
    out.push(line + " | color=" + kneeCol(v));
    let det = [];
    if (p.before != null) det.push("før " + p.before);
    if (p.during != null) det.push("under " + p.during);
    if (p.after != null)  det.push("etter " + p.after);
    if (det.length) out.push(det.join(" · ") + " | size=11 color=gray");
    if (p.date) out.push(p.date + " | size=11 color=gray");
  }
  out.push("---");

  // --- Trend (vs forrige loggførte dag) ---
  out.push("Trend (vs i går) | size=14");
  const y = d.yesterday || {};
  const yS = (y.sleep && y.sleep.score != null) ? y.sleep.score : null;
  const yK = (y.knee && y.knee.worst_score != null) ? y.knee.worst_score : null;
  const tS = (s && s.score != null) ? s.score : null;
  const tK = worstAll;

  // Søvn: høyere = bedre.
  if (tS != null && yS != null) {
    const diff = tS - yS;
    const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "▬";
    const col = diff > 0 ? "green" : diff < 0 ? "red" : "gray";
    const sign = diff > 0 ? "+" + diff : "" + diff;
    out.push("💤 Søvn: " + tS + " " + arrow + " " + sign + " (i går " + yS + ") | color=" + col);
  } else {
    out.push("💤 Søvn: ingen sammenligning | size=11 color=gray");
  }

  // Kne: lavere = bedre (pil ned = forbedring = grønn).
  if (tK != null && yK != null) {
    const diff = tK - yK;
    const arrow = diff < 0 ? "▼" : diff > 0 ? "▲" : "▬";
    const col = diff < 0 ? "green" : diff > 0 ? "red" : "gray";
    const sign = diff > 0 ? "+" + diff : "" + diff;
    out.push("🦵 Kne (verste): " + tK + " " + arrow + " " + sign + " (i går " + yK + ") | color=" + col);
  } else {
    out.push("🦵 Kne (verste): ingen sammenligning | size=11 color=gray");
  }
  out.push("---");

  // --- Gjøremål ---
  out.push("Gjøremål med frist | size=14");
  if (todos.length === 0) {
    out.push("Ingenting med frist 🎉 | color=gray");
  } else {
    const today = new Date(); today.setHours(0,0,0,0);
    for (const t of todos) {
      let due = "";
      let col = "white";
      if (t.due_date) {
        const dd = new Date(t.due_date + "T00:00:00");
        const diff = Math.round((dd - today) / 86400000);
        due = diff < 0 ? "for " + (-diff) + "d siden" : diff === 0 ? "i dag" : diff === 1 ? "i morgen" : diff <= 6 ? diff + "d" : (dd.getDate() + "." + (dd.getMonth()+1) + ".");
        col = diff < 0 ? "red" : diff <= 1 ? "orange" : "white";
      }
      const star = t.important ? "★ " : "• ";
      const title = t.title.length > 32 ? t.title.slice(0,31) + "…" : t.title;
      out.push(star + title + "  —  " + due + " | color=" + col);
    }
  }
  out.push("---");
  out.push("🤖 Åpne AI-chat | href=" + base + "/ai.html");
  out.push("🔄 Oppdater | refresh=true");

  return out.join("\n");
}
JXA

rm -f "$TMP"
