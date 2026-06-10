// api/ai-chat.js
// Mottar brukermelding, henter treningsdata fra Supabase (via api/_lib/context.js),
// og sender til Anthropic API. Returnerer AI-svar.
//
// Nødvendige env-variabler i Vercel:
//   SUPABASE_URL
//   SUPABASE_ANON_KEY
//   ANTHROPIC_API_KEY

import { SYSTEM_PROMPT, buildAiContext } from './_lib/context.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history, localDate, tz } = req.body || {};
  const authHeader = req.headers.authorization;

  if (!message || !authHeader) {
    return res.status(400).json({ error: 'Mangler melding eller autentisering' });
  }

  // Sanitise history: must be alternating user/assistant messages
  const safeHistory = (Array.isArray(history)
    ? history.filter(m => m
        && (m.role === 'user' || m.role === 'assistant')
        && typeof m.content === 'string'
        && m.content.length < 8000)
    : []).slice(-4);

  const token = authHeader.replace('Bearer ', '').trim();
  const { SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'Mangler miljøvariabler (SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY)' });
  }

  // Verify auth by fetching user profile
  const authCheck = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!authCheck.ok) return res.status(401).json({ error: 'Ikke autentisert' });

  // Hent treningsdata og bygg kontekst (delt med weekly-summary)
  const { context, osloDateISO } = await buildAiContext({
    supabaseUrl: SUPABASE_URL,
    apikey: SUPABASE_ANON_KEY,
    token,
    localDate,
    tz,
  });

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      // System-prompten er statisk → cache den. Cache-treff koster 0.1x input,
      // så de ~1000 tokenene gjenbrukes nesten gratis i hver melding (5 min TTL).
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [
        ...safeHistory,
        {
          role: 'user',
          content: `${context}\n\n---\n\n${message}`,
        },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const rawBody = await anthropicRes.text();
    let parsed = {};
    try { parsed = JSON.parse(rawBody); } catch {}
    const detail = parsed.error?.message || rawBody || 'ukjent feil';
    const errorMsg = `Anthropic ${anthropicRes.status}: ${detail}`;
    return res.status(502).json({ error: errorMsg });
  }

  const data = await anthropicRes.json();
  let reply = data.content?.[0]?.text || 'Tomt svar fra AI.';

  // B6: trekk ut og lagre evt. [NOTAT: ...] fra svaret, og fjern det fra det
  // brukeren ser. Fire-and-forget — feiler det, fortsetter vi uten å blokkere.
  const noteMatch = reply.match(/\[NOTAT:\s*([\s\S]*?)\]\s*$/i);
  if (noteMatch) {
    const note = noteMatch[1].trim().slice(0, 500);
    reply = reply.replace(/\[NOTAT:[\s\S]*?\]\s*$/i, '').trim();
    if (note) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/ai_notes`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ date: osloDateISO, note }),
        });
      } catch { /* stille — notat er sekundært */ }
    }
  }

  return res.status(200).json({ reply });
}
