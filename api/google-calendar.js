// api/google-calendar.js
// Henter ukens Google Calendar-hendelser.
// Vercel Serverless Function.
//
// Nødvendige env-variabler i Vercel:
//   GOOGLE_CLIENT_ID
//   GOOGLE_CLIENT_SECRET
//   GOOGLE_REFRESH_TOKEN
//   GOOGLE_CALENDAR_ID (valgfri, default: 'primary')

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_BASE  = 'https://www.googleapis.com/calendar/v3';

// Cache tokenet i module-scope — overlever warm Vercel-instanser (unngår unødvendig token-refresh)
let _cachedToken = null;
let _tokenExpiry = 0;

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
  // Bruk cachet token om det er gyldig i minst 5 min til
  if (_cachedToken && Date.now() < _tokenExpiry - 5 * 60 * 1000) {
    return _cachedToken;
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  _cachedToken = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  return _cachedToken;
}

async function fetchEvents(token, calId, timeMin, timeMax, maxResults) {
  const url = `${CAL_BASE}/calendars/${encodeURIComponent(calId)}/events` +
    `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;
  const calRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!calRes.ok) throw new Error(`Calendar fetch failed: ${await calRes.text()}`);
  const data = await calRes.json();
  return data.items || [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  const GOOGLE_CALENDAR_ID   = process.env.GOOGLE_CALENDAR_ID || 'primary';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return res.status(503).json({ error: 'Google Calendar env vars not configured' });
  }

  try {
    const token = await refreshAccessToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN);

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const [today, upcoming] = await Promise.all([
      fetchEvents(token, GOOGLE_CALENDAR_ID, now.toISOString(), endOfDay.toISOString(), 10),
      fetchEvents(token, GOOGLE_CALENDAR_ID, now.toISOString(), sevenDays.toISOString(), 20),
    ]);

    return res.status(200).json({ today, upcoming });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
