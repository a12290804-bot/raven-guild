// 渡鴉公會 App 程式：遊戲本體每次都抓最新版；圖片存在手機裡，打開更快。
const V = new URL(self.location).searchParams.get('v') || '0';
const PAGE = 'rg-page';
const IMG = 'rg-img-1';
// v2：不再把子資料夾的頁面當成遊戲本體
const IMG_RE = /\.(png|webp|gif|jpe?g|svg|ico)$/i;

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== PAGE && k !== IMG) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function pageFirst(req) {
  const cache = await caches.open(PAGE);
  try {
    const res = await fetch(req, { cache: 'no-store' });
    if (res && res.ok) cache.put('./', res.clone()).catch(() => {});
    return res;
  } catch (err) {
    const hit = await cache.match('./');
    if (hit) return hit;
    throw err;
  }
}

async function imgFirst(req, ev) {
  const cache = await caches.open(IMG);
  const hit = await cache.match(req);
  const refresh = async () => {
    const res = await fetch(req);
    if (res && res.ok && res.type === 'basic') {
      const b = await res.clone().blob();
      const h = new Headers(res.headers); h.set('x-rg-ver', V);
      await cache.put(req, new Response(b, { status: 200, headers: h }));
    }
    return res;
  };
  if (hit) {
    // 新版本時在背景確認一次圖片有沒有換過（沒換只會很快回 304）
    if (hit.headers.get('x-rg-ver') !== V) ev.waitUntil(refresh().catch(() => {}));
    return hit;
  }
  return refresh();
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope);
  if (!url.pathname.startsWith(scope.pathname)) return;
  const rel = url.pathname.slice(scope.pathname.length);
  // 其他子資料夾（例如 tactics/ 戰棋）有自己的 App 程式，這裡完全不管
  if (rel.startsWith('tactics/')) return;
  if (rel === '' || rel === 'index.html') { e.respondWith(pageFirst(req)); return; }
  if (req.mode === 'navigate') return;
  if (IMG_RE.test(url.pathname) && !url.search) { e.respondWith(imgFirst(req, e)); return; }
  // 其他（catalog.json、_ok.txt、音樂、sw.js…）照常從網路拿
});
