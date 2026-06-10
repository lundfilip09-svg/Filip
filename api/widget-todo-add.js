// api/widget-todo-add.js
// Skrive-endepunkt for hjemmeskjerm-widgeten "Viktige gjøremål".
// Legger til ett VIKTIG gjøremål (important=true) fra iPhone-scriptet
// "Legg til gjøremål.js" via Alert.prompt().
//
// Hvorfor eget endepunkt:
//   api/widget.js er bevisst READ-ONLY. Dette er det eneste widget-endepunktet
//   som skriver. Det bruker service_role-nøkkelen SERVER-SIDE (omgår RLS) og
//   autentiserer med CRON_SECRET — nøyaktig samme token som lese-proxyen.
//
// Bruk:
//   POST /api/widget-todo-add
//   Header:  x-widget-token: DIN_CRON_SECRET   (eller ?token= i URL)
//   Body:    { "title": "...", "due_date"?: "YYYY-MM-DD", "list_name"?: "..." }
//   Svar:    { ok: true, id: "<uuid>" }
//
// Nødvendige env-variabler i Vercel (samme som api/widget.js):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET

import crypto from 'crypto';

// Konstant-tids sammenligning så token ikke kan gjettes via timing.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

// YYYY-MM-DD eller null. Avviser annet format så vi ikke sender søppel til DB.
function cleanDate(v) {
  if (typeof v !== 'string') return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-widget-token');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CRON_SECRET) {
    return res.status(503).json({
      error: 'Mangler env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET',
    });
  }

  const provided = req.headers['x-widget-token'] || req.query.token || '';
  if (!provided || !safeEqual(provided, CRON_SECRET)) {
    return res.status(401).json({ error: 'Ugyldig eller manglende token' });
  }

  const body = readBody(req);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'title er påkrevd' });

  const row = {
    title,
    important: true,
    due_date: cleanDate(body.due_date),
    list_name: (typeof body.list_name === 'string' && body.list_name.trim())
      ? body.list_name.trim()
      : 'Generelt',
  };

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/todos`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      return res.status(502).json({ error: 'Supabase insert feilet', detail: await r.text() });
    }
    const inserted = await r.json();
    const id = Array.isArray(inserted) && inserted[0] ? inserted[0].id : null;
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    return res.status(502).json({ error: 'Kunne ikke lagre gjøremål', detail: String(e.message || e) });
  }
}
