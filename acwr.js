// acwr.js — delt ACWR-beregning (acute:chronic workload ratio, EWMA-variant)
// ÉN kilde til sannhet for formelen. Brukes av:
//   - klient: script-tag med src="acwr.js" → window.AcwrCore
//   - server: api/_lib/context.js → import '../../acwr.js' → globalThis.AcwrCore
//
// Metode (Williams et al. 2017 — EWMA foretrukket over rullerende sum):
//   load = rpe/10 (default-rpe: sprint 50, gym 60, aktivitet 50)
//   daglig load = sum av øktene den dagen, hviledag = 0
//   EWMA_i = load_i × λ + (1 − λ) × EWMA_(i−1),  λ = 2/(N+1)
//   akutt: N=7 (λ=0.25) · kronisk: N=28 (λ≈0.069)
//   ACWR = EWMA_akutt / EWMA_kronisk
//   Gyldig kun ved ≥ 8 økter siste 28d og kronisk > 0 (ellers null) — som før.
//   Oppvarming: beregningen starter 56 dager før første viste dag, slik at
//   EWMA-ene har konvergert ((1−λc)^56 ≈ 0.02 restbias).
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AcwrCore = api; // alltid på global — også under bundling
})(typeof globalThis !== 'undefined' ? globalThis : self, function () {

  const DEFAULT_RPE = { sprint: 50, gym: 60, activity: 50 };
  const LAMBDA_ACUTE = 2 / (7 + 1);
  const LAMBDA_CHRONIC = 2 / (28 + 1);
  const WARMUP_DAYS = 56;

  // rows: [{date, rpe}] per tabell → flat liste av {date, load}
  function buildLoadEvents({ sprint = [], gym = [], activity = [] }) {
    const ev = [
      ...sprint.map(r => ({ date: r.date, load: (r.rpe || DEFAULT_RPE.sprint) / 10 })),
      ...gym.map(r => ({ date: r.date, load: (r.rpe || DEFAULT_RPE.gym) / 10 })),
      ...activity.map(r => ({ date: r.date, load: (r.rpe || DEFAULT_RPE.activity) / 10 })),
    ];
    return ev.filter(e => e.date);
  }

  function _addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // Kjernen: én EWMA-gjennomkjøring fra (end − nDays + 1 − WARMUP) til end.
  // Returnerer de siste nDays dagene som [{date, acute, chronic, acwr, n28}].
  function _ewmaSeries(events, endISO, nDays) {
    const loadByDate = {};
    for (const e of events) loadByDate[e.date] = (loadByDate[e.date] || 0) + e.load;
    const sessionDates = events.map(e => e.date); // for n28-gyldighetsregelen

    // Start: minst WARMUP_DAYS før første viste dag, men dra med ALL eldre
    // historikk som finnes (capped 400d) — gjør acwrOn og acwrSeries
    // eksakt konsistente uansett vindusstørrelse.
    const firstShownISO = _addDays(endISO, -(nDays - 1));
    let startISO = _addDays(firstShownISO, -WARMUP_DAYS);
    for (const d in loadByDate) if (d < startISO) startISO = d;
    const capISO = _addDays(endISO, -400);
    if (startISO < capISO) startISO = capISO;

    const out = [];
    let ewmaA = 0, ewmaC = 0;
    let day = startISO;
    while (day <= endISO) {
      const load = loadByDate[day] || 0;
      ewmaA = load * LAMBDA_ACUTE + (1 - LAMBDA_ACUTE) * ewmaA;
      ewmaC = load * LAMBDA_CHRONIC + (1 - LAMBDA_CHRONIC) * ewmaC;
      if (day >= firstShownISO) {
        const lo = _addDays(day, -27);
        const n28 = sessionDates.filter(d => d >= lo && d <= day).length;
        out.push({
          date: day,
          acute: ewmaA,
          chronic: ewmaC,
          n28,
          acwr: (n28 >= 8 && ewmaC > 1e-9) ? ewmaA / ewmaC : null,
        });
      }
      day = _addDays(day, 1);
    }
    return out;
  }

  // ACWR per gitt dato. Returnerer { acute, chronic, acwr, n28 }.
  function acwrOn(events, dateISO) {
    return _ewmaSeries(events, dateISO, 1)[0];
  }

  // Daglig serie t.o.m. endISO, nDays bakover → [{date, acwr}]
  function acwrSeries(events, endISO, nDays) {
    return _ewmaSeries(events, endISO, nDays).map(p => ({ date: p.date, acwr: p.acwr }));
  }

  return { DEFAULT_RPE, buildLoadEvents, acwrOn, acwrSeries };
});
