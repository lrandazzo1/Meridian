// Meridian service worker — caches the app shell, never the API.
const CACHE = "meridian-v7";
const SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // NEVER cache the AI endpoint — always go to network
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // App shell: network-first, fall back to cache (so updates land immediately)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && e.request.method === "GET") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("/index.html")))
  );
});
