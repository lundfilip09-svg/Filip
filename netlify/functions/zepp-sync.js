/**
 * Netlify Serverless Function: /.netlify/functions/zepp-sync
 *
 * Autentiserer mot Huami/Zepp sitt API med e-post og passord,
 * og henter søvndata direkte — uten OAuth eller Mini Program.
 *
 * Required environment variables (Netlify Dashboard → Site → Environment Variables):
 *   ZEPP_EMAIL     — E-posten du bruker i Zepp-appen
 *   ZEPP_PASSWORD  — Passordet ditt i Zepp-appen
 *
 * Usage:
 *   GET /.netlify/functions/zepp-sync           → henter dagens data
 *   GET /.netlify/functions/zepp-sync?date=2026-05-23 → spesifikk dato
 */

const https = require("https");

const AUTH_URL  = "https://user-fit.huami.com/v1/user/login";
const SLEEP_URL = "https://api-mifit-no.huami.com/v1/data/band_data.json";

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function httpPost(url, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const data = typeof body === "string" ? body : new URLSearchParams(body).toString();
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(data),
        "User-Agent": "MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)",
        ...extraHeaders,
      },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: raw, headers: res.headers }); }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpGet(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: {
        "User-Agent": "MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)",
        ...extraHeaders,
      },
    };
    https.get(opts, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    }).on("error", reject);
  });
}

// ── Step 1: Logg inn og hent token ────────────────────────────────────────────
async function login() {
  const res = await httpPost(AUTH_URL, {
    email: process.env.ZEPP_EMAIL,
    password: process.env.ZEPP_PASSWORD,
    grant_type: "password",
    source: "com.xiaomi.mifit",
    device_id: "02:00:00:00:00:00",
    third_name: "huami_phone",
  });

  console.log("Auth response status:", res.status);
  console.log("Auth response body:", JSON.stringify(res.body));

  if (res.status !== 200) {
    throw new Error(`Login feilet (${res.status}): ${JSON.stringify(res.body)}`);
  }

  const token = res.body?.token_info?.login_token
    || res.body?.login_token
    || res.body?.access_token
    || res.body?.token;

  if (!token) {
    throw new Error(`Token ikke funnet i svar: ${JSON.stringify(res.body)}`);
  }

  return token;
}

// ── Step 2: Hent søvndata ─────────────────────────────────────────────────────
async function fetchSleep(token, dateStr) {
  const url = `${SLEEP_URL}?query_type=sleep&device_type=0&source=1&from_date=${dateStr}&to_date=${dateStr}&apptoken=${token}`;
  const res = await httpGet(url);

  console.log("Sleep response status:", res.status);
  console.log("Sleep response body:", JSON.stringify(res.body));

  return res;
}

// ── Step 3: Parse søvndata ────────────────────────────────────────────────────
function parseSleep(raw) {
  try {
    const data = raw?.data?.sleep?.[0] || raw?.items?.[0] || raw?.sleep?.[0] || {};
    return {
      totalMin:  data.totalTime || data.sleep_total || null,
      deepMin:   data.deepTime  || data.sleep_deep  || null,
      remMin:    data.remTime   || data.sleep_rem   || null,
      score:     data.score     || data.sleep_score || null,
      startTime: data.startTime || data.start       || null,
      endTime:   data.endTime   || data.stop        || null,
    };
  } catch {
    return { raw };
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (!process.env.ZEPP_EMAIL || !process.env.ZEPP_PASSWORD) {
    return {
      statusCode: 503,
      headers: cors,
      body: JSON.stringify({ error: "ZEPP_EMAIL og ZEPP_PASSWORD mangler i Netlify env vars." }),
    };
  }

  const dateStr = event.queryStringParameters?.date
    || new Date().toISOString().slice(0, 10);

  try {
    const token = await login();
    const sleepRaw = await fetchSleep(token, dateStr);
    const sleep = parseSleep(sleepRaw.body);

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        date: dateStr,
        sleep,
        _raw: sleepRaw.body, // fjern denne når alt fungerer
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (err) {
    console.error("zepp-sync error:", err.message);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
