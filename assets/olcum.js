/* olcum.js — sayfa içi davranış ölçümü.
 *
 * Ne toplanıyor: hangi sayfa, ne kadar aşağı inildi, hangi bölüme kadar gelindi,
 * sayfada ne kadar kalındı, hangi bağlantılara tıklandı, masaüstü mü mobil mi.
 * Ne toplanmıyor: çerez yok, kimlik yok, oturum kimliği yok, IP saklanmıyor,
 * serbest metin yok. Sunucuya giden şey günlük toplam sayaçlara ekleniyor;
 * tek bir ziyaretçinin izi geriye doğru sürülemiyor.
 * Tarayıcısında "izlenmek istemiyorum" (DNT) açık olan hiç ölçülmüyor.
 */
(function () {
  'use strict';
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' ||
      navigator.msDoNotTrack === '1') return;
  if (!navigator.sendBeacon && !window.fetch) return;

  var yol = location.pathname.replace(/index\.html$/, '').slice(0, 60) || '/';
  var basla = Date.now(), derin = 0, bolum = '', tikler = [], yollandi = false;
  var bolumler = [].slice.call(document.querySelectorAll('main section[id]'));

  function olc() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    derin = Math.max(derin, h > 0 ? Math.min(1, window.scrollY / h) : 1);
    for (var i = 0; i < bolumler.length; i++) {
      if (bolumler[i].getBoundingClientRect().top < window.innerHeight * 0.6) {
        bolum = bolumler[i].id;
      }
    }
  }
  window.addEventListener('scroll', olc, { passive: true });
  window.addEventListener('resize', olc, { passive: true });
  olc();

  function etiket(a) {
    var h = a.getAttribute('href') || '';
    if (a.closest('.gal')) return 'galeri';
    if (/^mailto:/.test(h)) return 'eposta';
    if (/soner-soylu-cv/.test(h)) return 'cv';
    if (/linkedin\.com/.test(h)) return 'linkedin';
    if (/instagram\.com/.test(h)) return 'instagram';
    if (/youtube\.com|youtu\.be/.test(h)) return 'youtube';
    if (a.closest('header')) return 'menu:' + h.slice(0, 26);
    if (a.closest('footer')) return 'alt:' + h.slice(0, 26);
    if (/^https?:/i.test(h)) {
      try { return 'dis:' + new URL(h).hostname.replace(/^www\./, '').slice(0, 30); }
      catch (e) { return 'dis'; }
    }
    if (h.charAt(0) === '#') return 'ic:' + h.slice(0, 24);
    return 'bag:' + h.slice(0, 26);
  }

  document.addEventListener('click', function (e) {
    if (tikler.length >= 12 || !e.target || !e.target.closest) return;
    var el = e.target.closest('a[href],.gal figure,[data-olcum]');
    if (!el) return;
    var et = el.getAttribute('data-olcum') ||
             (el.tagName === 'A' ? etiket(el) : (el.closest('.gal') ? 'galeri' : 'dugme'));
    tikler.push(String(et).slice(0, 40));
  }, true);

  function kova(sn) {
    return sn < 10 ? '0-10' : sn < 30 ? '10-30' : sn < 60 ? '30-60'
         : sn < 180 ? '60-180' : '180+';
  }

  function yolla() {
    if (yollandi) return;
    yollandi = true;
    olc();
    var veri = JSON.stringify({
      yol: yol,
      derinlik: Math.round(derin * 100),
      bolum: bolum.slice(0, 30),
      sure: kova((Date.now() - basla) / 1000),
      tik: tikler,
      cihaz: window.innerWidth < 700 ? 'mobil' : 'masaustu',
    });
    try {
      if (navigator.sendBeacon &&
          navigator.sendBeacon('/api/olcum', new Blob([veri], { type: 'application/json' }))) return;
    } catch (e) { /* aşağıdaki yedeğe düş */ }
    try {
      fetch('/api/olcum', { method: 'POST', body: veri, keepalive: true,
        headers: { 'content-type': 'application/json' } });
    } catch (e) { /* ölçüm sessizce vazgeçer */ }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') yolla();
  });
  window.addEventListener('pagehide', yolla);
})();
