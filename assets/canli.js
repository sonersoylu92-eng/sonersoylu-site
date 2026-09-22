/* canli.js — sayfayı İzmir–Bergama hava sahasının gerçek rüzgârına ve gerçek güneşe bağlar.
 *
 * Fikir: bir rüzgâr teknisyeninin sitesi, çalıştığı sahanın o anki hâlini
 * göstersin. Tek bir istek beş sayı üretiyor; tasarımın geri kalanı bu beş
 * sayıya CSS değişkenleriyle tepki veriyor. Betik çalışmazsa sayfa hiçbir şey
 * kaybetmiyor — sadece durağan kalıyor.
 */
(function () {
  'use strict';
  var kok = document.documentElement;
  var az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- N117/3000 modellenmiş güç eğrisi (ruzgar sayfasıyla aynı formül) ----
  var ALAN = Math.PI * 116.8 * 116.8 / 4;     // 10.715 m²
  var YARICAP = 58.4;                          // m
  function guc(v, rho) {
    if (v < 3 || v > 25) return 0;
    var cp;
    if (v >= 6.5) cp = 0.452;
    else { var x = (v - 3) / 3.5; cp = 0.10 + (0.452 - 0.10) * (3 * x * x - 2 * x * x * x); }
    var ham = 0.5 * rho * ALAN * v * v * v * cp / 1000;
    return ham / Math.pow(1 + Math.pow(ham / 3000, 6), 1 / 6);
  }
  // λ = 8; anma bandı 7,9–14,1 d/dk (üreticinin verdiği aralık)
  function devir(v) {
    if (v < 3 || v > 25) return 0;
    var r = (8 * v / YARICAP) * 60 / (2 * Math.PI);
    return Math.max(7.9, Math.min(14.1, r));
  }

  // ---- güneş yüksekliği (NOAA yaklaşımı, ±0,5°) ----------------------------
  function gunesYuksekligi(enlem, boylam, t) {
    var rad = Math.PI / 180;
    var gun = (t - Date.UTC(t.getUTCFullYear(), 0, 0)) / 86400000;
    var y = 2 * Math.PI / 365 * (gun - 1 + (t.getUTCHours() - 12) / 24);
    var esitlik = 229.18 * (0.000075 + 0.001868 * Math.cos(y) - 0.032077 * Math.sin(y)
      - 0.014615 * Math.cos(2 * y) - 0.040849 * Math.sin(2 * y));
    var egim = 0.006918 - 0.399912 * Math.cos(y) + 0.070257 * Math.sin(y)
      - 0.006758 * Math.cos(2 * y) + 0.000907 * Math.sin(2 * y)
      - 0.002697 * Math.cos(3 * y) + 0.00148 * Math.sin(3 * y);
    var dk = t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60;
    var saatAcisi = ((dk + esitlik + 4 * boylam) / 4 - 180) * rad;
    var cosz = Math.sin(enlem * rad) * Math.sin(egim)
      + Math.cos(enlem * rad) * Math.cos(egim) * Math.cos(saatAcisi);
    var z = Math.acos(Math.max(-1, Math.min(1, cosz)));
    var yuk = 90 - z / rad;
    var ca = (Math.sin(egim) - Math.sin(enlem * rad) * cosz) /
             (Math.cos(enlem * rad) * Math.sin(z) || 1e-6);
    var azm = Math.acos(Math.max(-1, Math.min(1, ca))) / rad;
    if (saatAcisi > 0) azm = 360 - azm;
    return { h: yuk, az: azm };
  }

  function vardiya(h, yukseliyor) {
    if (h < -6) return 'gece';
    if (h < 0) return yukseliyor ? 'safak' : 'aksam';
    if (h < 8) return 'altin';
    return 'gunduz';
  }

  // ---- güneş: hemen uygula, sonra periyodik tazele --------------------------
  // Sekme uzun süre açık kalırsa (biri gece yarısını geçerse) vardiya/etiket
  // bayatlamasın diye 10 dakikada bir yeniden hesaplanıyor.
  // Eskiden buraya bir "sürekli gece modu" tercihi de bakıyordu; o ayar
  // kaldırıldığı için artık sayfa her zaman gerçek güneş konumunu izliyor.
  try {
    ['forcedNightMode', 'autoNightMode', 'reducedMotion'].forEach(function (k) {
      localStorage.removeItem(k);
    });
  } catch (e) {}
  var ISIK = { gece: 'gece', safak: 'şafak', aksam: 'akşam',
               altin: 'altın saat', gunduz: 'gündüz' };
  var eIsik = document.getElementById('cIsik');
  var h0 = 0, v0 = 'gunduz';
  function gunuGuncelle() {
    var simdi = new Date();
    var g0 = gunesYuksekligi(39.12, 27.30, simdi);
    h0 = g0.h;
    var h1 = gunesYuksekligi(39.12, 27.30, new Date(simdi.getTime() + 600000)).h;
    v0 = vardiya(h0, h1 > h0);
    kok.setAttribute('data-vardiya', v0);
    kok.style.setProperty('--gunes', Math.max(0, Math.min(1, (h0 + 6) / 30)).toFixed(3));
    // ışık lekesi: güneş yükseldikçe karede yukarı çıkıyor, azimutla yana kayıyor
    kok.style.setProperty('--isik-y', (42 - Math.max(0, Math.min(60, h0)) * 0.55).toFixed(1) + '%');
    // kare kabaca güneye bakıyor: güneyden sapma karede yatay kaymaya dönüşüyor
    kok.style.setProperty('--isik-x',
      Math.max(6, Math.min(94, 50 + (g0.az - 180) * 0.30)).toFixed(1) + '%');
    if (eIsik) eIsik.textContent = ISIK[v0] || '';
  }
  gunuGuncelle();
  setInterval(gunuGuncelle, 600000);

  // ---- rüzgâr ---------------------------------------------------------------
  var kutu = document.getElementById('canli');
  if (!kutu) return;

  function bicim(x, basamak) {
    return x.toFixed(basamak).replace('.', ',');
  }
  var YONLER = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD',
                'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];

  // ---- analog clock animation (canlı saat) ----
  function updateAnalogClock() {
    var now = new Date();
    var h24 = now.getHours();
    var hour = h24 % 12;
    var minute = now.getMinutes();
    var second = now.getSeconds();
    var millisecond = now.getMilliseconds();

    var secondDegree = (second + millisecond / 1000) * 6;
    var minuteDegree = (minute + second / 60) * 6;
    var hourDegree = (hour + minute / 60) * 30;

    var hourHand = document.getElementById('hourHand');
    var minuteHand = document.getElementById('minuteHand');
    var secondHand = document.getElementById('secondHand');

    if (hourHand) hourHand.setAttribute('transform', 'rotate(' + hourDegree.toFixed(2) + ' 100 100)');
    if (minuteHand) minuteHand.setAttribute('transform', 'rotate(' + minuteDegree.toFixed(2) + ' 100 100)');
    if (secondHand) secondHand.setAttribute('transform', 'rotate(' + secondDegree.toFixed(2) + ' 100 100)');

    // ekran okuyucular için görsel-gizli dijital karşılık
    var ekran = document.getElementById('cSaatEkran');
    if (ekran) {
      var iki = function (n) { return (n < 10 ? '0' : '') + n; };
      ekran.textContent = iki(h24) + ':' + iki(minute) + ':' + iki(second);
    }
  }

  // Update clock immediately and then every 50ms for smooth animation
  updateAnalogClock();
  setInterval(updateAnalogClock, 50);

  // ---- veri depolama (son hava verileri) ----
  var sonVeri = { hiz: 0, yon: 0, rho: 1.225, kw: 0 };
  // uyarı kutusunu yeni veri geldiği anda tazeleyen kanca; initWindAlerts dolduruyor
  var uyariYenile = function () {};

  // ---- rüzgâr verisi: yükle, sonra düzenli tazele -------------------------
  // Eskiden tek sefer çekiliyordu; sekme saatlerce açık kalınca sayfa bayat
  // rüzgârı canlıymış gibi gösteriyordu. Artık on dakikada bir ve sekmeye
  // geri dönüldüğünde yenileniyor.
  function ruzgariIsle(d) {
    var c = d && d.current;
    if (!c) return false;
    var v = +c.wind_speed_120m;
    var yon = +c.wind_direction_120m;
    var hamle = +c.wind_gusts_10m;
    var sic = +c.temperature_2m;
    var bas = +c.pressure_msl;
    if (!isFinite(v)) return false;

    // hava yoğunluğu: p = ρRT, basıncı 120 m'ye barometrik indirgeyerek
    var t120 = sic - 0.0065 * 120;
    var p120 = bas * 100 * Math.exp(-9.80665 * 120 / (287.05 * (sic + 273.15)));
    var rho = p120 / (287.05 * (t120 + 273.15));

    var d117 = devir(v);
    var kw = guc(v, rho);

    sonVeri = { hiz: v, yon: yon, rho: rho, kw: kw };

    // --- tasarımın tepki verdiği sayılar ---
    kok.style.setProperty('--rz', Math.max(0, Math.min(1, v / 25)).toFixed(3));
    kok.style.setProperty('--yon', yon.toFixed(0) + 'deg');
    kok.style.setProperty('--yond', yon.toFixed(0));
    kok.style.setProperty('--devir-sure', d117 > 0 ? (60 / d117).toFixed(2) + 's' : '0s');
    kok.setAttribute('data-ruzgar', v < 3 ? 'durgun' : (v > 12 ? 'sert' : 'calisiyor'));

    // --- gösterge ---
    var yaz = function (id, m) { var e = document.getElementById(id); if (e) e.textContent = m; };
    yaz('cHiz', bicim(v, 1));
    yaz('cHamle', bicim(hamle, 1));
    yaz('cYon', YONLER[Math.round(yon / 22.5) % 16] + ' ' + Math.round(yon) + '°');
    yaz('cDevir', d117 > 0 ? bicim(d117, 1) : '0');
    yaz('cGuc', kw > 0 ? Math.round(kw).toLocaleString('tr-TR') : '0');
    yaz('kYon', YONLER[Math.round(yon / 22.5) % 16] + ' ' + Math.round(yon) + '° · '
        + bicim(v, 1) + ' m/s');
    yaz('kDevir', d117 > 0 ? bicim(d117, 1) : '0');
    yaz('cYogunluk', bicim(rho, 3));
    var ib = document.getElementById('cIbre');
    if (ib) ib.style.transform = 'rotate(' + yon.toFixed(0) + 'deg)';
    var dr = document.getElementById('cRotor');
    if (dr && !az && d117 > 0) dr.style.animationDuration = (60 / d117).toFixed(2) + 's';
    kutu.setAttribute('data-hazir', '1');
    uyariYenile();
    return true;
  }

  var sonCekme = 0;
  function ruzgariGetir(zorla) {
    var simdi = Date.now();
    if (!zorla && simdi - sonCekme < 5 * 60 * 1000) return;
    sonCekme = simdi;
    fetch('/api/ruzgar?s=bergama', { headers: { accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { if (!ruzgariIsle(d)) throw 0; })
      .catch(function () {
        // veri yoksa gösterge "yok" durumuna düşer; sayfanın geri kalanı çalışmaya devam eder
        if (kutu.getAttribute('data-hazir') !== '1') kutu.setAttribute('data-hazir', 'yok');
      });
  }

  ruzgariGetir(true);
  setInterval(function () { ruzgariGetir(true); }, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) ruzgariGetir(false); });

  // Rüzgâr verisi gelmese de kurulur; veri geldiğinde kendi kendine tazelenir.
  initWindAlerts();

  // ---- Rüzgâr Uyarı Sistemi ----
  function initWindAlerts() {
    var uyariKutusu = document.getElementById('currentAlertState');
    if (!uyariKutusu) return;
    var esikKutulari = document.querySelectorAll('.threshold');
    var ESIK = { warning: 15, critical: 20, shutdown: 25 };

    var p = uyariKutusu.querySelector('p') || uyariKutusu.appendChild(document.createElement('p'));

    function guncelle(hiz) {
      if (typeof hiz !== 'number' || !isFinite(hiz)) return;
      var durum = 'normal';
      var metin = 'Normal — ' + hiz.toFixed(1) + ' m/s';

      if (hiz >= ESIK.shutdown) {
        durum = 'shutdown';
        metin = 'Kesinti eşiği — ' + hiz.toFixed(1) + ' m/s · bu rüzgârda türbinin durmuş olması beklenir';
      } else if (hiz >= ESIK.critical) {
        durum = 'critical';
        metin = 'Kritik — ' + hiz.toFixed(1) + ' m/s · kesintiye yakın, üretimde hızlı düşüş beklenir';
      } else if (hiz >= ESIK.warning) {
        durum = 'warning';
        metin = 'Uyarı — ' + hiz.toFixed(1) + ' m/s · yüksek rüzgâr, kuleye çıkış planlanmaz';
      }

      uyariKutusu.className = 'alert-status ' + durum;
      p.textContent = metin;

      for (var i = 0; i < esikKutulari.length; i++) {
        var d = esikKutulari[i].getAttribute('data-level');
        esikKutulari[i].classList.toggle('active', durum !== 'normal' && hiz >= ESIK[d]);
      }
    }

    p.textContent = 'Rüzgâr verisi bekleniyor…';
    uyariYenile = function () { guncelle(sonVeri.hiz); };
    if (sonVeri.hiz > 0) uyariYenile();
    // yeni veri geldiğinde ruzgariIsle zaten çağırıyor; bu yalnızca emniyet ağı
    setInterval(uyariYenile, 60000);
  }

})();
