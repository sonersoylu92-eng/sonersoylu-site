/* akis-olcum.js — ana sayfada kaydırma akıcılığı ölçümü (anonim, yalnızca tanı).
 *
 * Neden: 3B sahnenin kendi donma kaydı yalnız 200 ms'yi aşan donmaları ve yalnız sahnenin içini görüyor.
 * Telefonda hissedilen "tırtıklı kaydırma" çoğu zaman 35–120 ms'lik kısa, sık kare kayıplarıdır ve
 * sayfanın herhangi bir bölümünde olabilir. Bu betik yalnızca kaydırma sürerken kare aralıklarını
 * ölçer, uzun kareleri o anda ekranın ortasındaki bölüme yazar ve sayfadan çıkarken tek bir özet yollar.
 * Kişisel veri yok; mevcut /api/tani ucuna 'takilma' olayı olarak, neden alanı 'akis …' ile gider.
 */
(function () {
  'use strict';
  if (!('requestAnimationFrame' in window)) return;
  var oturum = Math.random().toString(36).slice(2, 10);
  var kayiyor = false, sonKaydirma = 0, rafId = 0, sonT = 0;
  var kareSay = 0, kareTop = 0, k34 = 0, k50 = 0, k100 = 0, enUzun = 0, kaydirmaMs = 0;
  var bolumler = {};   // bölüm id → uzun kare (>34 ms) sayısı
  var gonderildi = false;

  function ortadakiBolum() {
    var el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    while (el && el !== document.body) {
      if (el.tagName === 'SECTION' && el.id) return el.id;
      if (el.tagName === 'FOOTER') return 'footer';
      el = el.parentElement;
    }
    return 'diger';
  }

  function kare(t) {
    rafId = 0;
    if (sonT) {
      var a = t - sonT;
      if (a < 1000) {   // sekme değişimi gibi uzun aralar sayılmaz
        kareSay++; kareTop += a; kaydirmaMs += a;
        if (a > 34) {
          k34++;
          var b = ortadakiBolum(); bolumler[b] = (bolumler[b] || 0) + 1;
          if (a > 50) k50++;
          if (a > 100) k100++;
          if (a > enUzun) enUzun = a;
        }
      }
    }
    sonT = t;
    if (performance.now() - sonKaydirma < 250) rafId = requestAnimationFrame(kare);
    else { kayiyor = false; sonT = 0; }
  }

  addEventListener('scroll', function () {
    sonKaydirma = performance.now();
    if (!kayiyor) { kayiyor = true; sonT = 0; if (!rafId) rafId = requestAnimationFrame(kare); }
  }, { passive: true });

  function gonder() {
    if (gonderildi || kareSay < 30) return;   // hiç kaydırmamış ziyaretçiyi saymayız
    gonderildi = true;
    var enCok = Object.keys(bolumler).sort(function (x, y) { return bolumler[y] - bolumler[x]; })
      .slice(0, 4).map(function (k) { return k + ':' + bolumler[k]; }).join(',');
    var v = {
      olay: 'takilma', sayfa: location.pathname, oturum: oturum, surum: 'akis1',
      neden: 'akis kare=' + kareSay + ' k34=' + k34 + ' k50=' + k50 + ' k100=' + k100 +
             ' en=' + Math.round(enUzun) + ' bolum=' + (enCok || '-'),
      kare_ms: Math.round(kareTop / kareSay * 10) / 10, sure_ms: Math.round(kaydirmaMs),
      ekran: innerWidth + 'x' + innerHeight, dpr: devicePixelRatio || 1
    };
    try {
      var govde = JSON.stringify(v);
      if (!(navigator.sendBeacon && navigator.sendBeacon('/api/tani', new Blob([govde], { type: 'application/json' }))))
        fetch('/api/tani', { method: 'POST', body: govde, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(function () {});
    } catch (e) { /* ölçüm sayfayı hiçbir zaman etkilemez */ }
  }
  addEventListener('pagehide', gonder);
  document.addEventListener('visibilitychange', function () { if (document.hidden) gonder(); });
})();
