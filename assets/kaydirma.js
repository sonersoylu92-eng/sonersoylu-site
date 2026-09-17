/* sonersoylu.com — kaydırma davranışları.
   1) okuma ilerleme çubuğu
   2) görünürlüğe girince beliren bölümler (kademeli)
   3) rakam sayaçları
   4) hero fotoğrafında hafif paralaks
   5) ana sayfada bölüm noktaları
   6) yükseklik sahnesi (kaydırdıkça temelden kanat ucuna)

   Hareketten rahatsız olan kullanıcı için (prefers-reduced-motion) hepsi kapanır;
   içerik olduğu gibi görünür. JS çalışmazsa da hiçbir şey gizlenmez: gizleme
   sınıfları yalnızca buradan ekleniyor. */
(function () {
  'use strict';

  var az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rAF = window.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  // ---- 1. okuma ilerleme çubuğu -------------------------------------------
  var cubuk, kot;
  (function () {
    var basik = document.querySelector('header');
    if (!basik) return;
    var kutu = document.createElement('div');
    kutu.id = 'okuma';
    kutu.setAttribute('aria-hidden', 'true');
    cubuk = document.createElement('i');
    kutu.appendChild(cubuk);
    basik.appendChild(kutu);
    // sayfayı okumak = kuleye tırmanmak: çubuk aynı zamanda bir kot göstergesi
    kot = document.createElement('span');
    kot.id = 'kot';
    kot.setAttribute('aria-hidden', 'true');
    kot.textContent = '0 m';
    kutu.appendChild(kot);
  })();

  // ---- 2. beliren bölümler -------------------------------------------------
  var SECICI = [
    'section .head', 'section > .wrap > .intro', '.pitch', '.stats > div',
    '.roles li', '.posts a', '.gal figure', '.video', '.card', '.plat li',
    '.chips', '.nxt a', '.blist a', '.rakam > div', '.tkart > div',
    '.adim > div', '.iec > div', '.rsl > div', '.kural > div', '.ozet > div',
    '.ist', '.qa details', '.kaynak', '.hedef', '.snot', '.uyari',
    '.ders h2', '.sinav .soru', '.gez a', '.yks-liste li',
    '.abone', '.form', '.grafik', '.simdi', '.toc', '.izmir', '.gelen',
  ].join(',');

  function belirtmeyiKur() {
    if (az || !('IntersectionObserver' in window)) return;
    var hepsi = [].slice.call(document.querySelectorAll(SECICI));
    var alt = window.innerHeight;
    var gruplar = new Map();

    hepsi.forEach(function (el) {
      if (el.closest('#araKat') || el.closest('header')) return;
      var r = el.getBoundingClientRect();
      if (r.top < alt * 0.92) return;      // ilk ekranda görünenlere dokunma
      if (r.height > alt * 1.4) return;    // çok uzun bloklar zıplatır
      var ana = el.parentElement || document.body;
      var n = gruplar.get(ana) || 0;
      gruplar.set(ana, n + 1);
      el.setAttribute('data-bel', '');
      el.style.setProperty('--gec', Math.min(n, 5) * 55 + 'ms');
    });

    var g = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (x) {
        if (!x.isIntersecting) return;
        x.target.classList.add('gor');
        g.unobserve(x.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    hepsi.forEach(function (el) { if (el.hasAttribute('data-bel')) g.observe(el); });
  }

  // ---- 3. rakam sayaçları --------------------------------------------------
  function sayaclariKur() {
    if (az || !('IntersectionObserver' in window)) return;
    var hedefler = [].slice.call(document.querySelectorAll('.stats dd.v, .rakam .v'))
      .filter(function (el) { return /^[^\d]*\d/.test(el.textContent); });
    if (!hedefler.length) return;

    var g = new IntersectionObserver(function (girdiler) {
      girdiler.forEach(function (x) {
        if (!x.isIntersecting) return;
        g.unobserve(x.target);
        say(x.target);
      });
    }, { threshold: 0.4 });
    hedefler.forEach(function (el) { g.observe(el); });

    function say(el) {
      var ham = el.textContent;
      var m = ham.match(/(\d+(?:[.,]\d+)?)/);
      if (!m) return;
      var metin = m[1];
      var ondalik = (metin.split(/[.,]/)[1] || '').length;
      var ayrac = metin.indexOf(',') > -1 ? ',' : '.';
      var son = parseFloat(metin.replace('.', '').replace(',', '.'));
      if (!isFinite(son) || son > 100000) return;
      var bas = performance.now(), sure = 900;
      el.style.fontVariantNumeric = 'tabular-nums';
      function adim(t) {
        var p = Math.min(1, (t - bas) / sure);
        var e = 1 - Math.pow(1 - p, 3);
        var d = son * e;
        var yazi = ondalik
          ? d.toFixed(ondalik).replace('.', ayrac)
          : Math.round(d).toLocaleString('tr-TR');
        el.textContent = ham.replace(m[1], yazi);
        if (p < 1) rAF(adim);
        else el.textContent = ham;
      }
      rAF(adim);
    }
  }

  // ---- 4/5/6: kaydırmaya bağlı işler --------------------------------------
  var isler = [];
  function ekle(f) { isler.push(f); }

  var bekliyor = false;
  function tetikle() {
    if (bekliyor) return;
    bekliyor = true;
    rAF(function () {
      bekliyor = false;
      for (var i = 0; i < isler.length; i++) isler[i]();
    });
  }

  // ilerleme çubuğu her zaman çalışsın (hareket değil, göstergedir)
  if (cubuk) {
    ekle(function () {
      var h = document.documentElement;
      var yol = h.scrollHeight - h.clientHeight;
      var p = yol > 40 ? Math.min(1, Math.max(0, h.scrollTop / yol)) : 0;
      if (kot) kot.textContent = Math.round(p * 178) + ' m';
      cubuk.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    });
  }

  // hero paralaks
  (function () {
    if (az) return;
    var img = document.querySelector('.hero .shot img');
    if (!img) return;
    img.style.willChange = 'transform';
    ekle(function () {
      var r = img.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      img.style.transform = 'translate3d(0,' + ((p - 0.5) * -34).toFixed(2) + 'px,0) scale(1.07)';
    });
  })();

  // bölüm noktaları (yalnızca ana sayfada, geniş ekranda)
  (function () {
    if (!document.getElementById('saha')) return;
    var bolumler = [].slice.call(document.querySelectorAll('main > section[id]'));
    if (bolumler.length < 4) return;
    var ad = {
      saha: 'Saha geçmişi', yazilar: 'Yazılar', rehbertanit: 'Rehber',
      kaynaktanit: 'Kaynaklar', yenikaynak: 'Yeni kaynaklar', yukseklik: 'Yükseklik',
      n117tanit: 'N117', n90tanit: 'N90', sahadan: 'Sahadan',
      yetkinlik: 'Yetkinlik', iletisim: 'İletişim',
    };
    var nav = document.createElement('nav');
    nav.id = 'noktalar';
    nav.setAttribute('aria-label', 'Bölümler');
    bolumler.forEach(function (b) {
      var a = document.createElement('a');
      a.href = '#' + b.id;
      a.innerHTML = '<i></i><span>' + (ad[b.id] || b.id) + '</span>';
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    var baglar = [].slice.call(nav.children);
    ekle(function () {
      var orta = window.innerHeight * 0.35, en = -1, enf = 1e9;
      bolumler.forEach(function (b, i) {
        var f = Math.abs(b.getBoundingClientRect().top - orta);
        if (f < enf) { enf = f; en = i; }
      });
      baglar.forEach(function (a, i) { a.classList.toggle('on', i === en); });
    });
  })();

  // yükseklik sahnesi
  (function () {
    var sar = document.getElementById('yksSar');
    if (!sar) return;
    var sahne = document.getElementById('yksSahne');
    var svg = document.getElementById('yksSvg');
    var kotEl = document.getElementById('yksKot');
    var basEl = document.getElementById('yksBas');
    var acEl = document.getElementById('yksAc');
    var gokEl = document.getElementById('yksGok');
    var rotor = document.getElementById('yksRotor');
    var olcuG = document.getElementById('yksOlcu');
    var ipucu = sahne.querySelector('.yks-ipucu');

    // duraklar: [p eşiği, kot, başlık, açıklama]
    var DURAK = [
      [0.00, '1,8 m', 'İnsan', 'Kule kapısının önünde durduğunuzda ölçek buradan başlar. Kapının ardında merdiven ya da asansör var; yukarısı bu boyun yüz katı.'],
      [0.22, '8 m', 'İki katlı ev', 'Kulenin dip çapı 4,3 metre. Yani bir evin genişliği kadar çelik boruyu dikey durdurup içine giriyorsunuz.'],
      [0.44, '45 m', 'On beş katlı blok', 'Buraya kadar tırmandığınızda henüz kulenin ortasındasınız. Kule dört ya da beş parça hâlinde geldi; her ekin flanşında yüzlerce cıvata var.'],
      [0.66, '120 m', 'Göbek yüksekliği', 'Naselin içi. Ana yatak, dişli kutusu, jeneratör ve konvertör burada; ayakta çalışabileceğiniz kadar yer var, fazlası değil.'],
      [0.88, '178 m', 'Kanat ucu', 'Kanat yukarı baktığında ulaştığı nokta. Ucu anma devrinde saniyede 77 metre gidiyor; saatte 280 kilometre.'],
    ];

    // kamera anahtar kareleri: [p, görünen yükseklik (m), kamera merkezi x (m)]
    // [p, görünen yükseklik (m), kamera merkezi x (m), kadraja sığması gereken genişlik (m)]
    var KARE = [[0, 6, -4, 7], [0.14, 10, -5, 10], [0.30, 20, -10, 17],
                [0.50, 62, -18, 46], [0.74, 150, -14, 99], [1, 226, -8, 112]];

    function aradeger(p, i) {
      for (var k = 1; k < KARE.length; k++) {
        if (p <= KARE[k][0] || k === KARE.length - 1) {
          var a = KARE[k - 1], b = KARE[k];
          var t = (p - a[0]) / (b[0] - a[0]);
          t = Math.max(0, Math.min(1, t));
          t = t * t * (3 - 2 * t);                       // yumuşak geçiş
          return i === 1
            ? a[1] * Math.pow(b[1] / a[1], t)            // yükseklik: logaritmik
            : i === 3
              ? a[3] + (b[3] - a[3]) * t
              : a[2] + (b[2] - a[2]) * t;
        }
      }
      return KARE[KARE.length - 1][i];
    }

    var sonDurak = -1, sonP = -1;

    function ciz(ham) {
      var p = Math.min(1, ham / 0.94);                   // son bölümde sahne dursun
      if (Math.abs(p - sonP) < 0.0005) return;
      sonP = p;
      var kutu = sahne.getBoundingClientRect();
      var ar = kutu.width / Math.max(1, kutu.height);
      // metin kutusu yer kaplar: geniş ekranda sağdan, dar ekranda alttan pay bırak
      var altPay = ar < 1 ? 0.32 : 0.08;
      var yanPay = ar < 1 ? 0 : Math.min(0.34, 420 / Math.max(1, kutu.width));
      var h = Math.max(aradeger(p, 1) / (1 - altPay),
                       aradeger(p, 3) / (1 - yanPay) / Math.max(0.25, ar));
      var w = h * ar;
      var cx = aradeger(p, 2);                      // kutunun kapatmadığı alanın merkezi
      var zeminAlti = h * altPay;
      svg.setAttribute('viewBox',
        (cx - w * (1 - yanPay) / 2).toFixed(2) + ' ' + (-h + zeminAlti).toFixed(2) + ' ' +
        w.toFixed(2) + ' ' + h.toFixed(2));

      // çizgi kalınlıkları ve yazı boyu tek değişkenle ölçeklenir (ucuz)
      svg.style.setProperty('--yk', (h / 620).toFixed(4));
      svg.style.setProperty('--yfs', (h / 34).toFixed(3));

      // gökyüzü: yükseldikçe koyulaşır
      if (gokEl) gokEl.style.opacity = (0.15 + p * 0.85).toFixed(3);

      // ölçü çizgileri yalnızca yeterince uzaktayken
      if (olcuG) olcuG.style.opacity = (ar < 1.2 || p < 0.55) ? '0' : Math.min(1, (p - 0.55) / 0.15).toFixed(2);

      // rotor tam bir tur atsın; sonunda bir kanat tam yukarı baksın
      if (rotor) rotor.setAttribute('transform', 'rotate(' + (p * 360).toFixed(1) + ' 0 -120)');

      if (ipucu) ipucu.style.opacity = p > 0.04 ? '0' : '';

      // metin
      var d = 0;
      for (var i = 0; i < DURAK.length; i++) if (p >= DURAK[i][0]) d = i;
      if (d !== sonDurak) {
        sonDurak = d;
        kotEl.textContent = DURAK[d][1];
        basEl.textContent = DURAK[d][2];
        acEl.textContent = DURAK[d][3];
        var kutuM = document.getElementById('yksMetin');
        kutuM.classList.remove('gec');
        void kutuM.offsetWidth;
        kutuM.classList.add('gec');
      }
    }

    if (az) {
      sar.style.height = 'auto';
      var ust = document.querySelector('.yks-bas .mono');
      if (ust) ust.textContent = '1,8 metreden 178 metreye';
      ciz(1);
      var liste = document.getElementById('yksListe');
      if (liste) {
        liste.hidden = false;
        liste.innerHTML = DURAK.map(function (x) {
          return '<li><b>' + x[1] + ' &#183; ' + x[2] + '</b><span>' + x[3] + '</span></li>';
        }).join('');
      }
      return;
    }

    ekle(function () {
      var r = sar.getBoundingClientRect();
      var yol = r.height - window.innerHeight;
      if (yol <= 0) { ciz(0); return; }
      var p = Math.min(1, Math.max(0, -r.top / yol));
      ciz(p);
    });
    ciz(0);
  })();


  // ---- 6. dergi katmanı: kapak üstünde saydam başlık, kesit derinliği -----
  (function () {
    var kapak = document.querySelector('.kapak');
    var bas = document.querySelector('header');
    if (kapak && bas) {
      ekle(function () {
        var esik = kapak.getBoundingClientRect().bottom - 90;
        bas.classList.toggle('sabit', esik <= 0);
      });
    }

    if (az) return;

    // kapak: kaydırırken görsel derinleşsin, yazı yukarı süzülüp sönsün
    var kgor = kapak && kapak.querySelector('.kapak-gorsel');
    var kic = kapak && kapak.querySelector('.kapak-ic');
    if (kgor && kic) {
      ekle(function () {
        var h = kapak.offsetHeight || 1;
        var p = Math.min(1, Math.max(0, -kapak.getBoundingClientRect().top / h));
        // açılış animasyonu biterken devralalım; başta hiç dokunma
        if (p <= 0.001 && !kapak.__oynadi) return;
        kapak.__oynadi = true;
        kgor.style.transform = 'translate3d(0,' + (p * 14).toFixed(2) + '%,0) scale('
          + (1 + p * 0.07).toFixed(4) + ')';
        kic.style.transform = 'translate3d(0,' + (p * -34).toFixed(1) + 'px,0)';
        kic.style.opacity = Math.max(0, 1 - p * 1.35).toFixed(3);
      });
    }

    // terim şeridi: kendiliğinden değil, sayfa kaydıkça akar
    var serit = document.getElementById('serit');
    var seritIc = document.getElementById('seritIc');
    if (serit && seritIc) {
      ekle(function () {
        var y = window.innerHeight;
        var r = serit.getBoundingClientRect();
        if (r.bottom < -200 || r.top > y + 200) return;
        var yari = seritIc.scrollWidth / 2;          // liste iki kez basılı
        var ilerleme = (y - r.top) / (y + r.height); // 0 → 1
        var x = -(((ilerleme * yari * 1.6) % yari) || 0);
        seritIc.style.setProperty('--kay', x.toFixed(1) + 'px');
      });
    }

    var kesitler = [].slice.call(document.querySelectorAll('.kesit img'));
    if (!kesitler.length) return;
    ekle(function () {
      var y = window.innerHeight;
      kesitler.forEach(function (im) {
        var r = im.parentNode.getBoundingClientRect();
        if (r.bottom < -80 || r.top > y + 80) return;
        var p = (r.top + r.height / 2 - y / 2) / (y / 2 + r.height / 2);
        im.style.transform = 'translate3d(0,' + (p * -7).toFixed(2) + '%,0) scale('
          + (1.02 + Math.abs(p) * 0.04).toFixed(4) + ')';
      });
    });
  })();

  window.addEventListener('scroll', tetikle, { passive: true });
  window.addEventListener('resize', function () { tetikle(); }, { passive: true });
  belirtmeyiKur();
  sayaclariKur();
  tetikle();
})();

/* ---- büyüteç: galeride bir kareye dokununca tam boy açılır ---------------
   Girişteki "büyütmek için üzerine dokun" sözü bugüne kadar karşılıksızdı.
   Klavyeyle de açılıyor, Esc kapatıyor, ok tuşları kareler arasında geziyor. */
(function () {
  'use strict';
  var kareler = [].slice.call(document.querySelectorAll('.gal figure[data-full]'));
  if (!kareler.length) return;
  var az = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var kutu, gorsel, yazi, kunye, sayac, acik = -1, donus = null;

  kareler.forEach(function (f, i) {
    f.setAttribute('tabindex', '0');
    f.setAttribute('role', 'button');
    var bas = f.querySelector('figcaption');
    f.setAttribute('aria-label', (bas ? bas.textContent.trim() + ', ' : '') + 'büyüt');
    f.addEventListener('click', function () { ac(i); });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ac(i); }
    });
  });

  function kur() {
    kutu = document.createElement('div');
    kutu.id = 'buyutec';
    kutu.setAttribute('role', 'dialog');
    kutu.setAttribute('aria-modal', 'true');
    kutu.setAttribute('aria-label', 'Fotoğraf');
    kutu.innerHTML =
      '<button type="button" class="kapat" aria-label="Kapat">×</button>' +
      '<button type="button" class="gez onceki" aria-label="Önceki fotoğraf">‹</button>' +
      '<figure><img alt=""><figcaption><span class="ad"></span>' +
      '<span class="kun"></span><span class="say"></span></figcaption></figure>' +
      '<button type="button" class="gez sonraki" aria-label="Sonraki fotoğraf">›</button>';
    document.body.appendChild(kutu);
    gorsel = kutu.querySelector('img');
    yazi = kutu.querySelector('.ad');
    kunye = kutu.querySelector('.kun');
    sayac = kutu.querySelector('.say');
    kutu.querySelector('.kapat').addEventListener('click', kapat);
    kutu.querySelector('.onceki').addEventListener('click', function (e) { e.stopPropagation(); git(-1); });
    kutu.querySelector('.sonraki').addEventListener('click', function (e) { e.stopPropagation(); git(1); });
    kutu.addEventListener('click', function (e) { if (e.target === kutu || e.target.tagName === 'FIGURE') kapat(); });
    document.addEventListener('keydown', function (e) {
      if (!kutu.classList.contains('acik')) return;
      if (e.key === 'Escape') kapat();
      else if (e.key === 'ArrowRight') git(1);
      else if (e.key === 'ArrowLeft') git(-1);
      else if (e.key === 'Tab') {                       // odak kutunun içinde kalsın
        var od = [].slice.call(kutu.querySelectorAll('button'));
        var i = od.indexOf(document.activeElement);
        e.preventDefault();
        od[(i + (e.shiftKey ? od.length - 1 : 1) + od.length) % od.length].focus();
      }
    });
  }

  function goster(i) {
    var f = kareler[i], im = f.querySelector('img');
    var bas = f.querySelector('figcaption');
    gorsel.src = f.getAttribute('data-full');
    gorsel.alt = im ? im.alt : '';
    yazi.textContent = bas ? bas.textContent.trim() : '';
    kunye.textContent = f.getAttribute('data-kunye') || '';
    sayac.textContent = (i + 1) + ' / ' + kareler.length;
    acik = i;
  }

  function ac(i) {
    if (!kutu) kur();
    donus = kareler[i];
    goster(i);
    kutu.classList.add('acik');
    if (az) kutu.classList.add('sessiz');
    document.documentElement.classList.add('kilit');
    kutu.querySelector('.kapat').focus();
  }

  function git(d) { goster((acik + d + kareler.length) % kareler.length); }

  function kapat() {
    kutu.classList.remove('acik');
    document.documentElement.classList.remove('kilit');
    if (donus) donus.focus();
  }
})();
