const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_CALENDAR_ID = 'primary',
} = process.env;

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_BASE  = 'https://www.googleapis.com/calendar/v3';

async function refreshAccessToken() {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

function weekBounds() {
  const now   = new Date();
  const day   = now.getDay();
  const monOff = day === 0 ? -6 : 1 - day;
  const mon   = new Date(now); mon.setDate(now.getDate() + monOff); mon.setHours(0,0,0,0);
  const sun   = new Date(mon); sun.setDate(mon.getDate() + 6);      sun.setHours(23,59,59,999);
  return { timeMin: mon.toISOString(), timeMax: sun.toISOString() };
}

exports.handler = async () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Google Calendar env vars not configured' }),
    };
  }

  try {
    const token = await refreshAccessToken();
    const { timeMin, timeMax } = weekBounds();
    const calId = encodeURIComponent(GOOGLE_CALENDAR_ID);

    const url = `${CAL_BASE}/calendars/${calId}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Calendar fetch failed: ${await res.text()}`);
    const data = await res.json();

    const events = (data.items || []).map(item => {
      const allDay = Boolean(item.start?.date);
      return {
        id:     item.id,
        title:  item.summary || '(ingen tittel)',
        start:  item.start?.dateTime || item.start?.date || '',
        end:    item.end?.dateTime   || item.end?.date   || '',
        allDay,
        color:  item.colorId || null,
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ events }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
