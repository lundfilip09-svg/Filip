// api/zepp-data.js
// Lagrer helsedata fra iPhone-snarvei eller Zepp mini-app direkte i Supabase.
// Vercel Serverless Function.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL              — f.eks. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key (bypasser RLS)

const VALID_FIELDS = ['sleepHours', 'sleepStart', 'sleepEnd', 'sleepScore', 'rhr', 'hrv', 'steps', 'bodyBattery', 'mood'];

export default async function handler(req, res) {
  // Preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const SUPABASE_URL              = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Mangler SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY' });
  }

  const sbHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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

    // Beregn sleepHours fra råe tidsstempler hvis de er sendt
    let sleepHours = body.sleepHours ?? null;
    if (body.sleepStart && body.sleepEnd) {
      const start = new Date(body.sleepStart);
      const end   = new Date(body.sleepEnd);
      const diff  = (end - start) / (1000 * 60 * 60);
      if (!isNaN(diff) && diff > 0 && diff < 24) {
        sleepHours = Math.round(diff * 100) / 100; // rund til 2 desimaler
      }
    }

    const row = {
      date:         body.date        || today,
      sleep_hours:  sleepHours,
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
