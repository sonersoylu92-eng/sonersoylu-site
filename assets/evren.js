/* evren.js — Rüzgârın yolculuğu (V26)
 *
 * Ana sayfada 3B kapaktan sonraki her bölüm ayrı bir dünya: Rüzgâr → Makine → Saha → Şebeke → Ufuk → Gece.
 * Sayfanın arkasında tek bir sabit tuval var. Bölümlerin zemin rengini ve binlerce noktadan oluşan dünyaları o çizer:
 *   Rüzgâr : canlı rüzgâr yönünde akan akım çizgileri (hız Aliağa verisinden)
 *   Makine : rotor nokta bulutu, canlı devirde döner
 *   Saha   : derinliğe uzanan Ege sırtları
 *   Şebeke : iletim hatları; hat boyunca akan enerji darbeleri
 *   Ufuk   : körfezin dalgaları
 *   Gece   : dönen yıldız gökü
 * Kaydırdıkça noktalar bir dünyadan ötekine dönüşür. Dönüşüm yalnız kaydırma konumunun işlevidir: geri gelince her şey
 * aynı yere oturur. Bölüm sınırlarında zemin renkleri yumuşak bir ufuk şeridiyle birbirine geçer.
 * İlerlemeli: tuval kurulamazsa ya da hareket azaltılmışsa bölümler eski düz renkleriyle kalır (CSS). Yazılar her zaman
 * tuvalin önünde; noktalar yalnız boş zeminde görünür. Kapak (3B) ekranı kaplarken tuval hiç çizilmez.
 */
