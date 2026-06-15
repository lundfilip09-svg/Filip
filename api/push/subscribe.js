// api/push/subscribe.js
// Lagrer (eller fjerner) et Web Push-abonnement for innlogget bruker.
// POST { subscription }            → lagre/oppdater
// POST { subscription, unsubscribe:true } → fjern

import { sb, verifyUser, cors } from '../_lib/push.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
