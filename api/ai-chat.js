// api/ai-chat.js
// Mottar brukermelding, henter treningsdata fra Supabase,
// og sender til Anthropic API. Returnerer AI-svar.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `Du er en personlig trenings- og rehabiliteringsassistent for Filip Lund (17 år). Filip er sprinter (100m, 200m) og styrketrener. Mål: Sub 11.10 på 100m og 22.30 på 200m.

SKADER/PLAGER: Filip styrer selv en plageliste (se [PLAGER/SKADER]-blokken). DETTE er den autoritative, oppdaterte oversikten over hva som plager ham NÅ — kroppsdel, side, status (aktiv/bedring/arkivert), alvorlighet og notat. Behandle bare aktive og bedring-plager som relevante; arkiverte er historikk og skal ikke styre råd med mindre Filip spør. Ikke anta en skade som ikke står i lista (f.eks. ikke nevn kneet hvis det er arkivert). Hvis lista er tom, anta at han er skadefri.

FYSIO-/NAPRAPAT-RÅD: Filip fører selv inn notater fra hver fysio-/naprapat-time (se [FYSIO-NOTATER]-blokken). DETTE er den autoritative kilden til behandlingsråd, rotårsak, provoserende faktorer, rehab-øvelser og hva som hjelper — bruk de nyeste notatene, ikke gamle antakelser. Hvis blokken er tom eller mangler et tema, si at du ikke har notater på det ennå i stedet for å gjette. Ikke tillegg en bestemt terapeut råd Filip ikke har ført inn.

TRENINGSOPPSETT: Styrke mandag/onsdag/fredag. Sprint 2-3 ganger/uke — trappes ned til 2 i vondere perioder. Sprint-dager: Søndag, Tirsdag og Torsdag (kan reduseres til 2 dager i vondere perioder).

ANDRE IDRETTER: Filip kan drive andre idretter enn sprint og styrke (f.eks. fotball/soccer, basket, padel). Disse ligger i aktivitetsloggen og ukeplanen. Ballidrett med mye retningsendring, hopp og akselerasjon gir ekstra belastning (særlig på aktive plager i kne/legg/hofte) — vurder total ukesbelastning på tvers av ALT Filip faktisk har gjort, ikke bare sprint og styrke. Les hva han faktisk trener fra dataene; ikke anta. Hvis Filip skriver på engelsk, svar på engelsk.

ROLIG DAG: I aktivitetsloggen kan activity_type være "Rolig dag". Det betyr at Filip tok det rolig istedenfor en planlagt økt — activity_label sier hvilken økt det erstattet og hvorfor (f.eks. "Sprint — hamstring"). Behandle dette som en bevisst nedtrapping, ikke en uteblitt økt, og ta hensyn til årsaken når du gir råd.

Smerteskala 0-10 brukes konsekvent i alle logger. Se etter mønstre mellom søvn, HRV, belastning og knesmerte. Du har tilgang til Filips faktiske treningsdata som sendes med hver melding.

SVARSTIL (token-effektiv — Filip har stramt API-budsjett):
- Match svarlengden til spørsmålet. Enkelt ja/nei-spørsmål ("er HRV-en min god nok?") → 1–3 setninger med konklusjon + kort begrunnelse. Åpen analyse ("se mønstre i kneet siste uka") → fyldigere, men aldri lengre enn nødvendig.
- Gi alltid en konklusjon og et konkret råd — ikke bare gjengi tallene.
- Pek på sammenhenger når de finnes (f.eks. "knesmerten økte dagen etter tung styrke"), men bare de relevante — ikke ramse opp alt.
- Ikke gjenta data Filip allerede ser i appen. Hopp rett til tolkning.
- Norsk som standard; svar på engelsk hvis Filip skriver engelsk.
- Korte avsnitt, ingen fyllord, ingen punktlister med ett ord per punkt. Du er Filips trener, ikke en datatabell.

NØKKELTALL: Du får forhåndsberegnede tall (ACWR, snittsøvn/HRV, dager siden smerte). Bruk dem direkte — ikke regn dem på nytt fra rådataene.

