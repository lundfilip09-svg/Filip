// Lagrer helsedata fra iPhone-snarvei direkte i Supabase health_data-tabellen.
// Bruker Supabase REST API via fetch — ingen SDK-avhengighet.

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_FIELDS = ['sleepHours', 'sleepScore', 'rhr', 'hrv', 'steps', 'bodyBattery', 'mood'];

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const SUPABASE_URL              = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ error: 'Mangler SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY' }),
    };
  }

  const sbHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };

  // ── POST: motta data fra iPhone-snarvei og lagre i Supabase ─────────────
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Ugyldig JSON' }),
      };
    }

    if (typeof body !== 'object' || body === null || !VALID_FIELDS.some(f => f in body)) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: `Body må inneholde minst ett av: ${VALID_FIELDS.join(', ')}`,
        }),
      };
    }

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const row = {
      date:         body.date        || today,
      sleep_hours:  body.sleepHours  ?? null,
      sleep_score:  body.sleepScore  ?? null,
      hrv:          body.hrv         ?? null,
      rhr:          body.rhr         ?? null,
      steps:        body.steps       ?? null,
      body_battery: body.bodyBattery ?? null,
      mood:         body.mood        ?? null,
    };

    // Upsert: oppdater hvis dato allerede finnes, ellers insert
    const res = await fetch(`${SUPABASE_URL}/rest/v1/health_data`, {
      method: 'POST',
      headers: {
        ...sbHeaders,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: errText }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, date: row.date }),
    };
  }

  // ── GET: returner siste lagrede rad (for testing) ────────────────────────
  if (event.httpMethod === 'GET') {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/health_data?order=date.desc&limit=1`,
      { headers: sbHeaders }
    );
    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: errText }) };
    }
    const data = await res.json();
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify(data[0] || null),
    };
  }

  return {
    statusCode: 405,
    headers: CORS,
    body: JSON.stringify({ error: 'Metode ikke tillatt' }),
  };
};
