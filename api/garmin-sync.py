# api/garmin-sync.py
# Henter helsedata fra Garmin Connect og lagrer i Supabase.
# Cron: kl. 07:45 norsk tid (05:45 UTC) hver dag.
#
# Logikk:
#   - Uten ?date: backfiller de SISTE 7 DAGENE (i dag + 6 bakover). Datoer som
#     allerede har søvndata i Supabase hoppes over, så Garmin-innlogging skjer
#     bare når minst én dag mangler. Logger inn ÉN gang for hele intervallet.
#   - Søvndata lagres under oppvåkningsdatoen; daglig statistikk (RHR, HRV, skritt,
#     body battery) hentes for samme dato.
#   - Støtter ?date=YYYY-MM-DD for manuell kjøring på én spesifikk dato
#   - ?force=1 henter på nytt selv om dataene finnes
#
# Env-variabler i Vercel:
#   GARMIN_EMAIL, GARMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import datetime
import urllib.request
import urllib.error
import traceback

DESKTOP_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36"
)


def ts_to_hhmm(ms_timestamp):
    try:
        if not ms_timestamp:
            return None
        dt = datetime.datetime.fromtimestamp(ms_timestamp / 1000, tz=datetime.timezone.utc)
        return dt.strftime("%H:%M")
    except Exception:
        return None


def garmin_login(email, password):
    from garminconnect import Garmin
    garmin = Garmin(email.strip(), password.strip())
    try:
        if hasattr(garmin, "garth") and hasattr(garmin.garth, "sess"):
            garmin.garth.sess.headers.update({"User-Agent": DESKTOP_UA})
        elif hasattr(garmin, "session"):
            garmin.session.headers.update({"User-Agent": DESKTOP_UA})
    except Exception:
        pass
    garmin.login()
    return garmin


