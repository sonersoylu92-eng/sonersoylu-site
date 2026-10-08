/* Tüm sayfalarda çalışan küçük ortak betik:
   1) servis çalışanını kaydeder (çevrimdışı kullanım)
   2) bağlantı kesilince üstte şerit gösterir
   3) tarayıcı izin verirse "telefona ekle" düğmesi çıkarır */
(function () {
  'use strict';

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    // Sitede bir güncelleme yayınlandığında açık duran sekmenin eski sayfayı
    // göstermeye devam etmemesi için: yeni servis çalışanı devri aldığı anda
    // sayfayı bir kez tazeliyoruz. Ziyaretçinin elle yenilemesi gerekmiyor.
    var oncedenKontrolVardi = !!navigator.serviceWorker.controller;
    var tazelendi = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!oncedenKontrolVardi || tazelendi) return;
      tazelendi = true;
      location.reload();
    });
    window.addEventListener('load', function () {
      function kaydet() { navigator.serviceWorker.register('/sw.js').then(function (kayit) {
        if (!kayit) return;
        kayit.update();
        // sekme günlerce açık kalabiliyor; saatte bir yeni sürüm var mı diye bak
        setInterval(function () { kayit.update(); }, 60 * 60 * 1000);
        // sekmeye geri dönüldüğünde de bak
        document.addEventListener('visibilitychange', function () {
          if (!document.hidden) kayit.update();
        });
      }).catch(function () {}); }
      // İlk ziyarette çevrimdışı sayfaların toplu indirilmesi 3B kapağın
      // yüklenmesiyle yarışmasın. Diğer sayfalarda kayıt normal devam eder.
      var sahne = document.getElementById('deneyim');
      if (!sahne || sahne.classList.contains('hazir') || sahne.classList.contains('statik')) { kaydet(); return; }
      var bitti = false, gozlem;
      function sahneSonra() {
        if (bitti) return; bitti = true; gozlem.disconnect(); clearTimeout(zaman);
        if ('requestIdleCallback' in window) requestIdleCallback(kaydet, { timeout: 3000 }); else setTimeout(kaydet, 300);
      }
      gozlem = new MutationObserver(function () { if (sahne.classList.contains('hazir') || sahne.classList.contains('statik')) sahneSonra(); });
      gozlem.observe(sahne, { attributes: true, attributeFilter: ['class'] });
      var zaman = setTimeout(sahneSonra, 20000);
    });
  }

  var serit;
  function seridiKur() {
    if (serit) return serit;
    serit = document.createElement('div');
    serit.id = 'cevrimdisiSerit';
    serit.setAttribute('role', 'status');
    serit.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:80;display:none;' +
      'background:#16191c;color:#f6f4f0;padding:.7rem 1rem;text-align:center;' +
      'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.6875rem;' +
      'letter-spacing:.16em;text-transform:uppercase';
    serit.textContent = 'Çevrimdışısınız — kayıtlı sayfalar açılmaya devam eder';
    document.body.appendChild(serit);
    return serit;
  }
  function durum() {
    var s = seridiKur();
    s.style.display = navigator.onLine ? 'none' : 'block';
  }
  window.addEventListener('online', durum);
  window.addEventListener('offline', durum);
  if (!navigator.onLine) durum();

  // Gerçek cihaz hız ölçüsü (Web Vitals): LCP, INP (yaklaşık), CLS, FCP, TTFB.
  // Sayfa kapanırken tek kayıt /api/tani'ye gider. Çerez, IP ya da kişisel veri yok.
  (function () {
    if (location.protocol !== 'https:' || !('PerformanceObserver' in window) || !navigator.sendBeacon) return;
    var dest = PerformanceObserver.supportedEntryTypes || [];
    var lcp = null, fcp = null, cls = 0, pencere = 0, pBas = 0, pSon = 0, inp = null, gitti = false;
    function izle(tur, f, ek) {
      if (dest.indexOf(tur) < 0) return;
      try { new PerformanceObserver(function (l) { l.getEntries().forEach(f); }).observe(Object.assign({ type: tur, buffered: true }, ek || {})); } catch (e) {}
    }
    var lcpBitti = false;
    izle('largest-contentful-paint', function (e) { if (!lcpBitti) lcp = e.startTime; });
    // LCP ilk gerçek etkileşimde ya da sayfa gizlenince sabitlenir; sonraki çizimler sayılmaz
    ['keydown', 'pointerdown'].forEach(function (t) { addEventListener(t, function () { lcpBitti = true; }, { once: true, capture: true }); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') lcpBitti = true; }, { capture: true });
    izle('paint', function (e) { if (e.name === 'first-contentful-paint') fcp = e.startTime; });
    izle('layout-shift', function (e) {
      if (e.hadRecentInput) return;
      // oturum penceresi: 1 sn boşluk ya da 5 sn üst sınır
      if (pencere && e.startTime - pSon < 1000 && e.startTime - pBas < 5000) pencere += e.value;
      else { pencere = e.value; pBas = e.startTime; }
      pSon = e.startTime; if (pencere > cls) cls = pencere;
    });
    izle('event', function (e) { if (e.interactionId && (inp === null || e.duration > inp)) inp = e.duration; }, { durationThreshold: 40 });
    izle('first-input', function (e) { var d = e.processingStart - e.startTime + (e.duration || 0); if (inp === null) inp = e.duration || d; });
    function gonder() {
      if (gitti) return; gitti = true;
      var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
      var r = function (x) { return x == null ? 'yok' : Math.round(x); };
      var veri = {
        olay: 'vitals', sayfa: location.pathname.slice(0, 40),
        neden: 'lcp=' + r(lcp) + ';inp=' + r(inp) + ';cls=' + cls.toFixed(3) + ';fcp=' + r(fcp) + ';ttfb=' + r(nav.responseStart) + ';tip=' + (nav.type || '?') +
          ';sw=' + (navigator.serviceWorker && navigator.serviceWorker.controller ? 1 : 0),
        sure_ms: lcp == null ? null : Math.round(lcp), kare_ms: inp == null ? null : Math.round(inp),
        ekran: innerWidth + 'x' + innerHeight, dpr: window.devicePixelRatio || 1,
        oturum: Math.random().toString(36).slice(2, 10), surum: 'vitals2'
      };
      try { navigator.sendBeacon('/api/tani', JSON.stringify(veri)); } catch (e) {}
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') gonder(); });
    window.addEventListener('pagehide', gonder);
  })();

  // "Telefona ekle" — sadece tarayıcı uygun bulursa görünür
  var istem = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    istem = e;
    var yer = document.getElementById('kurYuvasi');
    if (!yer) return;
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'plate';
    d.textContent = 'Telefona ekle';
    d.addEventListener('click', function () {
      if (!istem) return;
      istem.prompt();
      istem.userChoice.then(function () { istem = null; d.remove(); });
    });
    yer.appendChild(d);
  });
})();
