'use strict';
const CACHE_NAME = 'fourth-grade-unit-three-v1';
const APP_BASE = self.registration.scope;
const appURL = path => new URL(path, APP_BASE).toString();
const CORE_FILES = ['', 'index.html', 'manifest.webmanifest', 'The_Fourth_Grade_Unit_Three_Poster.png', 'icon-192.png', 'icon-512.png'].map(appURL);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('fourth-grade-unit-three-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(appURL('index.html'), fresh.clone());
        }
        return fresh;
      } catch (_) {
        return (await caches.match(appURL('index.html'))) || (await caches.match(APP_BASE)) || new Response('Game is not cached yet. Connect to the internet once, then open it again.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response('', {status: 504, statusText: 'Offline'});
    }
  })());
});