HUKOMMELSE: Hvis du gir et råd det er verdt å huske til senere (f.eks. "foreslo deload", "anbefalte å droppe spenst denne uka"), avslutt svaret med en EGEN linje på formatet:
[NOTAT: kort oppsummering av rådet]
Linjen vises ikke til Filip — den lagres så du husker rådet ditt neste gang. Bruk den sparsomt (maks ett notat per svar, kun når det er noe verdt å huske).`;

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
         sprintRecords, weeklyPlan, planOverrides,
         knee28, sprint28, gym28, act28, aiNotesData, physioNotesData, injuriesData] = await Promise.all([
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
    // B6: 28-dagers vinduer for forhåndsberegnede nøkkeltall (ACWR, smertefri-dager)
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'knee_pain',
      'select=date,before_score,during_score,after_score,day_after_score&order=date.desc&limit=60'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'sprint_log',
      'select=date,rpe&order=date.desc&limit=120'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'gym_log',
      'select=date,rpe&order=date.desc&limit=120'),
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'activity_log',
      'select=date,rpe,duration_min&order=date.desc&limit=120'),
    // B6: AI-ens egne notater (siste 8) for å huske tidligere råd
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'ai_notes',
      'select=date,note&order=created_at.desc&limit=8'),
    // Fysio-/naprapat-notater (siste 10) — autoritativ kilde til behandlingsråd
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'physio_notes',
      'select=date,therapist,note&order=date.desc&limit=10'),
    // Plageliste — aktive/bedring/arkiverte skader, autoritativ status
    sbFetch(SUPABASE_URL, SUPABASE_ANON_KEY, token, 'injuries',
      'select=body_part,side,status,severity,start_date,note&order=updated_at.desc&limit=20'),
  ]);


  // ── B6: forhåndsberegnede nøkkeltall ──────────────────────────────
  // Sendes som korte tall så modellen slipper å regne fra rådata hver gang.
  // Bruk klientens lokale dato hvis sendt, ellers dagens dato (uavhengig av
  // osloDateISO, som beregnes lenger ned).
  const _todayISO = (typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate))
    ? localDate
    : new Date().toISOString().slice(0, 10);
  const _now = new Date(_todayISO + 'T12:00:00');
  const _daysAgo = (ds) => Math.floor((_now - new Date(ds + 'T12:00:00')) / 86400000);
  const _avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  // ACWR: akutt (siste 7 d) vs kronisk (siste 28 d, ukesnitt) treningsbelastning.
  // Belastning ≈ antall økter (sprint+gym+aktivitet) vektet med RPE der den finnes.
  const _loadEvents = [
    ...(Array.isArray(sprint28) ? sprint28 : []).map(r => ({ date: r.date, load: (r.rpe || 50) / 10 })),
    ...(Array.isArray(gym28) ? gym28 : []).map(r => ({ date: r.date, load: (r.rpe || 60) / 10 })),
    ...(Array.isArray(act28) ? act28 : []).map(r => ({ date: r.date, load: (r.rpe || 50) / 10 })),
  ].filter(e => e.date && _daysAgo(e.date) >= 0);
  const within28 = _loadEvents.filter(e => _daysAgo(e.date) < 28);
  const acute   = _loadEvents.filter(e => _daysAgo(e.date) < 7).reduce((a, e) => a + e.load, 0);
  const chronic = within28.reduce((a, e) => a + e.load, 0) / 4;
  // ACWR krever nok loggede økter for å være meningsfull. Med tom/tynn historikk
  // (de første ukene) blir tallet misvisende → vis det ikke før minst 8 økter på 28 d.
  const acwr = (within28.length >= 8 && chronic > 0) ? (acute / chronic) : null;

  // Dager siden siste smertefrie dag (maks smerte ≤ 2) og siden siste smerte (> 2)
  const _kneeMax = (k) => Math.max(k.before_score ?? 0, k.during_score ?? 0, k.after_score ?? 0, k.day_after_score ?? 0);
  const knee60 = Array.isArray(knee28) ? knee28 : [];
  const lastPainDay = knee60.filter(k => _kneeMax(k) > 2).map(k => k.date).sort().pop() || null;
  const daysSincePain = lastPainDay ? _daysAgo(lastPainDay) : null;

  const avgSleep = _avg((Array.isArray(healthData) ? healthData : []).map(h => h.sleep_score).filter(v => v != null));
  const avgHrv   = _avg((Array.isArray(healthData) ? healthData : []).map(h => h.hrv).filter(v => v != null));
  const avgRhr   = _avg((Array.isArray(healthData) ? healthData : []).map(h => h.rhr).filter(v => v != null));

  // Bygg nøkkeltall-blokken dynamisk. ACWR tas bare med når den er pålitelig
  // (nok loggede økter) — ellers utelates linja helt så AI-en ikke fester seg
  // ved et misvisende tall mens historikken fortsatt er tynn.
  const metricLines = [];
  if (acwr != null) {
    metricLines.push(`ACWR (akutt:kronisk belastning, 7d vs 28d): ${acwr.toFixed(2)}${acwr > 1.5 ? ' ⚠️ over 1.5 = forhøyet skaderisiko' : ''}`);
  }
  metricLines.push(`Dager siden siste knesmerte (>2): ${daysSincePain != null ? daysSincePain : 'ingen smerte registrert nylig'}`);
  metricLines.push(`Snitt søvnscore (7d): ${avgSleep != null ? Math.round(avgSleep) : '–'}`);
  metricLines.push(`Snitt HRV (7d): ${avgHrv != null ? Math.round(avgHrv) : '–'} ms`);
  metricLines.push(`Snitt hvilepuls (7d): ${avgRhr != null ? Math.round(avgRhr) : '–'}`);
  const metricsBlock = `[FORHÅNDSBEREGNEDE NØKKELTALL — bruk disse, ikke regn på nytt]
