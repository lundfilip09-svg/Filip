// api/_lib/context.js
// Delt kontekstbygging for AI-endepunktene (ai-chat.js og weekly-summary.js).
// Filer i api/_lib/ blir IKKE egne Vercel-endepunkter (underscore-prefiks).

// ACWR-formelen bor i /acwr.js (delt med klienten — dashboardets load×smerte-graf).
import '../../acwr.js';
const AcwrCore = globalThis.AcwrCore;

export const SYSTEM_PROMPT = `Du er en personlig trenings- og rehabiliteringsassistent for Filip Lund (17 år). Filip er sprinter (100m, 200m) og styrketrener. Mål: Sub 11.10 på 100m og 22.30 på 200m.

SKADER/PLAGER: Filip styrer selv en plageliste (se [PLAGER/SKADER]-blokken). DETTE er den autoritative, oppdaterte oversikten — kroppsdel, side, status, alvorlighet og notat.
- STATUS sier hvor i forløpet plagen er: aktiv (plager nå), bedring (på vei opp), arkivert (historikk/frisk). Behandle aktive og bedring som relevante; arkiverte styrer ikke råd med mindre Filip spør.
- ALVORLIGHET sier hvor stor/viktig plagen er som helhet, UAVHENGIG av status: 'alvorlig' = en ekte, betydelig skade som skal styre treningen (f.eks. en langvarig senebetennelse) — gi den vedvarende oppmerksomhet og vær konservativ selv når den er i bedring. 'mild' = en liten plage man kjenner av og til (f.eks. noe i skulderen ved enkelte øvelser), ikke en egentlig skade — nevn den bare når det er relevant, ikke overdramatiser.
- Ikke anta en skade som ikke står i lista. Hvis lista er tom, anta at han er skadefri.

FYSIO-/NAPRAPAT-RÅD: Filip fører selv inn notater fra hver fysio-/naprapat-time (se [FYSIO-NOTATER]-blokken). DETTE er den autoritative kilden til behandlingsråd, rotårsak, provoserende faktorer, rehab-øvelser og hva som hjelper — bruk de nyeste notatene, ikke gamle antakelser. Hvis blokken er tom eller mangler et tema, si at du ikke har notater på det ennå i stedet for å gjette. Ikke tillegg en bestemt terapeut råd Filip ikke har ført inn.

Andreas Havre er ikke lenger tilgjengelig for nye timer — Filip kan ikke dra til ham, selv om eldre notater nevner å komme tilbake til ham (f.eks. hver ~5. uke); ignorer de oppfordringene. Bruk gjerne rådene Havre allerede har gitt (se FYSIO-NOTATER) og siter dem direkte — de er fortsatt verdifulle og gyldige.

Vær ærlig om behandlingsbehov: hvis noe genuint krever klinisk eller hands-on vurdering, si det rett ut og tydelig — ikke bagatelliser eller skjul det for å være hyggelig. Men ingen bestemt behandling er "non-negotiable": Filip har flere alternativer (trener Erlend Sæterstøl, fysioterapeut i USA, eller andre steder) — bare ikke Havre. Anbefal passende hjelp generelt når det faktisk trengs, og la Filip velge hvor. Ikke mas, og send ham aldri tilbake til Havre.

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

export async function sbFetch(supabaseUrl, apikey, token, table, params) {
  const url = `${supabaseUrl}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    headers: {
      apikey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  return res.json();
}

