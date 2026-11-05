// 語嫣・永生戰棋 App 程式：只管 tactics/ 資料夾。
// 遊戲檔案每次先抓網路上的最新版，抓不到（沒網路）才用手機裡存的那份。
const CACHE = 'yyt-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('yyt-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  const inScope = url.pathname.startsWith(scope.pathname);
  const isIcon = /\/icons\/[^/]+\.png$/.test(url.pathname);
  if (!inScope && !isIcon) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const k = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    try {
      const res = await fetch(req, { cache: 'no-store' });
      if (res && res.ok) cache.put(k, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const hit = await cache.match(k);
      if (hit) return hit;
      throw err;
    }
  })());
});
