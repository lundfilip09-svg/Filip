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

  // 7-dagers vindu (UTC, dato-streng) for treningsbelastning + søvn-historikk.
  const dayMs = 86400000;
  const cutoff7  = new Date(Date.now() -  6 * dayMs).toISOString().slice(0, 10);
  const cutoff14 = new Date(Date.now() - 13 * dayMs).toISOString().slice(0, 10);
  const cutoff8  = new Date(Date.now() -  7 * dayMs).toISOString().slice(0, 10);

  // Normaliser én belastnings-rad fra de tre kildetabellene til felles form.
  // session_type-kolonnen heter forskjellig per tabell (session_type / type /
  // activity_type). RPE lagres på 1–100-skala (migrasjon 018).
  const loadRow = (r, typeKey, source) => ({
    date: r.date,
    rpe: r.rpe,
    duration_min: r.duration_min ?? (source === 'sprint' ? 75 : 60),
    session_type: r[typeKey] || null,
    source,
  });

  try {
    // health_data limit=7 → rad [0] = siste natt, rad [1] = forrige loggførte
    // natt ("i går"), alle 7 brukes til søvn-historikk-stolpene (Large-widget).
    const [sleepRows, kneeRows, todoRows, gymLoad, sprintLoad, actLoad, weeklyRows,
           gymPrev, sprintPrev, actPrev, injuriesRows, businessRows] =
      await Promise.all([
        sb('health_data?select=date,sleep_score,sleep_hours,hrv,rhr,deep_sleep_minutes,light_sleep_minutes,rem_sleep_minutes,awake_minutes,sleep_start,sleep_end&order=date.desc&limit=7', cfg),
        sb('knee_pain?select=date,session_type,before_score,during_score,after_score,day_after_score&order=date.desc&limit=2', cfg),
        sb('todos?select=title,due_date,list_name,important&completed=eq.false&due_date=not.is.null&order=due_date.asc&limit=6', cfg),
        sb(`gym_log?select=date,rpe,duration_min,session_type&date=gte.${cutoff7}&order=date.desc`, cfg),
        sb(`sprint_log?select=date,rpe,duration_min,type&date=gte.${cutoff7}&order=date.desc`, cfg),
        sb(`activity_log?select=date,rpe,duration_min,activity_type&date=gte.${cutoff7}&order=date.desc`, cfg),
        sb('weekly_summaries?select=week_start,content_no,content_en&order=week_start.desc&limit=1', cfg),
        sb(`gym_log?select=date,rpe,duration_min&date=gte.${cutoff14}&date=lte.${cutoff8}&order=date.desc`, cfg),
        sb(`sprint_log?select=date,rpe,duration_min&date=gte.${cutoff14}&date=lte.${cutoff8}&order=date.desc`, cfg),
        sb(`activity_log?select=date,rpe,duration_min&date=gte.${cutoff14}&date=lte.${cutoff8}&order=date.desc`, cfg),
        sb('injuries?select=id,body_part,side,status,severity&severity=eq.severe&status=in.(active,improving)&order=updated_at.desc&limit=10', cfg),
        sb('business_customers?select=name,price,tier,business_model,status,deposit_paid&status=eq.Aktiv', cfg),
      ]);

    // Phase 2: injury_pain for severe injuries (needs IDs from phase 1).
    // injury_pain har ingen user_id → hentes direkte uten user-filter.
    // Filtrering på injury_id skoper til riktig bruker (service_role bypasser uansett RLS).
    const severeInjs = Array.isArray(injuriesRows) ? injuriesRows : [];
    const severeIds  = severeInjs.map(i => i.id).filter(Boolean);
    let injPainRows = [];
    if (severeIds.length) {
      const ipData = await sb(
        `injury_pain?select=id,injury_id,date,session_type,before_score,during_score,after_score,day_after_score&injury_id=in.(${severeIds.join(',')})&order=date.desc&limit=50`,
        cfg
      );
      injPainRows = Array.isArray(ipData) ? ipData : [];
    }

    // Siste injury_pain-rad per skade og forrige rad (for trendutspeiling i widget)
    const injPainLatest = {};   // injuryId → nyeste rad
    const injPainPrev   = {};   // injuryId → nest-nyeste rad
    for (const row of injPainRows) {
      if (!injPainLatest[row.injury_id]) {
        injPainLatest[row.injury_id] = row;
      } else if (!injPainPrev[row.injury_id]) {
        injPainPrev[row.injury_id] = row;
      }
    }

    const sleep = sleepRows[0] || null;
    const sleepPrev = sleepRows[1] || null;
    const weekly = (weeklyRows && weeklyRows[0]) || null;

    // knee: les fra injury_pain for kne-skaden, fall tilbake til knee_pain
    const isKneeBodyPart = (inj) => {
      const bp = (inj.body_part || '').toLowerCase();
      return bp === 'body.knee' || bp === 'knee' || bp.includes('kne');
    };
    const kneeInj = severeInjs.find(isKneeBodyPart);
    const kneeIpRow  = kneeInj ? (injPainLatest[kneeInj.id] || null) : null;
    const kneeIpPrev = kneeInj ? (injPainPrev[kneeInj.id]   || null) : null;
    const kneeRow  = kneeRows[0] || null;
    const kneePrev = kneeRows[1] || null;

    // Normaliser til felles knee-shape (injury_pain → field-mapping → same names)
    const toKneeShape = (ipRow) => ipRow ? {
      date: ipRow.date, session_type: ipRow.session_type,
      before: ipRow.before_score, during: ipRow.during_score,
      after: ipRow.after_score, day_after: ipRow.day_after_score,
    } : null;
    const kneeOut = kneeIpRow
      ? toKneeShape(kneeIpRow)
      : kneeRow && { date: kneeRow.date, session_type: kneeRow.session_type,
          before: kneeRow.before_score, during: kneeRow.during_score,
          after: kneeRow.after_score, day_after: kneeRow.day_after_score };
    const kneePrevOut = kneeIpPrev
      ? { worst_score: worstKnee(kneeIpPrev) }
      : kneePrev ? { worst_score: worstKnee(kneePrev) } : null;

    // business: forskudd-teller (A/B, ubetalt) + MRR-liste (C, aktive abonnement).
    const bizRows = Array.isArray(businessRows) ? businessRows : [];
    const unpaidDeposits = bizRows.filter(
      (r) => (r.business_model === 'A' || r.business_model === 'B') && r.deposit_paid === false
    ).length;
    const subscriptions = bizRows
      .filter((r) => r.business_model === 'C')
      .map((r) => ({ name: r.name, price: r.price, tier: r.tier }));
    const mrr = subscriptions.reduce((sum, r) => sum + (Number(r.price) || 0), 0);

    const last7load = [
      ...(gymLoad || []).map(r => loadRow(r, 'session_type', 'gym')),
      ...(sprintLoad || []).map(r => loadRow(r, 'type', 'sprint')),
      ...(actLoad || []).map(r => loadRow(r, 'activity_type', 'activity')),
    ];
    const prev7load = [
      ...(gymPrev || []).map(r => loadRow(r, 'session_type', 'gym')),
      ...(sprintPrev || []).map(r => loadRow(r, 'type', 'sprint')),
      ...(actPrev || []).map(r => loadRow(r, 'activity_type', 'activity')),
    ];

    return res.status(200).json({
      generated_at: new Date().toISOString(),
      sleep: sleep && {
        date: sleep.date,
        score: sleep.sleep_score,
        hours: sleep.sleep_hours,
        hrv: sleep.hrv,
        rhr: sleep.rhr,
        deep_sleep_minutes: sleep.deep_sleep_minutes,
        light_sleep_minutes: sleep.light_sleep_minutes,
        rem_sleep_minutes: sleep.rem_sleep_minutes,
        awake_minutes: sleep.awake_minutes,
        sleep_start: sleep.sleep_start,
        sleep_end: sleep.sleep_end,
      },
      // knee: bakoverkompatibel — leser fra injury_pain for kne-skaden, fallback knee_pain
      knee: kneeOut,
      // injuries: ett objekt per alvorlig aktiv/bedring-skade med siste smertedata
      injuries: severeInjs.map(inj => {
        const latest = injPainLatest[inj.id] || null;
        return {
          id: inj.id,
          body_part: inj.body_part,
          side: inj.side,
          status: inj.status,
          severity: inj.severity,
          latest_pain: latest ? {
            date: latest.date,
            session_type: latest.session_type,
            before: latest.before_score,
            during: latest.during_score,
            after: latest.after_score,
            day_after: latest.day_after_score,
          } : null,
        };
      }),
      todos: (todoRows || []).map(t => ({
        title: t.title,
        due_date: t.due_date,
        list_name: t.list_name,
        important: t.important,
      })),
      // Forrige loggførte dag — driver trend-pilene i widgetene.
      yesterday: {
        sleep: sleepPrev ? { score: sleepPrev.sleep_score, hrv: sleepPrev.hrv } : null,
        knee: kneePrevOut,
      },
      // Siste 7 loggførte netter (nyeste først): til søvnscore-stolper.
      last7sleep: (sleepRows || []).map(r => ({ date: r.date, sleep_score: r.sleep_score })),
      // Siste 7 dager rå treningsøkter fra alle tre kilder. Widgeten regner
      // sRPE selv (varighet × RPE/10) og summerer per dag.
      last7load,
      prev7load,
      // Siste ukesrapport. content_no/content_en er DB-kolonnenavnene; eksponeres
      // som summary_no/summary_en for widgeten.
      weekly_summary: weekly && {
        week_start: weekly.week_start,
        summary_no: weekly.content_no,
        summary_en: weekly.content_en,
      },
      // business: forskudd (ubetalt-teller A/B) + MRR (aktive C-abonnement).
      business: {
        unpaid_deposits: unpaidDeposits,
        mrr,
        subscriptions,
      },
    });
  } catch (e) {
    return res.status(502).json({ error: 'Kunne ikke hente data', detail: String(e.message || e) });
  }
}
