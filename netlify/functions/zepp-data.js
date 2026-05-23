import { getStore } from '@netlify/blobs';

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_FIELDS = ['sleepHours', 'sleepScore', 'rhr', 'hrv', 'steps', 'bodyBattery', 'mood'];

const EMPTY = {
  sleep: { hours: null, score: null, deepMin: null, remMin: null },
  rhr: null, hrv: null, steps: null, battery: null, mood: null,
  timestamp: null,
};

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  const store = getStore('health');

  // ── POST: receive data from iPhone Shortcut ─────────────────────────────
  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({ error: 'Invalid JSON' }),
      };
    }

    if (typeof body !== 'object' || body === null || !VALID_FIELDS.some(f => f in body)) {
      return {
        statusCode: 400,
        headers: CORS,
        body: JSON.stringify({
          error: `Body must be an object with at least one of: ${VALID_FIELDS.join(', ')}`,
        }),
      };
    }

    const payload = {
      sleep: {
        hours:   body.sleepHours  ?? null,
        score:   body.sleepScore  ?? null,
        deepMin: null,
        remMin:  null,
      },
      rhr:     body.rhr         ?? null,
      hrv:     body.hrv         ?? null,
      steps:   body.steps       ?? null,
      battery: body.bodyBattery ?? null,
      mood:    body.mood        ?? null,
      timestamp: new Date().toISOString(),
    };

    await store.setJSON('health-today', payload);

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ ok: true, timestamp: payload.timestamp }),
    };
  }

  // ── GET: return last stored data ────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const data = await store.get('health-today', { type: 'json' });
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify(data ?? EMPTY),
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ error: err.message }),
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
};
