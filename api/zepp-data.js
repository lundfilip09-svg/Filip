// api/zepp-data.js
// Lagrer helsedata fra iPhone-snarvei eller Zepp mini-app direkte i Supabase.
// Vercel Serverless Function.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL      — f.eks. https://xxxx.supabase.co
//   SUPABASE_ANON_KEY — Supabase anon key

const VALID_FIELDS = ['sleepHours', 'sleepScore', 'rhr', 'hrv', 'steps', 'bodyBattery', 'mood'];

export default async function handler(req, res) {
  // Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const SUPABASE_URL      = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(503).json({ error: 'Mangler SUPABASE_URL eller SUPABASE_ANON_KEY' });
  }

  const sbHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  };

  // ── POST: motta data og lagre i Supabase ────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body;

    if (typeof body !== 'object' || body === null || !VALID_FIELDS.some(f => f in body)) {
      return res.status(400).json({
        error: `Body må inneholde minst ett av: ${VALID_FIELDS.join(', ')}`,
      });
    }

    const today = new Date().toISOString().slice(0, 10);

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

    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/health_data`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
    });

    if (!sbRes.ok) {
      const errText = await sbRes.text();
      return res.status(500).json({ error: errText });
    }

    return res.status(200).json({ ok: true, date: row.date });
  }

  // ── GET: returner siste lagrede rad (for testing) ────────────────────────
  if (req.method === 'GET') {
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/health_data?order=date.desc&limit=1`,
      { headers: sbHeaders }
    );
    if (!sbRes.ok) {
      const errText = await sbRes.text();
      return res.status(500).json({ error: errText });
    }
    const data = await sbRes.json();
    return res.status(200).json(data[0] || null);
  }

  return res.status(405).json({ error: 'Metode ikke tillatt' });
}
