// acwr.js — delt ACWR-beregning (acute:chronic workload ratio)
// ÉN kilde til sannhet for formelen. Brukes av:
//   - klient: script-tag med src="acwr.js" → window.AcwrCore
//   - server: api/_lib/context.js → import '../../acwr.js' → globalThis.AcwrCore
// Formel (uendret fra opprinnelig context.js):
//   load = rpe/10 (default-rpe: sprint 50, gym 60, aktivitet 50)
//   akutt = sum load siste 7d, kronisk = sum load siste 28d / 4
//   ACWR = akutt/kronisk, kun gyldig ved >= 8 økter i 28d-vinduet og kronisk > 0
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.AcwrCore = api; // alltid på global — også under bundling
})(typeof globalThis !== 'undefined' ? globalThis : self, function () {

  const DEFAULT_RPE = { sprint: 50, gym: 60, activity: 50 };

  // rows: [{date, rpe}] per tabell → flat liste av {date, load}
  function buildLoadEvents({ sprint = [], gym = [], activity = [] }) {
    const ev = [
      ...sprint.map(r => ({ date: r.date, load: (r.rpe || DEFAULT_RPE.sprint) / 10 })),
      ...gym.map(r => ({ date: r.date, load: (r.rpe || DEFAULT_RPE.gym) / 10 })),
      ...activity.map(r => ({ date: r.date, load: (r.rpe || DEFAULT_RPE.activity) / 10 })),
    ];
    return ev.filter(e => e.date);
  }

  function _dayDiff(fromISO, toISO) {
    return Math.floor((new Date(toISO + 'T12:00:00') - new Date(fromISO + 'T12:00:00')) / 86400000);
  }

  // ACWR per gitt dato. Returnerer { acute, chronic, acwr, n28 }.
  function acwrOn(events, dateISO) {
    let acute = 0, chronicSum = 0, n28 = 0;
    for (const e of events) {
      const d = _dayDiff(e.date, dateISO); // dager siden økten, sett fra dateISO
      if (d < 0 || d >= 28) continue;
      chronicSum += e.load; n28++;
      if (d < 7) acute += e.load;
    }
    const chronic = chronicSum / 4;
    const acwr = (n28 >= 8 && chronic > 0) ? acute / chronic : null;
    return { acute, chronic, acwr, n28 };
  }

  // Daglig serie t.o.m. endISO, nDays bakover → [{date, acwr}]
  function acwrSeries(events, endISO, nDays) {
    const out = [];
    const end = new Date(endISO + 'T12:00:00');
    for (let i = nDays - 1; i >= 0; i--) {
      const d = new Date(end); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      out.push({ date: iso, acwr: acwrOn(events, iso).acwr });
    }
    return out;
  }

  return { DEFAULT_RPE, buildLoadEvents, acwrOn, acwrSeries };
});
