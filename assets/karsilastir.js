/* Türbin karşılaştırma tezgâhı: değerler sitenin model sayfalarından (onların kaynakları üretici ve yayımlanmış veri).
 * "hesap" işaretli satırlar sayfadaki çaptan hesaplanmıştır; sayfada olmayan bilgi "doğrulanacak" olarak gösterilir. */
(function () {
  'use strict';
  var D = '—';
  var M = {
    n90: { ad: 'Nordex N90/2500', ure: 'Nordex', u: '/n90/', cap: 90, aktarma: 'disli',
      v: { guc: '2.500 kW', cap: '90 m', alan: '6.362 m²', ozgul: '393 W/m²', gobek: '70 · 75 · 80 · 100 · 120 m', devir: 'maks. 18,1 d/dk',
        aktarma: 'Dişli kutulu: çok kademeli planet + 1 alın kademesi', jen: 'Çift beslemeli asenkron · 660 V', konv: 'IGBT konvertör, rotor devresinde (çift beslemeli düzen)',
        pitch: 'Elektrikli, kanat başına bağımsız; enerji depolamalı acil bayrak', yaw: '2 asenkron motor, 4 kademeli planet redüktör · ≈0,5°/s',
        bakim: 'Dişli kutusu yağ sıcaklığı ve partikül sayımı (sayfada ayrı bakım listesi yok)' },
      kaynak: 'N90 sayfası (wind-turbine-models.com verileri)' },
    n117: { ad: 'Nordex N117/3000 Delta', ure: 'Nordex', u: '/n117/', cap: 116.8, aktarma: 'disli',
      v: { guc: '3.000 kW', cap: '116,8 m', alan: '10.715 m²', ozgul: '280 W/m²', gobek: '91 / 120 m çelik · 141 m hibrit', devir: '7,9 – 14,1 d/dk',
        aktarma: 'Dişli kutulu: 3 kademe, planet–planet–helisel; üç nokta yataklama', jen: 'Çift beslemeli asenkron · 660 V', konv: 'Kısmi konvertör, rotor devresinde',
        pitch: 'Kanat başına tahrik, redüktör ve pinyon; UPS yedekli', yaw: 'Redüktörlü motorlar ve fren kaliperleri (motor sayısı sayfada yok)',
        bakim: 'Yağ analizi ve endoskopi, slip ring kömürleri, pitch yatağı yağlaması, konvertör filtreleri' },
      kaynak: 'N117 turu (Nordex SE ve wind-turbine-models.com verileri)' },
    e82: { ad: 'Enercon E-82 E2', ure: 'Enercon', u: '/turbinler/enercon/e82/', cap: 82, aktarma: 'dogrudan',
      v: { guc: '2,0 / 2,3 MW (E2) · 3,0 MW sınıfı E4 ayrı varyant', cap: '82 m', alan: '≈ 5.281 m² (hesap)', ozgul: '≈ 436 W/m² (2,3 MW, hesap)', gobek: '70 – 138 m', devir: '6 – 19,5 d/dk (E2)',
        aktarma: 'Dişli kutusuz: rotor halka jeneratörü doğrudan döndürür', jen: 'Doğrudan tahrikli, çok kutuplu senkron halka jeneratör', konv: 'Enercon konvertörü; değişken devirli doğrudan tahrikte güç konvertör üzerinden şebekeye verilir',
        pitch: 'Kanat başına bağımsız, acil durum beslemeli', yaw: 'Ayar dişlileri, yüke bağlı sönümleme',
        bakim: 'Jeneratör soğutma hava yolları ve filtreler, pitch acil durum beslemesi testi, yaw dişlileri, konvertör soğutması' },
      kaynak: 'E-82 model rehberi (ENERCON ürün bilgisi)' },
    v126: { ad: 'Vestas V126-3.45 MW', ure: 'Vestas', u: '/turbinler/vestas/v126/', cap: 126, aktarma: 'disli',
      v: { guc: '3,45 MW (ilk sürüm 3,3 MW)', cap: '126 m', alan: '12.469 m²', ozgul: '≈ 277 W/m² (hesap)', gobek: '87 / 117 / 137 / 147 / 149 / 166 m', devir: null,
        aktarma: 'Dişli kutulu: 2 planet + 1 helis kademe', jen: null, konv: 'Tam ölçekli: gücün tamamı konvertörden geçer',
        pitch: 'Hidrolik, kanat başına bir silindir; akümülatörlü', yaw: null,
        bakim: 'Konvertör soğutması, dişli kutusu yağ sıcaklığı ve filtre, hidrolik sızıntı ve akümülatör ön dolumu, kanat yatağı' },
      kaynak: 'V126 model rehberi (Vestas ürün sayfası)' }
  };
  var SATIR = [['guc', 'Anma gücü'], ['cap', 'Rotor çapı'], ['alan', 'Süpürme alanı'], ['ozgul', 'Özgül güç'], ['gobek', 'Göbek yükseklikleri'], ['devir', 'Rotor devri'],
    ['aktarma', 'Güç aktarma'], ['jen', 'Jeneratör'], ['konv', 'Konvertör'], ['pitch', 'Pitch'], ['yaw', 'Yaw'], ['bakim', 'Sahada bakım odağı']];
  var $ = function (s) { return document.querySelector(s); };
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var A = 'n117', B = 'e82';
  function hucre(x) { return x == null ? '<td class="kr-dog">doğrulanacak<small>Model sayfasında verilmedi; varyanta göre değişir.</small></td>' : '<td>' + esc(x).replace(/\((hesap)\)/, '<em>($1)</em>') + '</td>'; }
  function rotorSvg() {
    var a = M[A], b = M[B], W = 640, H = 300, olcek = (H - 40) / Math.max(a.cap, b.cap);
    var parca = function (m, cx, renk) {
      var r = m.cap * olcek / 2, cy = 20 + (Math.max(a.cap, b.cap) * olcek) / 2;
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(1) + '" class="kr-disk ' + renk + '"/>' +
        [0, 120, 240].map(function (d) { var t = (d - 90) * Math.PI / 180; return '<line class="kr-kanat ' + renk + '" x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(t) * r).toFixed(1) + '" y2="' + (cy + Math.sin(t) * r).toFixed(1) + '"/>'; }).join('') +
        '<circle cx="' + cx + '" cy="' + cy + '" r="4" class="kr-gobek"/>' +
        '<text x="' + cx + '" y="' + (H - 4) + '" text-anchor="middle" class="kr-et">' + esc(m.ad.split(' ').slice(0, 2).join(' ')) + ' · Ø ' + String(m.cap).replace('.', ',') + ' m</text>';
    };
    var insan = 1.8 * olcek;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Rotor çapları aynı ölçekte: ' + esc(a.ad) + ' ' + a.cap + ' metre, ' + esc(b.ad) + ' ' + b.cap + ' metre">' +
      parca(a, W * 0.28, 'kr-a') + parca(b, W * 0.72, 'kr-b') +
      '<text x="' + (W - 8) + '" y="16" text-anchor="end" class="kr-et">Fark: ' + Math.abs(a.cap - b.cap).toFixed(1).replace('.', ',') + ' m çap · süpürme alanı oranı ' + (Math.pow(Math.max(a.cap, b.cap) / Math.min(a.cap, b.cap), 2)).toFixed(2).replace('.', ',') + '×</text></svg>';
  }
  function aktarmaSvg(m, renk) {
    var dis = m.aktarma === 'disli';
    var kutu = function (x, w, ad, alt) { return '<g><rect x="' + x + '" y="40" width="' + w + '" height="56" class="kr-kutu ' + renk + '"/><text x="' + (x + w / 2) + '" y="64" text-anchor="middle" class="kr-ka">' + ad + '</text><text x="' + (x + w / 2) + '" y="82" text-anchor="middle" class="kr-et">' + alt + '</text></g>'; };
    var mil = function (x1, x2, hizli) { return '<line x1="' + x1 + '" y1="68" x2="' + x2 + '" y2="68" class="kr-mil' + (hizli ? ' kr-hizli' : '') + '"/>'; };
    var g = dis ? kutu(0, 92, 'Rotor', 'düşük devir') + mil(92, 132) + kutu(132, 100, 'Dişli kutusu', 'devri artırır') + mil(232, 272, true) + kutu(272, 110, 'Jeneratör', 'yüksek devir') + mil(382, 412, false).replace('kr-mil', 'kr-elk') + kutu(412, 108, 'Konvertör', m.v.konv && /Tam/.test(m.v.konv) ? 'tam güç' : 'rotor devresi')
                : kutu(0, 92, 'Rotor', 'düşük devir') + mil(92, 132) + kutu(132, 150, 'Halka jeneratör', 'rotorla aynı devir') + mil(282, 322, false).replace('kr-mil', 'kr-elk') + kutu(322, 110, 'Konvertör', 'tam güç');
    return '<figure class="kr-akt"><figcaption><b>' + esc(m.ad) + '</b> · ' + (dis ? 'dişli kutulu' : 'doğrudan tahrik (dişli kutusuz)') + '</figcaption><svg viewBox="0 0 530 110" role="img" aria-label="' + esc(m.ad + ' güç aktarma şeması: ' + m.v.aktarma) + '">' + g + '</svg></figure>';
  }
  function ciz() {
    var a = M[A], b = M[B];
    $('#krTablo').innerHTML = '<table class="kr-tablo"><caption class="gorsel-gizli">' + esc(a.ad + ' ile ' + b.ad + ' karşılaştırması') + '</caption><thead><tr><th scope="col">Özellik</th><th scope="col"><a href="' + a.u + '">' + esc(a.ad) + '</a></th><th scope="col"><a href="' + b.u + '">' + esc(b.ad) + '</a></th></tr></thead><tbody>' +
      SATIR.map(function (s) { return '<tr><th scope="row">' + s[1] + '</th>' + hucre(a.v[s[0]]) + hucre(b.v[s[0]]) + '</tr>'; }).join('') +
      '<tr class="kr-kay"><th scope="row">Kaynak</th><td>' + esc(a.kaynak) + '</td><td>' + esc(b.kaynak) + '</td></tr></tbody></table>';
    $('#krRotor').innerHTML = rotorSvg();
    $('#krAktarma').innerHTML = aktarmaSvg(a, 'kr-a') + aktarmaSvg(b, 'kr-b');
    $('#krFark').textContent = a.aktarma === b.aktarma ? (a.aktarma === 'disli' ? 'İki model de dişli kutulu: farklar kademe düzeninde, jeneratör ve konvertör tipinde.' : 'İki model de dişli kutusuz.')
      : 'Bir model dişli kutulu, diğeri doğrudan tahrikli: dişli kutulu makinede yağ, dişli ve yüksek devirli jeneratör bakımı öne çıkar; doğrudan tahrikte dişli kutusu yoktur, büyük ve ağır halka jeneratörün soğutması ve konvertör öne çıkar.';
    try { history.replaceState(null, '', '?a=' + A + '&b=' + B); } catch (e) {}
    $('#krA').value = A; $('#krB').value = B;
  }
  var p = new URLSearchParams(location.search);
  if (M[p.get('a')]) A = p.get('a'); if (M[p.get('b')] && p.get('b') !== A) B = p.get('b');
  var sec = Object.keys(M).map(function (k) { return '<option value="' + k + '">' + esc(M[k].ad) + '</option>'; }).join('');
  $('#krA').innerHTML = sec; $('#krB').innerHTML = sec;
  $('#krA').addEventListener('change', function () { A = this.value; if (A === B) B = Object.keys(M).filter(function (k) { return k !== A; })[0]; ciz(); });
  $('#krB').addEventListener('change', function () { B = this.value; if (A === B) A = Object.keys(M).filter(function (k) { return k !== B; })[0]; ciz(); });
  $('#krDegis').addEventListener('click', function () { var t = A; A = B; B = t; ciz(); });
  ciz();
})();
