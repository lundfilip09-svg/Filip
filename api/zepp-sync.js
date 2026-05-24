// api/zepp-sync.js
// Henter søvndata fra Zepp/Huami sitt API og lagrer i Supabase.
// Vercel Serverless Function — kjøres manuelt eller via cron.
//
// Nødvendige env-variabler i Vercel:
//   ZEPP_EMAIL        — din Zepp-app login e-post
//   ZEPP_PASSWORD     — ditt Zepp-app passord
//   SUPABASE_URL      — f.eks. https://xxxx.supabase.co
//   SUPABASE_ANON_KEY — Supabase anon key

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

const AUTH_URL = 'https://account.huami.com/v2/client/login';
const DATA_URL = 'https://api-mifit-eu2.huami.com/v1/data/band_data.json';

// ── Autentiser med Zepp/Huami ────────────────────────────────────────────────
async function getToken(email, password) {
  const deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });

  const body = new URLSearchParams({
    dn:           'account.huami.com,app-analytics.huami.com,api-user-account.huami.com,app-watch.huami.com',
    app_version:  '4.3.0-play',
    source:       'com.huami.midong',
    app_key:      '2s68a09d3',
    country_code: 'NO',
    device_id:    deviceId,
    grant_type:   'password',
    third_name:   'huami_phone',
    email,
    password,
  });

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth feilet (${res.status}): ${text}`);
  }

  const json = await res.json();

  if (!json.access_token) {
    throw new Error(`Ingen access_token i respons: ${JSON.stringify(json)}`);
  }

  return { token: json.access_token, userId: json.userid ?? json.user_id };
}

// ── Hent søvndata for en gitt dato ──────────────────────────────────────────
async function fetchSleepData(token, userId, date) {
  const url = new URL(DATA_URL);
  url.searchParams.set('query_type',  'summary');
  url.searchParams.set('device_type', '0');
  url.searchParams.set('userid',      userId);
  url.searchParams.set('from_date',   date);
  url.searchParams.set('to_date',     date);

  const res = await fetch(url.toString(), {
    headers: { apptoken: token },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Data-henting feilet (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Dekod base64 summary-felt og trekk ut søvndata ──────────────────────────
function parseSleepFromSummary(summaryB64) {
  if (!summaryB64) return null;

  let json;
  try {
    const decoded = Buffer.from(summaryB64, 'base64').toString('utf8');
    json = JSON.parse(decoded);
  } catch {
    return null;
  }

  const s = json.sleep ?? json.Sleep ?? null;
  if (!s) return null;

  const score    = s.score         ?? s.sleepScore  ?? null;
  const totalMin = s.totalSleepMin ?? s.totalTime   ?? s.duration ?? null;
  const deepMin  = s.deepSleepMin  ?? s.deepTime    ?? s.deep     ?? null;
  const startTs  = s.startSleep    ?? s.sleepTime   ?? null;
  const endTs    = s.stopSleep     ?? s.wakeTime    ?? s.wakeupTime ?? null;

  return { score, totalMin, deepMin, startTs, endTs, raw: s };
}

// ── Lagre i Supabase ─────────────────────────────────────────────────────────
async function saveToSupabase(supabaseUrl, supabaseKey, date, sleepData) {
  const row = {
    date,
    sleep_score: sleepData.score,
    sleep_hours: sleepData.totalMin != null ? +(sleepData.totalMin / 60).toFixed(2) : null,
  };

  const res = await fetch(`${supabaseUrl}/rest/v1/health_data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey':        supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase-lagring feilet: ${text}`);
  }

  return row;
}

// ── Vercel Handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeader('Access-Control-Allow-Origin', '*').end();
  }

  const ZEPP_EMAIL    = process.env.ZEPP_EMAIL;
  const ZEPP_PASSWORD = process.env.ZEPP_PASSWORD;
  const SUPABASE_URL  = process.env.SUPABASE_URL;
  const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!ZEPP_EMAIL || !ZEPP_PASSWORD || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: 'Mangler env-variabler: ZEPP_EMAIL, ZEPP_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY' });
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().slice(0, 10);
  const targetDate = req.query?.date ?? date;

  try {
    console.log(`[zepp-sync] Logger inn som ${ZEPP_EMAIL}`);
    const { token, userId } = await getToken(ZEPP_EMAIL, ZEPP_PASSWORD);
    console.log(`[zepp-sync] Token OK, userId: ${userId}`);

    console.log(`[zepp-sync] Henter data for ${targetDate}`);
    const rawResponse = await fetchSleepData(token, userId, targetDate);
    console.log(`[zepp-sync] Rårespons:`, JSON.stringify(rawResponse));

    const dataArr = rawResponse?.data ?? [];
    if (dataArr.length === 0) {
      return res.status(200).json({ ok: false, message: 'Ingen data for denne datoen', date: targetDate });
    }

    const summaryB64 = dataArr[0]?.summary;
    const sleepData  = parseSleepFromSummary(summaryB64);

    if (!sleepData) {
      return res.status(200).json({ ok: false, message: 'Klarte ikke parse søvndata', raw: summaryB64 });
    }

    console.log(`[zepp-sync] Søvndata:`, JSON.stringify(sleepData));

    const saved = await saveToSupabase(SUPABASE_URL, SUPABASE_KEY, targetDate, sleepData);
    console.log(`[zepp-sync] Lagret:`, JSON.stringify(saved));

    return res.status(200).json({ ok: true, date: targetDate, saved, rawSleep: sleepData.raw });

  } catch (err) {
    console.error(`[zepp-sync] Feil:`, err.message);
    return res.status(500).json({ error: err.message });
  }
}
