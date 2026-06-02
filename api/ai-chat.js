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

TRENINGSOPPSETT: Styrke mandag/onsdag/fredag. Sprint 2-3 ganger/uke — trappes ned til 2 i vondere perioder. Sprint-dager: Søndag, Tirsdag og Torsdag (kan reduseres til 2 dager i vondere perioder). Rehab tirsdag/torsdag/lørdag/søndag. Neste naprapat ~5 uker fra siste besøk.

NAKKE/RYGG (sekundært): Høyre indre rygg svakere pga telefon/dominant høyrehånd. Stiv rygg → skuldre fremover → nakkesmerter. Tiltak: Rows med strikk for midtre rygg.

ANDRE IDRETTER: Filip kan drive andre idretter enn sprint og styrke (f.eks. fotball/soccer, basket, padel). Disse ligger i aktivitetsloggen og ukeplanen. Ballidrett med mye retningsendring, hopp og akselerasjon gir ekstra belastning på patellarsenen — vurder total ukesbelastning på tvers av ALT Filip faktisk har gjort, ikke bare sprint og styrke. Les hva han faktisk trener fra dataene; ikke anta. Hvis Filip skriver på engelsk, svar på engelsk.

ROLIG DAG: I aktivitetsloggen kan activity_type være "Rolig dag". Det betyr at Filip tok det rolig istedenfor en planlagt økt — activity_label sier hvilken økt det erstattet og hvorfor (f.eks. "Sprint — hamstring"). Behandle dette som en bevisst nedtrapping, ikke en uteblitt økt, og ta hensyn til årsaken når du gir råd.

Smerteskala 0-10 brukes konsekvent i alle logger. Se etter mønstre mellom søvn, HRV, belastning og knesmerte. Du har tilgang til Filips faktiske treningsdata som sendes med hver melding.

SVARSTIL (token-effektiv — Filip har stramt API-budsjett):
- Match svarlengden til spørsmålet. Enkelt ja/nei-spørsmål ("er HRV-en min god nok?") → 1–3 setninger med konklusjon + kort begrunnelse. Åpen analyse ("se mønstre i kneet siste uka") → fyldigere, men aldri lengre enn nødvendig.
- Gi alltid en konklusjon og et konkret råd — ikke bare gjengi tallene.
- Pek på sammenhenger når de finnes (f.eks. "knesmerten økte dagen etter tung styrke"), men bare de relevante — ikke ramse opp alt.
- Ikke gjenta data Filip allerede ser i appen. Hopp rett til tolkning.
- Norsk som standard; svar på engelsk hvis Filip skriver engelsk.
- Korte avsnitt, ingen fyllord, ingen punktlister med ett ord per punkt. Du er Filips trener, ikke en datatabell.`;

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

  const { message, history, localDate, tz } = req.body || {};
  const authHeader = req.headers.authorization;

  if (!message || !authHeader) {
    return res.status(400).json({ error: 'Mangler melding eller autentisering' });
  }

  // Sanitise history: must be alternating user/assistant messages
  const safeHistory = (Array.isArray(history)
    ? history.filter(m => m
        && (m.role === 'user' || m.role === 'assistant')
        && typeof m.content === 'string'
        && m.content.length < 8000)
    : []).slice(-4);

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
  const [healthData, sprintData, gymData, kneePainData, activityData,
         sprintRecords, weeklyPlan, planOverrides] = await Promise.all([
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'health_data',
      'select=date,sleep_score,sleep_hours,hrv,rhr,deep_sleep_minutes,rem_sleep_minutes,light_sleep_minutes,mood&order=date.desc&limit=7'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'sprint_log',
      'select=*&order=date.desc&limit=7'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'gym_log',
      'select=*&order=date.desc&limit=7'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'knee_pain',
      'select=*&order=date.desc&limit=7'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'activity_log',
      'select=*&order=date.desc&limit=7'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'sprint_records',
      'select=distance,best_time,date&order=distance.asc'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'weekly_plan',
      'select=day,session_type&order=day.asc'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'training_plan',
      'select=day_index,session_text,notes&order=day_index.asc'),
  ]);

  // Slå sammen ukeplan: weekly_plan = global standard, training_plan = override per dag.
  const DAYS_NO = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
  const planByDay = {};
  (Array.isArray(weeklyPlan) ? weeklyPlan : []).forEach(r => {
    if (r.session_type) planByDay[r.day] = r.session_type;
  });
  (Array.isArray(planOverrides) ? planOverrides : []).forEach(r => {
    if (r.session_text) planByDay[r.day_index] = r.session_text;
    if (r.notes) planByDay[`notes_${r.day_index}`] = r.notes;
  });
  const weekPlanReadable = DAYS_NO.map((navn, i) =>
    `${navn}: ${planByDay[i] || 'Hvile'}${planByDay[`notes_${i}`] ? ` (${planByDay[`notes_${i}`]})` : ''}`
  ).join('\n');

  const now = new Date();
  // Bruk brukerens tidssone hvis sendt (funker når Filip er i USA), ellers Europe/Oslo.
  const userTz = (typeof tz === 'string' && tz) ? tz : 'Europe/Oslo';
  let osloDate, osloDateISO;
  try {
    osloDate = now.toLocaleDateString('no-NO', {
      timeZone: userTz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    osloDateISO = (typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate))
      ? localDate
      : now.toLocaleDateString('sv', { timeZone: userTz }); // YYYY-MM-DD
  } catch {
    osloDate = now.toLocaleDateString('no-NO', { timeZone: 'Europe/Oslo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    osloDateISO = now.toLocaleDateString('sv', { timeZone: 'Europe/Oslo' });
  }

  // Fjern interne felter (user_id/id/created_at) for å spare tokens.
  const stripMeta = (rows) => Array.isArray(rows)
    ? rows.map(r => { const { user_id, id, created_at, ...rest } = r; return rest; })
    : rows;

  const context = `[DAGENS DATO]
${osloDate} (${osloDateISO})

[UKEPLAN — hva som er planlagt per ukedag]
${weekPlanReadable}

[PERSONLIGE REKORDER (PB) — sprint]
${JSON.stringify(stripMeta(sprintRecords))}

[SØVN + HRV + PULS — SISTE 7 DAGER]
${JSON.stringify(stripMeta(healthData))}

[SPRINT-LOGGER — SISTE 7]
${JSON.stringify(stripMeta(sprintData))}

[GYM-LOGGER — SISTE 7]
${JSON.stringify(stripMeta(gymData))}

[KNESMERTE-LOGGER — SISTE 7]
${JSON.stringify(stripMeta(kneePainData))}

[ANDRE AKTIVITETER — SISTE 7 (fotball, basket, padel, svømming, rolig dag osv)]
${JSON.stringify(stripMeta(activityData))}`;

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      // System-prompten er statisk → cache den. Cache-treff koster 0.1x input,
      // så de ~1000 tokenene gjenbrukes nesten gratis i hver melding (5 min TTL).
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [
        ...safeHistory,
        {
          role: 'user',
          content: `${context}\n\n---\n\n${message}`,
        },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const rawBody = await anthropicRes.text();
    let parsed = {};
    try { parsed = JSON.parse(rawBody); } catch {}
    const detail = parsed.error?.message || rawBody || 'ukjent feil';
    const errorMsg = `Anthropic ${anthropicRes.status}: ${detail}`;
    return res.status(502).json({ error: errorMsg });
  }

  const data = await anthropicRes.json();
  return res.status(200).json({ reply: data.content?.[0]?.text || 'Tomt svar fra AI.' });
}
