// sw.js — Service Worker: offline-skall + hviletimer-varsler
//
// 1) OFFLINE (PWA): app-skallet (alle sider + styles/utils/ikoner) pre-caches,
//    og alle vellykkede GET-svar (inkl. Supabase REST-les) caches fortløpende.
//    Strategi: network-first med cache-fallback → alltid ferskt på nett,
//    sist lagrede data uten nett. Skriving (POST/PATCH/DELETE) røres aldri —
//    sidene håndterer feil selv (gym-økta auto-lagres ved reconnect).
//    Online-tjenester (AI-chat, Garmin-synk, Google Calendar) er online-only.
// 2) TIMER: mottar START_TIMER/CANCEL_TIMER fra gym.html og fyrer
//    systemvarsel når nedtellingen er ferdig (uendret oppførsel).
//
// Bump VERSION ved endringer her — gamle cacher ryddes i activate.

const VERSION = 'dash-v1';
const SHELL = [
  '/', '/dashboard.html', '/gym.html', '/sprint.html', '/sovn.html',
  '/gjoremal.html', '/kalender.html', '/treningsplan.html', '/ai.html',
  '/login.html', '/treningsdagbok.html',
  '/styles.css', '/utils.js', '/manifest.json',
  '/favicon.png', '/icon-192.png', '/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Individuelt (ikke addAll): én feilende ressurs skal ikke velte resten
    await Promise.allSettled(SHELL.map(u => cache.add(u)));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// network-first: ferskt svar caches og returneres; offline → cache
async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: false });
    if (hit) return hit;
    throw err;
  }
}

// cache-first (CDN-bibliotek — endres aldri uten URL-endring)
async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;   // skriving røres aldri
  const url = new URL(req.url);

  // Sidenavigasjon: network-first, fallback cachet side, ellers dashboard
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await networkFirst(req); }
      catch (err) {
        const cache = await caches.open(VERSION);
        return (await cache.match(url.pathname)) ||
               (await cache.match(url.pathname + '.html')) ||
               (await cache.match('/dashboard.html')) ||
               Response.error();
      }
    })());
    return;
  }

  // CDN (supabase-js): cache-first
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(cacheFirst(req));
    return;
  }

  // Supabase REST-les (data): network-first → sist lagrede data offline
  if (/\.supabase\.co$/.test(url.hostname) && url.pathname.startsWith('/rest/v1/')) {
    e.respondWith(networkFirst(req));
    return;
  }

  // Egne API-er: /api/config må funke offline (boot); resten online-only
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) {
    if (url.pathname === '/api/config') e.respondWith(networkFirst(req));
    return;
  }

  // Samme origin (statiske filer): network-first med cache-fallback
  if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
  }
});

// ── Hviletimer-varsler (uendret) ────────────────────────────────────
let _timerId = null;

self.addEventListener('message', e => {
  const msg = e.data;
  if (!msg) return;

  if (msg.type === 'START_TIMER') {
    if (_timerId !== null) { clearTimeout(_timerId); _timerId = null; }
    const ms = (msg.seconds || 0) * 1000;
    if (ms < 1000) return;
    _timerId = setTimeout(() => {
      _timerId = null;
      self.registration.showNotification(msg.title || 'Hviletimer ferdig', {
        body:    msg.body  || 'Tid for neste sett!',
        icon:    '/icon-192.png',
        badge:   '/icon-192.png',
        vibrate: [200, 100, 200],
        tag:     'rest-timer',
        renotify: true,
      });
    }, ms);
  }

  if (msg.type === 'CANCEL_TIMER') {
    if (_timerId !== null) { clearTimeout(_timerId); _timerId = null; }
  }
});
