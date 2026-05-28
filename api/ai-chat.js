// api/ai-chat.js
// Mottar brukermelding, henter treningsdata fra Supabase,
// og sender til Anthropic API. Returnerer AI-svar.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `Du er en personlig trenings- og rehabiliteringsassistent for Filip Lund (17 år). Filip er sprinter (100m, 200m) og styrketrener. Mål: Sub 11.10 på 100m og 22.30 på 200m.

KNESKADE — VENSTRE KNE
Diagnose: Patellar tendinopati (patellarsene-irritasjon). Debut: Januar 2026, etter direkte slag mot kneet. Symptomer: Smerte foran/nedre del av kneskålen, synlig hevelse venstre vs høyre, smerte ved full strekk, hypermobil kneskål. Rotårsak (naprapat Andreas Havre, Sandviken): Stiv venstre ankel, svakt quadriceps venstre, stivere venstre hofte — asymmetri mellom sidene. Provoserende faktorer: Spenst, eksplosive øvelser, blokkstart, step-up, knebøyhopp, høy total belastning. Hva hjelper: HSR, Spanish squat, eksentrisk leg extension, calf raise 90° sittende, backwards treadmill, oppvarming.

BEHANDLINGSFILOSOFI (fra Havre): Trene 80% intensitet, ikke presse gjennom smerte. Droppe spenst/plyometri. Litt rehab hver dag er bedre enn mye sjelden. 5 gode stevner > 8-10 dårlige med tilbakefall. Ikke vits å lage fast program — kjenn etter selv og tilpass. Styrke før løpeøkt er bra, styrkeøkt dagen før stevne kan fungere hvis eksplosivt utført. Kne sleeve til oppvarming.

DAGLIGE REHAB-ØVELSER (dager uten sprint/styrke): Spanish Squat ISO 2×35-45sek, Ankelstrekk mot vegg 2×12, Hip Swivels 1×10, Face pulls med strikk 2×15.

TRENINGSOPPSETT: Styrke mandag/onsdag/fredag. Sprint 2-3 ganger/uke — trappes ned til 2 i vondere perioder. Rehab tirsdag/torsdag/lørdag/søndag. Neste naprapat ~5 uker fra siste besøk.

NAKKE/RYGG (sekundært): Høyre indre rygg svakere pga telefon/dominant høyrehånd. Stiv rygg → skuldre fremover → nakkesmerter. Tiltak: Rows med strikk for midtre rygg.

Smerteskala 0-10 brukes konsekvent i alle logger. Se etter mønstre mellom søvn, HRV, belastning og knesmerte. Vær direkte og kortfattet. Du har tilgang til Filips faktiske treningsdata som sendes med hver melding.`;

async function sbFetch(supabaseUrl, anonKey, token, table, params) {
  const url = `${supabaseUrl}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message } = req.body || {};
  const authHeader = req.headers.authorization;

  if (!message || !authHeader) {
    return res.status(400).json({ error: 'Mangler melding eller autentisering' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const { SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Mangler miljøvariabler (SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY)' });
  }

  // Verify auth by fetching user profile
  const authCheck = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!authCheck.ok) return res.status(401).json({ error: 'Ikke autentisert' });

  // Fetch training data
  const [healthData, sprintData, gymData, kneePainData] = await Promise.all([
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'health_data',
      'select=date,sleep_score,sleep_hours,hrv,rhr,deep_sleep_minutes,rem_sleep_minutes,light_sleep_minutes,mood&order=date.desc&limit=14'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'sprint_log',
      'select=*&order=date.desc&limit=10'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'gym_log',
      'select=*&order=date.desc&limit=10'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'knee_pain',
      'select=*&order=date.desc&limit=5'),
  ]);

  const context = `[SØVN + HRV + PULS — SISTE 14 DAGER]
${JSON.stringify(healthData, null, 2)}

[SPRINT-LOGGER — SISTE 10]
${JSON.stringify(sprintData, null, 2)}

[GYM-LOGGER — SISTE 10]
${JSON.stringify(gymData, null, 2)}

[KNESMERTE-LOGGER — SISTE 5]
${JSON.stringify(kneePainData, null, 2)}`;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${context}\n\n---\n\n${message}`,
        },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    return res.status(502).json({ error: err.error?.message || 'Anthropic API-feil' });
  }

  const data = await anthropicRes.json();
  return res.status(200).json({ reply: data.content[0].text });
}
