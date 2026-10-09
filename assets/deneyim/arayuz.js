/* arayuz.js — "Türbinin içine" deneyiminin sayfa tarafı: etiketler, bölüm rayı,
 * dış altyazılar, kararma, kapanış ve WebGL yoksa durağan kapak.
 * Hem ana sayfada hem /deneyim/ sayfasında aynı işaretlemeyle çalışır.
 * Canlı rüzgâr (--devir-sure, --yon-derece) ve güneş (data-vardiya) sayfanın kendi betiğinden gelir. */
(function () {
  var bolum = document.getElementById('deneyim');
  if (!bolum) return;
  var $ = function (id) { return document.getElementById(id); };
  var kok = document.documentElement;
  var tuval = $('dnyTuval'), hud = $('dnyHud'), alt = $('dnyAlt'), son = $('dnySon');
  var eNo = $('dnyNo'), eEn = $('dnyEn'), eAd = $('dnyAd'), eBilgi = $('dnyBilgi');
  var eBolum = $('dnyBolum'), eKot = $('dnyKot');
  var kararti = $('dnyKararti'), cizgi = $('dnyIlerleme'), ray = $('dnyRay');
  var DURAKLAR = [];
  // Canlı 3B varsayılan. Önceden çekilmiş film sürümü yalnız ?film=1 ile açılır (karşılaştırma için saklı).
  // ?uc=1: canlı 3B'yi zorla (tanı ve otomatik test); zayıf cihaz kapısı ve kendiliğinden vazgeçme kapalı.
  var zorla3B = /[?&]uc=1\b/.test(location.search);
  var filmKip = /[?&]film=1\b/.test(location.search) && 'createImageBitmap' in window;

  /* ---- tanı: 3B sahnenin gerçek cihazlarda nasıl çalıştığı (anonim, /api/tani) ---- */
  var taniOturum = Math.random().toString(36).slice(2, 10), taniSay = 0, taniT0 = 0, taniGpu = null;
  function taniGpuOku() {
    if (taniGpu !== null) return taniGpu;
    taniGpu = '';
    try {
      var c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl');
      var e = g && g.getExtension('WEBGL_debug_renderer_info');
      taniGpu = g ? String(e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)).slice(0, 80) : 'webgl-yok';
      var k = g && g.getExtension('WEBGL_lose_context'); if (k) k.loseContext();
    } catch (er) { taniGpu = 'okunamadi'; }
    return taniGpu;
  }
  // Zayıf cihaz: tanı kayıtlarında ilk karesi 18–22 sn süren ve 15 sn donan ekran kartları.
  // Bu cihazlarda canlı 3B hiç yüklenmez; kapak ve içerik akıcı kalır. ?uc=1 testte zorlar.
  // v4: işaret artık süreli (ZAYIF_SURE). Eski v3 işaretleri süresizdi; bir kez geç yüklenen cihaz 3B'yi
  // bir daha hiç görmüyordu. Onlar burada temizlenir, her cihaz sahneye bir kez daha şans tanır.
  var ZAYIF_ANAHTAR = 'dny-zayif-v4', ZAYIF_SURE = 7 * 24 * 3600 * 1000;
  try { localStorage.removeItem('dny-zayif-v3'); } catch (e) {}
  var kurulumT0 = 0;   // sahne dosyaları indikten sonraki an: ilk kare sınırı (8 sn) buradan sayılır, indirme süresi sayılmaz
  var hazirAni = 0;   // ilk karede geometri yüklemesi uzun sürer; açılış takılması donma sayılmaz
  // Sekme arka plandayken ya da bilgisayar uykudayken kare gelmez; bu boşluklar donma sayılmaz.
  var gizlendi = document.hidden;
  document.addEventListener('visibilitychange', function () { if (document.hidden) gizlendi = true; });
  addEventListener('blur', function () { gizlendi = true; });
  function zayifIsaretle(neden) { try { localStorage.setItem(ZAYIF_ANAHTAR, JSON.stringify({ n: String(neden).slice(0, 40), t: Date.now() })); } catch (e) {} }
  function zayifCihaz() {
    if (/[?&]uc=1\b/.test(location.search)) return '';
    try {
      var k = localStorage.getItem(ZAYIF_ANAHTAR);
      if (k) {
        var z = JSON.parse(k);
        if (z && z.t && Date.now() - z.t < ZAYIF_SURE) return 'onceki-' + z.n;
        localStorage.removeItem(ZAYIF_ANAHTAR);   // süresi doldu ya da bozuk: sahneye yeniden şans ver
      }
    } catch (e) { try { localStorage.removeItem(ZAYIF_ANAHTAR); } catch (e2) {} }
    var g = taniGpuOku() || '', ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (/SwiftShader|llvmpipe|softpipe|Basic Render/i.test(g)) return 'yazilim-gpu';
    if (/Intel/i.test(g) && !/Iris\(R\) Xe|Arc/i.test(g)) return 'intel-tumlesik';
    if (/Adreno \(TM\) [1-6]\d\d\b/.test(g) || /Mali-(T|G[0-6]\d\b)/.test(g) || /PowerVR/i.test(g)) return 'zayif-mobil-gpu';
    if (!ios && navigator.deviceMemory && navigator.deviceMemory <= 4) return 'az-bellek';
    if (!ios && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return 'az-cekirdek';
    return '';
  }
  function tani(olay, ek) {
    if (taniSay++ > 22) return;
    try {
      var v = { olay: olay, sayfa: location.pathname, oturum: taniOturum, surum: filmKip ? 'film1' : 'akici18', gpu: taniGpuOku(),
        ekran: innerWidth + 'x' + innerHeight, dpr: devicePixelRatio || 1 };
      for (var k in ek) v[k] = ek[k];
      var govde = JSON.stringify(v);
      if (!(navigator.sendBeacon && navigator.sendBeacon('/api/tani', new Blob([govde], { type: 'application/json' }))))
        fetch('/api/tani', { method: 'POST', body: govde, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(function () {});
    } catch (er) { /* tanı sayfayı hiçbir zaman etkilemez */ }
  }
  // sayfadan çıkarken kısa özet: sahne hâlâ açık mı, hangi kademede, ortalama kare süresi
  var taniOzetGitti = false;
  addEventListener('pagehide', function () {
    if (taniOzetGitti || !taniT0) return; taniOzetGitti = true;
    var d = sahneS && sahneS.durum ? sahneS.durum() : {};
    tani('ozet', { neden: bolum.classList.contains('statik') ? 'kapakta' : (bolum.classList.contains('hazir') ? 'sahnede' : 'acilmadi'),
      kalite: d.kalite, kare_ms: d.kare_ms, sure_ms: Math.round(performance.now() - taniT0) });
  });

  // Aynı Aliağa tahmini hem 3B atmosferi hem de hafif hava katmanını sürer.
  var sahne = bolum.querySelector('.dny-sahne');
  // Yenilemede önceki ziyaretin donmuş karesi gösterilmez; sahne hazır olunca doğrudan canlı görüntü belirir.
  try { sessionStorage.removeItem('dny-kare:' + location.pathname); } catch (e) { /* depolama kapalı olabilir */ }
  var havaKat = document.createElement('div'); havaKat.className = 'dny-hava-kat'; havaKat.setAttribute('aria-hidden', 'true');
  sahne.insertBefore(havaKat, kararti);
  var havaEtiket = document.createElement('a'); havaEtiket.className = 'dny-hava-etiket';
  havaEtiket.href = '/ruzgar/?s=aliaga'; havaEtiket.setAttribute('aria-live', 'polite'); sahne.appendChild(havaEtiket);
  function havaTuru(kod) {
    if (kod === 0) return ['acik', 'Açık'];
    if (kod === 1 || kod === 2) return ['parcali', kod === 1 ? 'Az bulutlu' : 'Parçalı bulutlu'];   // güneş görünür: altın saat korunur
    if (kod === 3) return ['bulutlu', 'Kapalı'];
    if (kod === 45 || kod === 48) return ['sis', 'Sisli'];
    if ((kod >= 71 && kod <= 77) || kod === 85 || kod === 86) return ['kar', 'Karlı'];
    if (kod >= 95 && kod <= 99) return ['firtina', 'Gök gürültülü'];
    if ((kod >= 51 && kod <= 67) || (kod >= 80 && kod <= 82)) return ['yagmur', 'Yağmurlu'];
    return null;
  }
  function havaUygula(d) {
    var c = d && d.current, kod = c && c.weather_code != null ? Number(c.weather_code) : NaN, tur = havaTuru(kod);
    if (!tur) return;
    var h = { tur: tur[0], kod: kod, gece: Number(c.is_day) === 0 };
    bolum.dataset.hava = h.tur;
    havaEtiket.textContent = 'Aliağa · ' + tur[1] + ' · tahmin ↗';
    window.__sonerHava = h;
    window.dispatchEvent(new CustomEvent('ss:hava', { detail: h }));
  }
  function havaCek() {
    if (document.hidden) return;
    fetch('/api/ruzgar?s=aliaga', { headers: { accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('Hava verisi'); return r.json(); })
      .then(havaUygula).catch(function () { /* ağ kesilirse son geçerli sahne korunur */ });
  }
  havaCek();
  setInterval(havaCek, 10 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) havaCek(); });

  var DIS = [
    { p: 0.0, a: 0.035, b: 0.11, k: 'Uzaktan', t: 'Ege, rüzgâr çiftliği. Göbek yerden 120 metrede; rotorun çapı 116,8 metre.' },
    { p: 0.15, a: 0.143, b: 0.168, k: 'Kule kapısı', t: 'Her bakım günü bu kapının önünde başlar: iş izni, kilitleme ve kişisel koruyucu donanım.' },
    { p: 0.212, a: 0.212, b: 0.258, k: 'Kule içi', t: 'Dışarıdaki rüzgâr burada susar. Merdiven, kablo demeti ve servis asansörü: yukarı çıkan dikey bir koridor.' },
    { p: 0.285, a: 0.29, b: 0.395, k: 'Yukarı erişim', t: 'Servis asansörü kule boyunca çıkar. Flanşlar ve platformlar birer birer aşağıda kalır.' },
    { p: 0.418, a: 0.416, b: 0.458, k: 'Yaw katı', t: '', yon: true }
  ];
  function bolumAdi(p) {
    if (p < 0.14) return 'Dışarıda'; if (p < 0.205) return 'Kule kapısı'; if (p < 0.262) return 'Kule içi'; if (p < 0.41) return 'Servis asansörü';
    if (p < 0.462) return 'Yaw katı'; if (p < 0.72) return 'Güç aktarma'; if (p < 0.80) return 'Jeneratör'; if (p < 0.945) return 'Elektrik'; return 'Çıkış';
  }
  function canliYon() { return isFinite(parseFloat(getComputedStyle(kok).getPropertyValue('--yon-derece'))); }

  /* bölüm rayı: duraklar modül yüklenince kurulur */
  var rayOgeleri = [], rayLi = [];
  function rayKur() {
    rayOgeleri = [];
    DIS.forEach(function (d) { rayOgeleri.push({ p: d.p, ad: d.k, dis: true }); });
    DURAKLAR.forEach(function (d) { rayOgeleri.push({ p: d.p, ad: d.ad, dis: false }); });
    rayOgeleri.push({ p: 1, ad: 'Çıkış', dis: true });
    ray.textContent = '';
    rayLi = rayOgeleri.map(function (o) {
      var li = document.createElement('li'); if (o.dis) li.className = 'dis';
      var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = o.ad; bt.setAttribute('aria-label', o.ad + ' bölümüne git');
      bt.addEventListener('click', function () { git(o.p); });
      li.appendChild(bt); ray.appendChild(li); return li;
    });
  }

  var kesiyor = false, sonP = 0;
  function git(p) {
    var r = bolum.getBoundingClientRect(), yol = bolum.offsetHeight - (sahne.clientHeight || innerHeight);
    var hedef = Math.round(scrollY + r.top + yol * p);
    if (Math.abs(p - sonP) < 0.1 || kesiyor) { window.scrollTo({ top: hedef, behavior: 'instant' }); return; }   // yakın: kamera ataletle süzülür
    // uzak bölüm: kısa kararma, kesme, açılma (film kurgusu gibi)
    kesiyor = true; kararti.style.transition = 'opacity .3s ease'; kararti.style.opacity = '1';
    setTimeout(function () {
      window.scrollTo({ top: hedef, behavior: 'instant' }); window.__deneyimKes = true;
      setTimeout(function () {
        kararti.style.transition = 'opacity .6s ease'; kesiyor = false;
        kararti.style.opacity = '0';
        setTimeout(function () { kararti.style.transition = ''; }, 650);
      }, 180);
    }, 320);
  }
  // "Deneyimi geç": uzun kaydırmayı canlandırmadan doğrudan içeriğe
  var atla = bolum.querySelector('.dny-atla');
  if (atla) atla.addEventListener('click', function (e) {
    var h = document.querySelector(atla.getAttribute('href')); if (!h) return;
    e.preventDefault();
    window.scrollTo({ top: Math.round(scrollY + h.getBoundingClientRect().top - 72), behavior: 'instant' });
    h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
  });
  var sahaya = $('dnySahaya');
  if (sahaya) sahaya.addEventListener('click', function (e) {
    if (bolum.classList.contains('uc-boyut')) { e.preventDefault(); git(0.15); return; }
    if (acilabilir) { e.preventDefault(); kur(); }          // hareket azaltılmışsa: yalnız tıklayınca 3B açılır
    // WebGL hiç yoksa bağlantı /deneyim/ sayfasına gider
  });
  var basaDon = $('dnyBasaDon');
  if (basaDon) basaDon.addEventListener('click', function () { git(0); });

  var soz = $('vSoz'), sozSatir = soz ? [].slice.call(soz.querySelectorAll('span')) : [];
  var sonDurak = -2, sonRay = -1, sonAlt = -1, sonBolumAdi = '', sonKot = '';
  function ilerleme(p, y, icerde) {
    sonP = p;
    bolum.classList.toggle('gecti', p > 0.02);
    bolum.classList.toggle('sonda', p > 0.95);
    bolum.classList.toggle('dny-disarida', p < 0.203 || p > 0.948);
    cizgi.style.setProperty('--p', p.toFixed(4));
    var ba = bolumAdi(p); if (ba !== sonBolumAdi) { eBolum.textContent = ba; sonBolumAdi = ba; }
    var kot = icerde ? '<span class="dny-ic">Nasel içi</span> · <b>120</b> m' : 'Kot <b>' + Math.round(y) + '</b> m';
    if (kot !== sonKot) { eKot.innerHTML = kot; sonKot = kot; }

    // parça etiketi: durağa yaklaşınca belirir, uzaklaşınca söner
    var en = -1, fark = 1;
    DURAKLAR.forEach(function (d, i) { var f = Math.abs(p - d.p); if (f < fark) { fark = f; en = i; } });
    var goster = en >= 0 && fark < 0.019 && p < 0.934;
    if (goster && en !== sonDurak) {
      var d = DURAKLAR[en];
      eNo.textContent = String(en + 1).padStart(2, '0'); eEn.textContent = d.en; eAd.textContent = d.ad; eBilgi.textContent = d.bilgi;
      sonDurak = en;
    }
    hud.classList.toggle('gor', goster);

    // dış altyazılar
    var ai = -1; DIS.forEach(function (d, i) { if (p > d.a && p < d.b && !(i === 0 && soz)) ai = i; });
    if (ai !== sonAlt) {
      if (ai >= 0) {
        var d2 = DIS[ai], metin = d2.t;
        if (d2.yon) metin = canliYon() ? 'Son merdiven. Yukarıda nasel; şu an Aliağa\'daki gerçek rüzgâr yönüne dönük.' : 'Son merdiven: naselin tabanındaki kapaktan makine dairesine.';
        alt.innerHTML = '<b>' + String(ai + 1).padStart(2, '0') + ' · ' + d2.k + '</b>' + metin;
      }
      sonAlt = ai;
    }
    alt.classList.toggle('gor', ai >= 0);
    // kapak cümlesi: kamera türbine yaklaşırken satır satır belirir
    if (soz) {
      var sp = (p - 0.012) / 0.085;
      sozSatir.forEach(function (s, i) { s.classList.toggle('gor', sp > i * 0.13 && p < 0.106); });
      soz.classList.toggle('gor', p > 0.012 && p < 0.106);
    }
    son.classList.toggle('gor', p > 0.976);
    // kule kapısı: erişim işareti ve "Türbine gir"
    erisim.classList.toggle('gor', p > 0.168 && p < 0.199);
    erisimBtn.tabIndex = p > 0.168 && p < 0.199 ? 0 : -1;
    // servis asansörü: yukarı erişim göstergesi
    var asn = p > 0.279 && p < 0.412;
    asansor.classList.toggle('gor', asn);
    if (asn) { var oran = Math.max(0, Math.min(1, (y - 5.5) / 115)); asOran.style.setProperty('--o', oran.toFixed(3)); asKot.textContent = Math.round(y); }
    temsil.classList.toggle('gor', p > 0.2 && p < 0.95);

    // ray: geçilen ve etkin bölüm
    var ri = 0; rayOgeleri.forEach(function (o, i) { if (p >= o.p - 0.012) ri = i; });
    if (ri !== sonRay) { rayLi.forEach(function (li, i) { li.classList.toggle('etkin', i === ri); li.classList.toggle('gecildi', i < ri); }); sonRay = ri; }
  }

  /* ---- teknik işaret noktaları: sahnede parçanın üstünde küçük halka, üstüne gelince bilgi ---- */
  var NOKTA = {
    anaYatak:  { no: 'MAIN BEARING', ad: 'Ana yatak', t: 'Rotorun ağırlığını ve rüzgâr itkisini taşır; torku ana mile bırakır.',
      k: 'Gres durumu ve kaçak, yatak sıcaklığı trendi, titreşim, sızdırmazlık.', b: 'Komşu türbinlere göre yükselen sıcaklık, titreşimde yatak frekansları, conta çevresinde gres.', s: 'Yatak sıcaklığı (PT100), titreşim ivmeölçeri (durum izleme), rotor devri sensörü.', u: '/n117/', ul: 'N117 turu' },
    disli:     { no: 'GEARBOX', ad: 'Dişli kutusu', t: 'Üç kademe: iki planet, bir helisel. Rotor devrini jeneratörün istediği hıza çıkarır.',
      k: 'Yağ seviyesi ve sıcaklığı, filtre fark basıncı, yağ numunesi, endoskopla dişli yüzeyleri.', b: 'Yavaş yükselen yağ sıcaklığı, filtre alarmı, yağda metal partikül, ses değişimi.', s: 'Yağ ve yatak sıcaklıkları (PT100), yağ basıncı, filtre fark basıncı, yağ seviyesi, titreşim ivmeölçerleri; bazı türbinlerde yağda partikül sayacı.', u: '/saha-notlari/disli-kutusu-sicaklik/', ul: 'İlgili vaka' },
    jenerator: { no: 'GENERATOR', ad: 'Jeneratör', t: '3.000 kW, çift beslemeli asenkron, 660 V.',
      k: 'Sargı ve yatak sıcaklıkları, yalıtım direnci, bilezik ve kömürler, soğutma havası.', b: 'Sıcaklık alarmı (önce sensörü doğrula), kömür tozu birikimi, yatak sesi.', s: 'Sargı ve yatak sıcaklıkları (PT100), devir enkoderi, stator gerilim ve akımları, soğutma havası sıcaklığı.', u: '/saha-notlari/jenerator-sicaklik/', ul: 'İlgili vaka' },
    konvertor: { no: 'CONVERTER', ad: 'Konvertör', t: 'Jeneratörün rotor devresini besler; değişen rüzgârda şebekeye sabit frekans verir.',
      k: 'Soğutma devresi, bara bağlantı torkları, yük altında termal görüntü, filtreler.', b: 'Belirli güçte atan aşırı akım, aşırı sıcaklık hataları, reset sonrası normal çalışma.', s: 'Güç modülü ve soğutucu sıcaklıkları, DC bara gerilimi, faz akımları, soğutma suyu basıncı ve sıcaklığı.', u: '/saha-notlari/converter-asiri-akim/', ul: 'İlgili vaka' },
    yaw:       { no: 'YAW', ad: 'Yaw sistemi', t: 'Naseli rüzgâra döndüren halka yatak ve motorlar. Güç kabloları bu açıklıktan kuleye iner.',
      k: 'Yaw dişlisi yağlaması, fren balataları ve basıncı, motor-redüktörler, kablo burulma sayacı.', b: 'Salınım (hunting), gıcırtı ya da vuruntu, kablo burulma uyarısı.', s: 'Nasel üstünde rüzgâr yönü ve hızı sensörleri, yaw konum ve kablo burulma sayacı, fren basıncı.', u: '/saha-notlari/yaw-salinimi/', ul: 'İlgili vaka' },
    pitch:     { no: 'PITCH', ad: 'Pitch sistemi', t: 'Her kanadın açısını ayrı ayarlar; anma hızına gelince gücü sınırlar.',
      k: 'Kanat yatağı gresi, pitch motoru ve sürücü akımı, acil durum enerji kaynağı, açı enkoderi.', b: 'Kanatlar arası açı farkı, yüksek motor akımı, açı sapması hatası.', s: 'Kanat açı enkoderleri, pitch motoru akımı ve sıcaklığı, acil durum enerji kaynağının gerilimi.', u: '/saha-notlari/pitch-motor-yuksek-akim/', ul: 'İlgili vaka' },
    gobek:     { no: 'ROTOR & HUB', ad: 'Rotor ve göbek', t: 'Üç kanat göbeğe kanat yataklarıyla bağlanır. Ø 116,8 m rotor 7,9–14,1 d/dk aralığında döner; göbek pitch sistemini taşır.',
      k: 'Kanat yatağı cıvata torkları, göbek dökümünde çatlak kontrolü, kanat kökü sızdırmazlığı, kanat yüzeyi (erozyon, yıldırım izi).', b: 'Rotor dengesizliğinden gelen dönme frekanslı (1P) titreşim, kanat kökünde gres izi, periyodik vuruntu sesi.',
      s: 'Rotor devri sensörü, kanat açı enkoderleri, nasel ivmeölçerleri; bazı türbinlerde kanat yük sensörleri.', u: '/saha-notlari/kanat-titresimi/', ul: 'İlgili vaka' },
    anaMil:    { no: 'MAIN SHAFT', ad: 'Ana mil', t: 'Göbekten gelen düşük devirli, yüksek torklu gücü dişli kutusuna taşır; büzme diskiyle dişli kutusu giriş miline kilitlenir.',
      k: 'Büzme diski cıvata torkları, mil ile disk arasındaki işaret çizgisi (kayma kontrolü), rotor kilidi diski ve pimi.', b: 'İşaret çizgisinde kayma, rotor kilidinin zor girmesi, ana yatak tarafından gelen ses.',
      s: 'Rotor devri sensörü (endüktif ya da enkoder), ana yatak sıcaklığı ve titreşimi.', u: '/n117/', ul: 'N117 turu' },
    kaplin:    { no: 'COUPLING & BRAKE', ad: 'Kaplin ve fren', t: 'Dişli kutusunun hızlı milini jeneratöre bağlar; esnek disk paketleri küçük hizasızlıkları alır. Mekanik fren diski bu milin üzerindedir.',
      k: 'Kaplin hizası (lazerle), disk paketlerinde çatlak, fren balatası kalınlığı, fren basıncı ve kaliper.', b: 'Hizasızlıkta titreşim ve ısınan kaplin, balata aşınma uyarısı, frenlemede yanık kokusu.',
      s: 'Jeneratör tarafında devir enkoderi, fren basınç anahtarı, balata aşınma kontağı.', u: '/n117/', ul: 'N117 turu' },
    sogutma:   { no: 'COOLING', ad: 'Soğutma', t: 'Dişli kutusu yağının, jeneratörün ve konvertörün ısısı sıvı ve hava devreleriyle eşanjörlere taşınır. Sahnedeki modelde eşanjörler naselin üstünde.',
      k: 'Soğutma sıvısı seviyesi ve basıncı, pompa ve fanlar, eşanjör peteklerinde kir ve tıkanma, hortum bağlantıları.', b: 'Yazın yük altında yükselen sıcaklıklar, güç kısıtlama (derating), fan ya da pompa arızası uyarısı.',
      s: 'Giriş ve çıkış sıvı sıcaklıkları, basınç anahtarları, fan durum kontakları, nasel içi ve dış ortam sıcaklığı.', u: '/saha-notlari/disli-kutusu-sicaklik/', ul: 'İlgili vaka' },
    yaglama:   { no: 'LUBRICATION', ad: 'Yağlama', t: 'Dişli kutusu pompa, filtre ve soğutuculu basınçlı yağ devresiyle yağlanır. Ana yatak, kanat ve yaw yatakları gresle yağlanır; çoğu türbinde bunu otomatik gres üniteleri yapar.',
      k: 'Yağ seviyesi, filtre fark basıncı, yağ numunesi (partikül, su, viskozite), gres pompası haznesi ve dağıtıcı bloklar.', b: 'Filtre alarmı, yağda metal partikül, gres haznesi boş uyarısı, conta çevresinde eski gres birikimi.',
      s: 'Yağ basıncı ve sıcaklığı, fark basınç anahtarı, seviye sensörü; varsa yağda partikül sayacı.', u: '/saha-notlari/disli-kutusu-sicaklik/', ul: 'İlgili vaka' },
    panolar:   { no: 'AUX CABINETS', ad: 'Elektrik panoları', t: 'Nasel içindeki yardımcı güç dağıtımı: soğutma pompaları ve fanları, aydınlatma, vinç ve priz devreleri.',
      k: 'Bağlantı noktalarında termal kamera, kontaktör ve sigorta durumu, kaçak akım röleleri, pano filtreleri ve contaları.', b: 'Isınmış klemens, sık atan sigorta ya da şalter, nem ve yoğuşma izleri.',
      s: 'Pano içi sıcaklık ve nem, sigorta ve kontaktör geri bildirim kontakları.', u: '/ariza/', ul: 'Arıza ağacı' },
    kontrol:   { no: 'CONTROL SYSTEM', ad: 'Kontrol sistemi', t: 'Üst kutudaki (top box) kontrolör naseldeki sensörleri okur; pitch, yaw ve konvertöre komut verir. Güvenlik zinciri açılırsa türbin kontrolörden bağımsız olarak durdurulur.',
      k: 'Haberleşme bağlantıları, giriş/çıkış modülleri, kesintisiz güç kaynağı, acil stop ve güvenlik zinciri testleri.', b: 'Haberleşme kopması, sensör sinyal hatası, güvenlik zinciri açık uyarısı.',
      s: 'Bütün sensörlerin toplandığı yer: sıcaklık, titreşim, rüzgâr, pozisyon ve güvenlik zinciri girişleri.', u: '/kodlar/', ul: 'Alarm kodları' }
  };
  var katman = document.createElement('div'); katman.className = 'v-noktalar'; sahne.appendChild(katman);
  var pencere = document.createElement('div'); pencere.className = 'v-nokta-bilgi'; pencere.setAttribute('role', 'tooltip'); pencere.id = 'vNoktaBilgi'; sahne.appendChild(pencere);
  var noktaEl = {}, acikNokta = null, sonListe = [];
  Object.keys(NOKTA).forEach(function (id) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'v-nokta';
    b.setAttribute('aria-label', NOKTA[id].ad + ': teknik bilgi'); b.setAttribute('aria-describedby', 'vNoktaBilgi');
    b.innerHTML = '<i aria-hidden="true"></i><span>' + NOKTA[id].ad + '</span>';
    var ac = function () { noktaAc(id); }, kapa = function () { if (!pencere.matches(':hover')) noktaKapa(id); };
    b.addEventListener('mouseenter', ac); b.addEventListener('focus', ac);
    b.addEventListener('mouseleave', function () { setTimeout(kapa, 120); }); b.addEventListener('blur', function () { setTimeout(kapa, 120); });
    b.addEventListener('click', function (e) { e.preventDefault(); acikNokta === id ? noktaKapa(id, true) : noktaAc(id); });
    katman.appendChild(b); noktaEl[id] = b;
  });
  pencere.addEventListener('mouseleave', function () { if (acikNokta) noktaKapa(acikNokta); });
  function noktaAc(id) {
    var n = NOKTA[id]; acikNokta = id;
    pencere.innerHTML = '<p class="v-nb-no">' + n.no + '</p><p class="v-nb-ad">' + n.ad + '</p><p class="v-nb-t">' + n.t + '</p>' +
      '<dl class="v-nb-dl"><div><dt>Kontrol</dt><dd>' + n.k + '</dd></div><div><dt>Sahada belirti</dt><dd>' + n.b + '</dd></div>' +
      '<div><dt>Tipik sensörler</dt><dd>' + n.s + '</dd></div></dl>' +
      '<a class="v-nb-git" href="' + n.u + '">' + n.ul + '</a>';
    pencere.classList.add('gor'); konumla();
  }
  function noktaKapa(id, zorla) { if (acikNokta === id || zorla) { acikNokta = null; pencere.classList.remove('gor'); } }
  function konumla() {
    if (!acikNokta) return;
    var n = null; sonListe.forEach(function (o) { if (o.id === acikNokta) n = o; });
    if (!n || !n.gor) { noktaKapa(acikNokta, true); return; }
    var w = sahne.clientWidth, h = sahne.clientHeight, sag = n.x > w - 330, ust = n.y > h - 330;
    pencere.style.transform = 'translate3d(' + Math.round(sag ? n.x + 14 : n.x - 14) + 'px,' + Math.round(ust ? n.y - 22 : n.y + 22) + 'px,0)' +
      (sag ? ' translateX(-100%)' : '') + (ust ? ' translateY(-100%)' : '');
  }
  function noktalar(liste) {
    sonListe = liste;
    liste.forEach(function (n) {
      var b = noktaEl[n.id]; if (!b) return;
      b.classList.toggle('gor', n.gor);
      b.tabIndex = n.gor ? 0 : -1;
      if (n.gor) b.style.transform = 'translate3d(' + Math.round(n.x) + 'px,' + Math.round(n.y) + 'px,0)';
    });
    konumla();
  }

  /* ---- dış teknik etiketler: parçaya ince çizgiyle bağlı, belli bölümlerde belirir ---- */
  var ETIKET = {
    kule:  { en: 'TOWER',   ad: 'Kule',  t: 'Çelik · göbek 120 m',     ar: [[0.075, 0.118], [0.978, 1.01]], y: -26, mob: true },
    yaw:   { en: 'YAW',     ad: 'Yaw',   t: 'Nasel rüzgâra döner',     ar: [], y: 34 },
    nasel: { en: 'NACELLE', ad: 'Nasel', t: '12,4 × 4,2 × 4,0 m',       ar: [[0.08, 0.14], [0.978, 1.01]], y: -52, mob: true },
    gobek: { en: 'HUB',     ad: 'Göbek', t: 'Üç kanat yatağı',          ar: [[0.978, 1.01]], y: 50 },
    rotor: { en: 'ROTOR',   ad: 'Rotor', t: 'Ø 116,8 m · 3 kanat',      ar: [[0.075, 0.118], [0.978, 1.01]], y: 38, mob: true }
  };
  var dar = matchMedia('(max-width: 820px)').matches;
  var eKatman = document.createElement('div'); eKatman.className = 'v-etiketler'; eKatman.setAttribute('aria-hidden', 'true');
  var SVGNS = 'http://www.w3.org/2000/svg';
  var eSvg = document.createElementNS(SVGNS, 'svg'); eSvg.setAttribute('class', 'v-et-svg'); eKatman.appendChild(eSvg);
  var eOge = {};
  Object.keys(ETIKET).forEach(function (id, i) {
    var e = ETIKET[id];
    var yol = document.createElementNS(SVGNS, 'path'); yol.setAttribute('pathLength', '1'); yol.setAttribute('class', 'v-et-yol');
    var nok = document.createElementNS(SVGNS, 'circle'); nok.setAttribute('r', '2.5'); nok.setAttribute('class', 'v-et-nok');
    eSvg.appendChild(yol); eSvg.appendChild(nok);
    var kut = document.createElement('p'); kut.className = 'v-etiket';
    kut.innerHTML = '<span>' + e.en + '</span><b>' + e.ad + '</b><small>' + e.t + '</small>';
    kut.style.setProperty('--gecikme', (i * 90) + 'ms');
    eKatman.appendChild(kut);
    eOge[id] = { yol: yol, nok: nok, kut: kut, gor: false };
  });
  function etiketler(liste, p) {
    var w = sahne.clientWidth;
    liste.forEach(function (n) {
      var e = ETIKET[n.id], o = eOge[n.id]; if (!e || !o) return;
      var aralikta = e.ar.some(function (a) { return p > a[0] && p < a[1]; });
      var gor = !!(aralikta && n.ekranda && (!dar || e.mob));
      if (gor !== o.gor) { o.gor = gor; o.yol.classList.toggle('gor', gor); o.nok.classList.toggle('gor', gor); o.kut.classList.toggle('gor', gor); }
      if (!gor) return;
      var yon = n.x < w * 0.6 ? 1 : -1, dx = dar ? 44 : 84, ex = n.x + yon * dx, ey = n.y + e.y;
      o.yol.setAttribute('d', 'M' + n.x.toFixed(1) + ' ' + n.y.toFixed(1) + 'L' + (n.x + yon * Math.abs(e.y) * 0.6).toFixed(1) + ' ' + ey.toFixed(1) + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1));
      o.nok.setAttribute('cx', n.x.toFixed(1)); o.nok.setAttribute('cy', n.y.toFixed(1));
      o.kut.style.transform = 'translate3d(' + Math.round(yon > 0 ? ex + 8 : ex - 8) + 'px,' + Math.round(ey) + 'px,0) translateY(-50%)' + (yon > 0 ? '' : ' translateX(-100%)');
      o.kut.classList.toggle('sol', yon < 0);
    });
  }
  sahne.appendChild(eKatman);

  /* ---- fare: sahnedeki parçanın üstüne gelince küçük sistem etiketi ---- */
  var UST = { rotor: ['ROTOR SYSTEM', 'Rotor sistemi'], nasel: ['NACELLE SYSTEM', 'Nasel sistemi'], kule: ['STRUCTURE', 'Yapı · kule'] };
  var ust = document.createElement('p'); ust.className = 'v-ust'; ust.setAttribute('aria-hidden', 'true'); sahne.appendChild(ust);
  var sahneS = null, fx = 0, fy = 0;
  function uzerinde(tur) {
    if (tur && UST[tur]) { ust.innerHTML = '<span>' + UST[tur][0] + '</span>' + UST[tur][1]; ust.classList.add('gor'); }
    else ust.classList.remove('gor');
  }
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', function (e) {
      if (!sahneS || !sahneS.fare) return;
      var r = sahne.getBoundingClientRect();
      var ic = e.clientY >= r.top && e.clientY <= r.bottom && bolum.getBoundingClientRect().bottom > innerHeight * 0.5;
      var arayuzde = e.target && e.target.closest && e.target.closest('a,button,input,.ralan,.v-kimlik,.dugmeler,.rakam,.dny-ray,.v-nokta-bilgi,header');
      if (!ic || arayuzde) { sahneS.fare(null); ust.classList.remove('gor'); return; }
      fx = e.clientX; fy = e.clientY - r.top;
      ust.style.transform = 'translate3d(' + Math.round(fx + 16) + 'px,' + Math.round(fy + 18) + 'px,0)';
      sahneS.fare((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
    }, { passive: true });
    document.addEventListener('pointerleave', function () { if (sahneS && sahneS.fare) sahneS.fare(null); ust.classList.remove('gor'); });
  }

  /* ---- kule kapısı: erişim işareti ---- */
  var erisim = document.createElement('div'); erisim.className = 'v-erisim';
  erisim.innerHTML = '<p class="v-er-ust"><span aria-hidden="true"></span>Erişim · saha servisi</p><p class="v-er-ad">Kule kapısı</p>';
  var erisimBtn = document.createElement('button'); erisimBtn.type = 'button'; erisimBtn.className = 'v-er-git'; erisimBtn.textContent = 'Türbine gir'; erisimBtn.tabIndex = -1;
  erisimBtn.addEventListener('click', function () { git(0.226); });
  erisim.appendChild(erisimBtn); sahne.appendChild(erisim);
  /* ---- servis asansörü: yukarı erişim göstergesi ---- */
  var asansor = document.createElement('div'); asansor.className = 'v-asansor'; asansor.setAttribute('aria-hidden', 'true');
  asansor.innerHTML = '<p class="v-as-ust">ZARGES tipi servis asansörü · temsili</p><p class="v-as-ad">Yukarı erişim</p><p class="v-as-yol"><span>Kule</span><i><b></b></i><span>Nasel</span></p><p class="v-as-kot">Kot <b>0</b> m</p>';
  sahne.appendChild(asansor);
  var asOran = asansor.querySelector('.v-as-yol i'), asKot = asansor.querySelector('.v-as-kot b');
  /* ---- temsili yerleşim notu: kule ve nasel içi üretici çizimi değildir ---- */
  var temsil = document.createElement('p'); temsil.className = 'v-temsil'; temsil.textContent = 'Temsili yerleşim · üretici çizimi değildir'; sahne.appendChild(temsil);

  /* ---- ses: varsayılan kapalı; açılınca saha sesleri üretilir (dosya indirilmez) ---- */
  var sesBtn = document.createElement('button'); sesBtn.type = 'button'; sesBtn.className = 'v-ses'; sesBtn.setAttribute('aria-pressed', 'false');
  sesBtn.innerHTML = '<span aria-hidden="true"></span>Ses kapalı';
  var sesMotor = null, sesYukleniyor = false;
  sesBtn.addEventListener('click', function () {
    if (sesMotor) { sesMotor.kapat(); sesMotor = null; sesBtn.setAttribute('aria-pressed', 'false'); sesBtn.lastChild.textContent = 'Ses kapalı'; return; }
    if (sesYukleniyor) return; sesYukleniyor = true;
    import('/assets/deneyim/ses.js?v=9dd49f08').then(function (m) {
      sesMotor = m.sesKur(); sesYukleniyor = false;
      if (sesMotor) { sesBtn.setAttribute('aria-pressed', 'true'); sesBtn.lastChild.textContent = 'Ses açık'; }
    }).catch(function () { sesYukleniyor = false; });
  });
  sahne.appendChild(sesBtn);

  /* ---- irtifa cetveli: dış bölümde 0–120 m ---- */
  var irtifa = document.createElement('div'); irtifa.className = 'v-irtifa'; irtifa.setAttribute('aria-hidden', 'true');
  irtifa.innerHTML = '<div class="v-ir-cetvel">' + [120, 90, 60, 30, 0].map(function (m) { return '<i style="--y:' + (m / 120) + '"><b>' + m + '</b></i>'; }).join('') + '<span class="v-ir-ok"></span></div><p class="v-ir-b">İRTİFA · m</p>';
  sahne.appendChild(irtifa);
  var irOk = irtifa.querySelector('.v-ir-ok');
  function irtifaGuncelle(p, y) {
    irtifa.classList.toggle('gor', p > 0.02 && p < 0.47);
    irOk.style.setProperty('--y', Math.max(0, Math.min(1, y / 120)).toFixed(3));
  }

  var basla = $('dnyBasla'), acilabilir = false, kuruluyor = false;
  var hareketAz = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- izleyici denetimi: duraklat / devam ve baştan oynat (tercih bu tarayıcıda hatırlanır) ---- */
  var DUR_ANAHTAR = 'dny-duraklat';
  var denetim = document.createElement('div'); denetim.className = 'v-denetim'; denetim.setAttribute('role', 'group'); denetim.setAttribute('aria-label', '3B sahne denetimi');
  denetim.innerHTML = '<button type="button" class="v-den-dur" aria-pressed="false"><span aria-hidden="true"></span><b>Duraklat</b></button>' +
    '<button type="button" class="v-den-bas" aria-label="Açılış sahnesini baştan oynat"><span aria-hidden="true"></span><b>Baştan</b></button>';
  sahne.appendChild(denetim);
  var durBtn = denetim.querySelector('.v-den-dur'), basBtn = denetim.querySelector('.v-den-bas');
  function durGoster(d) { durBtn.setAttribute('aria-pressed', d ? 'true' : 'false'); durBtn.lastChild.textContent = d ? 'Devam' : 'Duraklat'; bolum.classList.toggle('dny-duraklatildi', d); }
  function duraklatUygula(d) {
    if (sahneS && sahneS.duraklat) sahneS.duraklat(d);
    durGoster(d);
    try { if (d) localStorage.setItem(DUR_ANAHTAR, '1'); else localStorage.removeItem(DUR_ANAHTAR); } catch (e) {}
  }
  function kayitliDuraklat() { try { return localStorage.getItem(DUR_ANAHTAR) === '1'; } catch (e) { return false; } }
  durBtn.addEventListener('click', function () { duraklatUygula(durBtn.getAttribute('aria-pressed') !== 'true'); });
  basBtn.addEventListener('click', function () {
    var ust = Math.round(scrollY + bolum.getBoundingClientRect().top);
    window.scrollTo({ top: ust, behavior: 'instant' });
    if (sahneS && sahneS.bastanOynat) sahneS.bastanOynat();
    durGoster(false);
    try { localStorage.removeItem(DUR_ANAHTAR); } catch (e) {}
  });
  durGoster(kayitliDuraklat());

  /* ---- panel ortak: Parça kâşifi ve Enerji akışı (sahnenin üstünde, Esc ile kapanır) ---- */
  denetim.insertAdjacentHTML('beforeend',
    '<button type="button" class="v-den-par" aria-haspopup="dialog" aria-controls="vParca" aria-expanded="false"><span aria-hidden="true"></span><b>Parçalar</b></button>' +
    '<button type="button" class="v-den-ea" aria-haspopup="dialog" aria-controls="vEnerji" aria-expanded="false"><span aria-hidden="true"></span><b>Enerji akışı</b></button>');
  var parBtn = denetim.querySelector('.v-den-par'), eaBtn = denetim.querySelector('.v-den-ea');
  /* V11: denetim katlanır; tek "Kontroller" düğmesi açar, sahne sade kalır */
  denetim.insertAdjacentHTML('afterbegin', '<button type="button" class="v-den-ac" aria-expanded="false" aria-label="Sahne kontrollerini aç"><span aria-hidden="true"></span><b>Kontroller</b></button>');
  var denAc = denetim.querySelector('.v-den-ac');
  function denetimAc(a) { denetim.classList.toggle('acik', a); denAc.setAttribute('aria-expanded', a ? 'true' : 'false'); denAc.setAttribute('aria-label', a ? 'Sahne kontrollerini kapat' : 'Sahne kontrollerini aç'); }
  denAc.addEventListener('click', function () { denetimAc(!denetim.classList.contains('acik')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && denetim.classList.contains('acik') && !bolum.classList.contains('dny-panel-acik')) { denetimAc(false); denAc.focus({ preventScroll: true }); } });
  parBtn.setAttribute('aria-label', 'Parça kâşifi'); eaBtn.setAttribute('aria-label', 'Enerji akışı');
  var acikPanel = null;
  function panelYap(id, baslik, en) {
    var p = document.createElement('div'); p.className = 'v-panel'; p.id = id; p.hidden = true;
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'false'); p.setAttribute('aria-labelledby', id + 'B');
    p.innerHTML = '<div class="v-panel-ust"><p class="v-panel-en">' + en + '</p><h2 class="v-panel-b" id="' + id + 'B">' + baslik + '</h2>' +
      '<button type="button" class="v-panel-kapa" aria-label="' + baslik + ' panelini kapat"><span aria-hidden="true"></span></button></div><div class="v-panel-ic"></div>';
    sahne.appendChild(p);
    p.querySelector('.v-panel-kapa').addEventListener('click', function () { panelKapa(true); });
    return p;
  }
  function panelAc(p, btn) {
    if (acikPanel && acikPanel.p !== p) panelKapa(false);
    acikPanel = { p: p, btn: btn };
    p.hidden = false; btn.setAttribute('aria-expanded', 'true'); bolum.classList.add('dny-panel-acik');
    requestAnimationFrame(function () { p.classList.add('gor'); });
    var ilk = p.querySelector('.v-panel-kapa'); if (ilk) ilk.focus({ preventScroll: true });
  }
  function panelKapa(odak) {
    if (!acikPanel) return;
    var a = acikPanel; acikPanel = null;
    a.p.classList.remove('gor'); a.p.hidden = true; a.btn.setAttribute('aria-expanded', 'false');
    bolum.classList.remove('dny-panel-acik');
    if (a.p === eaPanel) eaDur();
    if (odak) a.btn.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && acikPanel) { e.preventDefault(); panelKapa(true); } });
  var darEkran = matchMedia('(max-width: 820px)');

  /* ---- Parça kâşifi: parçayı seç, bilgisini oku, 3B'de o durağa git; işaret noktası vurgulanır ---- */
  // p: önce parçanın anlatı durağı (duraklar.js); halka o açıdan görünmezse sıradaki konumlar denenir
  var PARCA = [
    { id: 'gobek', p: [0.49, 0.125] }, { id: 'pitch', p: [0.49, 0.12] }, { id: 'anaYatak', p: [0.55, 0.66, 0.69, 0.49] },
    { id: 'anaMil', p: [0.59, 0.57] }, { id: 'disli', p: [0.635, 0.66] }, { id: 'yaglama', p: [0.635, 0.66] },
    { id: 'kaplin', p: [0.685, 0.7] }, { id: 'jenerator', p: [0.76, 0.79] }, { id: 'sogutma', p: [0.76, 0.79] },
    { id: 'konvertor', p: [0.845, 0.88] }, { id: 'panolar', p: [0.905, 0.89] }, { id: 'kontrol', p: [0.875, 0.86] },
    { id: 'yaw', p: [0.51, 0.52, 0.55] }
  ];
  var parPanel = panelYap('vParca', 'Parça kâşifi', 'COMPONENT EXPLORER');
  var parIc = parPanel.querySelector('.v-panel-ic');
  parIc.innerHTML = '<div class="v-rt-ac"><button type="button" class="v-rt-dugme" aria-pressed="false" aria-controls="vRontgen">Röntgen görünümü</button>' +
    '<span>Nasel kabuğu saydamlaşır, bileşenler ayrışır.</span></div>' +
    '<div class="v-par-liste" role="tablist" aria-label="Parçalar">' + PARCA.map(function (o) {
      return '<button type="button" role="tab" id="vParT-' + o.id + '" aria-controls="vParKart" aria-selected="false" data-id="' + o.id + '">' + NOKTA[o.id].ad + '</button>';
    }).join('') + '</div><div class="v-par-kart" id="vParKart" role="tabpanel"></div>';
  var parSecili = null, vurguZ = 0, aramaBitir = function () {};
  function parSec(id, odak) {
    var n = NOKTA[id]; parSecili = id;
    [].forEach.call(parIc.querySelectorAll('[role="tab"]'), function (t) {
      var s = t.getAttribute('data-id') === id; t.setAttribute('aria-selected', s ? 'true' : 'false'); t.tabIndex = s ? 0 : -1;
      if (s && odak) t.focus({ preventScroll: true });
    });
    var kart = parIc.querySelector('.v-par-kart'); kart.setAttribute('aria-labelledby', 'vParT-' + id);
    kart.innerHTML = (parPanel.classList.contains('saha-kip') ? '<p class="v-par-saha">Saha kipi: kontrol noktaları ve belirtiler. Gerçek müdahalede OEM prosedürü, LOTO ve rotor kilidi kuralları geçerlidir.</p>' : '') +
      '<p class="v-nb-no">' + n.no + '</p><p class="v-nb-ad">' + n.ad + '</p><p class="v-nb-t">' + n.t + '</p>' +
      '<dl class="v-nb-dl"><div><dt>Kontrol</dt><dd>' + n.k + '</dd></div><div><dt>Sahada belirti</dt><dd>' + n.b + '</dd></div>' +
      '<div><dt>Tipik sensörler</dt><dd>' + n.s + '<small>Genel bilgi; sensör seti üreticiye ve modele göre değişir.</small></dd></div></dl>' +
      '<p class="v-par-alt"><button type="button" class="v-par-goster">3B’de göster</button><a class="v-nb-git" href="' + n.u + '">' + n.ul + '</a></p>';
    kart.querySelector('.v-par-goster').addEventListener('click', function () { parGoster(id); });
    kart.querySelector('.v-par-goster').textContent = rontgenAcik ? 'Röntgende işaretle' : '3B’de göster';
    if (rontgenAcik && sahneS && sahneS.noktaVurgula) {   // röntgende seçim hemen vurgulanır
      Object.keys(noktaEl).forEach(function (k) { noktaEl[k].classList.toggle('secili', k === id); });
      sahneS.noktaVurgula(id);
    }
  }
  function parGoster(id) {
    var o = PARCA.filter(function (x) { return x.id === id; })[0]; if (!o) return;
    if (rontgenAcik) {   // röntgende kamera yörüngede kalır; seçilen bileşen vurgulanır
      Object.keys(noktaEl).forEach(function (k) { noktaEl[k].classList.toggle('secili', k === id); });
      if (sahneS && sahneS.noktaVurgula) sahneS.noktaVurgula(id);
      if (darEkran.matches) panelKapa(false);
      return;
    }
    panelKapa(true);   // panel sahnenin önünden çekilsin; halka görünür kalsın (odak Parçalar düğmesine döner)
    Object.keys(noktaEl).forEach(function (k) { noktaEl[k].classList.toggle('secili', k === id); });
    if (sahneS && sahneS.noktaVurgula) sahneS.noktaVurgula(id);   // seçilen parçanın halkası örtülse de gösterilir
    clearTimeout(vurguZ); aramaBitir();
    var el = noktaEl[id], deneme = 0, iptal = false;
    function kullanici() { iptal = true; }   // ziyaretçi kendisi kaydırırsa arama durur
    aramaBitir = function () { iptal = true; ['wheel', 'touchstart', 'keydown'].forEach(function (t) { removeEventListener(t, kullanici, true); }); };
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { addEventListener(t, kullanici, { capture: true, passive: true }); });
    git(o.p[0]);
    (function bak() {
      vurguZ = setTimeout(function () {
        if (iptal || !el || el.classList.contains('gor') || ++deneme >= o.p.length) { aramaBitir(); vurguZ = setTimeout(vurguBitir, 10000); return; }
        git(o.p[deneme]); bak();
      }, deneme === 0 ? 2200 : 1700);
    })();
    function vurguBitir() { if (el) el.classList.remove('secili'); if (sahneS && sahneS.noktaVurgula) sahneS.noktaVurgula(null); }
  }
  parIc.querySelector('.v-par-liste').addEventListener('click', function (e) {
    var t = e.target.closest('[role="tab"]'); if (t) parSec(t.getAttribute('data-id'));
  });
  parIc.querySelector('.v-par-liste').addEventListener('keydown', function (e) {
    var i = PARCA.map(function (o) { return o.id; }).indexOf(parSecili), y = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') y = 1; else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') y = -1; else return;
    e.preventDefault(); parSec(PARCA[(i + y + PARCA.length) % PARCA.length].id, true);
  });
  parSec('anaYatak');

  /* ---- Röntgen (dijital ikiz): saydam kabuk + patlatma; kaydırma engellenmez, kaydırınca normal görünüme döner ---- */
  var rontgenAcik = false, rtCubuk = document.createElement('div');
  rtCubuk.className = 'v-rontgen'; rtCubuk.id = 'vRontgen'; rtCubuk.hidden = true;
  rtCubuk.setAttribute('role', 'group'); rtCubuk.setAttribute('aria-label', 'Röntgen görünümü denetimi');
  rtCubuk.innerHTML = '<p class="v-rt-baslik"><b>Röntgen</b><span>Etkileşimli teknik model · sertifikalı dijital ikiz değildir</span></p>' +
    '<label class="v-rt-k"><span>Kabuk saydamlığı</span><input type="range" min="0" max="100" value="80" id="vRtKabuk"></label>' +
    '<label class="v-rt-k"><span>Patlatma</span><input type="range" min="0" max="100" value="0" id="vRtPatlat"></label>' +
    '<p class="v-rt-ipucu">Sürükleyerek döndür · kaydırınca normal görünüme döner</p>' +
    '<button type="button" class="v-rt-kapa">Röntgeni kapat</button>';
  sahne.appendChild(rtCubuk);
  var rtDugme = parIc.querySelector('.v-rt-dugme'), rtKabuk = rtCubuk.querySelector('#vRtKabuk'), rtPatlat = rtCubuk.querySelector('#vRtPatlat');
  var rtScroll = 0;
  function rontgen(acik) {
    if (!sahneS || !sahneS.rontgen) return;
    rontgenAcik = !!acik;
    sahneS.rontgen({ acik: rontgenAcik, kabuk: rtKabuk.value / 100, patlat: rontgenAcik ? rtPatlat.value / 100 : 0, secili: rontgenAcik ? parSecili : null });
    if (!rontgenAcik) rtPatlat.value = 0;
    rtDugme.setAttribute('aria-pressed', rontgenAcik ? 'true' : 'false');
    rtDugme.textContent = rontgenAcik ? 'Röntgeni kapat' : 'Röntgen görünümü';
    rtCubuk.hidden = !rontgenAcik; bolum.classList.toggle('dny-rontgen', rontgenAcik);
    rtScroll = scrollY;
    if (rontgenAcik) { Object.keys(noktaEl).forEach(function (k) { noktaEl[k].classList.toggle('secili', k === parSecili); }); if (sahneS.noktaVurgula) sahneS.noktaVurgula(parSecili); if (darEkran.matches) panelKapa(false); }
    else { if (sahneS.noktaVurgula) sahneS.noktaVurgula(null); Object.keys(noktaEl).forEach(function (k) { noktaEl[k].classList.remove('secili'); }); }
  }
  rtDugme.addEventListener('click', function () { rontgen(!rontgenAcik); });
  rtCubuk.querySelector('.v-rt-kapa').addEventListener('click', function () { rontgen(false); parBtn.focus({ preventScroll: true }); });
  rtKabuk.addEventListener('input', function () { if (sahneS && rontgenAcik) sahneS.rontgen({ kabuk: rtKabuk.value / 100 }); });
  rtPatlat.addEventListener('input', function () { if (sahneS && rontgenAcik) sahneS.rontgen({ patlat: rtPatlat.value / 100 }); });
  addEventListener('scroll', function () { if (rontgenAcik && Math.abs(scrollY - rtScroll) > 140) rontgen(false); }, { passive: true });
  // sürükleyerek döndürme: yalnız yatay; dikey hareket sayfayı kaydırmaya devam eder (touch-action: pan-y)
  (function () {
    var basX = null, sonX = 0;
    addEventListener('pointerdown', function (e) {
      if (!rontgenAcik || e.target.closest('a,button,input,label,select,.v-panel,.v-rontgen,.ralan,header,nav')) return;
      var r = sahne.getBoundingClientRect(); if (e.clientY < r.top || e.clientY > r.bottom) return;
      basX = sonX = e.clientX;
    }, { passive: true });
    addEventListener('pointermove', function (e) {
      if (basX === null || !rontgenAcik) return;
      var dx = e.clientX - sonX; sonX = e.clientX;
      if (dx) sahneS.rontgen({ aciEkle: dx * 0.006 });
    }, { passive: true });
    ['pointerup', 'pointercancel'].forEach(function (t) { addEventListener(t, function () { basX = null; }, { passive: true }); });
  })();
  parBtn.addEventListener('click', function () { acikPanel && acikPanel.p === parPanel ? panelKapa(true) : panelAc(parPanel, parBtn); });

  /* ---- Yönlendirmeli tur (Guided Journey): mevcut durakları, Parça kâşifini ve saha bilgisini tek rota çubuğunda birleştirir.
   * Sinematik: duraklar arasında kendiliğinden ilerler (kaydırınca durur). Keşif: Parça kâşifi. Saha: kontrol noktaları ve belirtiler öne çıkar.
   * /deneyim/ sayfasında bulunulan durak adrese yazılır (#durak-disli) ve paylaşılabilir; kaldığın durak bu tarayıcıda hatırlanır. ---- */
  var rotaSayfa = !bolum.classList.contains('dny-ana');   // adres ve "kaldığın yer" yalnız /deneyim/ sayfasında
  var rota = document.createElement('div'); rota.className = 'v-rota'; rota.setAttribute('role', 'group'); rota.setAttribute('aria-label', 'Yönlendirmeli tur');
  rota.innerHTML = '<div class="v-rota-kip" role="group" aria-label="Deneyim kipi">' +
      '<button type="button" data-kip="sinema" aria-pressed="false">Sinematik</button><button type="button" data-kip="kesif" aria-pressed="false">Keşif</button><button type="button" data-kip="saha" aria-pressed="false">Saha</button></div>' +
    '<div class="v-rota-gez"><button type="button" class="v-rota-onc" aria-label="Önceki durak">‹</button>' +
      '<p class="v-rota-no"><b>–</b><span></span></p><button type="button" class="v-rota-son" aria-label="Sonraki durak">›</button></div>' +
    '<button type="button" class="v-rota-devam" hidden></button>' +
    '<p class="gorsel-gizli" aria-live="polite" id="vRotaDuyuru"></p>';
  sahne.appendChild(rota);
  var rotaNo = rota.querySelector('.v-rota-no b'), rotaAd = rota.querySelector('.v-rota-no span'), rotaDuyuru = rota.querySelector('#vRotaDuyuru');
  var rotaDevam = rota.querySelector('.v-rota-devam'), turZ = 0, turAcik = false, sonRotaDurak = -1, hashIslendi = false;
  // kaydırma konumu (kameranın ataletli konumu değil): çubuk ve adres parmakla aynı anda güncellenir
  function kaydirmaP() { var r = bolum.getBoundingClientRect(), yol = bolum.offsetHeight - (sahne.clientHeight || innerHeight); return yol > 0 ? Math.max(0, Math.min(1, -r.top / yol)) : 0; }
  var rotaRaf = 0; addEventListener('scroll', function () { if (!rotaRaf) rotaRaf = requestAnimationFrame(function () { rotaRaf = 0; rotaGuncelle(kaydirmaP()); }); }, { passive: true });
  function enYakinDurak(p) { var en = 0, f = 9; DURAKLAR.forEach(function (d, i) { var x = Math.abs(p - d.p); if (x < f) { f = x; en = i; } }); return en; }
  function durakGit(i, duyur) {
    if (!DURAKLAR.length) return; i = Math.max(0, Math.min(DURAKLAR.length - 1, i));
    git(DURAKLAR[i].p);
    if (duyur) rotaDuyuru.textContent = 'Durak ' + (i + 1) + ' / ' + DURAKLAR.length + ': ' + DURAKLAR[i].ad + '. ' + DURAKLAR[i].bilgi;
  }
  function rotaGuncelle(p) {
    if (!DURAKLAR.length) return;
    var i = enYakinDurak(p);
    if (i === sonRotaDurak) return; sonRotaDurak = i;
    rotaNo.textContent = String(i + 1).padStart(2, '0') + ' / ' + DURAKLAR.length; rotaAd.textContent = DURAKLAR[i].ad;
    rota.querySelector('.v-rota-onc').disabled = i === 0 && p <= DURAKLAR[0].p + 0.003;
    rota.querySelector('.v-rota-son').disabled = i === DURAKLAR.length - 1 && p >= DURAKLAR[i].p - 0.003;
    if (rotaSayfa && hashIslendi && p > 0.1) {
      try { history.replaceState(null, '', '#durak-' + DURAKLAR[i].id); localStorage.setItem('dny-son-durak', DURAKLAR[i].id); } catch (e) {}
    }
  }
  function sonrakiDurak(yon) {
    var i = enYakinDurak(kaydirmaP()), d = DURAKLAR[i];
    if (yon > 0 && kaydirmaP() < d.p - 0.004) return i; if (yon < 0 && kaydirmaP() > d.p + 0.004) return i;   // durağın önündeyse önce o durak
    return i + yon;
  }
  rota.querySelector('.v-rota-onc').addEventListener('click', function () { turDurdur(); durakGit(sonrakiDurak(-1), true); });
  rota.querySelector('.v-rota-son').addEventListener('click', function () { turDurdur(); durakGit(sonrakiDurak(1), true); });
  // sinematik tur: her durakta okuma süresi kadar bekler; ziyaretçi kaydırır, dokunur ya da tuşa basarsa durur
  function turKullanici(e) { if (e.type === 'keydown' && e.target.closest && e.target.closest('.v-rota')) return; turDurdur(); }
  function turDurdur() {
    if (!turAcik) return; turAcik = false; clearTimeout(turZ);
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { removeEventListener(t, turKullanici, true); });
    kipGoster(null); rotaDuyuru.textContent = 'Otomatik tur durdu.';
  }
  function turBaslat() {
    if (!DURAKLAR.length) return;
    turAcik = true; kipGoster('sinema');
    ['wheel', 'touchstart', 'keydown'].forEach(function (t) { addEventListener(t, turKullanici, { capture: true, passive: true }); });
    var i = kaydirmaP() < DURAKLAR[0].p - 0.01 ? 0 : enYakinDurak(kaydirmaP()) + 1;
    (function adim() {
      if (!turAcik) return;
      if (i >= DURAKLAR.length) { turDurdur(); rotaDuyuru.textContent = 'Tur bitti.'; return; }
      durakGit(i, true); i++;
      turZ = setTimeout(adim, hareketAz ? 9000 : 7000);
    })();
  }
  function kipGoster(k) { [].forEach.call(rota.querySelectorAll('[data-kip]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-kip') === k ? 'true' : 'false'); }); }
  rota.querySelector('.v-rota-kip').addEventListener('click', function (e) {
    var b = e.target.closest('[data-kip]'); if (!b) return; var k = b.getAttribute('data-kip');
    if (k === 'sinema') { if (turAcik) turDurdur(); else { panelKapa(false); turBaslat(); } return; }
    turDurdur();
    parPanel.classList.toggle('saha-kip', k === 'saha');
    // bulunulan durağa en yakın parçayı seç (varsa)
    var d = DURAKLAR[enYakinDurak(kaydirmaP())]; if (d && NOKTA[d.id]) parSec(d.id); else if (parSecili) parSec(parSecili);
    if (!(acikPanel && acikPanel.p === parPanel)) panelAc(parPanel, parBtn);
    kipGoster(k);
  });
  // panel kapanınca Keşif/Saha düğmesi bırakılır
  new MutationObserver(function () { if (parPanel.hidden && !turAcik) kipGoster(null); }).observe(parPanel, { attributes: true, attributeFilter: ['hidden'] });
  // adresle gelen durak (#durak-disli) ya da bu tarayıcıda kalınan durak
  function devamKapat() { rotaDevam.hidden = true; bolum.classList.remove('dny-devam-var'); }
  addEventListener('scroll', function () { if (!rotaDevam.hidden && kaydirmaP() > 0.06) devamKapat(); }, { passive: true });
  function hashDurak() {
    var m = /^#durak-([a-zA-Z]+)$/.exec(location.hash); if (!m) return -1;
    for (var i = 0; i < DURAKLAR.length; i++) if (DURAKLAR[i].id === m[1]) return i; return -1;
  }
  function rotaHazir() {
    if (hashIslendi || !DURAKLAR.length || !bolum.classList.contains('hazir')) return;
    hashIslendi = true; rotaGuncelle(kaydirmaP());
    if (!rotaSayfa) return;
    var i = hashDurak();
    if (i >= 0) { setTimeout(function () { durakGit(i, true); }, 400); return; }
    var kayit = null; try { kayit = localStorage.getItem('dny-son-durak'); } catch (e) {}
    for (var k = 1; k < DURAKLAR.length; k++) if (DURAKLAR[k].id === kayit) {
      rotaDevam.textContent = 'Kaldığın yerden devam: ' + DURAKLAR[k].ad; rotaDevam.hidden = false; bolum.classList.add('dny-devam-var');
      (function (k) { rotaDevam.onclick = function () { devamKapat(); durakGit(k, true); }; })(k);
      setTimeout(devamKapat, 30000);
    }
  }
  addEventListener('hashchange', function () { var i = hashDurak(); if (i >= 0) durakGit(i, true); });
  new MutationObserver(rotaHazir).observe(bolum, { attributes: true, attributeFilter: ['class'] });
  parBtn.addEventListener('click', function () { if (parPanel.classList.contains('saha-kip') && !rota.querySelector('[data-kip="saha"][aria-pressed="true"]')) { parPanel.classList.remove('saha-kip'); if (parSecili) parSec(parSecili); } });

  /* ---- Enerji akışı: rüzgârdan şebekeye; mekanik bağlar çizgi, elektrik bağlar nokta akışıyla.
   * Değerler sayfadaki canlı rüzgâr panelinin tahmin+model çıktısıdır (ölçüm değil). ---- */
  var eaPanel = panelYap('vEnerji', 'Enerji akışı', 'ENERGY FLOW');
  eaPanel.classList.add('v-panel-genis');
  var eaIc = eaPanel.querySelector('.v-panel-ic');
  function dugum(cls, en, ad, deger, alt, p) {
    var etiket = p != null ? 'button type="button" data-p="' + p + '" aria-label="' + ad + ': 3B sahnede göster"' : 'div';
    return '<' + etiket + ' class="ea-d ' + cls + '"><span class="ea-en">' + en + '</span><b class="ea-ad">' + ad + '</b>' +
      (deger ? '<span class="ea-v" data-ea="' + deger + '">–</span>' : '') + '<small>' + alt + '</small></' + (p != null ? 'button' : 'div') + '>';
  }
  function bag(tur, ad) { return '<span class="ea-b ea-' + tur + '" role="img" aria-label="' + ad + '"><i></i></span>'; }
  eaIc.innerHTML =
    '<p class="ea-durum" id="eaDurum" role="status"></p>' +
    '<div class="ea-sema">' +
      dugum('ea-ruzgar', 'WIND', 'Rüzgâr', 'v', 'göbek yüksekliği 120 m') + bag('hava', 'Hava akışı') +
      dugum('', 'ROTOR', 'Rotor', 'devir', 'Ø 116,8 m · 3 kanat', 0.125) + bag('mek', 'Mekanik güç, düşük devir') +
      dugum('', 'MAIN SHAFT', 'Ana mil', 'tork', 'düşük devir, yüksek tork', 0.59) + bag('mek', 'Mekanik güç, düşük devir') +
      dugum('', 'GEARBOX', 'Dişli kutusu', '', '3 kademe · devri artırır', 0.635) + bag('mek ea-hizli', 'Mekanik güç, yüksek devir') +
      dugum('', 'GENERATOR', 'Jeneratör', 'kw', 'çift beslemeli asenkron · 660 V', 0.76) +
      '<div class="ea-catal">' +
        '<div class="ea-kol"><span class="ea-kol-ad">Stator → doğrudan</span>' + bag('elk', 'Elektrik: stator doğrudan şebekeye') + '</div>' +
        '<div class="ea-kol"><span class="ea-kol-ad">Rotor devresi</span>' + bag('elk', 'Elektrik: rotor devresi konvertöre') +
          dugum('ea-kucuk', 'CONVERTER', 'Konvertör', '', 'rotor devresini besler', 0.845) + bag('elk', 'Elektrik: konvertörden şebekeye') + '</div>' +
      '</div>' +
      dugum('ea-sebeke', 'GRID', 'Şebeke', '', 'sabit frekans · trafo üzerinden') +
    '</div>' +
    '<p class="ea-acik"><span class="ea-lej ea-lej-mek" aria-hidden="true"></span>Mekanik güç <span class="ea-lej ea-lej-elk" aria-hidden="true"></span>Elektrik güç · ' +
    'Değerler Open-Meteo tahmini ve güç eğrisi modelinden hesaplanır; türbin ölçümü değildir. Bir parçaya dokununca 3B sahnede oraya gidilir.</p>';
  [].forEach.call(eaIc.querySelectorAll('button.ea-d'), function (b) {
    b.addEventListener('click', function () { panelKapa(false); git(+b.getAttribute('data-p')); });
  });
  function vg(x, n) { return x.toFixed(n).replace('.', ','); }
  // /deneyim/ sayfasında rüzgâr paneli yok: aynı kaynak ve aynı model formülleriyle yedek hesap
  function yedekModel(d) {
    var c = d && d.current; if (!c) return null;
    var v = +c.wind_speed_120m, sic = +c.temperature_2m, bas = +c.pressure_msl; if (!isFinite(v)) return null;
    var rho = isFinite(sic) && isFinite(bas) ? (bas * 100 * Math.exp(-9.80665 * 120 / (287.05 * (sic + 273.15)))) / (287.05 * (sic - 0.78 + 273.15)) : 1.225;
    var A = Math.PI * 116.8 * 116.8 / 4, kw = 0, dv = 0;
    if (v >= 3 && v <= 25) {
      var cp = v >= 6.5 ? 0.452 : (function (x) { return 0.10 + (0.452 - 0.10) * (3 * x * x - 2 * x * x * x); })((v - 3) / 3.5);
      var ham = 0.5 * rho * A * v * v * v * cp / 1000; kw = ham / Math.pow(1 + Math.pow(ham / 3000, 6), 1 / 6);
      dv = Math.max(7.9, Math.min(14.1, (8 * v / 58.4) * 60 / (2 * Math.PI)));
    }
    return { v: v, rho: rho, devir: dv, kw: kw, durum: v < 3 ? 'beklemede' : v > 25 ? 'durdu' : 'uretimde', t: Date.now() };
  }
  var eaYedekIstendi = false;
  function eaYaz() {
    var r = window.__sonerRuzgar;
    if (!r && !eaYedekIstendi) {
      eaYedekIstendi = true;
      fetch('/api/ruzgar?s=aliaga', { headers: { accept: 'application/json' } }).then(function (x) { if (!x.ok) throw 0; return x.json(); })
        .then(function (d) { var m = yedekModel(d); if (m && !window.__sonerRuzgar) { window.__sonerRuzgar = m; eaYaz(); } }).catch(function () {});
    }
    var D = eaIc.querySelector('#eaDurum'), set = function (k, t) { var e = eaIc.querySelector('[data-ea="' + k + '"]'); if (e) e.textContent = t; };
    if (!r) { set('v', '–'); set('devir', '–'); set('tork', '–'); set('kw', '–'); D.textContent = 'Canlı rüzgâr verisi bekleniyor; akış şeması genel çalışma ilkesini gösterir.'; eaPanel.setAttribute('data-durum', 'yok'); return; }
    var omega = r.devir * 2 * Math.PI / 60, tork = omega > 0 ? r.kw / omega : 0;   // kW / (rad/s) = kN·m
    set('v', vg(r.v, 1) + ' m/s'); set('devir', vg(r.devir, 1) + ' d/dk');
    set('tork', tork > 0 ? '≈ ' + Math.round(tork).toLocaleString('tr-TR') + ' kN·m' : '0 kN·m');
    set('kw', Math.round(r.kw).toLocaleString('tr-TR') + ' kW');
    eaPanel.setAttribute('data-durum', r.durum);
    D.textContent = r.durum === 'beklemede' ? 'Rüzgâr ' + vg(r.v, 1) + ' m/s: devreye girme hızının (3 m/s) altında. Türbin beklemede; mekanik ve elektrik akış yok.'
      : r.durum === 'durdu' ? 'Rüzgâr ' + vg(r.v, 1) + ' m/s: devreden çıkma hızının (25 m/s) üstünde. Kanatlar yelkende, üretim durdu.'
      : 'Üretimde · Aliağa, göbek 120 m · tahmin + model, anma gücünün %' + Math.round(r.kw / 30) + '’i.';
    // akış hızı: mekanik bağlar rotor devriyle, elektrik bağlar güç oranıyla orantılı
    var tur = r.devir > 0 ? 60 / r.devir : 0, oran = r.kw / 3000;
    eaPanel.style.setProperty('--ea-mek', tur ? (tur / 4).toFixed(2) + 's' : '0s');
    eaPanel.style.setProperty('--ea-hizli', tur ? (tur / 14).toFixed(2) + 's' : '0s');
    eaPanel.style.setProperty('--ea-elk', oran > 0 ? (2.6 - 1.8 * oran).toFixed(2) + 's' : '0s');
    eaPanel.style.setProperty('--ea-hava', Math.max(0.5, 6 / Math.max(r.v, 0.5)).toFixed(2) + 's');
  }
  function eaDur() {}
  window.addEventListener('ss:ruzgar', function () { if (acikPanel && acikPanel.p === eaPanel) eaYaz(); });
  eaBtn.addEventListener('click', function () {
    if (acikPanel && acikPanel.p === eaPanel) { panelKapa(true); return; }
    eaYaz(); panelAc(eaPanel, eaBtn);
  });
  function statik(dugme) {
    bolum.classList.remove('uc-boyut', 'dny-hazirlaniyor', 'dny-akis', 'hazir');
    bolum.classList.add('statik');
    bolum.removeAttribute('aria-busy');
    kuruluyor = false;
    acilabilir = !!dugme;
    if (basla && !sahaya) basla.hidden = false;
    if (baslaBtn) baslaBtn.hidden = !dugme;
  }
  function kur() {
    if (kuruluyor || sahneS) return;
    kuruluyor = true;
    taniT0 = performance.now(); tani('basla', hareketAz ? { neden: 'hareket-azaltilmis' } : {});
    bolum.classList.remove('statik');
    bolum.classList.add('uc-boyut', 'dny-akis', 'dny-hazirlaniyor');
    bolum.setAttribute('aria-busy', 'true');
    if (basla) basla.hidden = true;
    acilabilir = false;
    if (filmKip) bolum.classList.add('dny-film');
    import(filmKip ? '/assets/deneyim/film.js?v=667a9d53' : '/assets/deneyim/deneyim.js?v=4dd84b24').then(function (mod) {
      kurulumT0 = performance.now();
      DURAKLAR = mod.DURAKLAR; rayKur();
      var S = (filmKip ? mod.filmBaslat : mod.deneyimBaslat)(tuval, bolum, {
        ilerleme: function (p, y, icerde) { ilerleme(p, y, icerde); irtifaGuncelle(p, y); },
        noktalar: noktalar,
        etiketler: etiketler,
        uzerinde: uzerinde,
        ses: function (d) { if (sesMotor) sesMotor.guncelle(d); },
        cizim: function (c) { bolum.classList.toggle('cizimde', c > 0.5); bolum.style.setProperty('--cizim', c.toFixed(3)); },
        karartma: function (k) { if (!kesiyor) kararti.style.opacity = k.toFixed(3); },
        hazir: function () { hazirAni = performance.now(); var hs = Math.round(performance.now() - taniT0), ks = Math.round(performance.now() - (kurulumT0 || taniT0)); var iz = sahneS && sahneS.isinma; tani('hazir', { sure_ms: hs, kurulum_ms: ks, neden: iz ? ('isinma ' + iz.once + '>' + iz.guvenli + '>' + iz.sonra + (iz.hata ? ' ' + iz.hata : '')) : null }); if (ks > 8000 && !filmKip && !gizlendi && !zorla3B) { zayifIsaretle('ilk-kare-' + ks); if (sahneS && sahneS.birak) sahneS.birak('ilk-kare-gec'); else birak(); return; } bolum.classList.remove('dny-hazirlaniyor'); bolum.classList.add('hazir'); bolum.removeAttribute('aria-busy'); },
        takilma: function (d) { if (!zorla3B && d.ms > 1500 && d.is > 1000 && hazirAni && performance.now() - hazirAni > 2500 && !filmKip && !gizlendi && !document.hidden) { zayifIsaretle('donma-' + d.ms); if (sahneS && sahneS.birak) setTimeout(function () { sahneS.birak('donma'); }, 0); } tani('takilma', { neden: 'p=' + d.p + ' ms=' + d.ms + ' is=' + d.is + ' prog+' + d.prog + ' geo+' + d.geo + ' tex+' + d.tex + ' vh=' + d.vh, kalite: d.kalite, sure_ms: d.ms }); },
        hata: function (neden, d) { d = d || {}; if (neden === 'yavas' && !filmKip) zayifIsaretle('yavas'); tani('birak', { neden: neden, kalite: d.kalite, kare_ms: d.kare_ms, sure_ms: Math.round(performance.now() - taniT0) }); birak(); }
      });
      if (!S) { tani('hata', { neden: 'sahne-kurulamadi' }); statik(false); } else { sahneS = S; if (kayitliDuraklat() && S.duraklat) S.duraklat(true); }
    }).catch(function (e) { console.error('deneyim yüklenemedi:', e); tani('hata', { neden: 'yukleme: ' + String(e && e.message || e).slice(0, 120) }); statik(false); });
    // 15 sn içinde ilk kare gelmezse bekletme: kapağa dön. Süre yalnız sekme görünürken işler;
    // arka planda açılan sekmede tarayıcı çizim yapmaz, sahne bu yüzden yanlışlıkla kapanmasın.
    var gorunurMs = 0, sonKontrol = performance.now(), indiBitti = false;
    var bekci = setInterval(function () {
      var simdi = performance.now();
      if (!document.hidden) gorunurMs += simdi - sonKontrol;
      sonKontrol = simdi;
      if (bolum.classList.contains('hazir') || bolum.classList.contains('statik')) { clearInterval(bekci); return; }
      // İndirme sürerken 30 sn tanınır; dosyalar inince sayaç sıfırlanır ve sahneye kendi 15 sn'si verilir.
      // Böylece yavaş internetteki sağlam bir cihaz, indirme yüzünden kapağa düşmez.
      if (!kurulumT0) { if (gorunurMs < 30000) return; }
      else { if (!indiBitti) { indiBitti = true; gorunurMs = Math.min(gorunurMs, simdi - kurulumT0); } if (gorunurMs < 15000 || zorla3B) return; }
      clearInterval(bekci);
      if (sahneS && sahneS.birak) sahneS.birak('zaman-asimi'); else { tani('birak', { neden: 'zaman-asimi-yukleme', sure_ms: 15000 }); birak(); }
    }, 500);
  }
  var baslaBtn = $('dnyBaslaBtn');
  if (baslaBtn) baslaBtn.addEventListener('click', kur);

  // 3B sahne vazgeçerse (bağlam kaybı ya da cihaz en düşük kalitede bile yetişemiyorsa)
  // bölüm tek ekranlık kapağa döner; okuyucu uzun boş bir kaydırma yolunda kalmaz.
  function birak() {
    var r = bolum.getBoundingClientRect(), icinde = r.top < 0 && r.bottom > innerHeight;
    statik(false);
    if (icinde) window.scrollTo({ top: Math.round(scrollY + bolum.getBoundingClientRect().bottom - 72), behavior: 'instant' });
  }

  if (!filmKip) try { var tc = document.createElement('canvas'); if (!(window.WebGLRenderingContext && (tc.getContext('webgl2') || tc.getContext('webgl')))) { taniT0 = 1; tani('statik', { neden: 'webgl-yok' }); return statik(false); } } catch (e) { tani('statik', { neden: 'webgl-hata' }); return statik(false); }
  // "Hareketi azalt" açık cihazlarda da sahne kendiliğinden açılır; deneyim.js bu tercihte kendiliğinden kamera
  // kaymasını ve el kamerası nefesini kapatır, kamera yalnız kaydırmayla ilerler. Fotoğrafa düşmek banner'ı
  // "çalışmıyor" gösteriyordu (8 Ekim tanı kayıtları: Mac, hareket-azaltilmis). Veri tasarrufu açıksa 3B indirilmez.
  if (navigator.connection && navigator.connection.saveData) {
    tani('statik', { neden: 'veri-tasarrufu' });
    return statik(true);
  }
  // Reserve the scroll path before the idle callback, so a fast first scroll does not jump.
  bolum.classList.add('dny-hazirlaniyor');
  var zayif = filmKip ? '' : zayifCihaz();
  if (zayif) { taniT0 = 1; tani('statik', { neden: 'zayif-' + zayif }); bolum.classList.remove('dny-hazirlaniyor'); return statik(false); }
  if ('requestIdleCallback' in window) requestIdleCallback(kur, { timeout: 1200 }); else setTimeout(kur, 300);
})();
