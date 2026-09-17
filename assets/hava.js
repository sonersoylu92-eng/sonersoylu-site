/* hava.js — Bergama–İzmir hava sahasının on günlük tahmini, ve kapağın
 * o anki havaya göre değişmesi.
 *
 * İki iş yapıyor:
 *   1. Kapak fotoğrafını hava koduna ve güneşin durumuna göre değiştiriyor.
 *      Açık gündüzde kendi drone karem duruyor ve palleri gerçek devirle
 *      dönüyor; hava değişince kare de değişiyor, o zaman rotor çekiliyor
 *      çünkü sprite yalnız o kareye oturuyor.
 *   2. Ana sayfaya on günlük rüzgâr şeridi basıyor: her gün için göbek
 *      yüksekliğinde en düşük ve en yüksek hız, m/s.
 *
 * Veri: Open-Meteo (CC BY 4.0), kendi sunucumuz üzerinden 15 dk önbellekli.
 * Betik çalışmazsa sayfa hiçbir şey kaybetmiyor.
 */
(function () {
  'use strict';
  var kok = document.documentElement;
  var az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- hava kodu → kendi fotoğraflarımdan biri ------------------------------
  // WMO kodları: 0 açık · 1-3 az/parçalı/kapalı · 45,48 sis · 51-67 çisenti ve
  // yağmur · 71-77 kar · 80-82 sağanak · 95-99 gök gürültülü.
  var LEVHA = '/assets/saha/ege-levha.webp';     // pal spriteının oturduğu kare
  function kareSec(kod, vardiya) {
    if (vardiya === 'gece') return '/assets/saha/yildizlar.webp';
    if (kod >= 71 && kod <= 77) return '/assets/saha/alacakaranlik.webp';
    if (kod >= 95) return '/assets/saha/lisans-sirt-yolu.webp';
    if (kod >= 51 && kod <= 82) return '/assets/saha/lisans-sirt-yolu.webp';
    if (kod === 45 || kod === 48) return '/assets/saha/bulut-ve-sira.webp';
    if (kod === 3) return '/assets/saha/lisans-bulut-ustu-sira.webp';
    if (vardiya === 'safak' || vardiya === 'aksam')
      return '/assets/saha/hero-gun-batimi.webp';
    return LEVHA;                                 // 0,1,2 gündüz: kendi karem
  }
  var HAVA_AD = {
    0: 'açık', 1: 'az bulutlu', 2: 'parçalı bulutlu', 3: 'kapalı',
    45: 'sisli', 48: 'kırağı sisi', 51: 'çisenti', 53: 'çisenti', 55: 'çisenti',
    56: 'donan çisenti', 57: 'donan çisenti', 61: 'hafif yağmur', 63: 'yağmur',
    65: 'kuvvetli yağmur', 66: 'donan yağmur', 67: 'donan yağmur',
    71: 'hafif kar', 73: 'kar', 75: 'yoğun kar', 77: 'kar taneli',
    80: 'sağanak', 81: 'sağanak', 82: 'kuvvetli sağanak',
    85: 'kar sağanağı', 86: 'kar sağanağı',
    95: 'gök gürültülü', 96: 'dolulu fırtına', 99: 'dolulu fırtına'
  };

  function kapagiDegistir(kod, vardiya) {
    var gorsel = document.querySelector('.kapak-gorsel .kapak-kat');
    if (!gorsel) return;
    var hedef = kareSec(kod, vardiya);
    if (hedef === LEVHA) return;                  // zaten duran kare

    var im = document.createElement('img');
    im.className = 'kapak-hava';
    im.alt = '';
    im.setAttribute('aria-hidden', 'true');
    im.decoding = 'async';
    im.src = hedef;
    im.onload = function () {
      kok.setAttribute('data-kare', 'hava');
      // bulanık taşma da aynı kareye dönsün: kaynağı değiştirmek yerine
      // ikinci bir katman koyup üstüne bindiriyoruz, böylece sıçrama olmuyor
      var fon = document.querySelector('.kapak-fon');
      if (fon && !fon.querySelector('.kapak-hava')) {
        var f = document.createElement('img');
        f.className = 'kapak-hava';
        f.alt = ''; f.setAttribute('aria-hidden', 'true');
        f.decoding = 'async'; f.src = hedef;
        fon.appendChild(f);
        if (az) f.classList.add('acik');
        else requestAnimationFrame(function () { f.classList.add('acik'); });
      }
      if (az) { im.classList.add('acik'); return; }
      requestAnimationFrame(function () { im.classList.add('acik'); });
    };
    gorsel.appendChild(im);
  }

  // ---- on günlük şerit ------------------------------------------------------
  var GUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  var YON = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD',
             'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
  function vir(x, b) { return x.toFixed(b).replace('.', ','); }

  // hava durumu ikonu — dört sade biçim yeter, ayrı dosya çekmiyoruz
  function ikon(kod) {
    var g = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5"/>';
    var b = '<path d="M7.5 18.5h9.2a3.6 3.6 0 0 0 .3-7.2 5.2 5.2 0 0 0-10-1.4 3.8 3.8 0 0 0 .5 8.6z"/>';
    var y = b + '<path d="M9 20.6l-.8 2M13 20.6l-.8 2M17 20.6l-.8 2"/>';
    var k = b + '<path d="M9 21h.01M13 21h.01M17 21h.01"/>';
    var f = '<path d="M3 9h13M3 13h17M6 17h11"/>';
    var s;
    if (kod >= 95) s = y;
    else if (kod >= 71 && kod <= 86) s = k;
    else if (kod >= 51) s = y;
    else if (kod === 45 || kod === 48) s = f;
    else if (kod >= 2) s = b;
    else s = g;
    return '<svg class="ik" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
           'stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' + s + '</svg>';
  }

  // saatlik 120 m serisinden gün gün en düşük / en yüksek
  function gunlukBantlar(d) {
    var s = d && d.hourly, g = d && d.daily;
    if (!s || !s.time || !g || !g.time) return null;
    var kova = {};
    for (var i = 0; i < s.time.length; i++) {
      var v = +s.wind_speed_120m[i];
      if (!isFinite(v)) continue;
      var t = s.time[i].slice(0, 10);
      if (!kova[t]) kova[t] = { min: v, max: v };
      else { if (v < kova[t].min) kova[t].min = v; if (v > kova[t].max) kova[t].max = v; }
    }
    var out = [];
    for (var j = 0; j < g.time.length && out.length < 10; j++) {
      var t2 = g.time[j], b = kova[t2];
      if (!b) continue;
      out.push({
        tarih: t2, min: b.min, max: b.max,
        kod: +g.weather_code[j],
        hamle: +g.wind_gusts_10m_max[j],
        yon: +g.wind_direction_10m_dominant[j]
      });
    }
    return out.length ? out : null;
  }

  function seritCiz(kutu, gunler) {
    var enBuyuk = 0;
    gunler.forEach(function (x) { if (x.max > enBuyuk) enBuyuk = x.max; });
    var tavan = Math.max(12, Math.ceil(enBuyuk / 4) * 4);
    var bugun = new Date().toISOString().slice(0, 10);
    var h = '';
    gunler.forEach(function (x) {
      var t = new Date(x.tarih + 'T12:00:00');
      var alt = Math.max(0, Math.min(100, x.min / tavan * 100));
      var ust = Math.max(0, Math.min(100, x.max / tavan * 100));
      h += '<div' + (x.tarih === bugun ? ' class="bugun"' : '') + '>' +
        '<span class="gun">' + (x.tarih === bugun ? 'Bugün' : GUN[t.getDay()]) +
        ' ' + t.getDate() + '</span>' +
        ikon(x.kod) +
        '<span class="bant" title="' + vir(x.min, 1) + '–' + vir(x.max, 1) + ' m/s">' +
        '<i style="bottom:' + alt.toFixed(1) + '%;height:' +
        Math.max(2, ust - alt).toFixed(1) + '%"></i></span>' +
        '<span class="mm"><b>' + vir(x.max, 1) + '</b><span> / ' + vir(x.min, 1) +
        '</span></span>' +
        '<span class="yon">' + YON[Math.round(x.yon / 22.5) % 16] + '</span>' +
        '</div>';
    });
    kutu.innerHTML = h;
  }

  // ---- çalıştır -------------------------------------------------------------
  var serit = document.getElementById('h10');
  var kapakVar = !!document.querySelector('.kapak-gorsel .kapak-kat');
  if (!serit && !kapakVar) return;

  fetch('/api/ruzgar?s=bergama', { headers: { accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      // 1. kapak
      if (kapakVar) {
        var kod = d.current ? +d.current.weather_code : 0;
        var vard = kok.getAttribute('data-vardiya') || 'gunduz';
        if (isFinite(kod)) kapagiDegistir(kod, vard);
        var ad = HAVA_AD[kod];
        var e = document.getElementById('cHava');
        if (e && ad) e.textContent = ad;
      }
      // 2. şerit
      if (serit) {
        var g = gunlukBantlar(d);
        if (!g) throw 0;
        seritCiz(serit, g);
        serit.parentNode.setAttribute('data-hazir', '1');
      }
    })
    .catch(function () {
      if (serit) serit.parentNode.setAttribute('data-hazir', 'yok');
    });
})();
