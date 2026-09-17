const VERSION = 'v1.3.0';
const SHELL = `camlist-shell-${VERSION}`;
const IMAGES = 'camlist-images';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.json', './data/catalog.json',
  './js/app.js', './js/store.js', './js/catalog.js', './js/list.js', './js/i18n.js', './js/brands.js',
  './js/export-text.js', './js/export-xlsx.js', './js/export-docx.js', './js/export-print.js',
  './js/ui/dom.js', './js/ui/projects.js', './js/ui/list.js', './js/ui/catalog.js', './js/ui/export.js', './logos/index.json', './js/compat.js', './data/compat.json',
  './vendor/xlsx.full.min.js', './vendor/docx.umd.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-180.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('camlist-shell-') && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trimImages(max = 500) {
  const c = await caches.open(IMAGES);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k);
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
        if (res.ok) caches.open(SHELL).then(c => c.put(e.request, res.clone()));
        return res;
      })),
    );
    return;
  }
  // Google Fonts (stylesheet + woff2): cache-first so the typeface works offline after first load.
  if (/fonts.(googleapis|gstatic).com$/.test(url.hostname)) {
    e.respondWith(caches.open(SHELL).then(async c => (await c.match(e.request)) || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; })));
    return;
  }
  if (e.request.destination === 'image') {
    e.respondWith(caches.open(IMAGES).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(res => { if (res.ok) { c.put(e.request, res.clone()); trimImages(); } return res; }).catch(() => hit);
      return hit || net;
    }));
  }
});