(function () {
  'use strict';
  if (window.__evren) return; window.__evren = true;
  var body = document.body; if (!body || !body.classList.contains('ana-body')) return;
  var kok = document.documentElement;
  var azHareket = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dny = document.getElementById('deneyim');
  var TANIM = [
    { id: 'giris', ad: 'Rüzgâr', tur: 'ruzgar' },
    { id: 'secilmis', ad: 'Makine', tur: 'makine' },
    { id: 'sahadan', ad: 'Saha', tur: 'saha' },
    { id: 'bilgi', ad: 'Şebeke', tur: 'sebeke' },
    { id: 'iletisim', ad: 'Ufuk', tur: 'ufuk' },
    { id: '__son', ad: 'Gece', tur: 'gece' },
  ];
  var D = [];
  TANIM.forEach(function (t) {
    var el = t.id === '__son' ? document.querySelector('footer.son') : document.getElementById(t.id);
    if (el) D.push({ el: el, ad: t.ad, tur: t.tur, id: t.id });
  });
  if (D.length < 3) return;
  var tuval = document.createElement('canvas');
  var ctx = tuval.getContext && tuval.getContext('2d');
  if (!ctx) return;

  // zemin renkleri bölümlerin kendi CSS renginden okunur (tasarım sistemi değişirse dünyalar da uyar)
  function rgb(s) { var m = String(s).match(/\d+(\.\d+)?/g); return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : null; }
  function parlak(c) { return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  D.forEach(function (d) {
    var c = rgb(getComputedStyle(d.el).backgroundColor);
    if (!c || (c[0] === 0 && c[1] === 0 && c[2] === 0 && /rgba\(0, 0, 0, 0\)/.test(getComputedStyle(d.el).backgroundColor))) c = [246, 242, 234];
    d.zemin = c; d.koyu = parlak(c) < 0.45;
    d.murekkep = d.koyu ? [236, 231, 220] : [22, 27, 28];
  });

  tuval.id = 'evren'; tuval.setAttribute('aria-hidden', 'true');
  body.insertBefore(tuval, body.firstChild);
  kok.classList.add('evren-acik');
  kok.style.setProperty('--evren-ilk', 'rgb(' + D[0].zemin.join(',') + ')');

  /* ---------------- yolculuk göstergesi (masaüstü): dünyalar ve şu anki konum ---------------- */
  var yol = document.createElement('nav');
  yol.className = 'evren-yol'; yol.setAttribute('aria-label', 'Sayfadaki dünyalar');
  D.forEach(function (d, i) {
    var a = document.createElement('a');
    a.href = d.id === '__son' ? '#' : '#' + d.id;
    if (d.id === '__son') a.addEventListener('click', function (e) { e.preventDefault(); d.el.scrollIntoView({ behavior: azHareket ? 'auto' : 'smooth' }); });
    a.innerHTML = '<span class="evren-yol-no">0' + (i + 1) + '</span><span class="evren-yol-ad">' + d.ad + '</span>';
    yol.appendChild(a); d.yolA = a;
  });
  body.appendChild(yol);

  /* ---------------- noktalar: her dünya için hedef konumlar ---------------- */
  var mobil = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches;
  var N = azHareket ? 0 : mobil ? 460 : 1000;
  var dpr = Math.min(devicePixelRatio || 1, 1.25);   // noktalar ince: yüksek çözünürlük gerekmez, doluluk maliyeti düşük kalır
  var W = 0, H = 0, U = 1;
  var rnd = (function (s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })(20261020);
  var gecik = new Float32Array(N), tohum = new Float32Array(N), darbe = new Uint8Array(N);
  for (var j = 0; j < N; j++) { gecik[j] = rnd() * 0.35; tohum[j] = rnd(); darbe[j] = rnd() < 0.09 ? 1 : 0; }
  // her dünya: N × (x, y, z) taban konum; hareket uygulanırken eklenir
  var T = D.map(function () { return new Float32Array(N * 3); });
  var RX = 0, RY = 0, RS = 0.5;   // rotor merkezi ve ölçeği (makine dünyası): masaüstünde başlığın sağındaki boşlukta
  function kur() {
    var asp = W / Math.max(1, H), sag = mobil ? 0 : Math.min(1.25, asp * 0.55);
    RX = mobil ? 0.62 : Math.min(1.15, asp * 0.6); RY = mobil ? 0.55 : 0.42; RS = mobil ? 0.36 : 0.5;
    D.forEach(function (d, k) {
      var P = T[k];
      for (var j = 0; j < N; j++) {
        var x = 0, y = 0, z = 0, r1 = tohum[j], r2 = rnd(), r3 = rnd();
        switch (d.tur) {
          case 'ruzgar':   // hacme serpilmiş akım parçacıkları
            x = (r2 * 2 - 1) * asp * 1.25; y = (r3 * 2 - 1) * 1.05; z = rnd() * 2.2 - 0.6; break;
          case 'makine': { // göbek, üç kanat, nasel, kule ve seyrek toz
            var p = j / N;
            if (p < 0.08) { var a = r2 * 6.283, b = Math.acos(r3 * 2 - 1); x = Math.sin(b) * Math.cos(a) * 0.1 * RS; y = Math.sin(b) * Math.sin(a) * 0.1 * RS; z = Math.cos(b) * 0.1 * RS; }
            else if (p < 0.74) { var kn = Math.floor(r2 * 3), s = Math.pow(rnd(), 0.8), ac = kn * 2.0944, kord = (0.085 * (1 - s) + 0.012) * (rnd() - 0.5);
              var lx = (0.1 + s * 1.05) * RS, ly = kord * RS; x = lx * Math.cos(ac) - ly * Math.sin(ac); y = lx * Math.sin(ac) + ly * Math.cos(ac); z = (rnd() - 0.5) * 0.02; }
            else if (p < 0.8) { x = (r2 - 0.5) * 0.08 * RS; y = (r3 - 0.5) * 0.08 * RS; z = (0.06 + rnd() * 0.32) * RS; }
            else if (p < 0.9) { var hh = rnd(); x = (rnd() - 0.5) * 0.05 * (1 + hh) * RS; y = (-0.08 - hh * 2.4) * RS; z = 0.1; }
            else { x = (r2 * 2 - 1) * asp * 1.3; y = (r3 * 2 - 1) * 1.1; z = rnd() * 2 + 0.5; }
            if (p < 0.9) { x += RX; y += RY; }
            break; }
          case 'saha': {   // sırt ızgarası: x yanlara, z derinliğe
            var gx = (r2 * 2 - 1) * 2.6, gz = 0.15 + Math.pow(r3, 0.7) * 4.2;
            x = gx; z = gz; y = -0.62 + 0.24 * Math.sin(gx * 1.3 + gz * 0.8) + 0.11 * Math.sin(gx * 3.1 - gz * 1.9) + 0.07 * gz; break; }
          case 'sebeke': { // dört hat, direkler arasında sarkarak derinliğe uzanır
            var hat = Math.floor(r2 * 4), hz = 0.2 + r3 * 5.2, aral = 1.3, u = (hz % aral) / aral;
            x = [-1.15, -0.55, 0.55, 1.15][hat] * (mobil ? 0.7 : 1) + (mobil ? 0 : sag * 0.45); z = hz;
            y = 0.62 + (hat % 2 ? 0.08 : 0) - 0.18 * (1 - Math.pow(2 * u - 1, 2)); break; }
          case 'ufuk': {   // körfezin dalga çizgileri
            var dz = 0.2 + Math.pow(r3, 0.8) * 4.5; x = (r2 * 2 - 1) * (1.2 + dz * 0.6) * asp * 0.8; z = dz; y = -0.5 + 0.03 * Math.sin(x * 4 + dz * 3); break; }
          default: {       // gece: uzak yıldızlar
            var a2 = r2 * 6.283, b2 = Math.acos(r3 * 2 - 1); x = Math.sin(b2) * Math.cos(a2) * 6; y = Math.abs(Math.cos(b2)) * 4 - 0.6; z = 4 + Math.sin(b2) * Math.sin(a2) * 2; }
        }
        P[j * 3] = x; P[j * 3 + 1] = y; P[j * 3 + 2] = z;
      }
    });
  }

  /* ---------------- canlı veri: rüzgâr hızı, yönü, rotor devri (sayfanın kendi değişkenleri) ---------------- */
  var canli = { hiz: 7, yon: 0, w: 1.3 }, canliT = -1e9;
  function canliOku(t) {
    if (t - canliT < 1500) return; canliT = t;
    var st = getComputedStyle(kok), rz = parseFloat(st.getPropertyValue('--rz')), yd = parseFloat(st.getPropertyValue('--yon-derece')), ds = parseFloat(st.getPropertyValue('--devir-sure'));
    if (isFinite(rz)) canli.hiz = Math.max(1.5, rz * 25);
    if (isFinite(yd)) canli.yon = yd;
    canli.w = ds > 0 ? 2 * Math.PI / ds : 0;
  }

  /* ---------------- dünya hareketi: taban konuma zamanla eklenen ---------------- */
  var _o = [0, 0, 0];
  function konum(k, j, t, P) {
    var x = P[j * 3], y = P[j * 3 + 1], z = P[j * 3 + 2], s = tohum[j];
    switch (D[k].tur) {
      case 'ruzgar': {
        var genis = (W / Math.max(1, H)) * 1.25, v = 0.05 + canli.hiz * 0.012;
        x = ((x + t * v * (0.7 + s * 0.6) + genis) % (2 * genis) + 2 * genis) % (2 * genis) - genis;
        y += Math.sin(x * 2.2 + t * 0.5 + s * 6) * 0.035; break; }
      case 'makine': {
        var p = j / N;
        if (p < 0.74) { var a = -t * canli.w, c = Math.cos(a), si = Math.sin(a), lx = x - RX, ly = y - RY; x = lx * c - ly * si + RX; y = lx * si + ly * c + RY; }
        else if (p >= 0.9) { y += Math.sin(t * 0.2 + s * 9) * 0.02; }
        break; }
      case 'saha': z = ((z - t * 0.035) % 4.35 + 4.35) % 4.35 + 0.15; y = -0.62 + 0.24 * Math.sin(x * 1.3 + z * 0.8) + 0.11 * Math.sin(x * 3.1 - z * 1.9) + 0.07 * z; break;
      case 'sebeke': if (darbe[j]) { z = ((z + t * 0.55) % 5.4 + 5.4) % 5.4 + 0.2; var u = (z % 1.3) / 1.3; y = 0.62 + (Math.floor(s * 4) % 2 ? 0.08 : 0) - 0.18 * (1 - Math.pow(2 * u - 1, 2)); } break;
      case 'ufuk': y += Math.sin(x * 3 + t * 0.9 + z * 2.4) * 0.025; break;
      default: { var g = t * 0.012, cg = Math.cos(g), sg = Math.sin(g), xx = x * cg - (z - 4) * sg; z = x * sg + (z - 4) * cg + 4; x = xx; }
    }
    _o[0] = x; _o[1] = y; _o[2] = z; return _o;
  }

  /* Yazı koruması: noktalar yazıların ve düğmelerin üstüne düşmez (okunurluk). Metin kutuları belge koordinatında bir kez
   * ölçülür, 64 px'lik satır kovalarına dağıtılır; her nokta yalnız kendi satırındaki kutulara bakar. Düzen değişince yenilenir. */
  var KOVA = 64, kova = new Map(), kutular = [];
  var METIN = 'h1,h2,h3,h4,p,li,dt,dd,figcaption,blockquote,label,button,input,textarea,select,.ralan,.el-kimlik dl,.el-proje-yazi';
  function engelOlc() {
    kutular = []; kova = new Map();
    var sy = scrollY, pay = 10, rg = document.createRange();
    D.forEach(function (d) {
      d.el.querySelectorAll(METIN).forEach(function (e) {
        // yazı satırları tek tek (başlığın boş kalan sağı ve altı dünyaya açık kalır); denetimler kutusuyla
        var liste;
        if (/^(H[1-4]|P|LI|DT|DD|FIGCAPTION|BLOCKQUOTE)$/.test(e.tagName)) { rg.selectNodeContents(e); liste = rg.getClientRects(); }
        else liste = [e.getBoundingClientRect()];
        for (var i = 0; i < liste.length; i++) {
          var r = liste[i]; if (r.width < 2 || r.height < 2) continue;
          var k = [r.left - pay, r.top + sy - pay, r.right + pay, r.bottom + sy + pay]; kutular.push(k);
          for (var y = Math.floor(k[1] / KOVA); y <= Math.floor(k[3] / KOVA); y++) { if (!kova.has(y)) kova.set(y, []); kova.get(y).push(k); }
        }
      });
    });
  }
  var engelZaman = 0;
  function engelIste() { clearTimeout(engelZaman); engelZaman = setTimeout(function () { engelOlc(); iste(); }, 180); }
  function engelde(x, yDoc) {
    var l = kova.get(Math.floor(yDoc / KOVA)); if (!l) return false;
    for (var i = 0; i < l.length; i++) { var k = l[i]; if (x > k[0] && x < k[2] && yDoc > k[1] && yDoc < k[3]) return true; }
    return false;
  }

  function boyutla() {
    W = innerWidth; H = innerHeight; U = Math.min(W, H) * 0.5;
    tuval.width = Math.round(W * dpr); tuval.height = Math.round(H * dpr);
    tuval.style.width = W + 'px'; tuval.style.height = H + 'px';
    kur(); engelOlc();
  }

  /* ---------------- çizim ---------------- */
  var acik = false, raf = 0, sonCiz = 0, sonKaydir = 0, gizli = false;
  function gorun(v) { if (v === acik) return; acik = v; kok.classList.toggle('evren-gorunur', v); }
  // sınır şeridi dar: yazının altındaki zemin hep kendi bölümünün rengi kalır; dönüşümü noktalar taşır
  var BANT = function () { return Math.min(H * 0.018, 14); };
  function harman(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function css(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }
  function yumusak(e0, e1, x) { var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
  var gruplar = [[], [], [], [], [], []];   // [mürekkep A yakın, A uzak, B yakın, B uzak, darbe, (boş)]

  function ciz(t) {
    var dAlt = dny ? dny.getBoundingClientRect().bottom : 0;
    if (dAlt >= H - 1) { gorun(false); return false; }
    gorun(true);
    canliOku(t);
    var R = D.map(function (d) { return d.el.getBoundingClientRect(); }), kaydirY = scrollY;
    var bant = BANT();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // zemin: her bölüm kendi rengi; sınırlarda ufuk şeridi
    ctx.fillStyle = css(D[0].zemin, 1); ctx.fillRect(0, 0, W, H);
    for (var i = 0; i < D.length; i++) {
      var r = R[i], ust = Math.max(0, r.top), alt = Math.min(H, r.bottom);
      if (alt > ust) { ctx.fillStyle = css(D[i].zemin, 1); ctx.fillRect(0, ust, W, alt - ust); }
    }
    for (i = 1; i < D.length; i++) {
      var b = R[i].top; if (b < -bant || b > H + bant) continue;
      var gr = ctx.createLinearGradient(0, b - bant, 0, b + bant);
      gr.addColorStop(0, css(D[i - 1].zemin, 1)); gr.addColorStop(0.5, css(harman(D[i - 1].zemin, D[i].zemin, 0.5), 1)); gr.addColorStop(1, css(D[i].zemin, 1));
      ctx.fillStyle = gr; ctx.fillRect(0, b - bant, W, bant * 2);
      var isik = 1 - Math.min(1, Math.abs(b - H * 0.5) / (H * 0.5));
      if (isik > 0.02) { ctx.fillStyle = 'rgba(208,89,42,' + (0.55 * isik).toFixed(3) + ')'; ctx.fillRect(0, b - 0.5, W, 1); }
    }
    // kapağın altına doğru: 3B bölüm henüz ekrandaysa üst kısım boş kalır (sahne orayı zaten kaplar)
    if (!N) return true;
    // dünya konumu: her sınır ekranın %80'inden %20'sine geçerken bir dünyalık dönüşüm
    var wf = 0;
    for (i = 1; i < D.length; i++) wf += yumusak(H * 0.8, H * 0.2, R[i].top);
    var k0 = Math.min(D.length - 1, Math.floor(wf)), k1 = Math.min(D.length - 1, k0 + 1), f = wf - k0;
    // ilk dünya kapaktan çıkarken ekrana dolar
    var giris = yumusak(H, H * 0.35, dAlt);
    var cx = W * 0.5, cy = H * 0.5, odak = U * 1.7, kz = 1.6;
    for (var g = 0; g < gruplar.length; g++) gruplar[g].length = 0;
    // mürekkep: noktanın ekrandaki y'sinin altındaki bölümün rengi (sınır geçişi keskin, şeritte yumuşak)
    var sinirY = [], ink = [];
    for (i = 0; i < D.length; i++) { sinirY.push(R[i].top); ink.push(D[i].murekkep); }
    var P0 = T[k0], P1 = T[k1], ruzgarAg = D[k0].tur === 'ruzgar' ? 1 - f : D[k1].tur === 'ruzgar' ? f : 0;
    var yonA = Math.sin(canli.yon * Math.PI / 180) * 0.22;
    for (var j = 0; j < N; j++) {
      var fj = Math.min(1, Math.max(0, (f - gecik[j]) / 0.65)); fj = fj * fj * (3 - 2 * fj);
      var a = konum(k0, j, t, P0), ax = a[0], ay = a[1], az = a[2];
      var x = ax, y = ay, z = az;
      if (fj > 0 && k1 !== k0) { var bb = konum(k1, j, t, P1); x = ax + (bb[0] - ax) * fj; y = ay + (bb[1] - ay) * fj; z = az + (bb[2] - az) * fj; }
      var dz = z + kz; if (dz < 0.15) continue;
      var sx = cx + x * odak / dz, sy = cy - y * odak / dz;
      if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
      if (giris < 1 && sy < dAlt) continue;
      if (engelde(sx, sy + kaydirY)) continue;
      var bi = 0; for (var q = D.length - 1; q >= 0; q--) if (sy >= sinirY[q]) { bi = q; break; }
      var yakin = dz < 2.6 || (D[k0].tur === 'gece' && f < 0.5) || (D[k1].tur === 'gece' && f >= 0.5) ? 0 : 1;
      var kat = darbe[j] && (D[k0].tur === 'sebeke' || D[k1].tur === 'sebeke') ? 4 : (bi % 2) * 2 + yakin;
      // aynı renk sınıfında olanları birlikte çiz (fillStyle değişimi az)
      var iri = (D[k0].tur === 'makine' ? 1 - fj : 0) + (D[k1].tur === 'makine' ? fj : 0);
      gruplar[kat].push(sx, sy, Math.max(0.7, 2.1 / dz) * (darbe[j] ? 1.5 : 1) * (1 + iri * 0.6 * (j / N < 0.8 ? 1 : 0)), bi);
    }
    // akım çizgileri: rüzgâr dünyasında noktalar rüzgâr yönünde kısa izler bırakır
    var iz = ruzgarAg * (6 + canli.hiz * 1.6);
    for (g = 0; g < 5; g++) {
      var L = gruplar[g]; if (!L.length) continue;
      if (g === 4) { ctx.fillStyle = 'rgba(208,89,42,' + (0.85 * giris).toFixed(3) + ')'; }
      for (var n = 0; n < L.length; n += 4) {
        var bi2 = L[n + 3];
        if (g !== 4) ctx.fillStyle = css(ink[bi2], ((g % 2 ? 0.28 : 0.5) * (1 - ruzgarAg * 0.45) * giris).toFixed(3));
        var s2 = L[n + 2];
        if (iz > 0.5 && g !== 4) { ctx.fillRect(L[n] - iz * s2 * 0.5, L[n + 1] - iz * yonA * s2 * 0.5, iz * s2, Math.max(0.5, s2 * 0.4)); }
        else ctx.fillRect(L[n] - s2 / 2, L[n + 1] - s2 / 2, s2, s2);
      }
    }
    return true;
  }

  /* ---------------- gösterge, fotoğraf derinliği, kart eğimi ---------------- */
  var kareler = [].slice.call(document.querySelectorAll('.el-kareler .el-kare'));
  var derinlik = !azHareket && !mobil && matchMedia('(pointer: fine)').matches;
  if (derinlik) kok.classList.add('evren-derin');
  var aktif = -1;
  function ust(t) {
    var orta = H * 0.5, ai = -1, R;
    for (var i = 0; i < D.length; i++) { R = D[i].el.getBoundingClientRect(); if (R.top <= orta && R.bottom > orta) ai = i; }
    if (ai !== aktif) {
      aktif = ai;
      D.forEach(function (d, i) { if (i === ai) d.yolA.setAttribute('aria-current', 'true'); else d.yolA.removeAttribute('aria-current'); });
      yol.classList.toggle('evren-yol-acik', ai >= 0);
      yol.dataset.zemin = ai >= 0 && D[ai].koyu ? 'koyu' : 'acik';
      kok.dataset.evren = ai >= 0 ? D[ai].tur : '';
    }
    if (derinlik) for (var k = 0; k < kareler.length; k++) {
      var r = kareler[k].getBoundingClientRect();
      if (r.bottom < -100 || r.top > H + 100) continue;
      // aynı yönde, farklı hızda: kareler arası boşluk (en az 40 px) hiçbir konumda kapanmaz
      var o = Math.max(-0.7, Math.min(0.7, (r.top + r.height / 2 - orta) / H)), hiz = 0.012 + (k % 3) * 0.011;
      kareler[k].style.transform = 'translate3d(0,' + (-o * hiz * H).toFixed(1) + 'px,0)';
    }
  }
  if (derinlik) document.querySelectorAll('.el-proje').forEach(function (a) {
    var fig = a.querySelector('figure'); if (!fig) return;
    a.addEventListener('pointermove', function (e) {
      var r = a.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      fig.style.transform = 'perspective(1100px) rotateX(' + (-py * 3.2).toFixed(2) + 'deg) rotateY(' + (px * 4.2).toFixed(2) + 'deg)';
    }, { passive: true });
    a.addEventListener('pointerleave', function () { fig.style.transform = ''; });
  });

  /* ---------------- döngü: kaydırırken her kare, dururken 30 fps, görünmüyorsa hiç ---------------- */
  function kare(t) {
    raf = 0;
    if (gizli) return;
    var kaydiriyor = t - sonKaydir < 260;
    if (!kaydiriyor && t - sonCiz < 32) { iste(); return; }
    sonCiz = t;
    var cizdi = ciz(azHareket ? 0 : t / 1000);
    ust(t);
    if (cizdi && !azHareket) iste();
  }
  function iste() { if (!raf) raf = requestAnimationFrame(kare); }
  addEventListener('scroll', function () { sonKaydir = performance.now(); iste(); }, { passive: true });
  addEventListener('resize', function () { boyutla(); iste(); });
  addEventListener('load', engelIste);
  if (window.ResizeObserver) { var ro = new ResizeObserver(engelIste); D.forEach(function (d) { ro.observe(d.el); }); }
  document.addEventListener('toggle', engelIste, true);
  document.addEventListener('visibilitychange', function () { gizli = document.hidden; if (!gizli) iste(); });
  boyutla(); iste();
  window.__evrenDurum = function () { return { acik: acik, N: N, aktif: aktif >= 0 ? D[aktif].tur : null, zemin: D.map(function (d) { return d.tur + ':' + d.zemin.join(','); }) }; };
})();
