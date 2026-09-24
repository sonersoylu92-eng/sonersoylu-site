/* sonersoylu.com — site içi arama.
   Dizin /assets/arama.json içinde; ilk arama denemesinde bir kez indirilir ve
   servis çalışanı önbelleğinde durduğu için çevrimdışı da çalışır.
   Dizin biçimi: {"k":[kategori adları], "e":[[kategori indeksi, başlık, özet, yol], ...]} */
(function () {
  'use strict';

  var HRF = { 'İ': 'i', 'I': 'i', 'ı': 'i', 'Ç': 'c', 'ç': 'c', 'Ğ': 'g', 'ğ': 'g',
              'Ö': 'o', 'ö': 'o', 'Ş': 's', 'ş': 's', 'Ü': 'u', 'ü': 'u',
              'Â': 'a', 'â': 'a', 'Î': 'i', 'î': 'i', 'Û': 'u', 'û': 'u' };
  function nrm(s) {
    return String(s).replace(/[İIıÇçĞğÖöŞşÜüÂâÎîÛû]/g, function (c) { return HRF[c]; }).toLowerCase();
  }
  function kac(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* İngilizce ya da günlük adla aranınca Türkçe karşılığını da bul (gearbox → dişli kutusu) */
  var ES = {
    gearbox: ['disli kutusu', 'redüktör'], 'gear box': ['disli kutusu'], generator: ['jenerator'], converter: ['konvertor', 'converter'],
    inverter: ['konvertor'], 'main bearing': ['ana yatak'], bearing: ['yatak', 'rulman'], blade: ['kanat'], blades: ['kanat'],
    hub: ['gobek'], nacelle: ['nasel'], tower: ['kule'], brake: ['fren'], coupling: ['kaplin'], shaft: ['mil', 'saft'],
    'main shaft': ['ana mil'], cable: ['kablo'], transformer: ['trafo', 'transformator'], oil: ['yag'], grease: ['gres'],
    temperature: ['sicaklik'], vibration: ['titresim'], sensor: ['sensor'], bolt: ['civata'], torque: ['tork'], tension: ['germe', 'gerdirme'],
    wind: ['ruzgar'], salary: ['maas'], pay: ['maas'], fault: ['ariza'], alarm: ['alarm', 'kod'], encoder: ['enkoder'],
    reduktor: ['disli kutusu'], sanziman: ['disli kutusu'], dinamo: ['jenerator']
  };
  function esler(k) {
    var l = ES[k] || []; var d = [k];
    for (var i = 0; i < l.length; i++) d.push(nrm(l[i]));
    return d;
  }
  var KAT_SIRA = ['Saha notu', 'Sistemler', 'N117 turu', 'Türbin modeli', 'Arıza ağacı', 'Araçlar', 'Kod kütüphanesi', 'Sözlük', 'Eğitim', 'Rehber', 'Sayfa', 'N90 montajı', 'Soru-cevap', 'Asistan'];
  var KAT_AD = { 'Saha notu': 'Saha notları', 'N117 turu': 'N117', 'Türbin modeli': 'Türbin modelleri', 'Araçlar': 'Hesaplayıcılar', 'Sayfa': 'Sayfalar', 'Soru-cevap': 'Soru-cevap' };

  var dizin = null, yukleniyor = null;
  function dizinAl() {
    if (dizin) return Promise.resolve(dizin);
    if (yukleniyor) return yukleniyor;
    yukleniyor = fetch('/assets/arama.json?v=726ee1c8')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        d.e.forEach(function (e) { e[4] = nrm(e[1]); e[5] = nrm(e[2]); });
        dizin = d;
        return d;
      })
      .catch(function () { return null; });
    return yukleniyor;
  }

  function ara(q) {
    if (!dizin) return [];
    var t = nrm(q).trim();
    if (t.length < 2) return [];
    var kel = t.split(/\s+/), sonuc = [];
    if (ES[t]) kel = [t];            // çok kelimelik eş anlamlı (main bearing) tek terim sayılır
    var alt = kel.map(esler);
    for (var i = 0; i < dizin.e.length; i++) {
      var e = dizin.e[i], puan = 0, hepsi = true;
      for (var j = 0; j < kel.length; j++) {
        var al = alt[j], k = kel[j], bi = -1, oi = -1;
        for (var q = 0; q < al.length && bi < 0 && oi < 0; q++) { k = al[q]; bi = e[4].indexOf(k); oi = e[5].indexOf(k); }
        if (bi < 0 && oi < 0) { hepsi = false; break; }
        if (bi === 0) puan += 100;
        else if (bi > 0) puan += (/[^a-z0-9]/.test(e[4].charAt(bi - 1)) ? 60 : 30);
        else puan += (oi === 0 || /[^a-z0-9]/.test(e[5].charAt(oi - 1))) ? 12 : 6;
      }
      if (!hepsi) continue;
      if (e[4] === t) puan += 250;
      if (dizin.w) puan += dizin.w[e[0]] || 0;
      puan -= Math.min(e[4].length, 40) * 0.2;
      sonuc.push([puan, e]);
    }
    sonuc.sort(function (a, b) { return b[0] - a[0]; });
    return sonuc.slice(0, 80).map(function (x) { return x[1]; });
  }

  function isaretle(metin, q) {
    var t = nrm(q).trim(); if (!ES[t]) t = t.split(/\s+/)[0];
    if (!t) return kac(metin);
    var n = nrm(metin), l = esler(t), i = -1;
    for (var z = 0; z < l.length && i < 0; z++) { i = n.indexOf(l[z]); if (i >= 0) t = l[z]; }
    if (i < 0) return kac(metin);
    return kac(metin.slice(0, i)) + '<mark>' + kac(metin.slice(i, i + t.length)) + '</mark>' + kac(metin.slice(i + t.length));
  }

  function ciz(hedef, liste, q) {
    if (!liste.length) { hedef.innerHTML = ''; return; }
    var katman = hedef.id === 'araSonuc', sinir = katman ? 4 : 12, gruplar = {};
    liste.forEach(function (e) { var k = dizin.k[e[0]]; (gruplar[k] = gruplar[k] || []).push(e); });
    var sira = KAT_SIRA.filter(function (k) { return gruplar[k]; });
    Object.keys(gruplar).forEach(function (k) { if (sira.indexOf(k) < 0) sira.push(k); });
    // en iyi eşleşmenin grubu en üstte
    var ilk = dizin.k[liste[0][0]]; sira.splice(sira.indexOf(ilk), 1); sira.unshift(ilk);
    var html = sira.map(function (k) {
      var g = gruplar[k], ad = KAT_AD[k] || k;
      return '<div class="ara-grup" role="group" aria-label="' + kac(ad) + '"><p class="ara-gb" aria-hidden="true"><span>' + kac(ad) + '</span><span>' + g.length + '</span></p>' +
        g.slice(0, sinir).map(function (e) {
          return '<a role="option" aria-selected="false" href="' + kac(e[3]) + '"><span class="b">' + isaretle(e[1], q) + '</span>' +
                 (e[2] ? '<span class="o">' + kac(e[2]) + '</span>' : '') + '</a>';
        }).join('') + '</div>';
    }).join('');
    if (katman) {
      var gizli = 0; sira.forEach(function (k) { gizli += Math.max(0, gruplar[k].length - sinir); });
      if (gizli > 0) html += '<a class="ara-tumu" role="option" aria-selected="false" href="/ara/?q=' + encodeURIComponent(q.trim()) + '"><span class="b">Tüm sonuçları gör · ' + liste.length + '</span></a>';
    }
    hedef.innerHTML = html;
  }


  // ---- üstteki arama katmanı
  var kat = document.getElementById('araKat');
  var giris = document.getElementById('araGiris');
  var cikti = document.getElementById('araSonuc');
  var dug = document.getElementById('araBtn');
  var kapat = document.getElementById('araKapat');
  var sec = -1, sonSonuc = [];

  // boş aramada hızlı erişim: sık aranan konular (tıklayınca aranır)
  var ONERI = ['Dişli kutusu', 'Pitch', 'Yaw', 'Jeneratör', 'GWO', 'Tork', 'Titreşim', 'Converter'];
  var oneri = null;
  if (kat && cikti) {
    oneri = document.createElement('div');
    oneri.className = 'ara-oneri';
    oneri.innerHTML = '<p class="ara-gb"><span>Hızlı erişim</span></p><div class="ara-cip">' +
      ONERI.map(function (o) { return '<button type="button">' + kac(o) + '</button>'; }).join('') +
      '</div><div class="ara-kisa"><a href="/deneyim/">Türbinin içine</a><a href="/saha-notlari/">Saha notları</a><a href="/ariza/">Arıza ağacı</a><a href="/araclar/">Hesaplayıcılar</a><a href="/sozluk/">Sözlük</a></div>';
    cikti.parentNode.insertBefore(oneri, cikti);
    oneri.addEventListener('click', function (e) {
      if (e.target.tagName !== 'BUTTON') return;
      giris.value = e.target.textContent; giris.focus(); yenileGec();
    });
  }
  function yenileGec() { yenile(); }

  function bosluk(el) {
    var t = (el && el.tagName) || '';
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || (el && el.isContentEditable);
  }

  function ac() {
    if (!kat) return;
    kat.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    dizinAl().then(function () { if (giris.value) yenile(); });
    setTimeout(function () { giris.focus(); giris.select(); }, 20);
  }
  function kapa() {
    if (!kat) return;
    kat.hidden = true;
    document.documentElement.style.overflow = '';
    if (dug) dug.focus();
  }
  function yenile() {
    if (oneri) oneri.hidden = giris.value.trim().length >= 2;
    sonSonuc = ara(giris.value);
    sec = -1;
    ciz(cikti, sonSonuc, giris.value);
    var bos = cikti.parentNode.querySelector('.ara-bos');
    if (bos) bos.remove();
    if (giris.value.trim().length >= 2 && !sonSonuc.length) {
      var p = document.createElement('p');
      p.className = 'ara-bos';
      p.textContent = '“' + giris.value.trim() + '” için sonuç yok. Sözlükte, araçlarda, arıza ağacında ve kod kütüphanesinde arıyorum.';
      cikti.parentNode.insertBefore(p, cikti.nextSibling);
      bildir(giris.value.trim());
    }
  }

  var bildirilen = {};
  function bildir(q) {
    if (bildirilen[q] || q.length < 3) return;
    bildirilen[q] = 1;
    clearTimeout(bildir.z);
    bildir.z = setTimeout(function () {
      try {
        fetch('/api/arama', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ q: q, nerede: 'site' }),
        }).catch(function () {});
      } catch (e) {}
    }, 1200);
  }

  function gez(yon) {
    var a = cikti.querySelectorAll('a');
    if (!a.length) return;
    if (sec >= 0 && a[sec]) { a[sec].classList.remove('sec'); a[sec].setAttribute('aria-selected', 'false'); }
    sec = (sec + yon + a.length + 1) % (a.length + 1) - 1;
    if (sec < 0) sec = yon > 0 ? 0 : a.length - 1;
    if (sec >= a.length) sec = 0;
    a[sec].classList.add('sec'); a[sec].setAttribute('aria-selected', 'true');
    a[sec].scrollIntoView({ block: 'nearest' });
  }

  if (dug) dug.addEventListener('click', ac);
  if (kapat) kapat.addEventListener('click', kapa);
  if (kat) kat.addEventListener('click', function (e) { if (e.target === kat) kapa(); });
  if (giris) {
    giris.addEventListener('input', yenile);
    giris.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); gez(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); gez(-1); }
      else if (e.key === 'Enter') {
        var a = cikti.querySelectorAll('a');
        if (sec >= 0 && a[sec]) { e.preventDefault(); location.href = a[sec].getAttribute('href'); }
        else if (a.length) { e.preventDefault(); location.href = a[0].getAttribute('href'); }
      }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (!kat) return;
    if (e.key === 'Escape' && !kat.hidden) { kapa(); return; }
    if (kat.hidden && !bosluk(document.activeElement)) {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); ac(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); ac(); }
    }
  });
  // fareyi menü düğmesine getirince dizini önden indir
  if (dug) dug.addEventListener('pointerenter', dizinAl, { once: true });

  // ---- /ara/ sayfası
  var sayfaGiris = document.getElementById('araSayfaGiris');
  if (sayfaGiris) {
    var sayfaCikti = document.getElementById('araSayfaSonuc');
    var sayfaBilgi = document.getElementById('araSayfaBilgi');
    var ilk = new URLSearchParams(location.search).get('q') || '';
    function sayfaYenile() {
      var q = sayfaGiris.value;
      var r = ara(q);
      ciz(sayfaCikti, r, q);
      if (q.trim().length < 2) sayfaBilgi.textContent = 'En az iki harf yazın.';
      else if (!r.length) { sayfaBilgi.textContent = '“' + q.trim() + '” için sonuç yok.'; bildir(q.trim()); }
      else sayfaBilgi.textContent = r.length + ' sonuç';
      var u = new URL(location.href);
      if (q) u.searchParams.set('q', q); else u.searchParams.delete('q');
      history.replaceState(null, '', u.toString());
    }
    dizinAl().then(function () {
      if (ilk) { sayfaGiris.value = ilk; }
      sayfaYenile();
      sayfaGiris.focus();
    });
    sayfaGiris.addEventListener('input', sayfaYenile);
  }

  // ---- açılır menüler
  var ddler = [].slice.call(document.querySelectorAll('nav.desk .dd'));
  function hepsiniKapat(haric) {
    ddler.forEach(function (o) {
      if (o.dd === haric) return;
      o.classList.remove('acik');
      o.__sebep = null;
      var ob = o.querySelector('.ddb');
      if (ob) ob.setAttribute('aria-expanded', 'false');
    });
  }
  ddler.forEach(function (dd) {
    var b = dd.querySelector('.ddb');
    if (!b) return;
    dd.__sebep = null;
    function set(a, sebep) {
      dd.classList.toggle('acik', a);
      dd.__sebep = a ? sebep : null;
      b.setAttribute('aria-expanded', String(a));
    }
    function hover() { return matchMedia('(hover:hover)').matches; }
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      // fareyle zaten açılmışsa tıklama onu "sabitler"; ikinci tıklama kapatır
      var kapat = dd.__sebep === 'tik';
      hepsiniKapat();
      set(!kapat, 'tik');
    });
    dd.addEventListener('pointerenter', function () {
      if (hover() && dd.__sebep !== 'tik') { hepsiniKapat(); set(true, 'hover'); }
    });
    dd.addEventListener('pointerleave', function () {
      if (hover() && dd.__sebep === 'hover') set(false);
    });
    dd.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); b.focus(); } });
    dd.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!dd.contains(document.activeElement) && dd.__sebep !== 'tik') set(false);
      }, 0);
    });
  });
  document.addEventListener('click', function () { hepsiniKapat(); });
})();