def fetch_for_date(garmin, save_date):
    """Henter søvn/HRV/RHR/body battery for ÉN dato fra en allerede innlogget
    garmin-klient. Søvn lagres under oppvåkningsdatoen (= save_date)."""
    # Søvn hentes fra datoen du VÅKNET – Garmin lagrer søvn under oppvåkningsdatoen
    sleep_date = save_date
    stats_date = save_date
    result = {"date": save_date}

    # ── Søvn ────────────────────────────────────────────────────────────────
    try:
        sleep = garmin.get_sleep_data(sleep_date)
        dto   = sleep.get("dailySleepDTO", {})

        def sec_to_min(s):
            return round(s / 60) if s else None

        total_sec = dto.get("sleepTimeSeconds") or 0
        # Fallback: sum opp fasene hvis totalverdien mangler
        if not total_sec:
            total_sec = sum(filter(None, [
                dto.get("deepSleepSeconds"),
                dto.get("lightSleepSeconds"),
                dto.get("remSleepSeconds"),
                dto.get("awakeSleepSeconds"),
            ]))
        if total_sec > 0:
            result["sleep_hours"] = round(total_sec / 3600, 2)

        deep  = sec_to_min(dto.get("deepSleepSeconds"))
        light = sec_to_min(dto.get("lightSleepSeconds"))
        rem   = sec_to_min(dto.get("remSleepSeconds"))
        awake = sec_to_min(dto.get("awakeSleepSeconds"))

        if deep  is not None: result["deep_sleep_minutes"]  = deep
        if light is not None: result["light_sleep_minutes"] = light
        if rem   is not None: result["rem_sleep_minutes"]   = rem
        if awake is not None: result["awake_minutes"]       = awake

        start_ts = dto.get("sleepStartTimestampLocal") or dto.get("sleepStartTimestampGMT")
        end_ts   = dto.get("sleepEndTimestampLocal")   or dto.get("sleepEndTimestampGMT")
        if start_ts: result["sleep_start"] = ts_to_hhmm(start_ts)
        if end_ts:   result["sleep_end"]   = ts_to_hhmm(end_ts)

        try:
            score = dto["sleepScores"]["overall"]["value"]
            if score: result["sleep_score"] = score
        except (KeyError, TypeError):
            pass

    except Exception:
        result["_sleep_error"] = traceback.format_exc()

    # ── Daglig statistikk ────────────────────────────────────────────────────
    try:
        stats = garmin.get_stats(stats_date)
        if stats.get("restingHeartRate"):
            result["rhr"] = stats["restingHeartRate"]
        if stats.get("totalSteps"):
            result["steps"] = stats["totalSteps"]
    except Exception:
        result["_stats_error"] = traceback.format_exc()

    # ── HRV ─────────────────────────────────────────────────────────────────
    try:
        hrv_data = garmin.get_hrv_data(sleep_date)
        summary  = hrv_data.get("hrvSummary", {})
        hrv_val  = (
            summary.get("lastNightAvg") or
            summary.get("lastNight") or
            summary.get("weekly5DayAverage")
        )
        if hrv_val:
            result["hrv"] = hrv_val
    except Exception:
        result["_hrv_error"] = traceback.format_exc()

    # ── Body Battery ─────────────────────────────────────────────────────────
    # Primært: Garmins daglige sammendrag har ferdige felt (ingen array-parsing).
    #   bodyBatteryHighestValue   = dagens topp (morgenverdien etter søvn)
    #   bodyBatteryMostRecentValue = siste avlesning
    # Vi bruker toppen: konsistent på tvers av backfill-dager og matcher klokka
    # når du sjekker om morgenen. Fallback til detalj-arrayen hvis sammendraget
    # mangler feltet (kan skje tidlig på dagen før Garmin har syncet).
    try:
        bb_val = None
        try:
            summary = garmin.get_stats(stats_date)
            if isinstance(summary, dict):
                bb_val = (
                    summary.get("bodyBatteryHighestValue")
                    or summary.get("bodyBatteryMostRecentValue")
                    or summary.get("bodyBatteryAtWakeTime")
                )
        except Exception:
            result["_bb_summary_error"] = traceback.format_exc()

        # Hele dagens kurve. Tett serie (~hvert 3. min) ligger i dailyStress-
        # endepunktet sin bodyBatteryValuesArray ([timestamp_ms, nivå]) — samme
        # kall vi bruker til stress-snittet. get_body_battery (reports/daily)
        # gir bare en grov hendelsesserie (~6 punkter), så den brukes kun som
        # fallback. Hvert punkt lagres som [epoch_sekunder_GMT, nivå].
        curve = []
        try:
            stress = garmin.get_stress_data(stats_date)
        except Exception:
            stress = None
            result["_stress_error"] = traceback.format_exc()
        if isinstance(stress, dict):
            for p in stress.get("bodyBatteryValuesArray") or []:
                if not isinstance(p, list) or len(p) < 2:
                    continue
                ts = p[0]
                # Format: [timestamp_ms, status, nivå, versjon]. Nivået er
                # heltallet 0–100 (versjon er en float som 3.0, status en
                # streng/kode) — plukk det robust uten å treffe versjonen.
                if len(p) >= 3:
                    lvl = p[2]
                else:
                    lvl = p[1]
                if isinstance(ts, (int, float)) and isinstance(lvl, int) and 0 <= lvl <= 100:
                    curve.append([int(ts // 1000), int(lvl)])
            avg = stress.get("avgStressLevel")
            if avg is not None and avg >= 0:
                result["stress_avg"] = avg

            # Stress-kurven ligger i SAMME respons — [timestamp_ms, nivå].
            # Garmin bruker negative nivåer som sentinel: -1 = klokka målte
            # ikke (av/ladet), -2 = for lite data til å beregne. De skal IKKE
            # bli 0 i grafen (0 betyr "helt rolig"), så de droppes helt og
            # etterlater et hull Chart.js hopper over med spanGaps.
            stress_curve = []
            for p in stress.get("stressValuesArray") or []:
                if not isinstance(p, list) or len(p) < 2:
                    continue
                ts, lvl = p[0], p[1]
                if isinstance(ts, (int, float)) and isinstance(lvl, (int, float)) and 0 <= lvl <= 100:
                    stress_curve.append([int(ts // 1000), int(lvl)])
            if stress_curve:
                stress_curve.sort(key=lambda x: x[0])
                result["stress_curve"] = stress_curve

        # Fallback: grov serie fra reports/daily hvis dailyStress mangler kurve.
        if not curve:
            bb_list = garmin.get_body_battery(stats_date)
            if bb_list and isinstance(bb_list, list):
                for entry in bb_list:
                    if not isinstance(entry, dict):
                        continue
                    ts_idx, lvl_idx = 0, None
                    for d in entry.get("bodyBatteryValueDescriptorDTOList") or []:
                        if not isinstance(d, dict):
                            continue
                        key = d.get("bodyBatteryValueDescriptorKey")
                        idx = d.get("bodyBatteryValueDescriptorIndex")
                        if key == "bodyBatteryLevel":
                            lvl_idx = idx
                        elif key == "timestamp":
                            ts_idx = idx
                    for p in entry.get("bodyBatteryValuesArray") or []:
                        if not isinstance(p, list) or len(p) <= ts_idx:
                            continue
                        if lvl_idx is not None and len(p) > lvl_idx:
                            lvl = p[lvl_idx]
                        else:
                            nums = [x for x in p[1:] if isinstance(x, (int, float)) and 0 <= x <= 100]
                            lvl = nums[-1] if nums else None
                        ts = p[ts_idx]
                        if isinstance(lvl, (int, float)) and isinstance(ts, (int, float)):
                            curve.append([int(ts // 1000), int(lvl)])

        curve.sort(key=lambda x: x[0])
        if curve:
            result["body_battery_curve"] = curve
            if bb_val is None:
                bb_val = max(lvl for _, lvl in curve)  # dagens topp

        if isinstance(bb_val, (int, float)) and bb_val > 0:
            result["body_battery"] = round(bb_val)
    except Exception:
        result["_bb_error"] = traceback.format_exc()

    return result


def save_to_supabase(row):
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    clean = {k: v for k, v in row.items() if not k.startswith("_")}
    data  = json.dumps(clean).encode("utf-8")
    req   = urllib.request.Request(
        f"{supabase_url}/rest/v1/health_data?on_conflict=date",
        data=data,
        headers={
            "Content-Type":  "application/json",
            "apikey":        supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Prefer":        "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        # urlopen kaster på 4xx/5xx og forkaster responskroppen — som er der
        # PostgREST faktisk forklarer hva som er galt ("column X does not
        # exist", PGRST204, ...). Uten dette bobler kun "HTTP Error 400: Bad
        # Request" opp, og en manglende migrasjon ser identisk ut som en
        # ugyldig verdi. Les kroppen og ta den med i feilmeldingen.
        try:
            detail = e.read().decode("utf-8", "replace")[:500]
        except Exception:
            detail = "(kunne ikke lese responskropp)"
        raise RuntimeError(f"Supabase {e.code}: {detail}") from None


def already_has_sleep(date_str):
    """True hvis health_data for datoen allerede har søvndata (sleep_hours/sleep_score).
    Brukes som vakt så 30-min-polling ikke logger inn i Garmin i unødvendig."""
    try:
        supabase_url = os.environ["SUPABASE_URL"]
        supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    except KeyError:
        return False
    url = f"{supabase_url}/rest/v1/health_data?date=eq.{date_str}&select=sleep_hours,sleep_score"
    req = urllib.request.Request(url, headers={
        "apikey":        supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            rows = json.loads(resp.read().decode("utf-8"))
        if isinstance(rows, list) and rows:
            r = rows[0]
            return bool(r.get("sleep_hours") or r.get("sleep_score"))
    except Exception:
        return False
    return False


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Les valgfri ?date=YYYY-MM-DD og ?force=1 fra URL
        target_date = None
        force = False
        provided_key = None
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            if "date" in params:
                target_date = params["date"][0]
            if "force" in params and params["force"][0] in ("1", "true", "yes"):
                force = True
            if "key" in params:
                provided_key = params["key"][0]
        except Exception:
            pass

        # Valgfri beskyttelse: er env-variabelen SYNC_KEY satt, må ?key=… matche.
        # AV som standard (bakoverkompatibelt) — app, cron og manuell henting funker uendret.
        required_key = os.environ.get("SYNC_KEY")
        if required_key and provided_key != required_key:
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": "forbidden"}).encode("utf-8"))
            return

        # Datoer som skal sjekkes:
        #   ?date=YYYY-MM-DD → bare den dagen.
        #   ellers           → de siste 5 dagene (i dag + 4 bakover) for backfill.
        if target_date:
            dates = [target_date]
        else:
            t0 = datetime.date.today()
            dates = [(t0 - datetime.timedelta(days=i)).isoformat() for i in range(7)]

        # Hopp over datoer som allerede har søvndata (med mindre ?force=1).
        # UNNTAK: i dag + i går hentes ALLTID. Body battery-kurve og skritt
        # akkumulerer gjennom hele døgnet, så de er ufullstendige til dagen er
        # over. I går er ferdig først ved denne morgenkjøringen → da får vi full
        # 24t-kurve og endelig skrittsum. Eldre dager hoppes over når søvn finnes
        # (sparer unødig Garmin-login).
        t0          = datetime.date.today()
        always      = {t0.isoformat(), (t0 - datetime.timedelta(days=1)).isoformat()}
        to_fetch    = [d for d in dates
                       if force or d in always or not already_has_sleep(d)]

        if not to_fetch:
            body = json.dumps({"ok": True, "skipped": "already_have_sleep", "dates": dates}, indent=2)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body.encode("utf-8"))
            return

        try:
            email    = os.environ["GARMIN_EMAIL"].strip()
            password = os.environ["GARMIN_PASSWORD"].strip()
            garmin   = garmin_login(email, password)   # logg inn ÉN gang for hele intervallet

            saved, skipped_no_sleep, warnings = [], [], {}
            for d in sorted(to_fetch):                 # eldste dato først
                row    = fetch_for_date(garmin, d)
                public = {k: v for k, v in row.items() if not k.startswith("_")}
                for k, v in row.items():
                    if k.startswith("_"):
                        warnings[f"{d}{k}"] = v
                # Lagre når vi har MENINGSFULL data. Søvn er ikke lenger et krav:
                # body battery-kurve og skritt skal med selv på netter uten klokke.
                # Upserten merger kun feltene som faktisk finnes i payloaden, så en
                # delvis henting nuller aldri ut eksisterende kolonner.
                if (public.get("sleep_hours") or public.get("sleep_score")
                        or public.get("body_battery_curve") or public.get("stress_curve")
                        or public.get("steps")):
                    save_to_supabase(row)
                    saved.append(public)
                else:
                    skipped_no_sleep.append(d)

            body = json.dumps({"ok": True, "saved": saved,
                               "skipped_no_sleep": skipped_no_sleep,
                               "warnings": warnings}, indent=2)
            self.send_response(200)
        except Exception as e:
            body = json.dumps({"ok": False, "error": str(e), "trace": traceback.format_exc()}, indent=2)
            self.send_response(500)

        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def log_message(self, format, *args):
        pass
