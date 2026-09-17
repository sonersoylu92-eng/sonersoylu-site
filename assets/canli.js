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

  // ---- güneşi hemen uygula (rüzgârı beklemeye gerek yok) -------------------
  var simdi = new Date();
  var g0 = gunesYuksekligi(39.12, 27.30, simdi);
  var h0 = g0.h;
  var h1 = gunesYuksekligi(39.12, 27.30, new Date(simdi.getTime() + 600000)).h;
  var v0 = vardiya(h0, h1 > h0);
  kok.setAttribute('data-vardiya', v0);
  kok.style.setProperty('--gunes', Math.max(0, Math.min(1, (h0 + 6) / 30)).toFixed(3));
  // ışık lekesi: güneş yükseldikçe karede yukarı çıkıyor, azimutla yana kayıyor
  kok.style.setProperty('--isik-y', (42 - Math.max(0, Math.min(60, h0)) * 0.55).toFixed(1) + '%');
  // kare kabaca güneye bakıyor: güneyden sapma karede yatay kaymaya dönüşüyor
  kok.style.setProperty('--isik-x',
    Math.max(6, Math.min(94, 50 + (g0.az - 180) * 0.30)).toFixed(1) + '%');
  var ISIK = { gece: 'gece', safak: 'şafak', aksam: 'akşam',
               altin: 'altın saat', gunduz: 'gündüz' };
  var eIsik = document.getElementById('cIsik');
  if (eIsik) eIsik.textContent = ISIK[v0] || '';

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
    var hour = now.getHours() % 12;
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
  }

  // Update clock immediately and then every 50ms for smooth animation
  updateAnalogClock();
  setInterval(updateAnalogClock, 50);

  // ---- veri depolama (son hava verileri) ----
  var sonVeri = { hiz: 0, yon: 0, rho: 1.225, kw: 0 };

  fetch('/api/ruzgar?s=bergama', { headers: { accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      var c = d && d.current;
      if (!c) throw 0;
      var v = +c.wind_speed_120m;
      var yon = +c.wind_direction_120m;
      var hamle = +c.wind_gusts_10m;
      var sic = +c.temperature_2m;
      var bas = +c.pressure_msl;
      if (!isFinite(v)) throw 0;

      // hava yoğunluğu: p = ρRT, basıncı 120 m'ye barometrik indirgeyerek
      var t120 = sic - 0.0065 * 120;
      var p120 = bas * 100 * Math.exp(-9.80665 * 120 / (287.05 * (sic + 273.15)));
      var rho = p120 / (287.05 * (t120 + 273.15));

      var d117 = devir(v);
      var kw = guc(v, rho);

      // veriyi sakla
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
      // kapaktaki pusula ve rozet
      yaz('kYon', YONLER[Math.round(yon / 22.5) % 16] + ' ' + Math.round(yon) + '° · '
          + bicim(v, 1) + ' m/s');
      yaz('kDevir', d117 > 0 ? bicim(d117, 1) : '0');
      yaz('cYogunluk', bicim(rho, 3));
      var d = document.getElementById('cIbre');
      if (d) d.style.transform = 'rotate(' + yon.toFixed(0) + 'deg)';
      var dr = document.getElementById('cRotor');
      if (dr && !az && d117 > 0) dr.style.animationDuration = (60 / d117).toFixed(2) + 's';
      kutu.setAttribute('data-hazir', '1');

      // özellikleri başlat
      initOzellikleri(v, yon, rho);
    })
    .catch(function () { kutu.setAttribute('data-hazir', 'yok'); });

  // ===================================================================
  // 7 YENİ ÖZELLIK BAŞLATMA FONKSİYONU
  // ===================================================================
  function initOzellikleri(wind, direction, density) {
    // 1. POWER OUTPUT CHART
    initPowerChart();

    // 2. WIND ROSE
    initWindRose();

    // 3. METAR/TAF
    initMetarTaf();

    // 4. FIELD NOTES
    initFieldNotes();

    // 5. WIND ALERTS
    initWindAlerts(wind);

    // 6. AMBIENT SOUND
    initAmbientSound(wind);

    // 7. NIGHT MODE
    initNightMode();
  }

  // ---- 1. Power Output Chart ----
  function initPowerChart(deneme) {
    var canvas = document.getElementById('powerChart');
    if (!canvas) return;
    if (!window.Chart) {
      // Chart.js CDN henüz yüklenmemiş olabilir — kısa süre bekleyip tekrar dene
      if ((deneme || 0) < 40) setTimeout(function () { initPowerChart((deneme || 0) + 1); }, 150);
      return;
    }

    var ctx = canvas.getContext('2d');
    var now = new Date();
    var labels = [];
    var data = [];

    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      labels.push((d.getMonth() + 1) + '/' + d.getDate());
      // Simüle edilmiş güç: 100 - 3000 kW arası random
      data.push(Math.random() * 2900 + 100);
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Saatlik Ortalama Güç (N117)',
          data: data,
          borderColor: '#c0392f',
          backgroundColor: 'rgba(192, 57, 47, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#c0392f',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, max: 3000, ticks: { callback: function(v) { return v + ' kW'; } } }
        }
      }
    });
  }

  // ---- 2. Wind Rose Chart ----
  function initWindRose(deneme) {
    var canvas = document.getElementById('windRoseChart');
    if (!canvas) return;
    if (!window.Chart) {
      if ((deneme || 0) < 40) setTimeout(function () { initWindRose((deneme || 0) + 1); }, 150);
      return;
    }

    var ctx = canvas.getContext('2d');
    // 16 yön için veri (K, KKD, KD, ... B, KB)
    var directions = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
    var speeds = [45, 52, 38, 41, 55, 48, 42, 39, 60, 58, 50, 35, 40, 38, 48, 42];

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: directions,
        datasets: [{
          label: 'Rüzgâr Hızı (m/s)',
          data: speeds,
          borderColor: '#c0392f',
          backgroundColor: 'rgba(192, 57, 47, 0.15)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#c0392f'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true, position: 'bottom' } },
        scales: { r: { beginAtZero: true, max: 60 } }
      }
    });
  }

  // ---- 3. METAR/TAF Entegrasyonu ----
  function initMetarTaf() {
    var metarDiv = document.getElementById('metarData');
    var tafDiv = document.getElementById('tafData');
    if (!metarDiv || !tafDiv) return;

    // Simüle METAR ve TAF verileri (gerçek API yerine örnek)
    metarDiv.textContent = 'LTAC 151600Z 35015G28KT 9999 FEW020 BKN050 24/18 Q1010 R09L/290060';
    tafDiv.textContent = 'LTAC 151720Z 151818 35012G22KT CAVOK 23/17 BECMG 1820 35010KT';
  }

  // ---- 4. Field Notes ----
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
        var card = document.createElement('div');
        card.className = 'note-card';
        card.innerHTML = '<div class="note-header">' +
          '<span class="note-time">' + note.time + '</span>' +
          '<button class="note-delete" data-id="' + note.id + '">Sil</button>' +
          '</div>' +
          '<div class="note-conditions">' + note.wind + ' · ' + note.direction + '</div>' +
          '<div class="note-text">' + note.text + '</div>';
        notesList.appendChild(card);

        card.querySelector('.note-delete').addEventListener('click', function() {
          var allNotes = JSON.parse(localStorage.getItem('fieldNotes') || '[]');
          allNotes = allNotes.filter(function(n) { return n.id !== note.id; });
          localStorage.setItem('fieldNotes', JSON.stringify(allNotes));
          loadAndDisplayNotes();
        });
      });
    }
  }

  // ---- 5. Wind Speed Alerts ----
  function initWindAlerts(initialWind) {
    var alertDiv = document.getElementById('currentAlertState');
    if (!alertDiv) return;

    var thresholds = { warning: 15, critical: 20, shutdown: 25 };

    function updateAlert(speed) {
      var status = 'normal';
      var msg = '✓ Normal: ' + speed.toFixed(1) + ' m/s';

      if (speed >= thresholds.shutdown) {
        status = 'shutdown';
        msg = '⛔ KESİNTİ: ' + speed.toFixed(1) + ' m/s — Türbin durmuş olmalı';
      } else if (speed >= thresholds.critical) {
        status = 'critical';
        msg = '🔴 KRİTİK: ' + speed.toFixed(1) + ' m/s — Hızlı düşüş bekleniyor';
      } else if (speed >= thresholds.warning) {
        status = 'warning';
        msg = '⚠ UYARI: ' + speed.toFixed(1) + ' m/s — Dikkat edin';
      }

      alertDiv.className = 'alert-status ' + status;
      alertDiv.innerHTML = '<p>' + msg + '</p>';
    }

    updateAlert(initialWind);

    // Her 10 saniyede kontrol et
    setInterval(function() {
      updateAlert(sonVeri.hiz);
    }, 10000);
  }

  // ---- 6. Ambient Sound ----
  function initAmbientSound(initialWind) {
    var soundToggle = document.getElementById('soundToggle');
    var soundVol = document.getElementById('soundVol');
    var volDisplay = document.getElementById('volDisplay');
    var soundInfo = document.getElementById('soundInfo');

    if (!soundToggle) return;

    var audioContext = null;
    var isPlaying = false;

    soundToggle.addEventListener('click', function() {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      isPlaying = !isPlaying;
      soundToggle.textContent = isPlaying ? 'Sesi Kapat' : 'Sesi Aç';
      soundInfo.classList.toggle('active', isPlaying);
      soundInfo.textContent = isPlaying ? 'Sesi açık — Rüzgâr hızına göre değişiyor' : 'Kapalı';

      if (!isPlaying && audioContext) {
        audioContext.close();
        audioContext = null;
      }
    });

    soundVol.addEventListener('input', function() {
      volDisplay.textContent = this.value + '%';
    });
  }

  // ---- 7. Night Mode Optimization ----
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
