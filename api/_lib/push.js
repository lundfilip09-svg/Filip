// api/_lib/push.js
// Delt hjelpebibliotek for Web Push (VAPID) + QStash-planlegging.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY  (finnes alt)
//   CRON_SECRET                                                  (finnes alt)
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT           (NY)
//   QSTASH_TOKEN                                                 (NY – valgfri,
//     men kreves for sekund-presis levering i bakgrunnen)

import webpush from 'web-push';

const SB  = process.env.SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ── Supabase REST (service-role: forbigår RLS) ──────────────────────────────
export async function sb(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${SB}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SRK,
      Authorization: `Bearer ${SRK}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return data;
}

// ── VAPID / web-push ────────────────────────────────────────────────────────
let _vapidSet = false;
function ensureVapid() {
  if (_vapidSet) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:filip.lund09@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
  _vapidSet = true;
}

// Send et varsel til alle lagrede abonnement. Rydder bort døde abonnement (404/410).
export async function sendToAll(payload) {
  ensureVapid();
  const subs = await sb('push_subscriptions?select=*');
  if (!Array.isArray(subs) || !subs.length) return { sent: 0, results: [] };
  const json = JSON.stringify(payload);
  const results = await Promise.all(subs.map(async (s) => {
    const ep = (s.endpoint || '').replace(/^https:\/\//, '').slice(0, 38);
    try {
      // Hard timeout så ett dødt endepunkt (f.eks. gammel FCM) ikke henger alt
      const res = await Promise.race([
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, json),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000)),
      ]);
      return { ep, status: res.statusCode };
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await sb(`push_subscriptions?id=eq.${s.id}`, { method: 'DELETE' }).catch(() => {});
        return { ep, status: err.statusCode, removed: true };
      }
      return { ep, status: err.statusCode || 0, error: String(err.body || err.message || '').slice(0, 160) };
    }
  }));
  const sent = results.filter(r => r.status >= 200 && r.status < 300).length;
  return { sent, results };
}

// ── Bruker-token-validering (klient-vendte endepunkter) ─────────────────────
export async function verifyUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const res = await fetch(`${SB}/auth/v1/user`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id || null;
  } catch { return null; }
}

// ── QStash (forsinket levering med sekund-presisjon) ────────────────────────
export async function qstashPublish({ url, body, delaySeconds }) {
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;            // ingen planlegger satt opp → graceful no-op
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  if (delaySeconds != null) headers['Upstash-Delay'] = `${Math.max(0, Math.round(delaySeconds))}s`;
  const res = await fetch(`https://qstash.upstash.io/v2/publish/${url}`, {
    method: 'POST', headers, body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(`QStash ${res.status}: ${await res.text()}`);
  const data = await res.json().catch(() => ({}));
  return data.messageId || null;
}

export async function qstashDelete(msgId) {
  const token = process.env.QSTASH_TOKEN;
  if (!token || !msgId) return;
  await fetch(`https://qstash.upstash.io/v2/messages/${msgId}`, {
    method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

// ── Diverse ─────────────────────────────────────────────────────────────────
export function baseUrl(req) {
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

// Setter CORS-headere. Returnerer true hvis dette var en OPTIONS-preflight
// (kalleren skal da returnere umiddelbart).
export function cors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
