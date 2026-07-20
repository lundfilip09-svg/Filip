#!/usr/bin/env bash
# Backfill stress_curve for de siste N dagene.
#
# Hvorfor et shell-script og ikke ny serverkode: /api/garmin-sync tar allerede
# ?date=YYYY-MM-DD&force=1 og henter én dag. Å loope over datoer her gir null
# ny kode i api/ — og dermed null ny angrepsflate og ingenting nytt å vedlikeholde.
#
# force=1 er nødvendig: uten den hopper syncen over dager som allerede har
# søvndata, og det er nettopp de dagene som mangler stress.
#
# Bruk:
#   ./scripts/backfill-stress.sh              # siste 30 dager
#   ./scripts/backfill-stress.sh 14           # siste 14 dager
#   SYNC_KEY=xxx ./scripts/backfill-stress.sh # hvis SYNC_KEY er satt i Vercel
#
# Rate limits: Garmin logger inn på nytt per kall og tåler dette dårlig hvis du
# maser. 8 sekunders pause mellom hver dag er bevisst konservativt — 30 dager
# tar ca. 5–6 minutter. Ikke senk den for å spare tid; blir du utestengt av
# Garmin må du vente timer, og da stopper også den daglige 07:45-syncen.

# Ingen -e: scriptet SKAL fortsette gjennom dager som feiler.
# Ingen pipefail: hver eneste sjekk her er `echo "$x" | grep -q ...`, og med
# pipefail endres exit-koden til pipen på måter som gjør betingelsene
# vanskeligere å resonnere om enn de er verdt i et script som dette.
set -u

DOMAIN="${DOMAIN:-https://filip-vita.vercel.app}"
DAYS="${1:-30}"
PAUSE="${PAUSE:-8}"
KEY_PARAM=""
[ -n "${SYNC_KEY:-}" ] && KEY_PARAM="&key=${SYNC_KEY}"

if ! [[ "$DAYS" =~ ^[0-9]+$ ]] || [ "$DAYS" -lt 1 ] || [ "$DAYS" -gt 90 ]; then
  echo "Ugyldig antall dager: $DAYS (må være 1–90)" >&2
  exit 1
fi

# macOS (BSD date) og Linux (GNU date) har ulik syntaks for datoaritmetikk.
date_n_days_ago() {
  if date -v-1d +%F >/dev/null 2>&1; then
    date -v-"$1"d +%F          # BSD / macOS
  else
    date -d "$1 days ago" +%F  # GNU / Linux
  fi
}

echo "Backfiller stress for siste $DAYS dager mot $DOMAIN"
echo "Pause mellom kall: ${PAUSE}s → estimert $(( DAYS * PAUSE / 60 )) min $(( DAYS * PAUSE % 60 ))s"
echo

ok=0; fail=0; nostress=0
consec_fail=0

# Kjenner igjen "kolonnen finnes ikke"-feilen og stopper med en beskjed som
# sier hva som er galt. Uten dette bruker scriptet 4 minutter på å feile 30
# ganger på rad med en rå Postgres-traceback — som er nøyaktig det som skjedde
# første gang: deploy skjedde før migrasjon 075 var kjørt.
# is_schema_error <respons> → 0 hvis responsen er en ekte "kolonnen mangler"-feil.
#
# MÅ kalles først etter at "ok": true er utelukket, og MÅ aldri matche på
# feltnavnet stress_curve. Første versjon gjorde nettopp det — og siden en
# VELLYKKET henting returnerer "stress_curve": [[...]] som data, slo detektoren
# ut på suksess og påsto at migrasjonen manglet. Migrasjonen var kjørt hele
# tiden. Match kun på Postgres/PostgREST sine faktiske feilkoder.
is_schema_error() {
  echo "$1" | grep -qi 'PGRST204\|42703\|schema cache\|does not exist\|Could not find the .* column'
}

schema_hint() {
  cat >&2 <<'MSG'

  ── STOPP: databasen mangler stress_curve-kolonnen ──────────────────────
  Migrasjon 075 er ikke kjørt ennå. Kjør denne i Supabase SQL Editor:

      ALTER TABLE public.health_data ADD COLUMN IF NOT EXISTS stress_curve jsonb;

  Kjør så dette scriptet på nytt. force=1 gjør det trygt å gjenta dagene
  som allerede gikk gjennom.
  ────────────────────────────────────────────────────────────────────────
MSG
}

# Ingen preflight-sjekk her, med vilje.
#
# Den fantes i en tidligere versjon og blokkerte fire kjøringer på rad mot en
# API som svarte HTTP 200 med "ok": true. Den fanget aldri en ekte feil.
# Løkka under har 5-på-rad-sikringen, som dekker nøyaktig samme scenario
# (manglende kolonne feiler likt hver dag) uten å kunne stoppe en backfill som
# faktisk virker. En vakthund som gir falske positiver er verre enn ingen
# vakthund: den koster tillit hver gang den bjeffer på riktig svar.

# Start på i går (dag 1) — i dag er ufullstendig og hentes uansett 07:45.
for i in $(seq 1 "$DAYS"); do
  d=$(date_n_days_ago "$i")
  printf '%s  ' "$d"

  resp=$(curl -sS --max-time 120 "${DOMAIN}/api/garmin-sync?date=${d}&force=1${KEY_PARAM}" 2>&1)

  if echo "$resp" | grep -q '"ok": *true'; then
    consec_fail=0
    if echo "$resp" | grep -q '"stress_curve"'; then
      # Tell punkter i stress_curve. MÅ gjøres uavhengig av linjeskift:
      # syncen svarer med json.dumps(indent=2), som legger hvert tall i paret
      # på sin egen linje. Et grep-mønster som forventer "[ts, lvl]" på ÉN
      # linje matcher aldri og rapporterer 0 selv når kurven er full.
      # python3 finnes på enhver Mac; faller tilbake til "?" hvis parsing feiler.
      pts=$(printf '%s' "$resp" | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
    n = sum(len(r.get("stress_curve") or []) for r in d.get("saved") or [])
    print(n)
except Exception:
    print("?")
' 2>/dev/null || echo "?")
      echo "OK  (${pts} stresspunkter)"
      ok=$((ok+1))
    else
      echo "OK, men ingen stressdata (klokka av / ikke båret?)"
      nostress=$((nostress+1))
    fi
  else
    fail=$((fail+1))
    consec_fail=$((consec_fail+1))

    # Manglende kolonne: feiler likt for hver eneste dag. Stopp umiddelbart.
    if is_schema_error "$resp"; then
      echo "FEIL (skjema)"
      schema_hint
      exit 2
    fi

    echo "FEIL"
    echo "$resp" | head -c 300 | sed 's/^/      /'
    echo

    # Generisk sikring: 5 på rad betyr noe systemisk (nede, utlogget,
    # rate-limited), ikke en enkelt dårlig dag. Ikke bruk 4 min på å bekrefte.
    if [ "$consec_fail" -ge 5 ]; then
      echo >&2
      echo "  ── STOPP: 5 feil på rad. Noe systemisk er galt (Vercel nede," >&2
      echo "     Garmin-utlogging eller rate limit). Sjekk feilen over." >&2
      exit 3
    fi
  fi

  [ "$i" -lt "$DAYS" ] && sleep "$PAUSE"
done

echo
echo "Ferdig: $ok med stress, $nostress uten stressdata, $fail feilet."
[ "$fail" -gt 0 ] && echo "Kjør scriptet på nytt for de feilede dagene — force=1 gjør det trygt å gjenta."
exit 0
