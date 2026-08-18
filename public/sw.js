// Minimal app-shell service worker. Scope is deliberately narrow: it only
// ever intercepts navigation (full-page HTML) requests, caching pages the
// user has actually visited while online so they can be reopened offline,
// with a static fallback page when nothing cached matches. It never
// touches JS/CSS chunks, RSC data fetches, or Supabase/API calls — those
// must always hit the network live. Caching RSC payloads or hashed chunk
// URLs cache-first was tried and reverted: a stale cached RSC response
// from before a rebuild referenced client code no longer in the current
// bundle and silently broke hydration (blank page after any dev rebuild
// or redeploy). Offline data writes are queued client-side instead — see
// src/lib/offline.

const CACHE_VERSION = "tide-shell-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(async () => (await caches.match(request)) || caches.match(OFFLINE_URL)),
  );
});
