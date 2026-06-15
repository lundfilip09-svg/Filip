// api/push/sweep.js
// Reserve-leveringsvei: finner forfalte varsler og sender dem.
// GET med  Authorization: Bearer <CRON_SECRET>
//
// Brukes ikke som standard. Hvis du er på Vercel Pro og IKKE vil bruke QStash,
// legg denne i vercel.json som cron «* * * * *» (presisjon da ±60 s).
// QStash gir sekund-presisjon og er anbefalt for hviletimeren.

import { sb, sendToAll } from '../_lib/push.js';

export default async function handler(req, res) {
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const nowIso = new Date().toISOString();
    const due = await sb(
      `scheduled_notifications?sent=eq.false&cancelled=eq.false&fire_at=lte.${nowIso}` +
      `&select=*&order=fire_at.asc&limit=50`);

    let sent = 0;
    for (const row of due || []) {
      const claimed = await sb(
        `scheduled_notifications?id=eq.${row.id}&sent=eq.false&cancelled=eq.false`,
        { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { sent: true } });
      if (!(Array.isArray(claimed) ? claimed[0] : claimed)) continue;
      await sendToAll({
        title: row.title, body: row.body || '',
        tag: row.tag || `sched-${row.id}`, url: row.url || '/',
      });
      sent++;
    }
    return res.status(200).json({ ok: true, sent });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
