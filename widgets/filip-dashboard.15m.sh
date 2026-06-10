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

BASE="https://filip-dashboard.vercel.app"
TOKEN="LIM_INN_CRON_SECRET_HER"

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

  const kneeVal = k ? (k.during != null ? k.during : (k.after != null ? k.after : null)) : null;

  // --- Menylinje (kompakt) ---
  const sTxt = s && s.score != null ? "😴" + s.score : "😴–";
  const kTxt = kneeVal != null ? "🦵" + kneeVal : "🦵–";
  const cTxt = "✅" + todos.length;
  out.push(sTxt + "  " + kTxt + "  " + cTxt + " | size=13");
  out.push("---");

  // --- Søvn ---
  out.push("Søvn siste natt | size=14 color=" + sleepCol(s && s.score));
  if (s) {
    let line = "😴 " + (s.score != null ? s.score : "–");
    if (s.hours != null) line += " · " + s.hours + "t";
    if (s.hrv != null)   line += " · HRV " + s.hrv;
    if (s.rhr != null)   line += " · RHR " + s.rhr;
    out.push(line + " | color=" + sleepCol(s.score));
    if (s.date) out.push(s.date + " | size=11 color=gray");
  } else out.push("Ingen data | color=gray");
  out.push("---");

  // --- Kne ---
  out.push("Kne (siste logg) | size=14 color=" + kneeCol(kneeVal));
  if (k) {
    let line = "🦵 " + (kneeVal != null ? kneeVal + "/10" : "–");
    if (k.session_type) line += " · " + k.session_type;
    out.push(line + " | color=" + kneeCol(kneeVal));
    let det = [];
    if (k.before != null) det.push("før " + k.before);
    if (k.during != null) det.push("under " + k.during);
    if (k.after != null)  det.push("etter " + k.after);
    if (det.length) out.push(det.join(" · ") + " | size=11 color=gray");
    if (k.date) out.push(k.date + " | size=11 color=gray");
  } else out.push("Ingen data | color=gray");
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
