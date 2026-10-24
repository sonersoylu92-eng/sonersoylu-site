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
    var lcp = null, fcp = null, cls = 0, pencere = 0, pBas = 0, pSon = 0, inp = null, gitti = false, kayMax = 0, kayKaynak = '';
    function izle(tur, f, ek) {
      if (dest.indexOf(tur) < 0) return;
      try { new PerformanceObserver(function (l) { l.getEntries().forEach(f); }).observe(Object.assign({ type: tur, buffered: true }, ek || {})); } catch (e) {}
    }
    // sayfa arka planda açıldıysa LCP anlamsız (sekmeye dönüldüğü an sayılır): kaydedilmez
    var gizliBasladi = document.visibilityState === 'hidden', lcpBitti = gizliBasladi;
    izle('largest-contentful-paint', function (e) { if (!lcpBitti) lcp = e.startTime; });
    // LCP ilk gerçek etkileşimde ya da sayfa gizlenince sabitlenir; sonraki çizimler sayılmaz
    ['keydown', 'pointerdown'].forEach(function (t) { addEventListener(t, function () { lcpBitti = true; }, { once: true, capture: true }); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') lcpBitti = true; }, { capture: true });
    izle('paint', function (e) { if (e.name === 'first-contentful-paint') fcp = e.startTime; });
    izle('layout-shift', function (e) {
      if (e.hadRecentInput) return;
      // V38 · en büyük tekil kaymanın kaynağı (yenilemede 0,4–0,96'lık kaymaların nedeni bulunsun)
      if (e.value > kayMax) {
        kayMax = e.value;
        var kn = e.sources && e.sources[0] && e.sources[0].node, ad = '';
        if (kn && kn.nodeType === 1) ad = kn.id ? '#' + kn.id : (kn.tagName.toLowerCase() + (typeof kn.className === 'string' && kn.className ? '.' + kn.className.split(' ')[0] : ''));
        kayKaynak = ad.slice(0, 22) + '@' + Math.round(e.startTime);
      }
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
      var ara = function (a, b) { return nav[a] > 0 && nav[b] > 0 ? Math.max(0, Math.round(nav[b] - nav[a])) : 0; };
      var veri = {
        olay: 'vitals', sayfa: location.pathname.slice(0, 40),
        neden: (gizliBasladi ? 'gizli;' : '') + 'lcp=' + r(lcp) + ';inp=' + r(inp) + ';cls=' + cls.toFixed(3) + ';fcp=' + r(fcp) + ';ttfb=' + r(nav.responseStart) + ';tip=' + (nav.type || '?') +
          ';sw=' + (navigator.serviceWorker && navigator.serviceWorker.controller ? 1 : 0) +
          // V34 · ilk baytın dökümü: yönlendirme, servis çalışanı açılışı, DNS, bağlantı (TLS dahil), sunucu bekleme, protokol
          ';yon=' + ara('redirectStart', 'redirectEnd') + ';swb=' + (nav.workerStart ? ara('workerStart', 'fetchStart') : 0) +
          ';dns=' + ara('domainLookupStart', 'domainLookupEnd') + ';bag=' + ara('connectStart', 'connectEnd') +
          ';bek=' + ara('requestStart', 'responseStart') + ';p=' + String(nav.nextHopProtocol || '?').slice(0, 6) +
          (kayMax > 0.05 ? ';kay=' + kayKaynak : ''),
        sure_ms: lcp == null ? null : Math.round(lcp), kare_ms: inp == null ? null : Math.round(inp),
        ekran: innerWidth + 'x' + innerHeight, dpr: window.devicePixelRatio || 1,
        oturum: Math.random().toString(36).slice(2, 10), surum: 'vitals5'
      };
      try { navigator.sendBeacon('/api/tani', JSON.stringify(veri)); } catch (e) {}
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') gonder(); });
    window.addEventListener('pagehide', gonder);
  })();

  /* V38 · Gezinti ölçümü (anonim): sayfanın hangi bölümüne kadar inildi ve hangi bölümden hangi iç bağlantıya
   * tıklandı. Editör kararı için: ziyaretçilerin çoğu ana sayfada kalıyor, kim nereye geçiyor bilinmiyordu.
   * Çerez, kimlik, IP yok; sayfa kapanırken tek kayıt. "İzlenmek istemiyorum" (DNT) açıksa hiç çalışmaz. */
  (function () {
    if (location.protocol !== 'https:' || !navigator.sendBeacon) return;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    var basT = Date.now(), tik = [], en = '', enSira = -1, gitti = false, raf = 0;
    var bolumler = [].slice.call(document.querySelectorAll('section[id]'));
    function bolumAdi(el) {
      if (el.closest('header')) return 'ust';
      if (el.closest('footer')) return 'alt';
      var s = el.closest('section[id]');
      return s ? s.id.slice(0, 12) : 'icerik';
    }
    function hedefAdi(a) {
      var h = a.getAttribute('href') || '';
      if (/^mailto:/.test(h)) return 'eposta';
      if (h.charAt(0) === '#') return h.slice(0, 16);
      try {
        var u = new URL(h, location.href);
        if (u.origin !== location.origin) return 'dis:' + u.hostname.replace(/^www\./, '').slice(0, 18);
        return (u.pathname + u.hash).slice(0, 30);
      } catch (e) { return '?'; }
    }
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      tik.push(bolumAdi(a) + '>' + hedefAdi(a));
      if (tik.length > 3) tik.shift();
    }, true);
    function olc() {
      raf = 0;
      for (var i = enSira + 1; i < bolumler.length; i++) {
        if (bolumler[i].getBoundingClientRect().top < innerHeight * 0.6) { enSira = i; en = bolumler[i].id; }
      }
    }
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(olc); }, { passive: true });
    olc();
    function gonder() {
      if (gitti) return; gitti = true; olc();
      var veri = {
        olay: 'gezinti', sayfa: location.pathname.slice(0, 40),
        neden: ('en=' + (en || '-').slice(0, 16) + ' tik=' + (tik.join(',') || '-')).slice(0, 160),
        sure_ms: Date.now() - basT, ekran: innerWidth + 'x' + innerHeight, dpr: window.devicePixelRatio || 1,
        oturum: Math.random().toString(36).slice(2, 10), surum: 'gezinti1'
      };
      try { navigator.sendBeacon('/api/tani', JSON.stringify(veri)); } catch (e) {}
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') gonder(); });
    addEventListener('pagehide', gonder);
  })();

  // V34 · "Rüzgâr dinlencesi": üst çubuktaki nota düğmesi (Beethoven, kamu malı kayıtlar). Müzik kendiliğinden
  // başlamaz; ziyaretçi açınca çalar ve sayfalar arasında kaldığı yerden sürer. Betik sayfa çizildikten sonra iner.
  (function () {
    if (!document.querySelector('header .hd-right')) return;
    function yukle() { var b = document.createElement('script'); b.src = '/assets/muzik.js?v=a90d5be9'; b.async = true; document.head.appendChild(b); }
    if (document.readyState === 'complete') yukle(); else window.addEventListener('load', yukle);
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
