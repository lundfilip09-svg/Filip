// api/push.js
// Slått sammen fra push/cancel.js, push/fire.js, push/schedule.js og
// push/subscribe.js for å holde oss under Vercel Hobby sin grense på
// 12 Serverless Functions. Rutes på ?action=cancel|fire|schedule|subscribe
// (samme mønster som api/finnhub.js bruker for ?endpoint=).
//
// Frontend (utils.js) kaller:
//   POST /api/push?action=subscribe
//   POST /api/push?action=schedule
//   POST /api/push?action=cancel
// QStash kaller (planlagt av action=schedule):
//   POST /api/push?action=fire

import { sb, verifyUser, sendToAll, qstashPublish, qstashDelete, baseUrl, cors } from './_lib/push.js';

// ── action=subscribe ────────────────────────────────────────────────────────
// POST { subscription }            → lagre/oppdater
// POST { subscription, unsubscribe:true } → fjern
async function actionSubscribe(req, res) {
  const userId = await verifyUser(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { subscription, unsubscribe } = req.body || {};
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Missing subscription' });

  try {
    if (unsubscribe) {
      await sb(`push_subscriptions?endpoint=eq.${encodeURIComponent(subscription.endpoint)}`,
        { method: 'DELETE' });
      return res.status(200).json({ ok: true });
    }
    await sb('push_subscriptions?on_conflict=endpoint', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: {
        user_id:    userId,
        endpoint:   subscription.endpoint,
        p256dh:     subscription.keys?.p256dh,
        auth:       subscription.keys?.auth,
        user_agent: req.headers['user-agent'] || null,
        updated_at: new Date().toISOString(),
      },
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

// ── action=schedule ──────────────────────────────────────────────────────────
// POST {
//   kind:'rest'|'todo', title, body?, tag?, url?,
//   delaySeconds?  (relativ — brukes av hviletimer),
//   fireAt?        (ISO-tidspunkt — brukes av gjøremål-påminnelser),
//   todoId?        (erstatter eksisterende påminnelse for samme gjøremål)
// }
// → { id, scheduled }   (scheduled=true betyr QStash ga sekund-presis trigger)
async function actionSchedule(req, res) {
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
        url: `${baseUrl(req)}/api/push?action=fire`,
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

// ── action=cancel ─────────────────────────────────────────────────────────────
// POST { id }      → kanseller spesifikk rad
// POST { todoId }  → kanseller alle ventende påminnelser for et gjøremål
async function actionCancel(req, res) {
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

// ── action=fire ────────────────────────────────────────────────────────────────
// Leverer ett planlagt varsel. Kalles av QStash på riktig tidspunkt.
// POST { id, secret }   (secret må matche CRON_SECRET)
// Idempotent: dobbel levering hindres ved å "claime" raden (sent=false → true).
async function actionFire(req, res) {
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

const ACTIONS = {
  subscribe: actionSubscribe,
  schedule:  actionSchedule,
  cancel:    actionCancel,
  fire:      actionFire,
};

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action;
  const fn = ACTIONS[action];
  if (!fn) return res.status(400).json({ error: 'Invalid or missing ?action= (subscribe|schedule|cancel|fire)' });

  return fn(req, res);
}
