/* WINE 200 service worker — core assets precache + runtime image cache */
const CORE = 'emart-winelist-core-v2';
const IMGS = 'emart-winelist-img-v2';
const CORE_ASSETS = ['./','index.html','styles.css','app.js','data.js','manifest.webmanifest','icon-192.png','icon-512.png','icon-180.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => k!==CORE && k!==IMGS).map(k => caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.includes('/images/')) {
    e.respondWith(caches.open(IMGS).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      try { const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res; }
      catch { return new Response('', {status: 404}); }
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
