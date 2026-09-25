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
    { p: 0.0, a: 0.035, b: 0.14, k: 'Uzaktan', t: 'Ege, rüzgâr çiftliği. Göbek yerden 120 metrede; rotorun çapı 116,8 metre.' },
    { p: 0.22, a: 0.165, b: 0.325, k: 'Kule', t: 'Her bakım günü bu tırmanışla başlar. Kule içinden, 120 metre yukarı.' },
    { p: 0.355, a: 0.34, b: 0.39, k: 'Nasel', t: '' }
  ];
  function bolumAdi(p) {
    if (p < 0.15) return 'Dışarıda'; if (p < 0.31) return 'Kule'; if (p < 0.48) return 'Nasel · rotor';
    if (p < 0.72) return 'Güç aktarma'; if (p < 0.80) return 'Jeneratör'; if (p < 0.945) return 'Elektrik'; return 'Çıkış';
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
    if (bolum.classList.contains('uc-boyut')) { e.preventDefault(); git(0.2); return; }
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
        if (ai === 2) metin = canliYon() ? 'Makine dairesi. Nasel rüzgâra döner; şu an Aliağa\'daki gerçek rüzgâr yönüne bakıyor.' : 'Makine dairesi. Nasel rüzgârı takip ederek kulenin üstünde döner.';
        alt.innerHTML = '<b>' + String(ai + 1).padStart(2, '0') + ' · ' + d2.k + '</b>' + metin;
      }
      sonAlt = ai;
    }
    alt.classList.toggle('gor', ai >= 0);
    // kapak cümlesi: kamera türbine yaklaşırken satır satır belirir
    if (soz) {
      var sp = (p - 0.012) / 0.13;
      sozSatir.forEach(function (s, i) { s.classList.toggle('gor', sp > i * 0.13 && p < 0.158); });
      soz.classList.toggle('gor', p > 0.012 && p < 0.158);
    }
    son.classList.toggle('gor', p > 0.968);

    // ray: geçilen ve etkin bölüm
    var ri = 0; rayOgeleri.forEach(function (o, i) { if (p >= o.p - 0.012) ri = i; });
    if (ri !== sonRay) { rayLi.forEach(function (li, i) { li.classList.toggle('etkin', i === ri); li.classList.toggle('gecildi', i < ri); }); sonRay = ri; }
  }

  /* ---- teknik işaret noktaları: sahnede parçanın üstünde küçük halka, üstüne gelince bilgi ---- */
  var NOKTA = {
    anaYatak:  { no: 'MAIN BEARING', ad: 'Ana yatak', t: 'Rotorun ağırlığını ve rüzgâr itkisini taşır; torku ana mile bırakır.', u: '/n117/', ul: 'N117 turu' },
    disli:     { no: 'GEARBOX', ad: 'Dişli kutusu', t: 'Üç kademe: iki planet, bir helisel. Rotor devrini jeneratörün istediği hıza çıkarır.', u: '/sistemler/disli-kutusu/', ul: 'Dişli kutusu sistemi' },
    jenerator: { no: 'GENERATOR', ad: 'Jeneratör', t: '3.000 kW, çift beslemeli asenkron, 660 V.', u: '/sistemler/jenerator/', ul: 'Jeneratör sistemi' },
    konvertor: { no: 'CONVERTER', ad: 'Konvertör', t: 'Jeneratörün rotor devresini besler; değişen rüzgârda şebekeye sabit frekans verir.', u: '/sistemler/jenerator/', ul: 'Jeneratör ve konvertör' },
    yaw:       { no: 'YAW', ad: 'Yaw sistemi', t: 'Naseli rüzgâra döndüren halka yatak ve motorlar. Güç kabloları bu açıklıktan kuleye iner.', u: '/sistemler/yaw/', ul: 'Yaw sistemi' },
    pitch:     { no: 'PITCH', ad: 'Pitch sistemi', t: 'Her kanadın açısını ayrı ayarlar; anma hızına gelince gücü sınırlar.', u: '/sistemler/pitch/', ul: 'Pitch sistemi' }
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
    pencere.innerHTML = '<p class="v-nb-no">' + n.no + '</p><p class="v-nb-ad">' + n.ad + '</p><p class="v-nb-t">' + n.t + '</p><a class="v-nb-git" href="' + n.u + '">' + n.ul + '</a>';
    pencere.classList.add('gor'); konumla();
  }
  function noktaKapa(id, zorla) { if (acikNokta === id || zorla) { acikNokta = null; pencere.classList.remove('gor'); } }
  function konumla() {
    if (!acikNokta) return;
    var n = null; sonListe.forEach(function (o) { if (o.id === acikNokta) n = o; });
    if (!n || !n.gor) { noktaKapa(acikNokta, true); return; }
    var w = sahne.clientWidth, h = sahne.clientHeight, sag = n.x > w - 300, ust = n.y > h - 220;
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
    import('/assets/deneyim/deneyim.js?v=cdc4c247').then(function (mod) {
      DURAKLAR = mod.DURAKLAR; rayKur();
      var S = mod.deneyimBaslat(tuval, bolum, {
        ilerleme: function (p, y, icerde) { ilerleme(p, y, icerde); irtifaGuncelle(p, y); },
        noktalar: noktalar,
        karartma: function (k) { if (!kesiyor) kararti.style.opacity = k.toFixed(3); },
        hazir: function () { bolum.classList.add('hazir'); },
        hata: function () { statik(false); }
      });
      if (!S) statik(false);
    }).catch(function (e) { console.error('deneyim yüklenemedi:', e); statik(false); });
  }
  var baslaBtn = $('dnyBaslaBtn');
  if (baslaBtn) baslaBtn.addEventListener('click', kur);

  try { var tc = document.createElement('canvas'); if (!(window.WebGLRenderingContext && (tc.getContext('webgl2') || tc.getContext('webgl')))) return statik(false); } catch (e) { return statik(false); }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.connection && navigator.connection.saveData)) return statik(true);
  if ('requestIdleCallback' in window) requestIdleCallback(kur, { timeout: 1200 }); else setTimeout(kur, 300);
})();
