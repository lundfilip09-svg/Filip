// api/kalender.js
// Fetches Google Calendar events for an arbitrary date range.
// Query params: ?start=YYYY-MM-DD&end=YYYY-MM-DD

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_BASE  = 'https://www.googleapis.com/calendar/v3';

async function refreshAccessToken(clientId, clientSecret, refreshToken) {
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
  return (await res.json()).access_token;
}

async function fetchRange(token, calId, timeMin, timeMax) {
  const url = `${CAL_BASE}/calendars/${encodeURIComponent(calId)}/events` +
    `?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=200`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error(`Calendar fetch failed: ${await r.text()}`);
  return (await r.json()).items || [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
          GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN)
    return res.status(503).json({ error: 'Google Calendar env vars not configured' });

  try {
    const { start, end } = req.query;
    const startDate = start ? new Date(start + 'T00:00:00') : (() => {
      const d = new Date(); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d;
    })();
    const endDate = end ? new Date(end + 'T23:59:59') : new Date(startDate.getTime() + 42 * 86400000);

    const token  = await refreshAccessToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN);
    const events = await fetchRange(token, GOOGLE_CALENDAR_ID, startDate.toISOString(), endDate.toISOString());
    return res.status(200).json({ events });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
