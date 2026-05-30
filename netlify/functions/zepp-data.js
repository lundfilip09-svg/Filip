/**
 * Netlify Serverless Function: /.netlify/functions/zepp-data
 *
 * Fetches today's health metrics from the Zepp Health Open Platform API.
 * Uses a stored refresh token to obtain a new access token on each call.
 *
 * Required environment variables (set in Netlify dashboard → Site settings → Environment variables):
 *   ZEPP_APP_ID         — Your App ID from developer.zepp.com
 *   ZEPP_APP_SECRET     — Your App Secret from developer.zepp.com
 *   ZEPP_REFRESH_TOKEN  — Long-lived refresh token obtained via the one-time OAuth setup
 *                         (run setup-zepp-auth.html locally once, paste the token here)
 *
 * Returns JSON: { sleep: { hours, score, deepMin, remMin }, rhr, hrv, steps, battery, timestamp }
 */

const https = require("https");

// ── Zepp API base URLs (verify latest at developer.zepp.com) ─────────────────
const TOKEN_URL  = "https://account.zepp.com/oauth2/token";
const SLEEP_URL  = "https://open-api.zepp.com/health/v1/sleep/daily";
const HR_URL     = "https://open-api.zepp.com/health/v1/heart_rate/daily";
const ACTIVITY_URL = "https://open-api.zepp.com/health/v1/activity/daily";
const PAI_URL    = "https://open-api.zepp.com/health/v1/pai/daily"; // body battery equivalent

// ── Helpers ──────────────────────────────────────────────────────────────────
function httpPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = typeof body === "string" ? body : JSON.stringify(body);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded",
                   "Content-Length": Buffer.byteLength(data), ...headers } },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get(
      { hostname: u.hostname, path: u.pathname + u.search, headers },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      }
    ).on("error", reject);
  });
}

function todayString() {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function msTimestamp(dateStr) {
  return new Date(dateStr).getTime();
}

// ── Step 1: Refresh access token ──────────────────────────────────────────────
async function getAccessToken() {
  const params = new URLSearchParams({
    grant_type:    "refresh_token",
    refresh_token: process.env.ZEPP_REFRESH_TOKEN,
    client_id:     process.env.ZEPP_APP_ID,
    client_secret: process.env.ZEPP_APP_SECRET,
  });

  const res = await httpPost(TOKEN_URL, params.toString());
  if (res.status !== 200 || !res.body.access_token) {
    throw new Error(`Token refresh failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.access_token;
}

// ── Step 2: Fetch endpoints in parallel ──────────────────────────────────────
async function fetchAll(token) {
  const today = todayString();
  const from  = msTimestamp(today);
  const to    = from + 86399999; // end of day

  const authHeader = { Authorization: `Bearer ${token}` };

  const [sleepRes, hrRes, actRes, paiRes] = await Promise.allSettled([
    httpGet(`${SLEEP_URL}?from_date=${today}&to_date=${today}`, authHeader),
    httpGet(`${HR_URL}?from_date=${today}&to_date=${today}`, authHeader),
    httpGet(`${ACTIVITY_URL}?from_date=${today}&to_date=${today}`, authHeader),
    httpGet(`${PAI_URL}?from_date=${today}&to_date=${today}`, authHeader),
  ]);

  return { sleepRes, hrRes, actRes, paiRes };
}

// ── Step 3: Parse responses into dashboard-friendly shape ─────────────────────
function parseData({ sleepRes, hrRes, actRes, paiRes }) {
  // Sleep
  let sleep = { hours: null, score: null, deepMin: null, remMin: null };
  if (sleepRes.status === "fulfilled" && sleepRes.value.status === 200) {
    const s = sleepRes.value.body?.data?.[0] || {};
    sleep = {
      hours:   s.total_sleep_time != null ? +(s.total_sleep_time / 60).toFixed(1) : null,
      score:   s.sleep_score ?? null,
      deepMin: s.deep_sleep_time ?? null,
      remMin:  s.rem_sleep_time  ?? null,
    };
  }

  // Resting heart rate
  let rhr = null;
  if (hrRes.status === "fulfilled" && hrRes.value.status === 200) {
    const h = hrRes.value.body?.data?.[0] || {};
    rhr = h.resting_hr ?? h.min_hr ?? null;
  }

  // Steps + HRV
  let steps = null;
  let hrv   = null;
  if (actRes.status === "fulfilled" && actRes.value.status === 200) {
    const a = actRes.value.body?.data?.[0] || {};
    steps = a.steps ?? null;
    hrv   = a.hrv   ?? null; // some Zepp devices report HRV here
  }

  // PAI / body battery (Zepp calls this PAI score 0–100)
  let battery = null;
  if (paiRes.status === "fulfilled" && paiRes.value.status === 200) {
    const p = paiRes.value.body?.data?.[0] || {};
    battery = p.pai_score ?? p.today_pai ?? null;
  }

  return { sleep, rhr, hrv, steps, battery, timestamp: new Date().toISOString() };
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    if (!process.env.ZEPP_APP_ID || !process.env.ZEPP_APP_SECRET || !process.env.ZEPP_REFRESH_TOKEN) {
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Zepp env vars not configured. Set ZEPP_APP_ID, ZEPP_APP_SECRET, ZEPP_REFRESH_TOKEN in Netlify." }),
      };
    }

    const token = await getAccessToken();
    const raw   = await fetchAll(token);
    const data  = parseData(raw);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(data) };

  } catch (err) {
    console.error("zepp-data error:", err.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
