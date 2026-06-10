// api/widget.js
// Read-only proxy for hjemmeskjerm-widgets (iPhone Scriptable + Mac SwiftBar).
//
// Hvorfor denne finnes:
//   Widgets kan ikke logge inn med Supabase-sesjon. For å lese data uten å åpne
//   RLS for anonym tilgang, går widgeten gjennom DETTE endepunktet. service_role-
//   nøkkelen ligger KUN her (server-side env-var) og forlater aldri serveren.
//   Widgeten autentiserer med CRON_SECRET (gjenbrukt). Endepunktet er READ-ONLY.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL                 (har du allerede)
//   SUPABASE_SERVICE_ROLE_KEY    (NY – Supabase → Project Settings → API → service_role)
//   CRON_SECRET                  (finnes allerede – gjenbrukes som widget-token)
//
// Bruk:
//   GET /api/widget?token=DIN_CRON_SECRET
//   (eller header:  x-widget-token: DIN_CRON_SECRET)
//
// MERK: CRON_SECRET deles nå med Vercel-cron. Roterer du den, må du oppdatere
//       BÅDE widget-filene OG cron-oppsettet samtidig.

import crypto from 'crypto';

// Konstant-tids sammenligning så token ikke kan gjettes via timing.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function sb(path, { url, key }) {
  const r = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });
  if (!r.ok) throw new Error(`Supabase ${path} -> ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-widget-token');
  // Widget cacher selv (15 min). Hold svaret ferskt på serveren.
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

  const cfg = { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY };

  // Verste kne-verdi (høyest smerte) på tvers av de fire feltene i én rad.
  const worstKnee = (r) => {
    if (!r) return null;
    const vals = [r.before_score, r.during_score, r.after_score, r.day_after_score]
      .filter((v) => v != null);
    return vals.length ? Math.max(...vals) : null;
  };

  try {
    // limit=2 → rad [0] = i dag/siste, rad [1] = forrige loggførte dag ("i går").
    // Vi bruker forrige loggførte rad, ikke en hard kalenderdato, så trenden
    // ikke forsvinner hver gang en dag uten logg hopper over.
    const [sleepRows, kneeRows, todoRows] = await Promise.all([
      // Siste to netter: nyeste rad etter dato
      sb('health_data?select=date,sleep_score,sleep_hours,hrv,rhr&order=date.desc&limit=2', cfg),
      // Siste to kne-logger: nyeste rad etter dato
      sb('knee_pain?select=date,session_type,before_score,during_score,after_score,day_after_score&order=date.desc&limit=2', cfg),
      // Aktive gjøremål med forfallsdato, nærmeste først
      sb('todos?select=title,due_date,list_name,important&completed=eq.false&due_date=not.is.null&order=due_date.asc&limit=6', cfg),
    ]);

    const sleep = sleepRows[0] || null;
    const knee = kneeRows[0] || null;
    const sleepPrev = sleepRows[1] || null;
    const kneePrev = kneeRows[1] || null;

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      sleep: sleep && {
        date: sleep.date,
        score: sleep.sleep_score,
        hours: sleep.sleep_hours,
        hrv: sleep.hrv,
        rhr: sleep.rhr,
      },
      knee: knee && {
        date: knee.date,
        session_type: knee.session_type,
        before: knee.before_score,
        during: knee.during_score,
        after: knee.after_score,
        day_after: knee.day_after_score,
      },
      todos: (todoRows || []).map(t => ({
        title: t.title,
        due_date: t.due_date,
        list_name: t.list_name,
        important: t.important,
      })),
      // Forrige loggførte dag — driver trend-pilene i widgetene.
      yesterday: {
        sleep: sleepPrev ? { score: sleepPrev.sleep_score } : null,
        knee: kneePrev ? { worst_score: worstKnee(kneePrev) } : null,
      },
    });
  } catch (e) {
    return res.status(502).json({ error: 'Kunne ikke hente data', detail: String(e.message || e) });
  }
}
