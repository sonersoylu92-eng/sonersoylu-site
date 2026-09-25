/* vitrin.js — ana sayfanın etkileşim katmanı (vitrin.css ile birlikte).
 * Bölüm geçişleri, kapakta rüzgâr akışı ve hafif paralaks, vaka akordeonu,
 * kariyer çizgisinin kaydırmayla dolması ve sahnedeyken şeffaf üst menü.
 * Hiçbir içerik bu betiğe bağımlı değil: betik çalışmazsa her şey görünür kalır. */
(function () {
  'use strict';
  var kok = document.documentElement;
  var az = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ince = matchMedia('(pointer: fine)').matches && innerWidth > 820;
  kok.classList.add('v-js');

  /* ---- bölüm numaraları ve belirme ---- */
  var bolumler = [].slice.call(document.querySelectorAll('main.ana > section:not(.dny-bolum)'));
  bolumler.forEach(function (b, i) {
    var e = b.querySelector('.etiket'); if (e) e.setAttribute('data-sira', String(i + 1).padStart(2, '0'));
  });
  if (!az && 'IntersectionObserver' in window) {
    var gozcu = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('v-gor'); gozcu.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    var isaretle = function (el, tur, sira) {
      if (!el || el.hasAttribute('data-v')) return;
      el.setAttribute('data-v', tur || ''); el.style.setProperty('--vi', sira || 0); gozcu.observe(el);
    };
    bolumler.forEach(function (b) {
      [].slice.call(b.querySelectorAll('.etiket, .giris, .bas > .ok, .kaynak-not')).forEach(function (el) { isaretle(el); });
      [].slice.call(b.querySelectorAll('h2:not(.gizli)')).forEach(function (el) { isaretle(el, 'b', 1); });
      [].slice.call(b.querySelectorAll('.soz, .platform li, .parca, .v-vaka > li, .gal > figure, .yazilar > .yazi, .kartlar > a, .belirti li, .yetki > div, .kanal, .zaman > li, .an-video, .uyari'))
        .forEach(function (el, i) { isaretle(el, '', i % 6); });
    });
  }

  /* ---- vaka akordeonu ---- */
  [].slice.call(document.querySelectorAll('.v-vk')).forEach(function (li) {
    var d = li.querySelector('.v-vk-bas button'), p = li.querySelector('.v-vk-panel');
    if (!d || !p) return;
    if (!li.classList.contains('acik')) p.hidden = true;
    d.addEventListener('click', function () {
      var acik = d.getAttribute('aria-expanded') === 'true';
      d.setAttribute('aria-expanded', String(!acik)); p.hidden = acik; li.classList.toggle('acik', !acik);
    });
  });

  /* ---- kaydırmaya bağlı: şeffaf menü ve kariyer çizgisi ---- */
  var sahne = document.getElementById('deneyim');
  var zaman = document.querySelector('.v-zaman'), dolu = document.getElementById('vZamanDolu');
  var zli = zaman ? [].slice.call(zaman.querySelectorAll('.zaman > li')) : [];
  var bekliyor = false;
  function kaydirma() {
    bekliyor = false;
    var vh = innerHeight;
    if (sahne) document.body.classList.toggle('v-sahnede', sahne.getBoundingClientRect().bottom > 80);
    if (zaman && dolu) {
      var r = zaman.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        var z = Math.max(0, Math.min(1, (vh * 0.62 - r.top) / r.height));
        dolu.style.setProperty('--z', z.toFixed(4));
        zli.forEach(function (li) { li.classList.toggle('ulasti', li.getBoundingClientRect().top < vh * 0.62); });
      }
    }
  }
  addEventListener('scroll', function () { if (!bekliyor) { bekliyor = true; requestAnimationFrame(kaydirma); } }, { passive: true });
  addEventListener('resize', kaydirma);
  kaydirma();

  /* ---- kapak: fareyle çok hafif paralaks ---- */
  if (sahne && ince && !az) {
    var mx = 0, my = 0, mBekle = false;
    sahne.addEventListener('pointermove', function (e) {
      mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5;
      if (mBekle || sahne.classList.contains('gecti')) return;
      mBekle = true;
      requestAnimationFrame(function () { mBekle = false; sahne.style.setProperty('--v-mx', mx.toFixed(3)); sahne.style.setProperty('--v-my', my.toFixed(3)); });
    }, { passive: true });
  }

  /* ---- iletişim formu: doğrular, hazır bir e-posta açar; hiçbir şey sunucuya gitmez ---- */
  var form = document.getElementById('vForm');
  if (form) {
    var ADRES = 'sonersoylu@yandex.com';
    var alan = function (id) { return document.getElementById(id); };
    var hata = function (id, msj) {
      var el = alan(id), h = alan(id + 'H');
      el.setAttribute('aria-invalid', msj ? 'true' : 'false');
      if (msj) { h.textContent = msj; h.hidden = false; el.setAttribute('aria-describedby', id + 'H'); }
      else { h.hidden = true; el.removeAttribute('aria-describedby'); }
      return !msj;
    };
    var kontrol = function () {
      var ad = alan('vAd').value.trim(), ep = alan('vEposta').value.trim(), ms = alan('vMesaj').value.trim();
      var a = hata('vAd', ad.length < 2 ? 'Adınızı yazın.' : '');
      var b = hata('vEposta', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ep) ? 'Geçerli bir e-posta adresi yazın; size buradan dönülecek.' : '');
      var c = hata('vMesaj', ms.length < 20 ? 'Mesajınız en az 20 karakter olsun (' + ms.length + '/20).' : '');
      return a && b && c;
    };
    ['vAd', 'vEposta', 'vMesaj'].forEach(function (id) {
      alan(id).addEventListener('blur', function () { if (alan(id).value) kontrol(); });
      alan(id).addEventListener('input', function () { if (alan(id).getAttribute('aria-invalid') === 'true') kontrol(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var durum = alan('vDurum'); durum.className = 'v-durum';
      if (!kontrol()) { durum.textContent = 'Lütfen işaretli alanları düzeltin.'; var ilk = form.querySelector('[aria-invalid=true]'); if (ilk) ilk.focus(); return; }
      var konu = (form.querySelector('input[name=konu]:checked') || {}).value || 'Genel';
      var ad = alan('vAd').value.trim(), ep = alan('vEposta').value.trim(), ms = alan('vMesaj').value.trim();
      var govde = ms + '\n\n— ' + ad + '\n' + ep + '\n(sonersoylu.com iletişim formundan)';
      location.href = 'mailto:' + ADRES + '?subject=' + encodeURIComponent('[' + konu + '] ' + ad) + '&body=' + encodeURIComponent(govde);
      durum.className = 'v-durum tamam';
      durum.textContent = 'E-posta uygulamanız açılıyor. Açılmazsa mesajınızı ' + ADRES + ' adresine gönderebilirsiniz; adresi yukarıdan kopyalayabilirsiniz.';
    });
  }

  /* ---- düğmeler: fareye çok hafif mıknatıs (en çok 5 px) ---- */
  if (ince && !az) [].slice.call(document.querySelectorAll('.v-miknatis')).forEach(function (d) {
    d.addEventListener('pointermove', function (e) {
      var r = d.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      d.style.transform = 'translate(' + (x * 10).toFixed(1) + 'px,' + (y * 6).toFixed(1) + 'px)';
    });
    d.addEventListener('pointerleave', function () { d.style.transform = ''; });
  });

  /* ---- kapak: rüzgâr akış çizgileri ve toz (yalnız masaüstü, yalnız ilk sahnede) ---- */
  var tuval = document.getElementById('vRuzgar');
  if (!tuval || az || !ince) return;
  var ctx = tuval.getContext('2d'); if (!ctx) return;
  var dpr = Math.min(devicePixelRatio || 1, 1.5), W = 0, H = 0, cizgiler = [], toz = [], raf = 0, sonT = 0;
  function olcek() {
    W = tuval.clientWidth; H = tuval.clientHeight; if (!W || !H) return;
    tuval.width = Math.round(W * dpr); tuval.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cizgiler = []; toz = [];
    for (var i = 0; i < 30; i++) cizgiler.push({ y: H * (0.18 + Math.random() * 0.74), a: 6 + Math.random() * 16, k: 0.0022 + Math.random() * 0.003, f: Math.random() * 6.28,
      x: Math.random() * W, h: 18 + Math.random() * 34, L: 120 + Math.random() * 260, al: 0.05 + Math.random() * 0.09 });
    for (var j = 0; j < 55; j++) toz.push({ x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 0.9, v: 4 + Math.random() * 10, f: Math.random() * 6.28 });
  }
  function yol(c, x) { return c.y + Math.sin(x * c.k + c.f) * c.a; }
  function kare(t) {
    raf = 0;
    if (document.hidden || sahne.classList.contains('gecti') || !sahne.classList.contains('hazir')) { sonT = 0; return; }
    var dt = sonT ? Math.min(0.05, (t - sonT) / 1000) : 0.016; sonT = t;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (var i = 0; i < cizgiler.length; i++) {
      var c = cizgiler[i]; c.x += c.h * dt; c.f += dt * 0.08;
      if (c.x - c.L > W) { c.x = -Math.random() * 200; c.y = H * (0.18 + Math.random() * 0.74); }
      var bas = c.x - c.L, g = ctx.createLinearGradient(bas, 0, c.x, 0);
      g.addColorStop(0, 'rgba(220,235,240,0)'); g.addColorStop(0.7, 'rgba(220,235,240,' + c.al + ')'); g.addColorStop(1, 'rgba(220,235,240,0)');
      ctx.strokeStyle = g; ctx.beginPath();
      for (var x = bas, n = 0; x <= c.x; x += 14, n++) { var y = yol(c, x); n ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    for (var j = 0; j < toz.length; j++) {
      var d = toz[j]; d.x += d.v * dt; d.f += dt; if (d.x > W + 4) { d.x = -4; d.y = Math.random() * H; }
      ctx.fillStyle = 'rgba(255,244,226,' + (0.12 + 0.12 * Math.sin(d.f)).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(d.x, d.y + Math.sin(d.f * 0.7) * 3, d.r, 0, 6.283); ctx.fill();
    }
    raf = requestAnimationFrame(kare);
  }
  function baslat() { if (!raf) raf = requestAnimationFrame(kare); }
  olcek(); addEventListener('resize', olcek);
  new MutationObserver(function () {
    var calis = sahne.classList.contains('hazir') && !sahne.classList.contains('gecti');
    tuval.classList.toggle('hazir', calis);
    if (calis) baslat();
  }).observe(sahne, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) baslat(); });
})();
