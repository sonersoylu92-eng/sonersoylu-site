/* sonersoylu.com — servis çalışanı
   Amaç: kule dibinde kapsama alanı yokken sözlük, araçlar, arıza ağacı ve
   rehberin açılabilmesi. Sürüm değişince eski önbellek silinir. */

const SURUM = 'kule-20261030-v43hikaye';
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
  '/assets/arama.json?v=3c76b522',
  '/assets/ara.js?v=b6a27d00',
  '/assets/kaydirma.js?v=23cd28e6',
  '/style.css?v=47d4c147',
  '/assets/site.js?v=c93d04fe',
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
    // Gezinme ön yüklemesi: sayfa isteği servis çalışanı uyanmayı beklemeden ağa çıkar. Tanı: geri gelen ziyaretçide
    // ana sayfanın ilk baytı %20 oturumda 0,8 sn'yi aşıyordu (telefonda çalışan uyanması + ağ, sırayla).
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (er) { /* desteklenmiyor */ } }
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

  // Video/ses parça istekleri (Range) servis çalışanından geçmez; Safari'de oynatma bozulmasın
  if (istek.headers.has('range') || istek.destination === 'video' || istek.destination === 'audio') return;

  /* Sayfa gezinmeleri: önce ağ. V34 · Ağ 1 sn içinde yanıt vermezse ve bu sayfanın bu sürümde kaydedilmiş kopyası varsa
   * kopya açılır; ağdan gelen yanıt arka planda kaydedilir, bir sonraki açılış onu kullanır. Tanı: geri gelen ziyaretçide
   * ana sayfanın ilk baytı zaman zaman 1,6–1,9 sn sürüyordu (sunucu kodu değil, bağlantı). Kopya yoksa ağ beklenir;
   * eskiden 3,5 sn'de kesilip bağlantı varken bile "çevrimdışı" sayfası açılabiliyordu. */
  if (istek.mode === 'navigate') {
    e.respondWith((async () => {
      const c = await caches.open(KABUK);
      const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
      const ag = Promise.resolve(e.preloadResponse).catch(() => null).then((on) => on || fetch(istek));
      e.waitUntil(ag.then((y) => { if (y && y.ok) return c.put(istek, y.clone()); }).catch(() => {}));
      const kayitli = async () => (await c.match(istek)) || (await c.match(u.pathname));
      try {
        const hizli = await Promise.race([ag.then((y) => ({ y }), () => null), bekle(1000).then(() => null)]);
        if (hizli) return hizli.y;
        const v = await kayitli();
        if (v) return v;
        return await Promise.race([ag, bekle(20000).then(() => { throw new Error('zaman-asimi'); })]);
      } catch {
        return (await kayitli()) || (await c.match('/cevrimdisi.html')) ||
               new Response('Çevrimdışısınız', { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // Sürümlü statik dosyalar: önbellek varsa tekrar ağ isteği çıkarma.
  // Yeni dağıtımda SURUM değişir ve eski önbellek kaldırılır.
  e.respondWith((async () => {
    const c = await caches.open(VARLIK);
    const v = await c.match(istek);
    if (v) return v;
    try {
      // V34 · yeni sürümün ilk isteği tarayıcı önbelleğini doğrulatır (ETag, çoğu zaman 304): Cloudflare dosyalara 4 saatlik
      // önbellek veriyor; damgası değişmeyen ortak bir dosya (ör. site.js) eski sürümde kalmasın.
      const y = await fetch(istek, { cache: 'no-cache' });
      if (y.ok) e.waitUntil(c.put(istek, y.clone()).catch(() => {}));
      return y;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});
