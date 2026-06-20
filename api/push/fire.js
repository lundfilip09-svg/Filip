// api/push/fire.js
// Leverer ett planlagt varsel. Kalles av QStash på riktig tidspunkt.
// POST { id, secret }   (secret må matche CRON_SECRET)
// Idempotent: dobbel levering hindres ved å "claime" raden (sent=false → true).

import { sb, sendToAll, cors } from '../_lib/push.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, secret } = req.body || {};
  if (secret !== process.env.CRON_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  if (!id) return res.status(400).json({ error: 'Missing id' });

  try {
    // Atomisk claim: kun rader som verken er sendt eller kansellert
    const claimed = await sb(
      `scheduled_notifications?id=eq.${id}&sent=eq.false&cancelled=eq.false`,
      { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { sent: true } });

    const row = Array.isArray(claimed) ? claimed[0] : claimed;
    if (!row) return res.status(200).json({ ok: true, skipped: true }); // alt sendt/kansellert

    const result = await sendToAll({
      title: row.title,
      body:  row.body || '',
      tag:   row.tag || `sched-${row.id}`,
      url:   row.url || '/',
    });
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
