// api/weekly-summary.js
// Genererer ukesrapport (uke = søndag–lørdag) på norsk + engelsk i ETT
// Anthropic-kall og upserter i weekly_summaries.
//
// To moduser:
//   1) Cron (lørdag morgen, se vercel.json): Vercel kaller GET med
//      Authorization: Bearer ${CRON_SECRET}. Bruker service-role-nøkkel og
//      genererer for alle brukere.
//   2) Klient: POST med brukerens JWT (samme som ai-chat). Genererer for den
//      brukeren og returnerer rapporten — brukes av "Lag på nytt" og
//      lørdags-fallback i ai.html.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY
//   SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET   (kun for cron-modus)

import { SYSTEM_PROMPT, buildAiContext } from './_lib/context.js';
import { sendToAll } from './_lib/push.js';

const EN_SPLIT = '===EN===';

function summaryPrompt(weekStart, weekEnd) {
  return `Lag ukesrapporten min for uka ${weekStart} (søndag) til ${weekEnd} (lørdag).
Struktur (med korte overskrifter i fet skrift):
1. Økter fullført vs planlagt
2. Total belastning (bruk ACWR)
3. Søvn og HRV
4. Knetrend
5. "Én ting å justere neste uke" — ett konkret, prioritert råd

Hold det kort og konkret — dette er en fast ukesrapport, ikke en chat. Ikke bruk [NOTAT].
Skriv rapporten FØRST på norsk. Deretter en linje som KUN inneholder ${EN_SPLIT} og så nøyaktig samme rapport på engelsk.`;
}

// Dato (YYYY-MM-DD) i gitt tidssone, og søndagen som starter uka datoen ligger i.
function localISO(tz) {
  try { return new Date().toLocaleDateString('sv', { timeZone: tz || 'Europe/Oslo' }); }
  catch { return new Date().toLocaleDateString('sv', { timeZone: 'Europe/Oslo' }); }
}
function weekBounds(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  const start = new Date(d); start.setUTCDate(d.getUTCDate() - d.getUTCDay()); // søndag
  const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6);          // lørdag
  const f = (x) => x.toISOString().slice(0, 10);
  return { weekStart: f(start), weekEnd: f(end) };
}

async function generateForUser({ supabaseUrl, apikey, token, anthropicKey, userId, localDate, tz }) {
  const iso = (typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate)) ? localDate : localISO(tz);
  const { weekStart, weekEnd } = weekBounds(iso);

  const { context } = await buildAiContext({ supabaseUrl, apikey, token, localDate: iso, tz, userId });

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1600, // NO + EN i samme svar
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `${context}\n\n---\n\n${summaryPrompt(weekStart, weekEnd)}` }],
    }),
  });
  if (!anthropicRes.ok) {
    const raw = await anthropicRes.text();
    let parsed = {}; try { parsed = JSON.parse(raw); } catch {}
    throw new Error(`Anthropic ${anthropicRes.status}: ${parsed.error?.message || raw || 'ukjent feil'}`);
  }
  const data = await anthropicRes.json();
  const full = data.content?.[0]?.text || '';
  const idx = full.indexOf(EN_SPLIT);
  const content_no = (idx >= 0 ? full.slice(0, idx) : full).trim();
  const content_en = (idx >= 0 ? full.slice(idx + EN_SPLIT.length) : '').trim() || null;
  if (!content_no) throw new Error('Tomt svar fra AI.');

  // Upsert — én rad per bruker per uke
  const row = { user_id: userId, week_start: weekStart, content_no, content_en, updated_at: new Date().toISOString() };
  const upsert = await fetch(`${supabaseUrl}/rest/v1/weekly_summaries?on_conflict=user_id,week_start`, {
    method: 'POST',
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!upsert.ok) throw new Error(`Supabase upsert ${upsert.status}: ${await upsert.text()}`);

  return { week_start: weekStart, content_no, content_en };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const { SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY,
          SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Mangler miljøvariabler' });
  }

  const authHeader = req.headers.authorization || '';

  // ── Cron-modus ──────────────────────────────────────────────────
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(503).json({ error: 'Mangler SUPABASE_SERVICE_ROLE_KEY' });
    }
    // Hent alle brukere (i praksis én)
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=50`, {
      headers: { apikey: SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!usersRes.ok) return res.status(502).json({ error: `Klarte ikke hente brukere (${usersRes.status})` });
    const usersData = await usersRes.json();
    const users = Array.isArray(usersData) ? usersData : (usersData.users || []);

    const results = [];
    for (const u of users) {
      try {
        const r = await generateForUser({
          supabaseUrl: SUPABASE_URL,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          token: SUPABASE_SERVICE_ROLE_KEY,
          anthropicKey: ANTHROPIC_API_KEY,
          userId: u.id,
          tz: 'Europe/Oslo',
        });
        results.push({ user: u.id, week_start: r.week_start, ok: true });
      } catch (e) {
        results.push({ user: u.id, ok: false, error: e.message });
      }
    }

    // Send push-varsel hvis minst én rapport ble generert
    const anyOk = results.some(r => r.ok);
    if (anyOk) {
      try {
        await sendToAll({
          title: '📅 Ny ukesrapport er klar',
          body: 'Treningsoversikten din for denne uka er klar.',
          tag: 'weekly-summary',
          url: '/ai',
        });
      } catch { /* push-feil skal ikke brekke cron-svaret */ }
    }

    return res.status(200).json({ results });
  }

  // ── Klient-modus (brukerens JWT) ────────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authHeader) return res.status(401).json({ error: 'Ikke autentisert' });
  const token = authHeader.replace('Bearer ', '').trim();

  const authCheck = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!authCheck.ok) return res.status(401).json({ error: 'Ikke autentisert' });
  const user = await authCheck.json();

  const { localDate, tz } = req.body || {};
  try {
    const r = await generateForUser({
      supabaseUrl: SUPABASE_URL,
      apikey: SUPABASE_ANON_KEY,
      token,
      anthropicKey: ANTHROPIC_API_KEY,
      userId: user.id, // brukes til upsert-raden; RLS filtrerer henting via token
      localDate,
      tz,
    });
    return res.status(200).json(r);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
