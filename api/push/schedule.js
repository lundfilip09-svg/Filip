// api/push/schedule.js
// Planlegger et Web Push-varsel som leveres på riktig tidspunkt.
// POST {
//   kind:'rest'|'todo', title, body?, tag?, url?,
//   delaySeconds?  (relativ — brukes av hviletimer),
//   fireAt?        (ISO-tidspunkt — brukes av gjøremål-påminnelser),
//   todoId?        (erstatter eksisterende påminnelse for samme gjøremål)
// }
// → { id, scheduled }   (scheduled=true betyr QStash ga sekund-presis trigger)

import { sb, verifyUser, qstashPublish, qstashDelete, baseUrl, cors } from '../_lib/push.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { kind, title, body, tag, url, delaySeconds, fireAt, todoId } = req.body || {};
  if (!kind || !title) return res.status(400).json({ error: 'Missing kind/title' });

  const fireAtIso = fireAt
    ? new Date(fireAt).toISOString()
    : new Date(Date.now() + (Number(delaySeconds) || 0) * 1000).toISOString();

  try {
    // Erstatt evt. ventende påminnelse for samme gjøremål
    if (todoId) {
      const existing = await sb(
        `scheduled_notifications?todo_id=eq.${todoId}&sent=eq.false&cancelled=eq.false&select=id,qstash_msg_id`);
      for (const r of existing || []) {
        await qstashDelete(r.qstash_msg_id);
        await sb(`scheduled_notifications?id=eq.${r.id}`, { method: 'PATCH', body: { cancelled: true } });
      }
    }

    const inserted = await sb('scheduled_notifications', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: {
        user_id: userId, kind, title,
        body: body || null, tag: tag || null, url: url || null,
        fire_at: fireAtIso, todo_id: todoId || null,
      },
    });
    const row = Array.isArray(inserted) ? inserted[0] : inserted;

    // Sekund-presis trigger via QStash (valgfri — uten den finnes raden for sweep-fallback)
    let msgId = null;
    try {
      const delay = Math.max(0, Math.round((new Date(fireAtIso).getTime() - Date.now()) / 1000));
      msgId = await qstashPublish({
        url: `${baseUrl(req)}/api/push/fire`,
        body: { id: row.id, secret: process.env.CRON_SECRET },
        delaySeconds: delay,
      });
      if (msgId) {
        await sb(`scheduled_notifications?id=eq.${row.id}`, { method: 'PATCH', body: { qstash_msg_id: msgId } });
      }
    } catch (e) {
      // QStash er valgfri — raden eksisterer fortsatt for /api/push/sweep
    }

    return res.status(200).json({ id: row.id, scheduled: !!msgId });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
