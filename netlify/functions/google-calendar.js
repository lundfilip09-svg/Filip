/**
 * Netlify Serverless Function: /.netlify/functions/google-calendar
 *
 * Returns upcoming Google Calendar events (next 14 days) for the authenticated user.
 * Uses the offline refresh token pattern — user authenticates once, token stored in env.
 *
 * Required environment variables (set in Netlify dashboard → Site settings → Environment variables):
 *   GOOGLE_CLIENT_ID      — OAuth 2.0 Client ID from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET  — OAuth 2.0 Client Secret
 *   GOOGLE_REFRESH_TOKEN  — Offline refresh token from one-time consent screen
 *                           (run setup-google-auth.html locally once, paste the token here)
 *   GOOGLE_CALENDAR_ID    — Calendar ID to read (usually "primary" for the default calendar)
 *
 * Returns JSON: { events: [{ id, title, start, end, allDay, calendarId, color }] }
 */

const https = require("https");

const TOKEN_URL    = "https://oauth2.googleapis.com/token";
const CALENDAR_URL = "https://www.googleapis.com/calendar/v3/calendars";

// ── Helpers ──────────────────────────────────────────────────────────────────
function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = typeof body === "string" ? body : JSON.stringify(body);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname, method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded",
                   "Content-Length": Buffer.byteLength(data) } },
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

function httpGet(url, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    https.get(
      { hostname: u.hostname, path: u.pathname + u.search,
        headers: { Authorization: `Bearer ${token}` } },
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

// ── Step 1: Refresh access token ──────────────────────────────────────────────
async function getAccessToken() {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type:    "refresh_token",
  });

  const res = await httpPost(TOKEN_URL, params.toString());
  if (res.status !== 200 || !res.body.access_token) {
    throw new Error(`Google token refresh failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.access_token;
}

// ── Step 2: Fetch events for the next 14 days ─────────────────────────────────
async function fetchEvents(token) {
  const calId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");

  const now     = new Date();
  const in14    = new Date(now);
  in14.setDate(in14.getDate() + 14);

  const params = new URLSearchParams({
    timeMin:      now.toISOString(),
    timeMax:      in14.toISOString(),
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "50",
  });

  const url = `${CALENDAR_URL}/${calId}/events?${params}`;
  const res = await httpGet(url, token);

  if (res.status !== 200) {
    throw new Error(`Google Calendar fetch failed (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.items || [];
}

// ── Step 3: Shape events for the dashboard ────────────────────────────────────
function parseEvents(raw) {
  return raw.map((ev) => {
    const allDay = Boolean(ev.start?.date && !ev.start?.dateTime);
    const start  = ev.start?.dateTime ?? ev.start?.date ?? null;
    const end    = ev.end?.dateTime   ?? ev.end?.date   ?? null;

    return {
      id:         ev.id,
      title:      ev.summary ?? "(No title)",
      start,
      end,
      allDay,
      location:   ev.location ?? null,
      color:      ev.colorId  ?? null, // Google's color ID (1–11)
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    };
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const required = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"];
    const missing  = required.filter((k) => !process.env[k]);
    if (missing.length) {
      return {
        statusCode: 503,
        headers: corsHeaders,
        body: JSON.stringify({ error: `Missing env vars: ${missing.join(", ")}. Set them in Netlify.` }),
      };
    }

    const token  = await getAccessToken();
    const raw    = await fetchEvents(token);
    const events = parseEvents(raw);

    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ events }) };

  } catch (err) {
    console.error("google-calendar error:", err.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
