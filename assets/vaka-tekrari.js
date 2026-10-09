/* Vaka tekrarı: saha notlarındaki üç vakayı altı adımda yeniden oynatır. Değerler vaka sayfalarındaki anlatıma aittir. */
(function () {
  'use strict';
  var VAKA = {
    pitch: {
      no: 'Vaka 01', ad: 'Pitch motor yüksek akım', model: 'Nordex N117/3000', yer: 'Bergama', sistem: 'Pitch', u: '/saha-notlari/pitch-motor-yuksek-akim/',
      belirti: 'Sabah açılışta pitch sistemi devreye giremiyor. Kontrol sisteminde "Pitch motor phase current high" alarmı; A kanadının motoru çalışmaya çalışıyor ama kanadı zor hareket ettiriyor.',
      olcum: [
        ['Motor akımı', '18 A', 'Normal 12 A, alarm eşiği 15 A'],
        ['Sargı direnci (faz-faz)', '8,1 – 8,3 Ω', 'Üç faz dengeli'],
        ['Kanat konum sensörleri', 'Beklenen değerde', 'Üç kanatta da aynı'],
        ['Elle döndürme', 'A kanadı sıkı', 'B ve C kanadı rahat'],
        ['Redüktör yağı', 'Minimumda', 'Koyu, yanık kokulu, metal partikül']
      ],
      trend: { tur: 'olcu', baslik: 'Pitch motor akımı, yaklaşık son 8 ay', birim: 'A', x: ['1', '2', '3', '4', '5'], xAd: 'Okuma sırası (eşit aralık varsayıldı)',
        seri: [{ ad: 'Motor akımı', d: [11, 12.5, 14, 16, 18] }], esik: [{ d: 15, ad: 'Alarm 15 A' }, { d: 12, ad: 'Normal 12 A' }],
        not: 'Vaka sayfasında verilen beş değer (11 → 12,5 → 14 → 16 → 18 A). Okumalar arası süre sayfada belirtilmediği için eşit aralıkla çizildi.' },
      soru: { s: 'Bu ölçümlere göre ilk hangi olasılık elenir?', c: [
        ['Motor sargısında kısa devre', true, 'Doğru. Üç faz arası direnç 8,1–8,3 Ω ile dengeli; sargı arızası bu tabloyu vermez.'],
        ['Redüktörde mekanik sıkışma', false, 'Henüz elenmez: A kanadının elle sıkı dönmesi ve yağ bulguları tam da bunu destekliyor.'],
        ['Yüksek akım yüke bağlı', false, 'Elenmez: akım gerçekten yüksek ve aylardır artıyor; yük artışı en güçlü açıklama.']] },
      hipotez: [
        ['Sargı arızası', 'elendi', 'Faz dirençleri dengeli.'],
        ['Konum sensörü hatası', 'elendi', 'Üç kanatta da beklenen çıkış.'],
        ['Kontrol / sürücü hatası', 'zayıf', 'Akım ölçümle de yüksek; sorun yükte.'],
        ['Redüktörde yağlama ve aşınma', 'güçlü', 'Elle sıkı dönen kanat, eksik ve yanık yağ, metal partikül, aylarca artan akım.']],
      kok: 'Redüktör gövdesindeki küçük bir sızıntı yağı aylar içinde eksiltmiş; dişliler yetersiz yağla çalışıp aşınmış, sürtünme arttıkça motor akımı yükselmiş ve sonunda motor kanadı çeviremez olmuş.',
      ders: ['Periyodik bakımda yağ seviyesi kontrolü atlanmış; prosedürde yazan adım yapılmamış.', 'Akım trendi aylar önce sinyal veriyordu: eşiğe değil eğime bakmak gerekir.', 'Ölçümden önce elle döndürme testi, sorunun hangi kanatta olduğunu dakikalar içinde gösterdi.']
    },
    disli: {
      no: 'Vaka 02', ad: 'Dişli kutusu sıcaklığı rüzgârla artıyor', model: 'Vestas V126', yer: 'Aliağa', sistem: 'Dişli kutusu', u: '/saha-notlari/disli-kutusu-sicaklik/',
      belirti: '10 m/s üstünde dişli kutusu sıcaklığı 75 °C\'yi aşıyor; uyarı geliyor ama türbin durmuyor. Aynı sahadaki türbinler 60–65 °C\'de, bu türbin 78–82 °C\'de. Alarm eşiği 85 °C.',
      olcum: [
        ['Yağ seviyesi', 'Minimumun altında', 'Dipstick ile, durdurup bekledikten sonra'],
        ['Yağ görünümü', 'Koyu, yapışkan', 'Oksidasyon şüphesi; numune laboratuvara'],
        ['Hava filtresi çevresi', 'Yağlı toz', 'Etkin ve uzun süreli sızıntı izi'],
        ['Sıcaklık: IR / SCADA', '72 °C / 78 °C', 'Fark 6 °C; sensör tek başına açıklamaz']
      ],
      trend: { tur: 'olcu', baslik: 'Günlük ortalama dişli kutusu sıcaklığı ve rüzgâr', birim: '°C', x: ['−20 gün', '−10 gün', '−3 gün', 'Bugün'], xAd: 'Gün',
        seri: [{ ad: 'Dişli kutusu °C', d: [55, 62, 76, 79] }, { ad: 'Rüzgâr m/s ×5', d: [40, 45, 55, 60], ikincil: true }], esik: [{ d: 85, ad: 'Alarm 85 °C' }],
        not: 'Vaka sayfasındaki tablodan: rüzgâr 8 → 12 m/s, sıcaklık 55 → 79 °C. Rüzgâr çizgisi aynı eksende görülsün diye 5 ile çarpıldı (8 m/s = 40).' },
      soru: { s: 'Sıcaklık artışını en iyi hangisi açıklar?', c: [
        ['Sadece daha yüksek rüzgâr', false, 'Tek başına değil: rüzgâr %50 artarken sıcaklık farkı orantısız sıçramış; komşu türbinler aynı rüzgârda 60–65 °C.'],
        ['Sensör kalibrasyonu', false, 'IR ile 6 °C fark var ama bu, komşulardan 15 °C yükseği açıklamaz.'],
        ['Düşük yağ ve sızıntı', true, 'Doğru. Seviye minimumun altında, filtre çevresinde yağlı toz: yağ filmi incelince sürtünme ısısı artar.']] },
      hipotez: [
        ['Yüksek yük (rüzgâr)', 'zayıf', 'Komşu türbinler aynı rüzgârda serin.'],
        ['Sensör kayması', 'zayıf', 'IR ile fark 6 °C; tabloyu açıklamaz.'],
        ['Soğutma devresi', 'açık', 'Vaka sayfasında ayrıca test edilmemiş.'],
        ['Yağ eksikliği / sızıntı', 'güçlü', 'Düşük seviye, koyu yağ, yağlı toz izi.']],
      kok: 'Mil geçişindeki keçe sertleşip sızdırmaya başlamış; yağ seviyesi düştükçe dişli temasında sürtünme ısısı artmış ve sıcaklık rüzgâr yüküyle orantısız yükselmiş.',
      ders: ['Sıcaklığı tek başına değil, aynı rüzgârdaki komşu türbinlerle birlikte okumak.', 'Seviye kadar yağın kendisine bakmak: numune ve laboratuvar analizi.', 'Sızıntı izini hava filtresi ve keçe çevresinde aramak.']
    },
    yaw: {
      no: 'Vaka 03', ad: 'Yaw salınımı (hunting)', model: 'Enercon E92', yer: 'Bergama', sistem: 'Yaw', u: '/saha-notlari/yaw-salinimi/',
      belirti: 'Nasel rüzgâra dönerken ileri geri salınıyor; rotor üretiyor ama yaw açısı sürekli değişiyor ve ritmik bir "tak tak" sesi var.',
      olcum: [
        ['Yaw açısı', '±18° salınım', '1–2 saniyelik periyot'],
        ['Test komutu', 'Hedef 45°, durdu 38°', 'Motor çalışıyor ama zorlanıyor'],
        ['Yaw motor akımı', '12 A', 'Normal 8 A'],
        ['Durdurma sonrası', '2 sn içinde +5° kayma', 'Mekanik sürüklenme belirtisi'],
        ['Rüzgâr yönü sensörü', '±0,5 V dalgalanma', 'Sensör başı gevşek olabilir'],
        ['Motor sargısı ve kontaktörler', 'Normal', 'Fazlar ~10 Ω dengeli']
      ],
      trend: { tur: 'temsili', baslik: 'Yaw açısı salınımı', birim: '°', x: [], xAd: 'Zaman (s)',
        not: 'Temsili eğitim grafiği: vaka sayfasındaki "±18°, 1–2 sn periyot" tarifinden çizildi; kayıtlı bir SCADA verisi değildir.' },
      soru: { s: 'Ölçümlere göre hangisi tek başına kök neden olamaz?', c: [
        ['Motor veya kontaktör arızası', true, 'Doğru. Sargılar dengeli, kontaktörler normal; motor tarafı salınımı açıklamıyor.'],
        ['Sensör gürültüsü', false, 'Katkısı var: ±0,5 V dalgalanma kontrolcünün sürekli düzeltme yapmasına yol açar.'],
        ['Yatak sürtünmesi ve yağlama', false, 'Katkısı var: yüksek akım ve durdurma sonrası kayma bunu gösteriyor.']] },
      hipotez: [
        ['Motor / kontaktör', 'elendi', 'Ölçümler normal.'],
        ['Rüzgâr yönü sensörü', 'güçlü', 'Gevşek montaj, gürültülü sinyal.'],
        ['Yaw yatağı yağlaması', 'güçlü', 'Yüksek akım, sürüklenme.'],
        ['Kontrol ayarı', 'olası', 'Vaka sayfası ayarın normalden yüksek bulunduğunu yazıyor; değişiklik yalnız üretici prosedürüyle yapılır.']],
      kok: 'Tek bir neden değil: azalmış yatak yağlaması, gevşek rüzgâr yönü sensörünün gürültülü sinyali ve kontrol ayarındaki sapma birleşince sistem hedef yönde duramayıp salınıma girmiş.',
      ders: ['Salınımda tek nedene kilitlenmemek: mekanik, sensör ve kontrol birlikte incelenir.', 'Sensör montajı ve kablo bağlantısı, parametreden önce kontrol edilir.', 'Kontrol parametreleri yalnız üretici yetkisiyle ve kayıt altında değiştirilir; bu sayfa ayar değeri önermez.']
    }
  };
  var ADIM = ['Belirti', 'Ölçümler', 'Trend', 'Hipotez', 'Kök neden', 'Ders'];
  var $ = function (s) { return document.querySelector(s); };
  var secili = 'pitch', adim = 0, cevap = {};
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function grafik(t) {
    var W = 640, H = 260, L = 46, R = 16, T = 18, B = 40, svg = [];
    if (t.tur === 'temsili') {
      var nokta = [], n = 160;
      for (var i = 0; i <= n; i++) { var s = i / n * 12, a = 18 * Math.sin(s / 1.5 * 2 * Math.PI) * (0.85 + 0.15 * Math.sin(s * 0.7)); nokta.push([L + (W - L - R) * s / 12, T + (H - T - B) * (0.5 - a / 50)]); }
      svg.push('<line class="vt-eks" x1="' + L + '" y1="' + (T + (H - T - B) / 2) + '" x2="' + (W - R) + '" y2="' + (T + (H - T - B) / 2) + '"/>');
      [-18, 18].forEach(function (v) { var y = T + (H - T - B) * (0.5 - v / 50); svg.push('<line class="vt-esik" x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '"/><text class="vt-et" x="' + (W - R) + '" y="' + (y - 5) + '" text-anchor="end">' + (v > 0 ? '+' : '−') + '18°</text>'); });
      svg.push('<polyline class="vt-cizgi" points="' + nokta.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>');
      for (var k = 0; k <= 12; k += 3) svg.push('<text class="vt-et" x="' + (L + (W - L - R) * k / 12) + '" y="' + (H - 14) + '" text-anchor="middle">' + k + '</text>');
      svg.push('<text class="vt-et vt-temsili" x="' + L + '" y="' + (T + 2) + '">TEMSİLİ EĞİTİM GRAFİĞİ</text>');
    } else {
      var hep = [].concat.apply([], t.seri.map(function (s) { return s.d; })).concat((t.esik || []).map(function (e) { return e.d; }));
      var mn = Math.floor(Math.min.apply(null, hep) * 0.85), mx = Math.ceil(Math.max.apply(null, hep) * 1.08), m = t.x.length;
      var X = function (i) { return L + (W - L - R) * (m > 1 ? i / (m - 1) : 0.5); }, Y = function (v) { return T + (H - T - B) * (1 - (v - mn) / (mx - mn)); };
      [mn, Math.round((mn + mx) / 2), mx].forEach(function (v) { svg.push('<line class="vt-izgara" x1="' + L + '" y1="' + Y(v) + '" x2="' + (W - R) + '" y2="' + Y(v) + '"/><text class="vt-et" x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>'); });
      (t.esik || []).forEach(function (e) { svg.push('<line class="vt-esik" x1="' + L + '" y1="' + Y(e.d) + '" x2="' + (W - R) + '" y2="' + Y(e.d) + '"/><text class="vt-et" x="' + (W - R) + '" y="' + (Y(e.d) - 5) + '" text-anchor="end">' + esc(e.ad) + '</text>'); });
      t.seri.forEach(function (s) {
        svg.push('<polyline class="vt-cizgi' + (s.ikincil ? ' vt-ikincil' : '') + '" points="' + s.d.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ') + '"/>');
        s.d.forEach(function (v, i) { svg.push('<circle class="vt-nokta' + (s.ikincil ? ' vt-ikincil' : '') + '" cx="' + X(i) + '" cy="' + Y(v) + '" r="4"><title>' + esc(s.ad) + ': ' + String(v).replace('.', ',') + '</title></circle>'); });
      });
      t.x.forEach(function (x, i) { svg.push('<text class="vt-et" x="' + X(i) + '" y="' + (H - 14) + '" text-anchor="middle">' + esc(x) + '</text>'); });
    }
    return '<figure class="vt-grafik"><figcaption><b>' + esc(t.baslik) + '</b>' + (t.seri ? '<span>' + t.seri.map(function (s) { return '<i class="vt-lej' + (s.ikincil ? ' vt-ikincil' : '') + '"></i>' + esc(s.ad); }).join(' ') + '</span>' : '') + '</figcaption>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(t.baslik + '. ' + t.not) + '">' + svg.join('') + '</svg>' +
      (t.seri ? '<table class="gorsel-gizli"><caption>' + esc(t.baslik) + '</caption><tr><th>' + esc(t.xAd) + '</th>' + t.seri.map(function (s) { return '<th>' + esc(s.ad) + '</th>'; }).join('') + '</tr>' + t.x.map(function (x, i) { return '<tr><td>' + esc(x) + '</td>' + t.seri.map(function (s) { return '<td>' + s.d[i] + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' : '') +
      '<p class="vt-kaynak' + (t.tur === 'temsili' ? ' vt-uyari' : '') + '">' + esc(t.not) + '</p></figure>';
  }
  function icerik(v) {
    switch (adim) {
      case 0: return '<p class="vt-buyuk">' + esc(v.belirti) + '</p><dl class="vt-kunye"><div><dt>Model</dt><dd>' + esc(v.model) + '</dd></div><div><dt>Saha</dt><dd>' + esc(v.yer) + '</dd></div><div><dt>Sistem</dt><dd>' + esc(v.sistem) + '</dd></div></dl>';
      case 1: return '<table class="vt-olcum"><thead><tr><th scope="col">Ölçüm</th><th scope="col">Bulgu</th><th scope="col">Not</th></tr></thead><tbody>' + v.olcum.map(function (o) { return '<tr><th scope="row">' + esc(o[0]) + '</th><td>' + esc(o[1]) + '</td><td>' + esc(o[2]) + '</td></tr>'; }).join('') + '</tbody></table><p class="vt-kaynak">Değerler vaka sayfasındaki anlatımdan; SCADA dökümü değildir.</p>';
      case 2: return grafik(v.trend);
      case 3:
        var c = cevap[secili];
        return '<fieldset class="vt-soru"><legend>' + esc(v.soru.s) + '</legend>' + v.soru.c.map(function (o, i) {
            var durum = c === undefined ? '' : (i === c ? (o[1] ? ' dogru' : ' yanlis') : (o[1] ? ' dogru-isaret' : ''));
            return '<button type="button" class="vt-sec' + durum + '" data-i="' + i + '" aria-pressed="' + (c === i) + '"' + (c !== undefined ? ' disabled' : '') + '>' + esc(o[0]) + '</button>';
          }).join('') + '<p class="vt-geri" role="status">' + (c === undefined ? 'Bir seçenek seç; açıklama burada çıkar.' : esc(v.soru.c[c][2])) + '</p></fieldset>' +
          '<ul class="vt-hipotez">' + v.hipotez.map(function (h) { return '<li class="vt-h-' + (h[1] === 'güçlü' ? 'guclu' : h[1] === 'elendi' ? 'elendi' : 'diger') + '"><b>' + esc(h[0]) + '</b><span>' + esc(h[1]) + '</span><p>' + esc(h[2]) + '</p></li>'; }).join('') + '</ul>';
      case 4: return '<p class="vt-buyuk">' + esc(v.kok) + '</p>';
      default: return '<ol class="vt-ders">' + v.ders.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ol><p><a class="vt-tam" href="' + v.u + '">Vakanın tam anlatımı →</a></p>';
    }
  }
  function ciz(odak) {
    var v = VAKA[secili];
    [].forEach.call(document.querySelectorAll('.vt-vaka'), function (b) { var s = b.getAttribute('data-v') === secili; b.setAttribute('aria-pressed', s); });
    $('#vtNo').textContent = v.no + ' · ' + v.model; $('#vtAd').textContent = v.ad;
    $('#vtAdimlar').innerHTML = ADIM.map(function (a, i) { return '<li><button type="button" data-a="' + i + '"' + (i === adim ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '</span>' + a + '</button></li>'; }).join('');
    $('#vtCubuk').style.width = ((adim + 1) / ADIM.length * 100) + '%';
    $('#vtBaslik').textContent = (adim + 1) + ' / ' + ADIM.length + ' · ' + ADIM[adim];
    $('#vtIcerik').innerHTML = icerik(v);
    $('#vtGeri').disabled = adim === 0; $('#vtIleri').textContent = adim === ADIM.length - 1 ? 'Sonraki vaka →' : 'Sonraki adım →';
    try { history.replaceState(null, '', '#' + secili + '-' + (adim + 1)); } catch (e) {}
    if (odak) $('#vtBaslik').focus({ preventScroll: false });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('.vt-vaka'); if (t) { secili = t.getAttribute('data-v'); adim = 0; ciz(); return; }
    t = e.target.closest('#vtAdimlar button'); if (t) { adim = +t.getAttribute('data-a'); ciz(true); return; }
    t = e.target.closest('.vt-sec'); if (t) { cevap[secili] = +t.getAttribute('data-i'); ciz(); return; }
    if (e.target.closest('#vtGeri')) { if (adim > 0) { adim--; ciz(true); } return; }
    if (e.target.closest('#vtIleri')) { if (adim < ADIM.length - 1) adim++; else { var k = Object.keys(VAKA); secili = k[(k.indexOf(secili) + 1) % k.length]; adim = 0; } ciz(true); }
  });
  function adrestenOku() { var m = /^#(pitch|disli|yaw)-([1-6])$/.exec(location.hash); if (m) { secili = m[1]; adim = +m[2] - 1; return true; } return false; }
  adrestenOku(); ciz();
  addEventListener('hashchange', function () { if (adrestenOku()) ciz(); });   // paylaşılan bağlantı aynı sayfada açılınca
})();
