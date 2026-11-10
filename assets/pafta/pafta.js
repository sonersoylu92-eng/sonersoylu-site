/* pafta.js — ana sayfanın 3B dışındaki davranışı: tema, menü, canlı rüzgâr paneli, iletişim.
   Canlı rüzgâr: /api/ruzgar (Open-Meteo tahmini, Aliağa, 120 m). Güç ve devir modelden hesaplanır, ölçüm değildir;
   veri yokken hiçbir sayı uydurulmaz, panel bunu açıkça söyler. */
(function () {
  'use strict';
  var kok = document.documentElement;
  function $(i) { return document.getElementById(i); }
  var hareketAz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- tema */
  function temaYaz(t, kaydet) {
    kok.setAttribute('data-tema', t);
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'gece' ? '#0B1F3F' : '#EDF2F5';
    var b = $('temaBtn'); if (b) b.setAttribute('aria-label', t === 'gece' ? 'Gündüz paftasına geç' : 'Gece paftasına geç');
    if (kaydet) { try { if (t === kok.getAttribute('data-tema-oto')) localStorage.removeItem('pafta-tema'); else localStorage.setItem('pafta-tema', t); } catch (e) {} }
    try { dispatchEvent(new CustomEvent('pafta:tema', { detail: t })); } catch (e) {}
  }
  var tb = $('temaBtn');
  if (tb) { temaYaz(kok.getAttribute('data-tema') || 'gunduz', false); tb.addEventListener('click', function () { temaYaz(kok.getAttribute('data-tema') === 'gece' ? 'gunduz' : 'gece', true); }); }

  /* ---------------------------------------------------------------- menü */
  var acik = null;
  function kapat() { if (!acik) return; acik.setAttribute('aria-expanded', 'false'); $(acik.getAttribute('aria-controls')).hidden = true; acik = null; }
  [].forEach.call(document.querySelectorAll('.menu-d'), function (d) {
    d.addEventListener('click', function (e) {
      e.stopPropagation(); var buydu = acik === d; kapat();
      if (!buydu) { d.setAttribute('aria-expanded', 'true'); $(d.getAttribute('aria-controls')).hidden = false; acik = d; }
    });
  });
  document.addEventListener('click', function (e) { if (acik && !e.target.closest('.menu-g')) kapat(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (acik) { var d = acik; kapat(); d.focus(); } else cekmeceKapat(); } });
  var cek = $('cekmece'), cekAc = $('menuAc');
  function cekmeceKapat() { if (!cek || cek.hidden) return; cek.hidden = true; kok.style.overflow = ''; cekAc.setAttribute('aria-expanded', 'false'); cekAc.focus(); }
  if (cek && cekAc) {
    cekAc.addEventListener('click', function () { cek.hidden = false; kok.style.overflow = 'hidden'; cekAc.setAttribute('aria-expanded', 'true'); $('menuKapat').focus(); });
    $('menuKapat').addEventListener('click', cekmeceKapat);
    cek.addEventListener('click', function (e) { if (e.target.closest('a')) { cek.hidden = true; kok.style.overflow = ''; cekAc.setAttribute('aria-expanded', 'false'); } });
  }

  /* ---------------------------------------------------------------- canlı rüzgâr */
  var rz = $('rz');
  if (rz) (function () {
    /* Güç: Cp yaklaşımı, /ruzgar/ sayfasındaki N117 güç eğrisiyle yoğunluk düzeltmeli karşılaştırmada ±%1 içinde;
       anma gücü 3.000 kW'ı aşmaz. Devir: uç hız oranı 8, 7,9–14,1 d/dk işletme aralığına sıkıştırılır. */
    var ALAN = Math.PI * 116.8 * 116.8 / 4, YARICAP = 58.4;
    var YONLER = ['K', 'KKD', 'KD', 'DKD', 'D', 'DGD', 'GD', 'GGD', 'G', 'GGB', 'GB', 'BGB', 'B', 'BKB', 'KB', 'KKB'];
    function guc(v, rho) {
      if (v < 3 || v > 25) return 0;
      var x = (v - 3) / 3.5, cp = v >= 6.5 ? 0.452 : 0.10 + (0.452 - 0.10) * (3 * x * x - 2 * x * x * x);
      var ham = 0.5 * rho * ALAN * v * v * v * cp / 1000;
      return ham / Math.pow(1 + Math.pow(ham / 3000, 6), 1 / 6);
    }
    function devir(v) { if (v < 3 || v > 25) return 0; return Math.max(7.9, Math.min(14.1, (8 * v / YARICAP) * 60 / (2 * Math.PI))); }
    function yogunluk(sic, bas) { var p = bas * 100 * Math.exp(-9.80665 * 120 / (287.05 * (sic + 273.15))); return p / (287.05 * (sic - 0.78 + 273.15)); }
    function vg(x, n) { return x.toFixed(n).replace('.', ','); }

    /* Sayılar doğrudan yazılır (sayaç efekti yok): arka plandaki sekmede kare gelmeyince ara değer (0,0) ekranda
       kalıp yanlış veri gibi okunuyordu. */
    function yaz(id, x, n) { var el = $(id); if (el) el.textContent = isFinite(x) ? vg(x, n) : '–'; }

    /* güç eğrisi (SVG): modellenmiş eğri + şu anki çalışma noktası */
    /* dar ekranda çizim alanı küçülür ki yazılar okunaklı kalsın (SVG ölçeklenince 13 px yazı 7 px'e düşüyordu) */
    var EW = 640, EH = 320, EL = 46, ER = 18, ET = 18, EB = 38, SW = 640, SH = 150, sonEgri = null, sonSaat = null;
    function olcek() { var dar = rz.clientWidth < 560; EW = SW = dar ? 370 : 640; EH = dar ? 280 : 320; SH = dar ? 150 : 150; EL = dar ? 34 : 46; ER = dar ? 10 : 18; }
    function ex(v) { return EL + v / 26 * (EW - EL - ER); }
    function ey(mw) { return EH - EB - mw / 3.2 * (EH - ET - EB); }
    function egriCiz(rho, v, kw) {
      var s = $('rzEgri'); if (!s) return; var h = '', d = '', i; sonEgri = [rho, v, kw]; olcek(); s.setAttribute('viewBox', '0 0 ' + EW + ' ' + EH);
      for (i = 1; i <= 3; i++) h += '<line class="egri-izgara" x1="' + EL + '" x2="' + (EW - ER) + '" y1="' + ey(i) + '" y2="' + ey(i) + '"/><text class="egri-yazi" x="' + (EL - 8) + '" y="' + (ey(i) + 4) + '" text-anchor="end">' + i + '</text>';
      for (i = 0; i <= 25; i += 5) h += '<line class="egri-eksen" x1="' + ex(i) + '" x2="' + ex(i) + '" y1="' + ey(0) + '" y2="' + (ey(0) + 5) + '"/><text class="egri-yazi" x="' + ex(i) + '" y="' + (ey(0) + 22) + '" text-anchor="middle">' + i + '</text>';
      h += '<text class="egri-yazi" x="' + (EW - ER) + '" y="' + (ey(0) + 36) + '" text-anchor="end">m/s</text><text class="egri-yazi" x="' + (EL - 8) + '" y="' + (ET - 4) + '" text-anchor="end">MW</text>';
      d = 'M' + ex(3).toFixed(1) + ' ' + ey(0).toFixed(1);
      for (var q = 3; q <= 25.001; q += 0.25) d += 'L' + ex(q).toFixed(1) + ' ' + ey(guc(q, rho) / 1000).toFixed(1);
      h += '<path class="egri-alan" d="' + d + 'L' + ex(25).toFixed(1) + ' ' + ey(0).toFixed(1) + 'Z"/>';
      h += '<path class="egri-cizgi" d="M' + ex(0) + ' ' + ey(0) + 'L' + d.slice(1) + 'L' + ex(25).toFixed(1) + ' ' + ey(0).toFixed(1) + 'L' + ex(26) + ' ' + ey(0) + '"/>';
      h += '<path class="egri-eksen" d="M' + EL + ' ' + ET + 'V' + ey(0) + 'H' + (EW - ER) + '"/>';
      h += (isFinite(v) && v < 6.5 ? '' : '<text class="egri-yazi" x="' + ex(5.5).toFixed(1) + '" y="' + (ey(0) - 9) + '">3 m/s altında üretim yok</text>') + '<text class="egri-yazi" x="' + (ex(25) - 6) + '" y="' + (ey(1.5)) + '" text-anchor="end">devreden çıkma 25</text>';
      if (isFinite(v)) {
        var px = ex(Math.min(26, v)), py = ey(kw / 1000), sol = px > EW * 0.62;
        h += '<path class="egri-iz" d="M' + px.toFixed(1) + ' ' + ey(0) + 'V' + py.toFixed(1) + 'H' + EL + '"/><circle class="egri-nokta" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="6.5"/>';
        h += '<text class="egri-deger" x="' + (px + (sol ? -12 : 12)).toFixed(1) + '" y="' + (py - 12).toFixed(1) + '"' + (sol ? ' text-anchor="end"' : '') + '>' + vg(v, 1) + ' m/s, ' + vg(kw / 1000, 2) + ' MW</text>';
      }
      s.innerHTML = h;
      s.setAttribute('aria-label', isFinite(v) ? 'Modellenmiş N117/3000 güç eğrisi. Şu anki tahmin: ' + vg(v, 1) + ' m/s rüzgârda ' + vg(kw / 1000, 2) + ' megavat.' : 'Modellenmiş N117/3000 güç eğrisi: 3 m/s’de devreye girer, yaklaşık 12 m/s’de 3 megavata ulaşır, 25 m/s’de devreden çıkar.');
    }
    /* önümüzdeki 24 saat: saatlik 120 m rüzgâr tahmini */
    function saatCiz(h) {
      var s = $('rzSaat'), kutu = $('rzSaatKutu'); if (!s || !h || !h.time || !h.wind_speed_120m) return null; sonSaat = h; olcek(); s.setAttribute('viewBox', '0 0 ' + SW + ' ' + SH);
      var simdi = Date.now(), i0 = 0, i, v = [], sa = [], top = 0, n = 0;
      for (i = 0; i < h.time.length; i++) if (new Date(h.time[i] + ':00+03:00').getTime() <= simdi) i0 = i;
      for (i = i0; i < Math.min(h.time.length, i0 + 24); i++) {
        var x = +h.wind_speed_120m[i]; if (!isFinite(x)) continue; v.push(x); sa.push(String(h.time[i]).slice(11, 16));
        var t = +(h.temperature_2m || [])[i], p = +(h.pressure_msl || [])[i];
        top += guc(x, isFinite(t) && isFinite(p) ? yogunluk(t, p) : 1.225) / 3000; n++;
      }
      if (v.length < 12) return null;
      var SL = EL, SR = ER, ST = 12, SB = 26, mx = Math.max(16, Math.ceil(Math.max.apply(0, v) / 4) * 4), bw = (SW - SL - SR) / v.length, out = '';
      function sy(m) { return SH - SB - m / mx * (SH - ST - SB); }
      for (i = 0; i < v.length; i++) {
        out += '<rect class="saat-cubuk' + (v[i] < 3 || v[i] > 25 ? ' yok' : '') + '" x="' + (SL + i * bw + 1.5).toFixed(1) + '" y="' + sy(v[i]).toFixed(1) + '" width="' + (bw - 3).toFixed(1) + '" height="' + Math.max(1, sy(0) - sy(v[i])).toFixed(1) + '"/>';
        if (i % 6 === 0) out += '<text class="egri-yazi" x="' + (SL + i * bw + 1.5).toFixed(1) + '" y="' + (SH - 6) + '">' + sa[i] + '</text>';
      }
      out += '<path class="egri-iz" d="M' + SL + ' ' + sy(3).toFixed(1) + 'H' + (SW - SR) + '"/><text class="egri-yazi" x="' + (SL - 8) + '" y="' + (sy(3) + 4).toFixed(1) + '" text-anchor="end">3</text>';
      out += '<text class="egri-yazi" x="' + (SL - 8) + '" y="' + (sy(mx) + 10).toFixed(1) + '" text-anchor="end">' + mx + '</text><path class="egri-eksen" d="M' + SL + ' ' + sy(0) + 'H' + (SW - SR) + '"/>';
      s.innerHTML = out; if (kutu) kutu.hidden = false;
      s.setAttribute('aria-label', 'Önümüzdeki ' + v.length + ' saatin 120 metredeki rüzgâr tahmini: en düşük ' + vg(Math.min.apply(0, v), 1) + ', en yüksek ' + vg(Math.max.apply(0, v), 1) + ' metre bölü saniye.');
      return n >= 12 ? top / n : null;
    }

    var cekilen = 0, veriSaati = '', veriZamani = 0, durum = 'bos', istekNo = 0, hataSay = 0, tekrarZ = 0, elle = false;
    function zamanYaz() {
      var z = $('rzZaman'); if (!z) return;
      if (!cekilen) { z.textContent = durum === 'hata' ? 'Canlı rüzgâr verisi alınamadı. Bağlantıyı kontrol edip yeniden deneyin.' : 'Tahmin alınıyor…'; return; }
      var sn = Math.max(0, Math.round((Date.now() - cekilen) / 1000)), eski = (veriZamani && Date.now() - veriZamani > 2 * 3600 * 1000) || durum === 'eski';
      rz.setAttribute('data-veri', eski ? 'eski' : 'var');
      z.textContent = (durum === 'eski' ? 'Son başarılı veri; yenileme başarısız. ' : '') + (veriSaati ? 'Tahmin adımı ' + veriSaati + (eski ? ' (eski veri)' : '') + ', ' : '') + (sn < 5 ? 'az önce' : sn < 60 ? sn + ' sn önce' : Math.floor(sn / 60) + ' dk önce') + ' alındı.';
    }
    function isle(d) {
      var c = d && d.current; if (!c) throw 0;
      var v = +c.wind_speed_120m, yon = +c.wind_direction_120m, sic = +c.temperature_2m, bas = +c.pressure_msl;
      if (!isFinite(v)) throw 0;
      var rho = isFinite(sic) && isFinite(bas) ? yogunluk(sic, bas) : 1.225, dv = devir(v), kw = guc(v, rho);
      yaz('rzHiz', v, 1); yaz('rzRho', rho, 2); yaz('rzDevir', dv, 1); yaz('rzGuc', kw / 1000, 2);
      if (isFinite(yon)) { $('rzYon').textContent = Math.round(yon) + '°'; $('rzYonAd').textContent = YONLER[Math.round(yon / 22.5) % 16]; $('rzOk').style.transform = 'rotate(' + (yon + 180) + 'deg)'; }
      egriCiz(rho, v, kw);
      var kf = saatCiz(d.hourly);
      $('rzKf').textContent = kf === null ? '–' : vg(kf * 100, 0);
      var dr = v < 3 ? 'beklemede' : v > 25 ? 'durdu' : 'uretimde', u = $('rzUyari');
      if (dr === 'uretimde') u.hidden = true;
      else {
        u.querySelector('b').textContent = dr === 'beklemede' ? 'Rüzgâr yetersiz, türbin beklemede.' : 'Fırtına, türbin güvenli duruşta.';
        u.querySelector('span').textContent = dr === 'beklemede'
          ? 'Devreye girme hızı 3 m/s; altında jeneratör şebekeye bağlanmaz, üretim yoktur. Kapaktaki rotor bu durumda çok yavaş döner; bu serbest dönüş bir gösterimdir, ölçüm değildir.'
          : 'Devreden çıkma hızı 25 m/s; üstünde kanatlar rüzgârdan çıkarılır ve rotor durur.';
        u.hidden = false;
      }
      var k = $('kpCanli');
      if (k) { $('kpHiz').textContent = vg(v, 1); $('kpDevirYazi').innerHTML = dr === 'uretimde' ? 'rotor <b>' + vg(dv, 1) + '</b> d/dk' : dr === 'durdu' ? 'fırtına, türbin durdu' : 'türbin beklemede'; k.hidden = false; }
      window.__sonerRuzgar = { v: v, yon: yon, rho: rho, devir: dv, kw: kw, durum: dr, t: Date.now(), veriSaati: c.time || null };
      try { dispatchEvent(new CustomEvent('ss:ruzgar', { detail: window.__sonerRuzgar })); } catch (e) {}
      var vz = c.time ? new Date(c.time + ':00+03:00') : null;
      veriZamani = vz && isFinite(vz.getTime()) ? vz.getTime() : 0; veriSaati = veriZamani ? String(c.time).slice(11, 16) : ''; cekilen = Date.now();
    }
    function dugme(bekliyor) { var b = $('rzYeniden'); if (!b) return; b.disabled = bekliyor; b.textContent = bekliyor ? 'Deneniyor…' : 'Yeniden dene'; b.hidden = !(bekliyor && elle) && durum !== 'hata' && durum !== 'eski'; }
    function cekVeri() {
      var no = ++istekNo; clearTimeout(tekrarZ); dugme(true);
      var kes = 'AbortController' in window ? new AbortController() : null, sure = setTimeout(function () { if (kes) kes.abort(); }, 12000);
      return fetch('/api/ruzgar?s=aliaga', { headers: { accept: 'application/json' }, signal: kes ? kes.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('kaynak'); return r.json(); })
        .then(function (d) { if (no !== istekNo) return; isle(d); hataSay = 0; durum = 'basarili'; })
        .catch(function () {
          if (no !== istekNo) return; hataSay++;
          durum = cekilen ? 'eski' : (hataSay >= 2 || elle ? 'hata' : 'bos');
          if (hataSay <= 3) tekrarZ = setTimeout(cekVeri, [0, 30, 60, 120][hataSay] * 1000);
        })
        .then(function () { clearTimeout(sure); if (no === istekNo) { elle = false; dugme(false); zamanYaz(); } });
    }
    egriCiz(1.225, NaN, 0);
    var genis = rz.clientWidth < 560;
    addEventListener('resize', function () { var g = rz.clientWidth < 560; if (g === genis) return; genis = g; if (sonEgri) egriCiz(sonEgri[0], sonEgri[1], sonEgri[2]); if (sonSaat) saatCiz(sonSaat); });
    $('rzYeniden').addEventListener('click', function () { hataSay = 0; elle = true; cekVeri(); });
    cekVeri(); setInterval(zamanYaz, 1000);
    setInterval(function () { if (!document.hidden) cekVeri(); }, 10 * 60 * 1000);
  })();

  /* ---------------------------------------------------------------- iletişim */
  /* dar ekranda kütüphane grupları açılır kapanır; ilki açık başlar */
  if (matchMedia('(max-width: 600px)').matches) [].forEach.call(document.querySelectorAll('details.kt-g'), function (d, i) { if (i) d.removeAttribute('open'); });

  var kopya = $('epostaKopya');
  if (kopya) kopya.addEventListener('click', function () {
    var adres = kopya.getAttribute('data-adres'), tamam = function () { kopya.textContent = 'Kopyalandı'; setTimeout(function () { kopya.textContent = 'Adresi kopyala'; }, 2200); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(adres).then(tamam, function () { kopya.textContent = adres; });
    else kopya.textContent = adres;
  });
  var form = $('vForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ad = $('vAd'), ep = $('vEposta'), ms = $('vMesaj'), ilk = null;
    function hata(el, hid, metin) { var h = $(hid); h.textContent = metin; h.hidden = !metin; el.setAttribute('aria-invalid', metin ? 'true' : 'false'); if (metin && !ilk) ilk = el; }
    hata(ad, 'vAdH', ad.value.trim() ? '' : 'Adınızı yazın.');
    hata(ep, 'vEpostaH', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(ep.value.trim()) ? '' : 'Size dönebilmem için geçerli bir e-posta adresi yazın.');
    hata(ms, 'vMesajH', ms.value.trim().length >= 10 ? '' : 'Mesajınızı birkaç cümleyle yazın.');
    if (ilk) { ilk.focus(); $('vDurum').textContent = ''; return; }
    var konu = (form.querySelector('input[name="konu"]:checked') || {}).value || 'Genel';
    var govde = ms.value.trim() + '\n\n' + ad.value.trim() + '\n' + ep.value.trim();
    location.href = 'mailto:sonersoylu@yandex.com?subject=' + encodeURIComponent('[' + konu + '] sonersoylu.com üzerinden') + '&body=' + encodeURIComponent(govde);
    $('vDurum').textContent = 'E-posta uygulamanız açılıyor. Açılmazsa adresi kopyalayıp doğrudan yazabilirsiniz.';
  });
})();