// Bygger hele datakonteksten som sendes til modellen.
// - Vanlig chat: apikey = anon key, token = brukerens JWT (RLS filtrerer), userId utelates.
// - Cron: apikey = token = service-role key (RLS omgås) → userId MÅ sendes og
//   legges på som eksplisitt filter på alle tabeller.
export async function buildAiContext({ supabaseUrl, apikey, token, localDate, tz, userId }) {
  const uf = userId ? `&user_id=eq.${userId}` : '';
  // Tabeller UTEN user_id-kolonne (enbruker-app). Å legge uf på disse gir PostgREST 400 →
  // tom liste — det var derfor ukesrapporten manglet søvn/HRV (health_data) og AI-notater.
  // injury_pain har sitt eget unntak lenger ned (hentes via sbFetch uten uf).
  const USERLESS = new Set(['health_data', 'knee_pain', 'sprint_log', 'gym_log', 'sprint_records', 'ai_notes']);
  const sb = (table, params) =>
    sbFetch(supabaseUrl, apikey, token, table, params + (USERLESS.has(table) ? '' : uf));

  // Inneværende ukes mandag (ISO) — overstyringer ligger dato-forankret i
  // training_plan_weekly, ikke i en datoløs tabell, så de arver ikke til neste uke.
  const _base = (typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate))
    ? new Date(localDate + 'T00:00:00') : new Date();
  const _mon = new Date(_base);
  _mon.setDate(_base.getDate() - ((_base.getDay() + 6) % 7));
  const weekMondayISO = _mon.getFullYear() + '-' +
    String(_mon.getMonth() + 1).padStart(2, '0') + '-' + String(_mon.getDate()).padStart(2, '0');

  const [healthData, sprintData, gymData, kneePainData, activityData,
         sprintRecords, weeklyPlan, planOverrides,
         knee28, sprint28, gym28, act28, aiNotesData, physioNotesData, injuriesData, programData,
         templatesData] = await Promise.all([
    sb('health_data',
      'select=date,sleep_score,sleep_hours,hrv,rhr,deep_sleep_minutes,rem_sleep_minutes,light_sleep_minutes,mood,body_battery,stress_avg&order=date.desc&limit=7'),
    sb('sprint_log', 'select=*&order=date.desc&limit=7'),
    sb('gym_log', 'select=*&order=date.desc&limit=7'),
    sb('knee_pain', 'select=*&order=date.desc&limit=7'),
    sb('activity_log', 'select=*&order=date.desc&limit=7'),
    sb('sprint_records', 'select=distance,best_time,date&order=distance.asc'),
    sb('weekly_plan', 'select=day,session_type,template_id&order=day.asc'),
    sb('training_plan_weekly', `select=day_index,session_text,notes,template_id&week_monday=eq.${weekMondayISO}&order=day_index.asc`),
    // B6: 28-dagers vinduer for forhåndsberegnede nøkkeltall (ACWR, smertefri-dager)
    sb('knee_pain', 'select=date,before_score,during_score,after_score,day_after_score&order=date.desc&limit=60'),
    sb('sprint_log', 'select=date,rpe&order=date.desc&limit=120'),
    sb('gym_log', 'select=date,rpe&order=date.desc&limit=120'),
    sb('activity_log', 'select=date,rpe,duration_min&order=date.desc&limit=120'),
    // B6: AI-ens egne notater (siste 8) for å huske tidligere råd
    sb('ai_notes', 'select=date,note&order=created_at.desc&limit=8'),
    // Fysio-/naprapat-notater (siste 10) — autoritativ kilde til behandlingsråd
    sb('physio_notes', 'select=date,therapist,note&order=date.desc&limit=10'),
    // Plageliste — aktive/bedring/arkiverte skader, autoritativ status
    sb('injuries', 'select=id,body_part,side,status,severity,start_date,note&order=updated_at.desc&limit=20'),
    // Gym-program: hvilke øvelser som ligger på hver styrkedag (man/ons/fre) m/ anbefalte sett×reps
    sb('workout_program', 'select=day,section,exercise_name,sets,reps&order=day.asc,sort_order.asc'),
    // 051: økt-mal-bibliotek — for å resolve template_id -> lesbart navn i ukeplanen
    sb('session_templates', 'select=id,name,i18n_key'),
  ]);

  // ── Fase 2: injury_pain per alvorlig aktiv skade (trenger ID-er fra fase 1) ──
  const _todayISO = (typeof localDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(localDate))
    ? localDate
    : new Date().toISOString().slice(0, 10);
  const _now    = new Date(_todayISO + 'T12:00:00');
  const _daysAgo = (ds) => Math.floor((_now - new Date(ds + 'T12:00:00')) / 86400000);
  const _avg    = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const _kneeMax = (k) => Math.max(k.before_score ?? 0, k.during_score ?? 0, k.after_score ?? 0, k.day_after_score ?? 0);

  const _isKneeBodyPart = (inj) => {
    const bp = (inj.body_part || '').toLowerCase();
    return bp === 'body.knee' || bp === 'knee' || bp.includes('kne');
  };

  const _allInjuries = Array.isArray(injuriesData) ? injuriesData : [];
  const _severeInj   = _allInjuries.filter(i => i.severity === 'severe' && i.status !== 'archived');
  const _severeIds   = _severeInj.map(i => i.id).filter(Boolean);

  // injury_pain har ingen user_id-kolonne → bruk sbFetch direkte (uten uf-filter).
  // Filtrering på injury_id impliserer riktig bruker siden _severeIds kom fra sb() med uf.
  let injPainRows = [];
  if (_severeIds.length) {
    const ipData = await sbFetch(
      supabaseUrl, apikey, token, 'injury_pain',
      `select=id,injury_id,date,session_type,before_score,during_score,after_score,day_after_score,source&injury_id=in.(${_severeIds.join(',')})&order=date.desc&limit=200`
    );
    injPainRows = Array.isArray(ipData) ? ipData : [];
  }

  // ── B6: forhåndsberegnede nøkkeltall ──────────────────────────────
  const _loadEvents = AcwrCore.buildLoadEvents({
    sprint: Array.isArray(sprint28) ? sprint28 : [],
    gym: Array.isArray(gym28) ? gym28 : [],
    activity: Array.isArray(act28) ? act28 : [],
  });
  const { acwr } = AcwrCore.acwrOn(_loadEvents, _todayISO);

  const knee60 = Array.isArray(knee28) ? knee28 : [];

  // Felles leksikon for body_part / side (brukes av metrics, injuries-blokk og pain-logg)
  const BODY_NO = { 'body.knee':'Kne','body.hamstring':'Hamstring','body.glute':'Glute',
    'body.hipflexor':'Hoftebøyer','body.hip':'Hofte','body.shoulder':'Skulder','body.back':'Rygg',
    'body.neck':'Nakke','body.ankle':'Ankel','body.calf':'Legg','body.achilles':'Akilles','body.foot':'Fot','body.other':'Annet' };
  const SIDE_NO = { left:'venstre', right:'høyre', both:'begge' };
  const STAT_NO = { active:'AKTIV', improving:'BEDRING', archived:'arkivert' };
  const SEV_NO  = { mild:'mild', moderate:'moderat', severe:'alvorlig' };
  const _fmtName = (inj) => (BODY_NO[inj.body_part] || inj.body_part) + (inj.side && SIDE_NO[inj.side] ? ' ' + SIDE_NO[inj.side] : '');

  // Per-skade "dager siden smerte": injury_pain primær, knee_pain fallback for kne
  const injDaysSince = _severeInj.map(inj => {
    const ipRows = injPainRows.filter(r => r.injury_id === inj.id && _daysAgo(r.date) <= 60);
    const ipLastPain = ipRows.filter(r => _kneeMax(r) > 2).map(r => r.date).sort().pop() || null;
    let dsp = ipLastPain ? _daysAgo(ipLastPain) : null;
    if (dsp === null && _isKneeBodyPart(inj)) {
      const kLast = knee60.filter(k => _kneeMax(k) > 2).map(k => k.date).sort().pop() || null;
      if (kLast) dsp = _daysAgo(kLast);
    }
    return { inj, dsp, latestScore: ipRows[0] ? _kneeMax(ipRows[0]) : null };
  });

  // Legacyfallback: bruk knee_pain alene hvis ingen alvorlige skader er registrert
  const _legacyLastPainDay = knee60.filter(k => _kneeMax(k) > 2).map(k => k.date).sort().pop() || null;
  const _legacyDaysSince   = _legacyLastPainDay ? _daysAgo(_legacyLastPainDay) : null;

  const avgSleep = _avg((Array.isArray(healthData) ? healthData : []).map(h => h.sleep_score).filter(v => v != null));
  const avgHrv   = _avg((Array.isArray(healthData) ? healthData : []).map(h => h.hrv).filter(v => v != null));
  const avgRhr   = _avg((Array.isArray(healthData) ? healthData : []).map(h => h.rhr).filter(v => v != null));

  const metricLines = [];
  if (acwr != null) {
    metricLines.push(`ACWR (akutt:kronisk belastning, EWMA 7d:28d): ${acwr.toFixed(2)}${acwr > 1.5 ? ' ⚠️ over 1.5 = forhøyet skaderisiko' : ''}`);
  }
  if (_severeInj.length) {
    injDaysSince.forEach(({ inj, dsp, latestScore }) => {
      const name = _fmtName(inj);
      metricLines.push(
        `Dager siden siste ${name}-smerte (>2): ${dsp != null ? dsp : 'ingen registrert nylig'}` +
        (latestScore != null ? ` (siste registrerte: ${latestScore}/10)` : '')
      );
    });
  } else {
    metricLines.push(`Dager siden siste knesmerte (>2): ${_legacyDaysSince != null ? _legacyDaysSince : 'ingen smerte registrert nylig'}`);
  }
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
  const injAll = _allInjuries;
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

  // Slå sammen ukeplan: weekly_plan = global standard, training_plan_weekly =
  // per-dag-overstyring for inneværende uke (dato-forankret).
  const DAYS_NO = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
  // 051: resolve template_id -> norsk navn (innebygde maler via i18n_key), ellers
  // tekst-snapshot. Tom = hvile. NB: AI-øvelser kobles ikke på her ennå (egen oppgave).
  const DAYTYPE_NO = {
    'daytype.strength':'Styrke','daytype.strength_capacity':'Styrke Kapasitet',
    'daytype.strength_power':'Styrke Power','daytype.power':'Power',
    'daytype.mobility':'Sirkulasjon & Mobilitet','daytype.conditioning':'Kondisjon',
    'daytype.rest':'Hvile','daytype.rehab':'Rehab','daytype.soccer':'Fotball',
    'daytype.basketball':'Basketball','daytype.track':'Friidrett','daytype.sprint':'Sprint',
  };
  const _tplMap = {};
  (Array.isArray(templatesData) ? templatesData : []).forEach(tpl => {
    _tplMap[tpl.id] = tpl.i18n_key ? (DAYTYPE_NO[tpl.i18n_key] || tpl.name) : tpl.name;
  });
  const _tplName = (tid, txt) => (tid && _tplMap[tid]) ? _tplMap[tid] : (txt || '').trim();
  const planByDay = {};
  (Array.isArray(weeklyPlan) ? weeklyPlan : []).forEach(r => {
    const v = _tplName(r.template_id, r.session_type);
    if (v) planByDay[r.day] = v;
  });
  (Array.isArray(planOverrides) ? planOverrides : []).forEach(r => {
    // En rad = eksplisitt overstyring; '' = dagen tømt denne uka (= hvile).
    planByDay[r.day_index] = _tplName(r.template_id, r.session_text);
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

  // Søvnvarighet: gi AI ferdig "Xt Ym"-streng (matcher fmtHM i utils.js), ikke desimaltimer.
  // 10.7 → "10t 42m". Uten dette leser modellen rå sleep_hours og skriver "10,7t".
  const fmtHM = (h) => {
    if (h == null || isNaN(h) || h <= 0) return null;
    const mins = Math.round(h * 60), hh = Math.floor(mins / 60), mm = mins % 60;
    if (hh <= 0) return `${mm}m`;
    return mm > 0 ? `${hh}t ${mm}m` : `${hh}t`;
  };
  const fmtSleep = (rows) => Array.isArray(rows)
    ? rows.map(r => r.sleep_hours != null
        ? { ...r, sleep_varighet: fmtHM(r.sleep_hours), sleep_hours: undefined }
        : r)
    : rows;

  // Per-skade smerte-logg: injury_pain primær, knee_pain fallback for kne-skaden
  let painLogHeader, painLogBlock;
  if (_severeInj.length) {
    painLogHeader = '[SMERTE-LOGGER — SISTE 7 PER AKTIV SKADE]';
    const parts = _severeInj.map(inj => {
      const name = _fmtName(inj);
      const rows = injPainRows.filter(r => r.injury_id === inj.id).slice(0, 7);
      if (rows.length === 0 && _isKneeBodyPart(inj)) {
        const kpRows = (Array.isArray(kneePainData) ? kneePainData : []).slice(0, 7);
        return `${name} (fra knee_pain, fallback):\n${JSON.stringify(stripMeta(kpRows))}`;
      }
      if (rows.length === 0) return `${name}: (ingen registrert)`;
      return `${name}:\n${JSON.stringify(rows.map(({ id: _i, injury_id: _ij, source: _s, ...r }) => r))}`;
    });
    painLogBlock = parts.join('\n\n');
  } else {
    painLogHeader = '[KNESMERTE-LOGGER — SISTE 7]';
    painLogBlock  = JSON.stringify(stripMeta(kneePainData));
  }

  // Gym-program per styrkedag — så AI vet hvilke øvelser Filip faktisk har på man/ons/fre
  // (gym_log viser bare det som er logget; dette er selve planen med anbefalte sett×reps).
  const PROG_DAY_NO = {
    monday: 'Mandag', wednesday: 'Onsdag', friday: 'Fredag',
    monday_warmup: 'Mandag (oppvarming)', wednesday_warmup: 'Onsdag (oppvarming)',
    friday_warmup: 'Fredag (oppvarming)', rehab: 'Rehab',
  };
  const PROG_ORDER = ['monday', 'monday_warmup', 'wednesday', 'wednesday_warmup', 'friday', 'friday_warmup', 'rehab'];
  const progRows = Array.isArray(programData) ? programData : [];
  const progByDay = {};
  progRows.forEach(r => { (progByDay[r.day] ||= []).push(r); });
  const progKeys = Object.keys(progByDay).sort(
    (a, b) => (PROG_ORDER.indexOf(a) + 1 || 99) - (PROG_ORDER.indexOf(b) + 1 || 99)
  );
  const progFmt = r => {
    const sr = [r.sets ? `${r.sets}×` : '', r.reps || ''].join('').trim();
    return `  - ${r.exercise_name}${sr ? ` (${sr})` : ''}`;
  };
  const programBlock = progKeys.length
    ? `[GYM-PROGRAM PER DAG — øvelsene Filip har planlagt på hver styrkedag, med anbefalte sett×reps. Bruk dette når han spør om en gymdag eller om progresjon/overload.]
${progKeys.map(k => `${PROG_DAY_NO[k] || k}:\n${progByDay[k].map(progFmt).join('\n')}`).join('\n\n')}`
    : `[GYM-PROGRAM PER DAG]
(Ingen øvelser lagt inn i programmet ennå.)`;

  const context = `[DAGENS DATO]
${osloDate} (${osloDateISO})

${metricsBlock}

${injuriesBlock}

${physioBlock}

${notesBlock}

[UKEPLAN — hva som er planlagt per ukedag]
${weekPlanReadable}

${programBlock}

[PERSONLIGE REKORDER (PB) — sprint]
${JSON.stringify(stripMeta(sprintRecords))}

[SØVN + HRV + PULS — SISTE 7 DAGER] (sleep_varighet er allerede formatert, f.eks. "10t 42m" — bruk den direkte, ikke regn om)
${JSON.stringify(stripMeta(fmtSleep(healthData)))}

[SPRINT-LOGGER — SISTE 7]
${JSON.stringify(stripMeta(sprintData))}

[GYM-LOGGER — SISTE 7]
${JSON.stringify(stripMeta(gymData))}

${painLogHeader}
${painLogBlock}

[ANDRE AKTIVITETER — SISTE 7 (fotball, basket, padel, svømming, rolig dag osv)]
${JSON.stringify(stripMeta(activityData))}`;

  return { context, osloDateISO };
}
