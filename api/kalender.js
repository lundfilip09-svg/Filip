// api/kalender.js
// Fetches / creates / patches / deletes Google Calendar events.
// Query params (GET): ?start=YYYY-MM-DD&end=YYYY-MM-DD
// Requires: Authorization: Bearer <supabase-jwt>

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_BASE  = 'https://www.googleapis.com/calendar/v3';

async function requireAuth(req, res) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) { res.status(401).json({ error: 'unauthorized' }); return false; }
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) { res.status(401).json({ error: 'unauthorized' }); return false; }
  return true;
}

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

// Write (PATCH) or delete (DELETE) a single Google Calendar event by id.
// For recurring events the caller decides which id to pass:
//   instance id  → affects only that one occurrence
//   recurringEventId → affects the whole series
async function googleWrite(method, token, calId, eventId, body) {
  const url = `${CAL_BASE}/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}`;
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const detail = await r.text();
    const err = new Error(detail || `Google ${method} failed`);
    err.status = r.status;
    throw err;
  }
  return r.status === 204 ? {} : r.json(); // DELETE returns empty body
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch { return {}; } }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://filip-vita.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (!await requireAuth(req, res)) return;

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN,
          GOOGLE_CALENDAR_ID = 'primary' } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN)
    return res.status(503).json({ error: 'Google Calendar env vars not configured' });

  try {
    const token = await refreshAccessToken(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN);

    // ── Create event ──
    if (req.method === 'POST') {
      const { summary, start, end } = readBody(req);
      if (!summary || !start || !end) return res.status(400).json({ error: 'summary, start, end required' });
      const url = `${CAL_BASE}/calendars/${encodeURIComponent(GOOGLE_CALENDAR_ID)}/events`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, start, end }),
      });
      if (!r.ok) {
        const detail = await r.text();
        const err = new Error(detail || 'Google POST failed');
        err.status = r.status;
        throw err;
      }
      return res.status(200).json({ event: await r.json() });
    }

    // ── Update event: title and/or time ──
    if (req.method === 'PATCH') {
      const { eventId, summary, start, end } = readBody(req);
      if (!eventId) return res.status(400).json({ error: 'eventId required' });
      const patch = {};
      if (summary !== undefined) patch.summary = summary;
      if (start) patch.start = start;
      if (end)   patch.end   = end;
      const updated = await googleWrite('PATCH', token, GOOGLE_CALENDAR_ID, eventId, patch);
      return res.status(200).json({ event: updated });
    }

    // ── Delete event: single instance or whole series (caller picks the id) ──
    if (req.method === 'DELETE') {
      const { eventId } = { ...req.query, ...readBody(req) };
      if (!eventId) return res.status(400).json({ error: 'eventId required' });
      await googleWrite('DELETE', token, GOOGLE_CALENDAR_ID, eventId, null);
      return res.status(200).json({ ok: true });
    }

    // ── Read range (default GET) ──
    const { start, end } = req.query;
    const startDate = start ? new Date(start + 'T00:00:00') : (() => {
      const d = new Date(); d.setDate(d.getDate() - ((d.getDay()+6)%7)); return d;
    })();
    const endDate = end ? new Date(end + 'T23:59:59') : new Date(startDate.getTime() + 42 * 86400000);

    const events = await fetchRange(token, GOOGLE_CALENDAR_ID, startDate.toISOString(), endDate.toISOString());
    return res.status(200).json({ events });
  } catch (err) {
    // 401/403 from Google = refresh token lacks write scope (calendar.events)
    if (err.status === 401 || err.status === 403) {
      return res.status(403).json({ error: 'scope', detail: err.message });
    }
    return res.status(err.status || 500).json({ error: err.message });
  }
}
