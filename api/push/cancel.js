// api/push/cancel.js
// Kansellerer et planlagt varsel (hviletimer stoppet / gjøremål fullført|slettet).
// POST { id }      → kanseller spesifikk rad
// POST { todoId }  → kanseller alle ventende påminnelser for et gjøremål

import { sb, verifyUser, qstashDelete, cors } from '../_lib/push.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id, todoId } = req.body || {};
  if (!id && !todoId) return res.status(400).json({ error: 'Missing id/todoId' });

  const filter = id
    ? `id=eq.${id}`
    : `todo_id=eq.${todoId}&sent=eq.false&cancelled=eq.false`;

  try {
    const rows = await sb(`scheduled_notifications?${filter}&select=id,qstash_msg_id`);
    for (const r of rows || []) {
      await qstashDelete(r.qstash_msg_id);
      await sb(`scheduled_notifications?id=eq.${r.id}`, { method: 'PATCH', body: { cancelled: true } });
    }
    return res.status(200).json({ ok: true, cancelled: (rows || []).length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
