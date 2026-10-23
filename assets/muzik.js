/* muzik.js — "Rüzgâr dinlencesi": siteyi gezerken Beethoven.
 * Kayıtlar Musopen'in kamu malı / CC0 kayıtlarıdır; Wikimedia Commons'tan (MP3 dönüşümü) akış olarak çalınır,
 * sitenin sunucusuna ek yük getirmez. Müzik kendiliğinden başlamaz: ziyaretçi üst çubuktaki nota düğmesine
 * dokununca çalar. Açık bırakılırsa sonraki sayfada kaldığı yerden sürer (tarayıcı izin vermezse ilk dokunuşta).
 * Çerez yok; yalnız bu tarayıcıda küçük bir tercih kaydı (açık mı, hangi parça, nerede, ses düzeyi). */
(function () {
  'use strict';
  if (window.__muzik) return;
  window.__muzik = 1;
  var sag = document.querySelector('header .hd-right');
  if (!sag || !window.Audio) return;

  var EN = /^en/i.test(document.documentElement.lang || '');
  var T = EN ? {
    dugme: 'Music: Beethoven', bas: 'Wind rest · Beethoven', cal: 'Play', dur: 'Pause', onc: 'Previous piece', son: 'Next piece',
    ses: 'Volume', konum: 'Position', kapat: 'Close', liste: 'Playlist', bekle: 'Tap anywhere to continue the music',
    hata: 'The recordings cannot be reached right now.', ipucu: 'Some Beethoven while you browse?', ipucuCal: 'Play',
    kunye: 'Recordings: Musopen · public domain / CC0 · via Wikimedia Commons', kaynak: 'Source', caliyor: ' (playing)'
  } : {
    dugme: 'Müzik: Beethoven', bas: 'Rüzgâr dinlencesi · Beethoven', cal: 'Çal', dur: 'Duraklat', onc: 'Önceki parça', son: 'Sonraki parça',
    ses: 'Ses düzeyi', konum: 'Konum', kapat: 'Kapat', liste: 'Çalma listesi', bekle: 'Müziğin sürmesi için sayfaya bir kez dokunun',
    hata: 'Kayıtlara şu an ulaşılamıyor.', ipucu: 'Gezinirken biraz Beethoven?', ipucuCal: 'Çal',
    kunye: 'Kayıtlar: Musopen · kamu malı / CC0 · Wikimedia Commons üzerinden', kaynak: 'Kaynak', caliyor: ' (çalıyor)'
  };
  var L = EN ? 1 : 0;
  // Dört sakin parça; sıra dinlendirici bir akış için seçildi. Süreler Commons kayıtlarının gerçek süreleri (sn).
  var PARCALAR = [
    { yol: '4/48', dosya: "Ludwig_van_Beethoven_-_sonata_no._14_in_c_sharp_minor_'moonlight',_op._27_no._2_-_i._adagio_sostenuto.ogg", sure: 336,
      ad: ['Ay Işığı Sonatı', 'Moonlight Sonata'], alt: ['Piyano Sonatı No. 14 · I. Adagio sostenuto', 'Piano Sonata No. 14 · I. Adagio sostenuto'], icra: 'Paul Pitman · Musopen' },
    { yol: 'a/a9', dosya: "Ludwig_van_Beethoven_-_symphony_no._6_in_f_major_'pastoral',_op._68_-_ii._andante_molto_mosso.ogg", sure: 646,
      ad: ['Pastoral Senfoni', 'Pastoral Symphony'], alt: ['Senfoni No. 6 · II. Dere kenarında', 'Symphony No. 6 · II. Scene by the brook'], icra: 'Musopen' },
    { yol: '6/63', dosya: 'Beethoven,_Sonata_No._8_in_C_Minor_Pathetique,_Op._13_-_II._Adagio_cantabile.ogg', sure: 298,
      ad: ['Pathétique Sonatı', 'Pathétique Sonata'], alt: ['Piyano Sonatı No. 8 · II. Adagio cantabile', 'Piano Sonata No. 8 · II. Adagio cantabile'], icra: 'Musopen' },
    { yol: '4/49', dosya: "Ludwig_van_Beethoven_-_sonata_no._15_in_d_major,_op._28_'pastorale'_-_ii._andante.ogg", sure: 438,
      ad: ['Pastorale Sonatı', 'Pastorale Sonata'], alt: ['Piyano Sonatı No. 15 · II. Andante', 'Piano Sonata No. 15 · II. Andante'], icra: 'Musopen' }
  ];
  var N = PARCALAR.length;
  function kod(p) { return encodeURIComponent(p.dosya); }
  function adres(p) { var k = kod(p); return 'https://upload.wikimedia.org/wikipedia/commons/transcoded/' + p.yol + '/' + k + '/' + k + '.mp3'; }
  function sayfa(p) { return 'https://commons.wikimedia.org/wiki/File:' + kod(p); }
  function sure(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  // ---- tercih kaydı ----
  var ANAHTAR = 'ss-muzik-v1', d = { acik: false, i: 0, t: 0, ses: 0.4 };
  try {
    var k = JSON.parse(localStorage.getItem(ANAHTAR) || 'null');
    if (k) {
      d.i = Math.abs(k.i | 0) % N; d.t = +k.t || 0;
      if (k.ses >= 0 && k.ses <= 1) d.ses = +k.ses;
      // yalnız yakın zamanda (yarım saat) çalıyorduysa sürer; ertesi gün sessiz açılır
      d.acik = !!k.acik && Date.now() - (+k.z || 0) < 30 * 60 * 1000;
    }
  } catch (e) { /* gizli pencere: kayıt yok */ }
  function kaydet() {
    try { localStorage.setItem(ANAHTAR, JSON.stringify({ acik: d.acik, i: d.i, t: Math.round(ses.currentTime || d.t || 0), ses: d.ses, z: Date.now() })); } catch (e) {}
  }

  // ---- ses ----
  var ses = new Audio(); ses.preload = 'none';
  var yukluI = -1, bekliyor = false, hataSay = 0, kisik = false, disaridan = null, rampa = 0;
  // iOS ses düzeyini değiştirmeye izin vermez: kaydırıcı orada gizlenir
  var sesAyari = (function () { try { ses.volume = 0.5; var ok = Math.abs(ses.volume - 0.5) < 0.01; ses.volume = 1; return ok; } catch (e) { return false; } })();
  function hedefSes() { return d.ses * (kisik ? 0.35 : 1); }
  function sesYumusak(hedef, ms) {
    if (!sesAyari) return;
    cancelAnimationFrame(rampa);
    var bas = ses.volume, t0 = performance.now();
    (function adim(t) {
      var f = Math.min(1, ((t || performance.now()) - t0) / ms);
      try { ses.volume = Math.max(0, Math.min(1, bas + (hedef - bas) * f)); } catch (e) {}
      if (f < 1) rampa = requestAnimationFrame(adim);
    })();
  }
  function yukle(i, t) {
    d.i = (i + N) % N; d.t = t || 0; yukluI = d.i;
    ses.src = adres(PARCALAR[d.i]) + (d.t > 1 ? '#t=' + Math.floor(d.t) : '');
  }
  function cal() {
    if (yukluI !== d.i) yukle(d.i, d.t);
    if (sesAyari) ses.volume = 0;
    d.acik = true; bekliyor = false; kaydet(); arayuz();
    var s = ses.play();
    if (s && s.catch) s.catch(function (e) {
      if (e && e.name === 'NotAllowedError') { bekliyor = true; arayuz(); ilkDokunus(); }
    });
  }
  function durdur() { d.acik = false; bekliyor = false; disaridan = null; ses.pause(); kaydet(); arayuz(); }
  function parca(i, oto) { var acikti = d.acik || oto; yukle(i, 0); if (acikti) cal(); else arayuz(); kaydet(); }

  ses.addEventListener('playing', function () { hataSay = 0; sesYumusak(hedefSes(), 1600); arayuz(); oturum(); });
  ses.addEventListener('pause', function () { arayuz(); });
  ses.addEventListener('ended', function () { parca(d.i + 1, true); });
  ses.addEventListener('error', function () {
    if (!ses.src) return;
    if (++hataSay >= N) { d.acik = false; yukluI = -1; ses.removeAttribute('src'); arayuz(T.hata); kaydet(); return; }
    parca(d.i + 1, true);   // bir kayıt açılmazsa sıradakine geç
  });
  var sonKayit = 0;
  ses.addEventListener('timeupdate', function () {
    d.t = ses.currentTime || 0;
    konumGoster();
    var simdi = Date.now(); if (simdi - sonKayit > 3000) { sonKayit = simdi; kaydet(); }
  });
  addEventListener('pagehide', kaydet);

  // tarayıcı kendiliğinden çalmaya izin vermediyse: sayfadaki ilk dokunuşta ya da tuşta sürer
  var dokunusBekleniyor = false;
  function ilkDokunus() {
    if (dokunusBekleniyor) return; dokunusBekleniyor = true;
    function surdur(e) {
      if (e && e.target && e.target.closest && e.target.closest('.ssm-btn,.ssm-panel')) return;   // düğmenin kendisi zaten karar verir
      ['pointerdown', 'keydown', 'touchend'].forEach(function (t) { removeEventListener(t, surdur, true); });
      dokunusBekleniyor = false;
      if (bekliyor && d.acik) cal();
    }
    ['pointerdown', 'keydown', 'touchend'].forEach(function (t) { addEventListener(t, surdur, true); });
  }

  // sayfadaki sesli bir video ya da ses çalınca müzik susar, o bitince ya da durunca kaldığı yerden sürer
  document.addEventListener('play', function (e) {
    var m = e.target;
    if (m === ses || !m || !/^(VIDEO|AUDIO)$/.test(m.tagName) || m.muted || m.volume === 0) return;
    if (!ses.paused) { disaridan = m; ses.pause(); arayuz(); }
  }, true);
  function disaridanBitti(e) { if (disaridan && e.target === disaridan) { disaridan = null; if (d.acik) cal(); } }
  document.addEventListener('pause', disaridanBitti, true);
  document.addEventListener('ended', disaridanBitti, true);
  // 3B kapakta "Ses" (saha sesleri) açılınca müzik kısılır
  addEventListener('ss:saha-ses', function (e) { kisik = !!(e.detail && e.detail.acik); if (!ses.paused) sesYumusak(hedefSes(), 600); });

  // ---- görünüm ----
  var css = document.createElement('style');
  css.textContent =
    '.ssm-btn{position:relative}' +
    '.ssm-btn .ssm-cubuk{display:none;align-items:flex-end;gap:2px;height:13px}' +
    '.ssm-btn .ssm-cubuk i{display:block;width:2px;height:4px;background:currentColor;animation:ssmZ 1.1s ease-in-out infinite}' +
    '.ssm-btn .ssm-cubuk i:nth-child(2){animation-delay:-.35s}.ssm-btn .ssm-cubuk i:nth-child(3){animation-delay:-.7s}' +
    '.ssm-btn.calar .ssm-not{display:none}.ssm-btn.calar .ssm-cubuk{display:flex}' +
    'header .ssm-btn.calar,body.kapakli header .ssm-btn.calar{color:#f2b233}' +
    '.ssm-btn.bekler::after{content:"";position:absolute;top:4px;right:4px;width:6px;height:6px;border-radius:50%;background:#f2b233;animation:ssmN 1.6s ease-in-out infinite}' +
    '@keyframes ssmZ{0%,100%{height:3px}50%{height:13px}}@keyframes ssmN{0%,100%{opacity:.35}50%{opacity:1}}' +
    '.ssm-panel{position:fixed;z-index:60;right:max(1rem,env(safe-area-inset-right));width:min(23rem,calc(100vw - 2rem));' +
    'background:#11161a;border:1px solid #262e35;border-radius:8px;box-shadow:0 18px 50px rgba(0,0,0,.5);padding:1rem 1rem .9rem;' +
    'color:#e9edf0;font-family:var(--sans,system-ui,sans-serif);font-size:.875rem;line-height:1.45}' +
    '.ssm-panel[hidden],.ssm-ipucu[hidden]{display:none}' +
    '.ssm-ust{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.6rem}' +
    '.ssm-etiket{font-family:var(--mono,ui-monospace,monospace);font-size:.625rem;letter-spacing:.18em;text-transform:uppercase;color:#f2b233}' +
    '.ssm-panel button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;color:#e9edf0;border-radius:6px}' +
    '.ssm-panel button:focus-visible,.ssm-ipucu button:focus-visible{outline:2px solid #f2b233;outline-offset:2px}' +
    '.ssm-x{width:2.25rem;height:2.25rem;color:#9ea8b0!important;font-size:1.25rem}.ssm-x:hover{color:#e9edf0!important}' +
    '.ssm-ad{font-family:"Fraunces",Georgia,serif;font-size:1.25rem;line-height:1.2;margin:0}' +
    '.ssm-alt{margin:.15rem 0 0;color:#9ea8b0;font-size:.8125rem}' +
    '.ssm-konum{display:flex;align-items:center;gap:.6rem;margin:.8rem 0 .35rem;font-family:var(--mono,monospace);font-size:.6875rem;color:#9ea8b0}' +
    '.ssm-konum input{flex:1;min-width:0;accent-color:#f2b233;height:1.5rem;cursor:pointer}' +
    '.ssm-dugmeler{display:flex;align-items:center;gap:.35rem}' +
    '.ssm-dugmeler button{width:2.75rem;height:2.75rem;border:1px solid #262e35}' +
    '.ssm-dugmeler button:hover{border-color:#9ea8b0}' +
    '.ssm-dugmeler .ssm-oynat{width:3.25rem;height:3.25rem;border-radius:50%;background:#f2b233;color:#0b0e10;border-color:#f2b233}' +
    '.ssm-dugmeler .ssm-oynat:hover{background:#ffc552}' +
    '.ssm-ses{margin-left:auto;display:flex;align-items:center;gap:.4rem;color:#9ea8b0}' +
    '.ssm-ses input{width:6rem;accent-color:#f2b233;cursor:pointer}' +
    '.ssm-liste{list-style:none;margin:.9rem 0 0;padding:.4rem 0 0;border-top:1px solid #262e35}' +
    '.ssm-liste button{display:flex!important;width:100%;justify-content:flex-start!important;gap:.6rem;padding:.55rem .4rem;min-height:2.75rem;text-align:left}' +
    '.ssm-liste button:hover{background:#171e24}' +
    '.ssm-liste b{font-family:var(--mono,monospace);font-weight:400;font-size:.6875rem;color:#9ea8b0;width:1.4rem;flex:none}' +
    '.ssm-liste span{flex:1;min-width:0}.ssm-liste small{display:block;color:#9ea8b0;font-size:.75rem}' +
    '.ssm-liste em{font-style:normal;font-family:var(--mono,monospace);font-size:.6875rem;color:#9ea8b0;flex:none}' +
    '.ssm-liste button[aria-current="true"]{background:rgba(242,178,51,.08)}.ssm-liste button[aria-current="true"] b{color:#f2b233}' +
    '.ssm-not-satir{margin:.75rem 0 0;font-size:.6875rem;line-height:1.5;color:#9ea8b0}' +
    '.ssm-not-satir a{color:#e9edf0;text-decoration:underline;text-underline-offset:2px}' +
    '.ssm-durum{margin:.5rem 0 0;font-size:.75rem;color:#f2b233}.ssm-durum:empty{display:none}' +
    '.ssm-ipucu{position:fixed;z-index:60;right:max(1rem,env(safe-area-inset-right));display:flex;align-items:center;gap:.5rem;' +
    'background:#11161a;border:1px solid #262e35;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.45);padding:.3rem .3rem .3rem .9rem;' +
    'color:#e9edf0;font-family:var(--sans,system-ui,sans-serif);font-size:.8125rem;animation:ssmGir .35s ease-out}' +
    '.ssm-ipucu button{all:unset;box-sizing:border-box;cursor:pointer;border-radius:999px;min-height:2.25rem;display:inline-flex;align-items:center;justify-content:center}' +
    '.ssm-ipucu .ssm-ic{background:#f2b233;color:#0b0e10;padding:0 .9rem;font-weight:600}' +
    '.ssm-ipucu .ssm-ik{width:2.25rem;color:#9ea8b0;font-size:1.1rem}' +
    '@keyframes ssmGir{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.ssm-btn .ssm-cubuk i,.ssm-btn.bekler::after,.ssm-ipucu{animation:none}.ssm-btn .ssm-cubuk i{height:9px}}';
  document.head.appendChild(css);

  var NOT = '<svg class="ssm-not" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">' +
    '<path d="M6 12.2V3.4l7-1.6v8.6"/><circle cx="4.3" cy="12.3" r="1.8"/><circle cx="11.3" cy="10.5" r="1.8"/></svg>' +
    '<span class="ssm-cubuk" aria-hidden="true"><i></i><i></i><i></i></span>';
  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'ikon ssm-btn'; btn.id = 'muzikBtn';
  btn.setAttribute('aria-label', T.dugme); btn.title = T.dugme;
  btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'muzikPanel');
  btn.innerHTML = NOT;
  var ara = document.getElementById('araBtn');
  if (ara && ara.parentNode === sag) sag.insertBefore(btn, ara.nextSibling); else sag.insertBefore(btn, sag.firstChild);

  var OYNAT = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M5 3.2v9.6L13 8z" fill="currentColor"/></svg>';
  var DURAK = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.5 3h2.6v10H4.5zM8.9 3h2.6v10H8.9z" fill="currentColor"/></svg>';
  var panel = document.createElement('div');
  panel.className = 'ssm-panel'; panel.id = 'muzikPanel'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', T.bas);
  panel.innerHTML =
    '<div class="ssm-ust"><span class="ssm-etiket">' + T.bas + '</span><button type="button" class="ssm-x" aria-label="' + T.kapat + '">×</button></div>' +
    '<p class="ssm-ad"></p><p class="ssm-alt"></p>' +
    '<div class="ssm-konum"><span class="ssm-gecen">0:00</span><input type="range" min="0" max="336" step="1" value="0" aria-label="' + T.konum + '"><span class="ssm-top">5:36</span></div>' +
    '<div class="ssm-dugmeler">' +
      '<button type="button" class="ssm-onc" aria-label="' + T.onc + '"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3h1.8v10H3zM13 3.2v9.6L5.6 8z" fill="currentColor"/></svg></button>' +
      '<button type="button" class="ssm-oynat" aria-label="' + T.cal + '">' + OYNAT + '</button>' +
      '<button type="button" class="ssm-son" aria-label="' + T.son + '"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M11.2 3H13v10h-1.8zM3 3.2v9.6L10.4 8z" fill="currentColor"/></svg></button>' +
      (sesAyari ? '<label class="ssm-ses"><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M2.5 6h2.6L8.5 3v10L5.1 10H2.5z"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5"/></svg><input type="range" min="0" max="1" step="0.05" aria-label="' + T.ses + '"></label>' : '') +
    '</div>' +
    '<p class="ssm-durum" role="status"></p>' +
    '<ol class="ssm-liste" aria-label="' + T.liste + '"></ol>' +
    '<p class="ssm-not-satir"></p>';
  document.body.appendChild(panel);

  var eAd = panel.querySelector('.ssm-ad'), eAlt = panel.querySelector('.ssm-alt'), eGecen = panel.querySelector('.ssm-gecen'),
      eTop = panel.querySelector('.ssm-top'), eKonum = panel.querySelector('.ssm-konum input'), eOynat = panel.querySelector('.ssm-oynat'),
      eDurum = panel.querySelector('.ssm-durum'), eListe = panel.querySelector('.ssm-liste'), eNot = panel.querySelector('.ssm-not-satir'),
      eSes = panel.querySelector('.ssm-ses input');
  PARCALAR.forEach(function (p, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button"><b>' + String(i + 1).padStart(2, '0') + '</b><span>' + p.ad[L] + '<small>' + p.alt[L] + '</small></span><em>' + sure(p.sure) + '</em></button>';
    li.firstChild.addEventListener('click', function () { parca(i, true); });
    eListe.appendChild(li);
  });
  if (eSes) {
    eSes.value = d.ses;
    eSes.addEventListener('input', function () { d.ses = +eSes.value; cancelAnimationFrame(rampa); try { ses.volume = hedefSes(); } catch (e) {} kaydet(); });
  }
  var kaydiriyor = false;
  eKonum.addEventListener('input', function () { kaydiriyor = true; eGecen.textContent = sure(+eKonum.value); });
  eKonum.addEventListener('change', function () {
    kaydiriyor = false; var t = +eKonum.value;
    if (yukluI === d.i && ses.readyState > 0) { try { ses.currentTime = t; } catch (e) {} } else { d.t = t; yukluI = -1; }
    d.t = t; kaydet(); konumGoster();
  });
  eOynat.addEventListener('click', function () { if (d.acik && !ses.paused) durdur(); else cal(); });
  panel.querySelector('.ssm-onc').addEventListener('click', function () { parca((ses.currentTime || 0) > 5 ? d.i : d.i - 1); });
  panel.querySelector('.ssm-son').addEventListener('click', function () { parca(d.i + 1); });
  panel.querySelector('.ssm-x').addEventListener('click', function () { panelKapat(true); });

  function konumGoster() {
    if (kaydiriyor) return;
    var p = PARCALAR[d.i], top = isFinite(ses.duration) && ses.duration > 0 && yukluI === d.i ? ses.duration : p.sure;
    var t = yukluI === d.i ? (ses.currentTime || d.t || 0) : d.t;
    eKonum.max = Math.round(top); eKonum.value = Math.round(t);
    eGecen.textContent = sure(t); eTop.textContent = sure(top);
  }
  function arayuz(mesaj) {
    var p = PARCALAR[d.i], caliyor = d.acik && !ses.paused;
    btn.classList.toggle('calar', caliyor);
    btn.classList.toggle('bekler', d.acik && bekliyor);
    btn.setAttribute('aria-label', T.dugme + (caliyor ? T.caliyor : '')); btn.title = T.dugme + (caliyor ? T.caliyor : '');
    eAd.textContent = p.ad[L]; eAlt.textContent = p.alt[L];
    eOynat.innerHTML = caliyor ? DURAK : OYNAT; eOynat.setAttribute('aria-label', caliyor ? T.dur : T.cal);
    [].forEach.call(eListe.querySelectorAll('button'), function (b, i) { b.setAttribute('aria-current', i === d.i ? 'true' : 'false'); });
    eNot.innerHTML = T.kunye + '. ' + p.icra + ' · <a href="' + sayfa(p) + '" target="_blank" rel="noopener">' + T.kaynak + '</a>';
    eDurum.textContent = mesaj || (d.acik && bekliyor ? T.bekle : '');
    konumGoster();
  }

  // ---- panel aç/kapat ----
  function panelYeri(el) {
    var h = document.querySelector('header'), alt = h ? h.getBoundingClientRect().bottom : 64;
    el.style.top = Math.max(8, Math.round(alt) + 8) + 'px';
  }
  function panelAc() {
    ipucuKapat(true);
    panelYeri(panel); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); arayuz();
    eOynat.focus({ preventScroll: true });
  }
  function panelKapat(odak) {
    if (panel.hidden) return;
    panel.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (odak) btn.focus({ preventScroll: true });
  }
  btn.addEventListener('click', function () {
    if (!panel.hidden) { panelKapat(false); return; }
    // ilk dokunuş: müzik hemen başlar ve panel açılır; sonrakilerde panel açılır, kontrol oradadır
    if (!d.acik) cal(); else if (bekliyor) cal();
    panelAc();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) panelKapat(true); });
  document.addEventListener('pointerdown', function (e) { if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) panelKapat(false); }, true);
  addEventListener('resize', function () { if (!panel.hidden) panelYeri(panel); });

  // ---- Media Session: kilit ekranı ve klavye medya tuşları ----
  function oturum() {
    if (!('mediaSession' in navigator)) return;
    var p = PARCALAR[d.i];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: p.ad[L] + ' — ' + p.alt[L], artist: 'Ludwig van Beethoven', album: T.bas,
        artwork: [{ src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' }] });
    } catch (e) {}
  }
  if ('mediaSession' in navigator) {
    var eylem = function (ad, f) { try { navigator.mediaSession.setActionHandler(ad, f); } catch (e) {} };
    eylem('play', cal); eylem('pause', durdur);
    eylem('previoustrack', function () { parca(d.i - 1, true); });
    eylem('nexttrack', function () { parca(d.i + 1, true); });
  }

  // ---- bir kezlik davet: kapak (3B) üstünde değilken, sayfada biraz zaman geçirince ----
  var ipucu = null, ipucuZ = 0;
  function ipucuGoruldu() { try { return !!localStorage.getItem('ss-muzik-ipucu'); } catch (e) { return true; } }
  function ipucuKapat(kalici) {
    clearTimeout(ipucuZ);
    if (ipucu) { ipucu.remove(); ipucu = null; }
    if (kalici) try { localStorage.setItem('ss-muzik-ipucu', '1'); } catch (e) {}
  }
  function ipucuGoster() {
    if (ipucu || d.acik || ipucuGoruldu() || !panel.hidden || document.hidden) return;
    var kapak = document.getElementById('deneyim');
    if (kapak && kapak.getBoundingClientRect().bottom > 80) return;   // kapak sade kalır
    ipucu = document.createElement('div'); ipucu.className = 'ssm-ipucu'; ipucu.setAttribute('role', 'status');
    ipucu.innerHTML = '<span>' + T.ipucu + '</span><button type="button" class="ssm-ic">' + T.ipucuCal + '</button><button type="button" class="ssm-ik" aria-label="' + T.kapat + '">×</button>';
    panelYeri(ipucu); document.body.appendChild(ipucu);
    ipucu.querySelector('.ssm-ic').addEventListener('click', function () { ipucuKapat(true); cal(); panelAc(); });
    ipucu.querySelector('.ssm-ik').addEventListener('click', function () { ipucuKapat(true); });
    try { localStorage.setItem('ss-muzik-ipucu', '1'); } catch (e) {}
    ipucuZ = setTimeout(function () { ipucuKapat(true); }, 12000);
  }
  if (!ipucuGoruldu()) {
    var bekleme = setInterval(function () { ipucuGoster(); if (ipucu || ipucuGoruldu() || d.acik) clearInterval(bekleme); }, 2000);
    setTimeout(function () { clearInterval(bekleme); }, 5 * 60 * 1000);
    var basT = Date.now(), eskiGoster = ipucuGoster;
    ipucuGoster = function () { if (Date.now() - basT > 9000) eskiGoster(); };
  }

  // ---- açılış: önceki sayfada çalıyorsa kaldığı yerden ----
  arayuz();
  if (d.acik) { yukle(d.i, d.t); cal(); }
})();
