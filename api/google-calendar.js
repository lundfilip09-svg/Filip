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
  const data = await res.json();
  return data.access_token;
}

function weekBounds() {
  const now    = new Date();
  const day    = now.getDay();
  const monOff = day === 0 ? -6 : 1 - day;
  const mon    = new Date(now); mon.setDate(now.getDate() + monOff); mon.setHours(0, 0, 0, 0);
  const sun    = new Date(mon); sun.setDate(mon.getDate() + 6);      sun.setHours(23, 59, 59, 999);
  return { timeMin: mon.toISOString(), timeMax: sun.toISOString() };
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
    const { timeMin, timeMax } = weekBounds();
    const calId = encodeURIComponent(GOOGLE_CALENDAR_ID);

    const url = `${CAL_BASE}/calendars/${calId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`;
    const calRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!calRes.ok) throw new Error(`Calendar fetch failed: ${await calRes.text()}`);
    const data = await calRes.json();

    const events = (data.items || []).map(item => ({
      id:     item.id,
      title:  item.summary || '(ingen tittel)',
      start:  item.start?.dateTime || item.start?.date || '',
      end:    item.end?.dateTime   || item.end?.date   || '',
      allDay: Boolean(item.start?.date),
      color:  item.colorId || null,
    }));

    return res.status(200).json({ events });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