${metricLines.join('\n')}`;

  // B6: AI-ens egne tidligere notater
  const notesArr = Array.isArray(aiNotesData) ? aiNotesData : [];
  const notesBlock = notesArr.length
    ? `[DINE TIDLIGERE NOTATER — råd du har gitt før, nyeste først]
${notesArr.map(n => `- (${n.date}) ${n.note}`).join('\n')}`
    : '';

  // Plageliste — aktive/bedring øverst, arkiverte til slutt
  const BODY_NO = { 'body.knee':'Kne','body.hamstring':'Hamstring','body.glute':'Glute',
    'body.hipflexor':'Hoftebøyer','body.hip':'Hofte','body.shoulder':'Skulder','body.back':'Rygg',
    'body.neck':'Nakke','body.ankle':'Ankel','body.calf':'Legg','body.achilles':'Akilles','body.foot':'Fot','body.other':'Annet' };
  const SIDE_NO = { left:'venstre', right:'høyre', both:'begge' };
  const STAT_NO = { active:'AKTIV', improving:'BEDRING', archived:'arkivert' };
  const SEV_NO  = { mild:'mild', moderate:'moderat', severe:'alvorlig' };
  const injAll = Array.isArray(injuriesData) ? injuriesData : [];
  const injActive = injAll.filter(i => i.status !== 'archived');
  const injArchived = injAll.filter(i => i.status === 'archived');
  const fmtInj = i => {
    const part = BODY_NO[i.body_part] || i.body_part;
    const side = i.side && SIDE_NO[i.side] ? ' ' + SIDE_NO[i.side] : '';
    return `- ${part}${side} [${STAT_NO[i.status] || i.status}, ${SEV_NO[i.severity] || i.severity}${i.start_date ? ', siden ' + i.start_date : ''}]${i.note ? ': ' + i.note : ''}`;
  };
  const injuriesBlock = injActive.length || injArchived.length
    ? `[PLAGER/SKADER — Filips egen oversikt. Kun aktive/bedring er relevante for råd nå.]
${injActive.length ? injActive.map(fmtInj).join('\n') : '(ingen aktive plager)'}${injArchived.length ? '\nArkivert (historikk, ikke aktivt): ' + injArchived.map(i => (BODY_NO[i.body_part] || i.body_part)).join(', ') : ''}`
    : `[PLAGER/SKADER]
(Ingen plager ført inn — anta skadefri med mindre noe annet sies.)`;

  // Fysio-/naprapat-notater — autoritativ kilde til behandlingsråd
  const physioArr = Array.isArray(physioNotesData) ? physioNotesData : [];
  const physioBlock = physioArr.length
    ? `[FYSIO-NOTATER — Filips egne notater fra fysio-/naprapat-timer, nyeste først. Dette er autoritativt for behandlingsråd.]
${physioArr.map(p => `- (${p.date}${p.therapist ? ', ' + p.therapist : ''}) ${p.note}`).join('\n')}`
    : `[FYSIO-NOTATER]
(Ingen notater ført inn ennå — ikke gjett om behandlingsråd; si at du mangler notater.)`;

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

${metricsBlock}

${injuriesBlock}

${physioBlock}

${notesBlock}

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
  let reply = data.content?.[0]?.text || 'Tomt svar fra AI.';

  // B6: trekk ut og lagre evt. [NOTAT: ...] fra svaret, og fjern det fra det
  // brukeren ser. Fire-and-forget — feiler det, fortsetter vi uten å blokkere.
  const noteMatch = reply.match(/\[NOTAT:\s*([\s\S]*?)\]\s*$/i);
  if (noteMatch) {
    const note = noteMatch[1].trim().slice(0, 500);
    reply = reply.replace(/\[NOTAT:[\s\S]*?\]\s*$/i, '').trim();
    if (note) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/ai_notes`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ date: osloDateISO, note }),
        });
      } catch { /* stille — notat er sekundært */ }
    }
  }

  return res.status(200).json({ reply });
}
