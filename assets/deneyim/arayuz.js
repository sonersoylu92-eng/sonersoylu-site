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
    var r = bolum.getBoundingClientRect(), yol = bolum.offsetHeight - innerHeight;
    var hedef = Math.round(scrollY + r.top + yol * p);
    if (Math.abs(p - sonP) < 0.1 || kesiyor) { window.scrollTo({ top: hedef, behavior: 'instant' }); return; }   // yakın: kamera ataletle süzülür
    // uzak bölüm: kısa kararma, kesme, açılma (film kurgusu gibi)
    kesiyor = true; kararti.style.transition = 'opacity .3s ease'; kararti.style.opacity = '1';
    setTimeout(function () {
      window.scrollTo({ top: hedef, behavior: 'instant' }); window.__deneyimKes = true;
      setTimeout(function () {
        kararti.style.transition = 'opacity .6s ease'; kesiyor = false;
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
  var sonDurak = -2, sonRay = -1, sonAlt = -1;
  function ilerleme(p, y, icerde) {
    sonP = p;
    bolum.classList.toggle('gecti', p > 0.02);
    bolum.classList.toggle('sonda', p > 0.95);
    cizgi.style.setProperty('--p', p.toFixed(4));
    eBolum.textContent = bolumAdi(p);
    eKot.innerHTML = icerde ? '<span class="dny-ic">Nasel içi</span> · <b>120</b> m' : 'Kot <b>' + Math.round(y) + '</b> m';

    // parça etiketi: durağa yaklaşınca belirir, uzaklaşınca söner
    var en = -1, fark = 1;
    DURAKLAR.forEach(function (d, i) { var f = Math.abs(p - d.p); if (f < fark) { fark = f; en = i; } });
    var goster = en >= 0 && fark < 0.019;
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
      k: 'Gres durumu ve kaçak, yatak sıcaklığı trendi, titreşim, sızdırmazlık.', b: 'Komşu türbinlere göre yükselen sıcaklık, titreşimde yatak frekansları, conta çevresinde gres.', u: '/n117/', ul: 'N117 turu' },
    disli:     { no: 'GEARBOX', ad: 'Dişli kutusu', t: 'Üç kademe: iki planet, bir helisel. Rotor devrini jeneratörün istediği hıza çıkarır.',
      k: 'Yağ seviyesi ve sıcaklığı, filtre fark basıncı, yağ numunesi, endoskopla dişli yüzeyleri.', b: 'Yavaş yükselen yağ sıcaklığı, filtre alarmı, yağda metal partikül, ses değişimi.', u: '/saha-notlari/disli-kutusu-sicaklik/', ul: 'İlgili vaka' },
    jenerator: { no: 'GENERATOR', ad: 'Jeneratör', t: '3.000 kW, çift beslemeli asenkron, 660 V.',
      k: 'Sargı ve yatak sıcaklıkları, yalıtım direnci, bilezik ve kömürler, soğutma havası.', b: 'Sıcaklık alarmı (önce sensörü doğrula), kömür tozu birikimi, yatak sesi.', u: '/saha-notlari/jenerator-sicaklik/', ul: 'İlgili vaka' },
    konvertor: { no: 'CONVERTER', ad: 'Konvertör', t: 'Jeneratörün rotor devresini besler; değişen rüzgârda şebekeye sabit frekans verir.',
      k: 'Soğutma devresi, bara bağlantı torkları, yük altında termal görüntü, filtreler.', b: 'Belirli güçte atan aşırı akım, aşırı sıcaklık hataları, reset sonrası normal çalışma.', u: '/saha-notlari/converter-asiri-akim/', ul: 'İlgili vaka' },
    yaw:       { no: 'YAW', ad: 'Yaw sistemi', t: 'Naseli rüzgâra döndüren halka yatak ve motorlar. Güç kabloları bu açıklıktan kuleye iner.',
      k: 'Yaw dişlisi yağlaması, fren balataları ve basıncı, motor-redüktörler, kablo burulma sayacı.', b: 'Salınım (hunting), gıcırtı ya da vuruntu, kablo burulma uyarısı.', u: '/saha-notlari/yaw-salinimi/', ul: 'İlgili vaka' },
    pitch:     { no: 'PITCH', ad: 'Pitch sistemi', t: 'Her kanadın açısını ayrı ayarlar; anma hızına gelince gücü sınırlar.',
      k: 'Kanat yatağı gresi, pitch motoru ve sürücü akımı, acil durum enerji kaynağı, açı enkoderi.', b: 'Kanatlar arası açı farkı, yüksek motor akımı, açı sapması hatası.', u: '/saha-notlari/pitch-motor-yuksek-akim/', ul: 'İlgili vaka' }
  };
  var sahne = bolum.querySelector('.dny-sahne');
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
      '<dl class="v-nb-dl"><div><dt>Kontrol</dt><dd>' + n.k + '</dd></div><div><dt>Sahada belirti</dt><dd>' + n.b + '</dd></div></dl>' +
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

  var basla = $('dnyBasla'), acilabilir = false;
  function statik(dugme) {
    bolum.classList.remove('uc-boyut', 'hazir');
    bolum.classList.add('statik');
    acilabilir = !!dugme;
    if (dugme && basla && !sahaya) basla.hidden = false;   // ana sayfada bu işi "Sahaya gir" yapıyor
  }
  function kur() {
    bolum.classList.remove('statik');
    bolum.classList.add('uc-boyut', 'dny-akis');
    if (basla) basla.hidden = true;
    acilabilir = false;
    import('/assets/deneyim/deneyim.js?v=a1acae6c').then(function (mod) {
      DURAKLAR = mod.DURAKLAR; rayKur();
      var S = mod.deneyimBaslat(tuval, bolum, {
        ilerleme: function (p, y, icerde) { ilerleme(p, y, icerde); irtifaGuncelle(p, y); },
        noktalar: noktalar,
        etiketler: etiketler,
        uzerinde: uzerinde,
        ses: function (d) { if (sesMotor) sesMotor.guncelle(d); },
        cizim: function (c) { bolum.classList.toggle('cizimde', c > 0.5); bolum.style.setProperty('--cizim', c.toFixed(3)); },
        karartma: function (k) { if (!kesiyor) kararti.style.opacity = k.toFixed(3); },
        hazir: function () { bolum.classList.add('hazir'); },
        hata: function () { statik(false); }
      });
      if (!S) statik(false); else sahneS = S;
    }).catch(function (e) { console.error('deneyim yüklenemedi:', e); statik(false); });
  }
  var baslaBtn = $('dnyBaslaBtn');
  if (baslaBtn) baslaBtn.addEventListener('click', kur);

  try { var tc = document.createElement('canvas'); if (!(window.WebGLRenderingContext && (tc.getContext('webgl2') || tc.getContext('webgl')))) return statik(false); } catch (e) { return statik(false); }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.connection && navigator.connection.saveData)) return statik(true);
  if ('requestIdleCallback' in window) requestIdleCallback(kur, { timeout: 1200 }); else setTimeout(kur, 300);
})();
