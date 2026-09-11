/*
 * Sential service worker.
 *
 * Deliberately minimal. Its only jobs are to make the app installable to a home
 * screen and to keep its icons available.
 *
 * It does NOT cache pages, API responses or any operational data. During a live
 * event a cached incident list is worse than no offline support at all: an
 * operator cannot tell a stale screen from a current one, and acting on an old
 * picture is a safety problem. Every request that could carry operational data
 * goes to the network, every time.
 *
 * Offline incident drafting is a real requirement, but it needs a queue, a sync
 * state and conflict handling. It is not something to approximate with a cache.
 */

const CACHE = "sential-shell-v1";

// Static, non-operational assets only.
const SHELL = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  // Take over immediately so a stale worker never lingers mid-event.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(() => undefined));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Anything not on the static shell list is left entirely alone, so the browser
  // fetches it from the network as normal. No operational response is ever
  // intercepted, stored or replayed.
  if (!SHELL.includes(url.pathname)) return;

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
