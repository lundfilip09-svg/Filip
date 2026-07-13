// api/quote.js
// Proxy mot Yahoo Finance (uoffisiell, gratis, key-fri) — dekker Oslo Børs (.OL).
// Vercel Serverless Function. Ingen API-key trengs.
// Krever: Authorization: Bearer <supabase-jwt> (samme mønster som tidligere finnhub.js)

const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const YAHOO_SEARCH = 'https://query1.finance.yahoo.com/v1/finance/search';

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

const YAHOO_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; FilipDashboard/1.0)' };

async function handleQuote(ticker, res) {
  const url = `${YAHOO_CHART}${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const r = await fetch(url, { headers: YAHOO_HEADERS });
  if (!r.ok) throw new Error(`Yahoo chart fetch failed: ${await r.text()}`);
  const json = await r.json();
  const result = json?.chart?.result?.[0];
  const err = json?.chart?.error;
  if (err || !result || !result.meta) {
    return res.status(422).json({ error: 'no_data', message: 'Ingen kursdata funnet for dette symbolet.' });
  }
  const m = result.meta;
  return res.status(200).json({
    symbol: m.symbol,
    currency: m.currency || 'NOK',
    price: m.regularMarketPrice ?? null,
    previousClose: m.previousClose ?? m.chartPreviousClose ?? null,
    open: m.regularMarketOpen ?? null,
    dayHigh: m.regularMarketDayHigh ?? null,
    dayLow: m.regularMarketDayLow ?? null,
    exchangeName: m.fullExchangeName || m.exchangeName || null,
    marketState: m.marketState || null,
  });
}

async function handleChart(ticker, range, res) {
  const RANGE_MAP = {
    '1d': { range: '1d', interval: '5m' },
    '1u': { range: '5d', interval: '30m' },
    '1m': { range: '1mo', interval: '1d' },
    '3m': { range: '3mo', interval: '1d' },
    '1y': { range: '1y', interval: '1wk' },
    '5y': { range: '5y', interval: '1mo' },
  };
  const cfg = RANGE_MAP[range] || RANGE_MAP['3m'];
  const url = `${YAHOO_CHART}${encodeURIComponent(ticker)}?interval=${cfg.interval}&range=${cfg.range}`;
  const r = await fetch(url, { headers: YAHOO_HEADERS });
  if (!r.ok) throw new Error(`Yahoo chart fetch failed: ${await r.text()}`);
  const json = await r.json();
  const result = json?.chart?.result?.[0];
  const err = json?.chart?.error;
  if (err || !result || !result.timestamp) {
    return res.status(422).json({ error: 'no_data', message: 'Ingen graf-data funnet for dette symbolet.' });
  }
  const ts = result.timestamp;
  const closes = result.indicators?.quote?.[0]?.close || [];
  const points = ts
    .map((t, i) => ({ t: t * 1000, c: closes[i] }))
    .filter(p => p.c != null);
  return res.status(200).json({
    symbol: result.meta?.symbol,
    currency: result.meta?.currency || 'NOK',
    range,
    points,
  });
}

async function handleSearch(query, res) {
  const url = `${YAHOO_SEARCH}?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
  const r = await fetch(url, { headers: YAHOO_HEADERS });
  if (!r.ok) throw new Error(`Yahoo search fetch failed: ${await r.text()}`);
  const json = await r.json();
  const quotes = Array.isArray(json?.quotes) ? json.quotes : [];
  const mapped = quotes
    .filter(q => q.symbol)
    .map(q => ({
      symbol: q.symbol,
      shortname: q.shortname || q.longname || q.symbol,
      exchange: q.exchange || null,
    }));
  // Prioriter Oslo Børs (.OL) siden Filip kun handler norske aksjer
  mapped.sort((a, b) => {
    const aOl = a.symbol.endsWith('.OL') ? 0 : 1;
    const bOl = b.symbol.endsWith('.OL') ? 0 : 1;
    return aOl - bOl;
  });
  return res.status(200).json({ quotes: mapped });
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

  const { ticker, endpoint, q, range } = req.query;

  try {
    if (endpoint === 'search') {
      if (!q) return res.status(400).json({ error: 'Missing q' });
      return await handleSearch(q, res);
    }
    if (endpoint === 'chart') {
      if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
      return await handleChart(ticker, range, res);
    }
    if (endpoint === 'quote' || !endpoint) {
      if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
      return await handleQuote(ticker, res);
    }
    return res.status(400).json({ error: 'Invalid endpoint' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}