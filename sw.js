/* sonersoylu.com — servis çalışanı
   Amaç: kule dibinde kapsama alanı yokken sözlük, araçlar, arıza ağacı ve
   rehberin açılabilmesi. Sürüm değişince eski önbellek silinir. */

const SURUM = 'kapak-2a9680f10001a059';
const KABUK = 'kabuk-' + SURUM;   // sayfa iskeleti ve stil
const VARLIK = 'varlik-' + SURUM; // görsel, yazı tipi, betik

const ONBELLEGE = [
  '/',
  '/rehber/',
  '/sozluk/',
  '/araclar/',
  '/ariza/',
  '/n117/',
  '/kodlar/',
  '/ruzgar/',
  '/egitim/',
  '/sor/',
  '/ara/',
  '/assets/arama.json?v=38fe9ce8',
  '/assets/ara.js?v=da9b2173',
  '/assets/kaydirma.js?v=23cd28e6',
  '/style.css?v=1a5286e5',
  '/assets/site.js?v=2083a619',
  '/favicon.svg',
  '/cevrimdisi.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(KABUK);
    // tek tek ekle: biri düşerse kurulum tümden başarısız olmasın
    await Promise.all(ONBELLEGE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const adlar = await caches.keys();
    await Promise.all(adlar.filter((n) => !n.endsWith(SURUM)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'guncelle') self.skipWaiting();
});

function yaziTipiMi(u) {
  return u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', (e) => {
  const istek = e.request;
  if (istek.method !== 'GET') return;

  const u = new URL(istek.url);

  // API asla önbelleğe alınmaz
  if (u.origin === location.origin && u.pathname.startsWith('/api/')) return;

  // Google Fonts: önce önbellek, arkada tazele
  if (yaziTipiMi(u)) {
    e.respondWith((async () => {
      const c = await caches.open(VARLIK);
      const v = await c.match(istek);
      const ag = fetch(istek).then((y) => { if (y.ok) c.put(istek, y.clone()); return y; }).catch(() => null);
      return v || (await ag) || new Response('', { status: 504 });
    })());
    return;
  }

  if (u.origin !== location.origin) return;

  // Sayfa gezinmeleri: önce ağ (3,5 sn), olmazsa önbellek, o da yoksa çevrimdışı sayfası
  if (istek.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const y = await Promise.race([
          fetch(istek),
          new Promise((_, red) => setTimeout(() => red(new Error('zaman-asimi')), 3500)),
        ]);
        if (y && y.ok) {
          const c = await caches.open(KABUK);
          c.put(istek, y.clone());
        }
        return y;
      } catch {
        const c = await caches.open(KABUK);
        return (await c.match(istek)) || (await c.match(u.pathname)) ||
               (await c.match('/cevrimdisi.html')) ||
               new Response('Çevrimdışısınız', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // Diğer aynı köken istekleri: önce önbellek, arkada tazele
  e.respondWith((async () => {
    const c = await caches.open(VARLIK);
    const v = await c.match(istek);
    const ag = fetch(istek).then((y) => { if (y.ok) c.put(istek, y.clone()); return y; }).catch(() => null);
    return v || (await ag) || new Response('', { status: 504 });
  })());
});
