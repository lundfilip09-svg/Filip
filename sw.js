// sw.js — Service Worker for background rest-timer notifications
// Receives a START_TIMER message from gym.html and fires a system
// notification when the countdown ends — works even when the tab is
// in the background (iOS Home Screen PWA + Mac).

let _timerId = null;

self.addEventListener('message', e => {
  const msg = e.data;
  if (!msg) return;

  if (msg.type === 'START_TIMER') {
    // Cancel any running timer first
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
        tag:     'rest-timer',          // replaces any previous timer notification
        renotify: true,
      });
    }, ms);
  }

  if (msg.type === 'CANCEL_TIMER') {
    if (_timerId !== null) { clearTimeout(_timerId); _timerId = null; }
  }
});

// Activate immediately — no waiting for old SW to expire
self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
