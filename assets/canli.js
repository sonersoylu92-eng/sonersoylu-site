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
  // bayatlamasın diye 10 dakikada bir yeniden hesaplanıyor. Zorlama gece modu
  // açıksa (bkz. initNightMode) dokunmuyoruz, kullanıcı tercihini ezmesin.
  var ISIK = { gece: 'gece', safak: 'şafak', aksam: 'akşam',
               altin: 'altın saat', gunduz: 'gündüz' };
  var eIsik = document.getElementById('cIsik');
  var h0 = 0, v0 = 'gunduz';
  function gunuGuncelle() {
    try { if (localStorage.getItem('forcedNightMode') === 'true') return; } catch (e) {}
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

  // ===================================================================
  // SAYFA ÖZELLİKLERİ
  // Rüzgâr verisi gelmese de çalışmaları gerekiyor: eskiden hepsi rüzgâr
  // isteğinin başarılı dönmesine bağlıydı, istek düşünce not defteri, ayarlar
  // ve havacılık raporu da ölüyordu.
  // ===================================================================
  initMetarTaf();
  initFieldNotes();
  initWindAlerts();
  initAmbientSound();
  initNightMode();

  // ---- 1. METAR/TAF — LTBJ resmî gözlemi (worker üzerinden, 10 dk önbellekli) ----
  function initMetarTaf() {
    var ozetEl = document.getElementById('metarOzet');
    var metarEl = document.getElementById('metarData');
    var tafEl = document.getElementById('tafData');
    var metarZaman = document.getElementById('metarTime');
    var tafZaman = document.getElementById('tafTime');
    if (!metarEl || !tafEl) return;

    function yaz(el, metin) { if (el) el.textContent = metin; }

    function getir() {
      fetch('/api/metar', { headers: { accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d || !d.ok) throw new Error('kaynak');

          if (ozetEl) {
            ozetEl.classList.remove('bekliyor');
            yaz(ozetEl, (d.coz && d.coz.ozet) || 'Gözlem çözümlenemedi.');
          }
          yaz(metarEl, d.metar || 'Gözlem alınamadı');
          yaz(tafEl, d.taf || 'Tahmin alınamadı');

          if (d.coz && d.coz.gun && d.coz.saat) {
            yaz(metarZaman, 'Ayın ' + d.coz.gun + '. günü ' + d.coz.saat + ' UTC gözlemi');
          } else {
            yaz(metarZaman, '');
          }
          if (d.taf) {
            var g = d.taf.match(/\b(\d{2})(\d{2})(\d{2})Z\b/);
            yaz(tafZaman, g ? 'Ayın ' + (+g[1]) + '. günü ' + g[2] + ':' + g[3] + ' UTC yayını' : '');
          }
        })
        .catch(function () {
          if (ozetEl) { ozetEl.classList.add('bekliyor'); yaz(ozetEl, 'Havacılık raporuna şu an ulaşılamıyor.'); }
          yaz(metarEl, 'Ulaşılamadı');
          yaz(tafEl, 'Ulaşılamadı');
          yaz(metarZaman, ''); yaz(tafZaman, '');
        });
    }

    getir();
    // METAR yarım saatte bir yayınlanır; on dakikada bir bakmak fazlasıyla yeterli
    setInterval(getir, 10 * 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) getir(); });
  }

  // ---- 2. Field Notes ----
  function initFieldNotes() {
    var noteInput = document.getElementById('noteInput');
    var addBtn = document.getElementById('addNoteBtn');
    var notesList = document.getElementById('notesList');
    var noteCount = document.getElementById('noteCount');

    if (!noteInput || !addBtn) return;

    // Var olan notları yükle
    loadAndDisplayNotes();

    noteInput.addEventListener('input', function() {
      var len = noteInput.value.length;
      noteCount.textContent = len + '/280';
      if (len > 250) noteCount.classList.add('warning');
      else noteCount.classList.remove('warning');
    });

    addBtn.addEventListener('click', function() {
      var text = noteInput.value.trim();
      if (!text) return;

      var note = {
        id: Date.now(),
        text: text,
        time: new Date().toLocaleString('tr-TR'),
        wind: sonVeri.hiz.toFixed(1) + ' m/s',
        direction: Math.round(sonVeri.yon) + '°'
      };

      // localStorage'a kaydet
      var notes = JSON.parse(localStorage.getItem('fieldNotes') || '[]');
      notes.unshift(note);
      if (notes.length > 100) notes = notes.slice(0, 100); // son 100 not tut
      localStorage.setItem('fieldNotes', JSON.stringify(notes));

      noteInput.value = '';
      noteCount.textContent = '0/280';
      loadAndDisplayNotes();
    });

    function loadAndDisplayNotes() {
      var notes = JSON.parse(localStorage.getItem('fieldNotes') || '[]');
      notesList.innerHTML = '';
      notes.forEach(function(note) {
        // Not metni kullanıcıdan geliyor: HTML olarak değil, metin olarak basılır.
        function kutu(sinif, metin) {
          var e = document.createElement('div');
          e.className = sinif;
          e.textContent = metin;
          return e;
        }
        var card = document.createElement('div');
        card.className = 'note-card';

        var bas = document.createElement('div');
        bas.className = 'note-header';
        var zaman = document.createElement('span');
        zaman.className = 'note-time';
        zaman.textContent = note.time;
        var sil = document.createElement('button');
        sil.className = 'note-delete';
        sil.type = 'button';
        sil.textContent = 'Sil';
        bas.appendChild(zaman);
        bas.appendChild(sil);

        card.appendChild(bas);
        card.appendChild(kutu('note-conditions', note.wind + ' · ' + note.direction));
        card.appendChild(kutu('note-text', note.text));
        notesList.appendChild(card);

        sil.addEventListener('click', function() {
          var allNotes = JSON.parse(localStorage.getItem('fieldNotes') || '[]');
          allNotes = allNotes.filter(function(n) { return n.id !== note.id; });
          localStorage.setItem('fieldNotes', JSON.stringify(allNotes));
          loadAndDisplayNotes();
        });
      });
    }
  }

  // ---- 3. Rüzgâr Uyarı Sistemi ----
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

  // ---- 4. Rüzgâr Ambiyansı ----
  // Kayıt çalmıyoruz; sesi tarayıcıda üretiyoruz. Rüzgâr uğultusu aslında geniş
  // bantlı gürültünün alçak frekanslara bastırılmış hâli: beyaz gürültüyü bir
  // alçak geçiren süzgeçten geçirip kesim frekansını ve kazancı o anki gerçek
  // rüzgâr hızına bağlıyoruz. Hız arttıkça ses hem yükseliyor hem tizleşiyor.
  function initAmbientSound() {
    var dugme = document.getElementById('soundToggle');
    var kaydirac = document.getElementById('soundVol');
    var yuzde = document.getElementById('volDisplay');
    var bilgi = document.getElementById('soundInfo');
    if (!dugme || !kaydirac) return;

    var ctx = null, kaynak = null, suzgec = null, kazanc = null, lfo = null, lfoKazanc = null;
    var caliyor = false, zamanlayici = null;

    function gurultuTamponu(ctx) {
      var n = ctx.sampleRate * 3;                 // 3 saniyelik döngü
      var b = ctx.createBuffer(1, n, ctx.sampleRate);
      var d = b.getChannelData(0);
      // kahverengi gürültü: beyaz gürültünün entegrali — rüzgâra beyazdan çok daha yakın
      var son = 0;
      for (var i = 0; i < n; i++) {
        var beyaz = Math.random() * 2 - 1;
        son = (son + 0.02 * beyaz) / 1.02;
        d[i] = son * 3.5;
      }
      return b;
    }

    function hizaGore() {
      if (!ctx || !caliyor) return;
      var v = Math.max(0, Math.min(30, sonVeri.hiz || 0));
      var t = ctx.currentTime;
      // 0 m/s'de boğuk ve kısık, 25 m/s'de parlak ve yüksek
      var kesim = 180 + v * 95;                            // Hz
      var seviye = (0.05 + Math.min(1, v / 22) * 0.95) * (kaydirac.value / 100);
      suzgec.frequency.setTargetAtTime(kesim, t, 1.5);
      kazanc.gain.setTargetAtTime(seviye * 0.9, t, 1.5);
      // hamleler: hız arttıkça dalgalanma da artar
      lfoKazanc.gain.setTargetAtTime(seviye * Math.min(0.45, v / 45), t, 1.5);
      lfo.frequency.setTargetAtTime(0.06 + v / 160, t, 1.5);
      if (bilgi) {
        bilgi.textContent = 'Açık — ' + v.toFixed(1) + ' m/s rüzgâra göre üretiliyor';
      }
    }

    function baslat() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { if (bilgi) bilgi.textContent = 'Tarayıcınız ses üretimini desteklemiyor'; return false; }
      ctx = new AC();
      kaynak = ctx.createBufferSource();
      kaynak.buffer = gurultuTamponu(ctx);
      kaynak.loop = true;

      suzgec = ctx.createBiquadFilter();
      suzgec.type = 'lowpass';
      suzgec.frequency.value = 400;
      suzgec.Q.value = 0.7;

      kazanc = ctx.createGain();
      kazanc.gain.value = 0;

      // yavaş bir salınım: sabit uğultu yerine gelip giden rüzgâr hissi
      lfo = ctx.createOscillator();
      lfo.frequency.value = 0.1;
      lfoKazanc = ctx.createGain();
      lfoKazanc.gain.value = 0;
      lfo.connect(lfoKazanc).connect(kazanc.gain);

      kaynak.connect(suzgec).connect(kazanc).connect(ctx.destination);
      kaynak.start();
      lfo.start();
      return true;
    }

    function durdur() {
      caliyor = false;
      if (zamanlayici) { clearInterval(zamanlayici); zamanlayici = null; }
      if (ctx) {
        try {
          kazanc.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
          var k = ctx;
          setTimeout(function () { try { k.close(); } catch (e) {} }, 600);
        } catch (e) { try { ctx.close(); } catch (e2) {} }
      }
      ctx = null; kaynak = null; suzgec = null; kazanc = null; lfo = null; lfoKazanc = null;
      dugme.textContent = 'Sesi Aç';
      dugme.setAttribute('aria-pressed', 'false');
      if (bilgi) { bilgi.classList.remove('active'); bilgi.textContent = 'Kapalı'; }
    }

    dugme.setAttribute('aria-pressed', 'false');

    dugme.addEventListener('click', function () {
      if (caliyor) { durdur(); return; }
      if (!baslat()) return;
      caliyor = true;
      // bazı tarayıcılar sesi ilk dokunuşa kadar askıya alır
      if (ctx.state === 'suspended') ctx.resume();
      dugme.textContent = 'Sesi Kapat';
      dugme.setAttribute('aria-pressed', 'true');
      if (bilgi) bilgi.classList.add('active');
      hizaGore();
      zamanlayici = setInterval(hizaGore, 5000);
    });

    kaydirac.addEventListener('input', function () {
      if (yuzde) yuzde.textContent = this.value + '%';
      hizaGore();
    });

    // sekme arkaya atılırsa sesi kapat — kimse fonda uğultu istemez
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && caliyor) durdur();
    });
  }

  // ---- 5. Night Mode Optimization ----
  function initNightMode() {
    var autoNight = document.getElementById('autoNightMode');
    var forcedNight = document.getElementById('forcedNightMode');
    var reducedMotion = document.getElementById('reducedMotion');
    var resetBtn = document.getElementById('resetSettings');

    if (!autoNight) return;

    // Kayıtlı ayarları yükle
    autoNight.checked = localStorage.getItem('autoNightMode') !== 'false';
    forcedNight.checked = localStorage.getItem('forcedNightMode') === 'true';
    reducedMotion.checked = localStorage.getItem('reducedMotion') === 'true';

    // Değişiklikleri kaydet
    [autoNight, forcedNight, reducedMotion].forEach(function(el) {
      el.addEventListener('change', function() {
        localStorage.setItem(el.id, el.checked);
        applyNightModeSettings();
      });
    });

    resetBtn.addEventListener('click', function() {
      localStorage.removeItem('autoNightMode');
      localStorage.removeItem('forcedNightMode');
      localStorage.removeItem('reducedMotion');
      location.reload();
    });

    function applyNightModeSettings() {
      if (forcedNight.checked) {
        kok.setAttribute('data-vardiya', 'gece');
        kok.style.setProperty('--gunes', '0');
        if (eIsik) eIsik.textContent = ISIK.gece;
      } else {
        // zorlama kapatıldıysa gerçek güneş konumuna geri dön
        kok.setAttribute('data-vardiya', v0);
        kok.style.setProperty('--gunes', Math.max(0, Math.min(1, (h0 + 6) / 30)).toFixed(3));
        if (eIsik) eIsik.textContent = ISIK[v0] || '';
      }
      if (reducedMotion.checked) {
        kok.style.setProperty('--animation-duration', '0s');
      } else {
        kok.style.removeProperty('--animation-duration');
      }
    }

    applyNightModeSettings();
  }
})();
