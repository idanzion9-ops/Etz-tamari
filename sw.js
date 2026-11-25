/* עץ תמרי — Service Worker
   מעטפת האפליקציה נשמרת במטמון; התוכן תמיד נטען מהרשת קודם,
   כדי שפרסום חדש יופיע מיד ולא ייתקע על גרסה ישנה. */

const VERSION = 'etz-v4';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/style.css',
  './assets/js/store.js',
  './assets/js/ui.js',
  './assets/js/app.js',
  './assets/js/admin.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // התוכן: רשת קודם, מטמון רק כגיבוי
  if (url.pathname.includes('/assets/data/')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // שאר הקבצים: מטמון קודם
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
