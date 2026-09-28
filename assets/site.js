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
