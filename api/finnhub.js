// api/finnhub.js
// Proxy mot Finnhub — API-nøkkel eksponeres ALDRI til klienten.
// Vercel Serverless Function. Ingen caching/cron (bevisst enkelt).
// Krever: Authorization: Bearer <supabase-jwt> (samme mønster som google-calendar.js)
//
// Nødvendig env-variabel i Vercel:
//   FINNHUB_API_KEY

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

const ENDPOINTS = {
  quote:   (ticker) => `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(ticker)}`,
  profile: (ticker) => `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(ticker)}`,
  earnings: (ticker) => `${FINNHUB_BASE}/calendar/earnings?symbol=${encodeURIComponent(ticker)}`,
  search:  (ticker) => `${FINNHUB_BASE}/search?q=${encodeURIComponent(ticker)}`,
};

async function requireAuth(req, res) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) { res.status(401).json({ error: 'unauthorized' }); return false; }
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!r.ok) { res.status(401).json({ error: 'unauthorized' }); return false; }
  return true;
}

function resolveOrigin(req) {
  const origin = req.headers['origin'] || '';
  if (origin === 'https://filip-vita.vercel.app') return origin;
  if (/^https:\/\/filip-vita-[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return origin;
  if (/^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return origin;
  return 'https://filip-vita.vercel.app';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', resolveOrigin(req));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (!await requireAuth(req, res)) return;

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
  if (!FINNHUB_API_KEY) {
    return res.status(503).json({ error: 'FINNHUB_API_KEY not configured' });
  }

  const { ticker, endpoint } = req.query;
  if (!ticker || !endpoint) {
    return res.status(400).json({ error: 'Missing ticker or endpoint' });
  }
  const build = ENDPOINTS[endpoint];
  if (!build) {
    return res.status(400).json({ error: 'Invalid endpoint' });
  }

  try {
    const url = build(ticker) + (build(ticker).includes('?') ? '&' : '?') + `token=${FINNHUB_API_KEY}`;
    const fhRes = await fetch(url);
    if (!fhRes.ok) throw new Error(`Finnhub fetch failed: ${await fhRes.text()}`);
    const data = await fhRes.json();
    // Finnhub sin gratis-tier har ikke data for ikke-US-børser (f.eks. Oslo Børs, .OL-suffiks).
    // Den returnerer da IKKE en feilkode, men et "tomt" quote-objekt med alle felt = 0
    // (c:0, o:0, h:0, l:0, pc:0). Uten denne sjekken vises dette som ekte "0.00"-pris i UI.
    if (endpoint === 'quote' && data && data.c === 0 && data.o === 0 && data.h === 0 && data.l === 0 && data.pc === 0) {
      return res.status(422).json({ error: 'no_data', message: 'Ingen kursdata for dette symbolet på gjeldende Finnhub-plan (gratis-tier støtter kun US-børser).' });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}