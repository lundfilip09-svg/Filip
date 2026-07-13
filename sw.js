// sw.js — Service Worker: offline-skall + hviletimer-varsler
//
// 1) SIDER + STATISKE FILER: stale-while-revalidate — cachet versjon serveres
//    UMIDDELBART (ingen vent på nett), fersk versjon hentes i bakgrunnen og
//    legges i cache til neste besøk. Endret ETag → SW_UPDATED-melding til
//    klientene (utils.js viser toast). Gir ~0 ms sidebytte i både nettleser
//    og PWA.
// 2) DATA (Supabase REST-les): network-first → alltid ferskt på nett, sist
//    lagrede data uten nett. Skriving (POST/PATCH/DELETE) røres aldri —
//    sidene håndterer feil selv (gym-økta auto-lagres ved reconnect).
//    Online-tjenester (AI-chat, Garmin-synk, Google Calendar) er online-only.
// 3) TIMER: mottar START_TIMER/CANCEL_TIMER fra gym.html og fyrer
//    systemvarsel når nedtellingen er ferdig (uendret oppførsel).
//
// Bump VERSION ved endringer her — gamle cacher ryddes i activate.

const VERSION = 'dash-v7';
const SHELL = [
  '/', '/dashboard.html', '/gym.html', '/sprint.html', '/sovn.html',
  '/gjoremal.html', '/kalender.html', '/treningsplan.html', '/ai.html',
  '/investments.html', '/business.html', '/login.html', '/treningsdagbok.html',
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

// stale-while-revalidate: cachet svar serveres umiddelbart, ferskt hentes i
// bakgrunnen. notify=true → SW_UPDATED-melding hvis innholdet endret seg
// (ETag/Last-Modified), så utils.js kan vise «ny versjon»-toast.
async function staleWhileRevalidate(req, notify = false) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const refresh = (async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok) {
        if (notify && hit) {
          const a = hit.headers.get('etag') || hit.headers.get('last-modified');
          const b = res.headers.get('etag') || res.headers.get('last-modified');
          if (a && b && a !== b) notifyClients({ type: 'SW_UPDATED' });
        }
        await cache.put(req, res.clone());
      }
      return res;
    } catch { return null; }
  })();
  if (hit) return hit;                      // umiddelbart fra cache
  const res = await refresh;                // førstegangsbesøk: vent på nett
  if (res) return res;
  throw new Error('offline og ikke i cache');
}

async function notifyClients(msg) {
  const cs = await self.clients.matchAll({ includeUncontrolled: true });
  cs.forEach(c => c.postMessage(msg));
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

  // Sidenavigasjon: stale-while-revalidate → cachet side vises umiddelbart,
  // fersk hentes i bakgrunnen (toast ved endring). Fallback: pre-cachet skall.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try { return await staleWhileRevalidate(req, true); }
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

  // Samme origin (statiske filer): stale-while-revalidate → umiddelbart fra
  // cache, oppdateres i bakgrunnen til neste sidelasting
  if (url.origin === self.location.origin) {
    e.respondWith(staleWhileRevalidate(req));
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
      self.registration.showNotification(msg.title || 'Dashboard', {
        body:    msg.body  || '',
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

// ── Web Push ────────────────────────────────────────────────────────
// Server (api/push/fire) sender et varsel via VAPID. Dette fyrer ENDA OM
// PWA-en er lukket eller du er i andre apper — i motsetning til setTimeout
// over, som iOS dreper i bakgrunnen. Dette er den egentlige fiksen.
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { title: e.data && e.data.text() }; }
  const title = data.title || 'Dashboard';
  e.waitUntil(self.registration.showNotification(title, {
    body:     data.body || '',
    icon:     '/icon-192.png',
    badge:    '/icon-192.png',
    vibrate:  [200, 100, 200],
    tag:      data.tag || 'dash-push',
    renotify: true,
    data:     { url: data.url || '/' },
  }));
});

// Klikk på varsel → fokuser en åpen fane, eller åpne riktig side.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { try { await c.navigate(url); } catch {} return c.focus(); }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
