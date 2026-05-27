# api/garmin-sync.py
# Henter helsedata fra Garmin Connect og lagrer i Supabase.
# Vercel Serverless Function — kjøres automatisk via cron kl. 07:00 norsk tid (05:00 UTC).
#
# Nødvendige env-variabler i Vercel:
#   GARMIN_EMAIL              — din Garmin Connect e-post
#   GARMIN_PASSWORD           — ditt Garmin Connect passord
#   SUPABASE_URL              — f.eks. https://xxxx.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key

from http.server import BaseHTTPRequestHandler
import json
import os
import datetime
import urllib.request


def ts_to_hhmm(ms_timestamp):
    """Konverter millisekund-timestamp (lokal tid) til HH:MM-streng."""
    try:
        if not ms_timestamp:
            return None
        dt = datetime.datetime.fromtimestamp(ms_timestamp / 1000, tz=datetime.timezone.utc)
        return dt.strftime("%H:%M")
    except Exception:
        return None


def fetch_garmin_data():
    from garminconnect import Garmin

    email    = os.environ["GARMIN_EMAIL"]
    password = os.environ["GARMIN_PASSWORD"]

    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()

    garmin = Garmin(email, password)
    garmin.login()

    result = {"date": yesterday}

    # ── Søvn (total + faser) ────────────────────────────────────────────────
    try:
        sleep = garmin.get_sleep_data(yesterday)
        dto   = sleep.get("dailySleepDTO", {})

        def sec_to_min(s):
            return round(s / 60) if s else None

        total_sec = dto.get("sleepTimeSeconds") or 0
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

        # Innsovnings- og oppvåkningstid
        start_ts = dto.get("sleepStartTimestampLocal") or dto.get("sleepStartTimestampGMT")
        end_ts   = dto.get("sleepEndTimestampLocal")   or dto.get("sleepEndTimestampGMT")
        if start_ts: result["sleep_start"] = ts_to_hhmm(start_ts)
        if end_ts:   result["sleep_end"]   = ts_to_hhmm(end_ts)

        # Søvnscore
        try:
            score = dto["sleepScores"]["overall"]["value"]
            if score: result["sleep_score"] = score
        except (KeyError, TypeError):
            pass

    except Exception as e:
        result["_sleep_error"] = str(e)

    # ── Daglig statistikk (RHR, skritt) ─────────────────────────────────────
    try:
        stats = garmin.get_stats(yesterday)
        if stats.get("restingHeartRate"):
            result["rhr"] = stats["restingHeartRate"]
        if stats.get("totalSteps"):
            result["steps"] = stats["totalSteps"]
    except Exception as e:
        result["_stats_error"] = str(e)

    # ── HRV ─────────────────────────────────────────────────────────────────
    try:
        hrv_data = garmin.get_hrv_data(yesterday)
        hrv_val  = hrv_data.get("hrvSummary", {}).get("lastNight")
        if hrv_val: result["hrv"] = hrv_val
    except Exception as e:
        result["_hrv_error"] = str(e)

    # ── Body Battery ─────────────────────────────────────────────────────────
    try:
        bb_list = garmin.get_body_battery(yesterday)
        if bb_list and isinstance(bb_list, list):
            vals = [
                entry.get("charged") or entry.get("value") or entry.get("bodyBattery")
                for entry in bb_list if isinstance(entry, dict)
            ]
            vals = [v for v in vals if v is not None]
            if vals: result["body_battery"] = max(vals)
    except Exception as e:
        result["_bb_error"] = str(e)

    return result


def save_to_supabase(row):
    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    clean = {k: v for k, v in row.items() if not k.startswith("_")}

    data = json.dumps(clean).encode("utf-8")
    req  = urllib.request.Request(
        f"{supabase_url}/rest/v1/health_data",
        data=data,
        headers={
            "Content-Type":  "application/json",
            "apikey":        supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Prefer":        "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            row    = fetch_garmin_data()
            save_to_supabase(row)
            # Returner data uten interne feilnøkler
            public = {k: v for k, v in row.items() if not k.startswith("_")}
            errors = {k: v for k, v in row.items() if k.startswith("_")}
            body   = json.dumps({"ok": True, "data": public, "warnings": errors})
            self.send_response(200)
        except Exception as e:
            body = json.dumps({"ok": False, "error": str(e)})
            self.send_response(500)

        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def log_message(self, format, *args):
        pass
