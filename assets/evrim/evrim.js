/* evrim.js — Rüzgârın evrimi: kaydırmaya bağlı sahne gösterisi.
 *
 * Her bölüm ([data-evre]) bir makineye karşılık gelir. Sahnede tek bir nokta bulutu var; iki komşu makinenin
 * noktaları GPU'da birbirine dönüşür (köşe gölgelendiricisi: konum A → B, rotorlar kendi göbeği çevresinde döner).
 * Kaydırma iki bölüm merkezi arasındaki yolun ortasında dönüşümü yürütür; kamera her makine için ayrı bir açıya geçer.
 * WebGL yoksa ya da hareket azaltılmışsa metin, yıl sayacı ve zaman çizelgesi yine çalışır.
 */
const kok = document.documentElement;
const prm = new URLSearchParams(location.search);
const hareketAz = matchMedia('(prefers-reduced-motion: reduce)').matches;
const GENIS = matchMedia('(min-width: 900px) and (min-aspect-ratio: 21/20)');
const inceImlec = matchMedia('(hover: hover) and (pointer: fine)').matches;

const tuval = document.getElementById('evrimSahne');
const EV = [...document.querySelectorAll('[data-evre]')].map((el, i) => ({
  el, i, ad: el.dataset.evre, yil: Number(el.dataset.yil) || null, etiket: el.dataset.etiket || '',
  kart: el.querySelector('.ev-kart'), sayilar: [...el.querySelectorAll('[data-say]')],
}));
const SON = EV.length - 1;
const hudYil = document.getElementById('hudYil');
const hudNo = document.getElementById('hudNo');
const olcekEl = document.getElementById('olcekCubuk');
const olcekYazi = olcekEl && olcekEl.querySelector('span');
const zaman = document.querySelector('.ev-zaman');
const zamanLink = zaman ? [...zaman.querySelectorAll('a[data-i]')] : [];

/* ---------------------------------------------------------------- kaydırma → dönem */
let merkez = [];
function olc() {
  const sy = scrollY, vh = innerHeight;
  merkez = EV.map((e) => { const r = e.el.getBoundingClientRect(); return r.top + sy + r.height / 2 - vh / 2; });
}
const kirp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const yumusak = (x) => x * x * (3 - 2 * x);
function haritala(y) {
  if (!merkez.length || SON < 1) return { k: 0, mix: 0 };
  if (y <= merkez[0]) return { k: 0, mix: 0 };
  if (y >= merkez[SON]) return { k: SON - 1, mix: 1 };
  let k = 0; while (k < SON - 1 && y >= merkez[k + 1]) k++;
  const f = (y - merkez[k]) / Math.max(1, merkez[k + 1] - merkez[k]);
  return { k, mix: kirp((f - 0.2) / 0.6) };
}

/* ---------------------------------------------------------------- arayüz: kartlar, yıl, çizelge */
const bicim = new Map();
function sayiBicim(b) { if (!bicim.has(b)) bicim.set(b, new Intl.NumberFormat('tr-TR', { minimumFractionDigits: b, maximumFractionDigits: b, useGrouping: false })); return bicim.get(b); }
function say(el) {
  const hedef = parseFloat(el.dataset.say), b = Number(el.dataset.basamak || 0), f = sayiBicim(b);
  if (hareketAz || !Number.isFinite(hedef)) { el.textContent = f.format(hedef); return; }
  const t0 = performance.now(), sure = 1200;
  const adim = (t) => { const q = kirp((t - t0) / sure), e = 1 - Math.pow(1 - q, 3); el.textContent = f.format(hedef * e); if (q < 1) requestAnimationFrame(adim); };
  requestAnimationFrame(adim);
}
let etkin = -1, sonYil = '', sonNo = '';
function arayuz(d) {
  const otur = d.mix < 0.5 ? d.k : Math.min(SON, d.k + 1);
  if (otur !== etkin) {
    if (etkin >= 0) EV[etkin].el.classList.remove('etkin');
    etkin = otur; const e = EV[etkin]; e.el.classList.add('etkin');
    e.sayilar.forEach(say);
    zamanLink.forEach((a) => { if (Number(a.dataset.i) === etkin) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    kok.classList.toggle('ev-girista', etkin === 0);
  }
  // yıl sayacı: geçişte sayılar akar, oturunca dönemin etiketi
  const A = EV[d.k], B = EV[Math.min(SON, d.k + 1)];
  let yazi;
  if (!hareketAz && A.yil && B.yil && d.mix > 0.06 && d.mix < 0.94) yazi = String(Math.round(A.yil + (B.yil - A.yil) * yumusak(kirp((d.mix - 0.06) / 0.88))));
  else yazi = EV[otur].etiket;
  if (yazi !== sonYil && hudYil) { hudYil.textContent = yazi; hudYil.classList.toggle('uzun', yazi.length > 5); sonYil = yazi; }
  const no = otur > 0 ? String(otur).padStart(2, '0') : '';
  if (no !== sonNo && hudNo) { hudNo.textContent = no; sonNo = no; }
  if (zaman) zaman.style.setProperty('--ilerleme', kirp((d.k + d.mix - 1) / Math.max(1, SON)).toFixed(4));
  // sahne: ölçek bölümünde kısılır, son bölümden sonra söner
  const y = scrollY;
  kok.classList.toggle('ev-bitti', y > merkez[SON] + innerHeight * 0.75);
}

const losEl = document.querySelector('.ev-olcek-bolum');
if (losEl && 'IntersectionObserver' in window) {
  new IntersectionObserver((g) => g.forEach((x) => kok.classList.toggle('ev-los', x.isIntersecting)), { rootMargin: '-30% 0px -30% 0px' }).observe(losEl);
  new IntersectionObserver((g) => g.forEach((x) => { if (x.isIntersecting) losEl.classList.add('gor'); }), { threshold: 0.25 }).observe(losEl);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#evre-"]'); if (!a) return;
  const i = EV.findIndex((x) => '#' + x.el.id === a.getAttribute('href')); if (!merkez.length || i < 0) return;
  e.preventDefault();
  // dönemin tam oturduğu noktaya git (bölüm merkezi)
  scrollTo({ top: Math.max(0, merkez[i]), behavior: hareketAz ? 'auto' : 'smooth' });
  history.replaceState(null, '', a.getAttribute('href'));
});

// klavyeyle bir kartın içine odak gelirse o döneme git (kartlar sabit konumda; sayfa kendiliğinden kaymaz)
document.addEventListener('focusin', (e) => {
  const kart = e.target.closest && e.target.closest('.ev-kart'); if (!kart || !merkez.length) return;
  const i = EV.findIndex((x) => x.kart === kart); if (i < 0 || i === etkin) return;
  scrollTo({ top: merkez[i], behavior: 'auto' });
});

/* ---------------------------------------------------------------- sunum modu
 * Lansmanda sahnede anlatmak için: "Oynat" dönemleri sırayla, sinematik bir hızla geçer ve her birinde bekler.
 * Sunum kumandası (PageDown/PageUp ya da sağ/sol ok) bir sonraki/önceki döneme götürür. Kullanıcı kaydırınca durur. */
const oynatDugmeleri = [...document.querySelectorAll('[data-oynat]')];
const tamEkranDugme = document.getElementById('evTamEkran');
let oto = false, tweenNo = 0;
const yavas = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function kaydir(hedefY, sure) {
  const no = ++tweenNo, y0 = scrollY, d = hedefY - y0, t0 = performance.now();
  const st = kok.style.scrollBehavior; kok.style.scrollBehavior = 'auto';
  return new Promise((coz) => {
    if (hareketAz || sure <= 0 || Math.abs(d) < 2) { scrollTo(0, hedefY); kok.style.scrollBehavior = st; coz(true); return; }
    const adim = (t) => {
      if (no !== tweenNo) { kok.style.scrollBehavior = st; coz(false); return; }
      const q = kirp((t - t0) / sure); scrollTo(0, y0 + d * yavas(q));
      if (q < 1) requestAnimationFrame(adim); else { kok.style.scrollBehavior = st; coz(true); }
    };
    requestAnimationFrame(adim);
  });
}
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
function otoDurum(a) {
  oto = a; kok.classList.toggle('ev-oynuyor', a);
  oynatDugmeleri.forEach((b) => { b.setAttribute('aria-pressed', String(a)); const y = b.querySelector('[data-yazi]'); if (y) y.textContent = a ? 'Duraklat' : (b.dataset.yazi || 'Oynat'); });
}
function durdur() { if (!oto) return; tweenNo++; otoDurum(false); }
async function oynat() {
  if (oto) { durdur(); return; }
  olc(); otoDurum(true);
  let i = merkez.findIndex((m) => m > scrollY + 4); if (i < 0 || scrollY >= merkez[SON] - 4) i = 1;
  if (i === 1 && scrollY > merkez[1]) await kaydir(0, 900);
  while (oto && i <= SON) {
    const tamam = await kaydir(merkez[i], i === 1 ? 2200 : 3000);
    if (!tamam || !oto) break;
    await bekle(i === SON ? 0 : 6500);
    i++;
  }
  if (oto) otoDurum(false);
}
oynatDugmeleri.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); oynat(); }));
['wheel', 'touchstart'].forEach((t) => addEventListener(t, durdur, { passive: true }));
addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-oynat]')) durdur(); });
addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(e.target.tagName) || document.getElementById('araKat')?.hidden === false) return;
  const ileri = e.key === 'PageDown' || e.key === 'ArrowRight', geri = e.key === 'PageUp' || e.key === 'ArrowLeft';
  if (!ileri && !geri) { if (!['Shift', 'Tab'].includes(e.key)) durdur(); return; }
  const y = scrollY;
  if (!merkez.length || y > merkez[SON] + innerHeight * 0.5) return;
  let i;
  if (ileri) { i = merkez.findIndex((m) => m > y + 4); if (i < 0) return; }
  else { i = -1; merkez.forEach((m, k) => { if (m < y - 4) i = k; }); if (i < 0) return; }
  e.preventDefault(); durdur(); kaydir(merkez[i], 1700);
});
if (tamEkranDugme) {
  if (!document.fullscreenEnabled) tamEkranDugme.hidden = true;
  tamEkranDugme.addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else kok.requestFullscreen().catch(() => {}); });
  document.addEventListener('fullscreenchange', () => { tamEkranDugme.setAttribute('aria-pressed', String(!!document.fullscreenElement)); setTimeout(() => { olc(); iste(); }, 120); });
}

/* ---------------------------------------------------------------- döngü */
let durum = { k: 0, mix: 0 }, sahne = null, kirli = true, rafId = 0, sonEtkilesim = performance.now();
function kare(t) {
  rafId = 0;
  durum = haritala(scrollY);
  if (kirli) { arayuz(durum); kirli = false; }
  if (sahne && !document.hidden) sahne.ciz(t, durum);
  if (sahne && sahne.surekli() && !document.hidden) rafId = requestAnimationFrame(kare);
}
function iste() { kirli = true; sonEtkilesim = performance.now(); if (!rafId) rafId = requestAnimationFrame(kare); }
addEventListener('scroll', iste, { passive: true });
addEventListener('resize', () => { olc(); if (sahne) sahne.boyut(); iste(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) iste(); });
if ('ResizeObserver' in window) new ResizeObserver(() => { olc(); iste(); }).observe(document.body);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { olc(); iste(); });
olc(); kok.classList.add('js-evrim'); iste();
// test ve tanı için salt okunur kanca
window.__evrim = { merkez: () => merkez.slice(), durum: () => durum, sahne: () => (sahne ? sahne.bilgi() : null) };

/* ---------------------------------------------------------------- tanı (yalnız sayı: süre, kare, kademe) */
const taniOturum = Math.random().toString(36).slice(2, 10);
function tani(olay, ek) {
  try {
    const v = Object.assign({ olay, sayfa: '/evrim/', oturum: taniOturum, surum: 'evrim1', ekran: innerWidth + 'x' + innerHeight, dpr: devicePixelRatio || 1 }, ek);
    const g = JSON.stringify(v);
    if (!(navigator.sendBeacon && navigator.sendBeacon('/api/tani', new Blob([g], { type: 'application/json' }))))
      fetch('/api/tani', { method: 'POST', body: g, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
  } catch (h) { /* tanı sayfayı etkilemez */ }
}

/* ---------------------------------------------------------------- 3B sahne */
const POZ = {
  toz: { az: 0, el: 0.1, yak: 1.05, telYak: 1.75, telY: -0.6 },
  panemone: { az: 0.6, el: 0.3, yak: 1.18 },
  direkli: { az: -0.5, el: 0.12, yak: 0.98 },
  kuleDegirmen: { az: 0.42, el: 0.07, yak: 0.98 },
  pompa: { az: -0.4, el: 0.1, yak: 0.98 },
  brush: { az: 0.55, el: 0.1, yak: 1 },
  smith: { az: -0.72, el: 0.12, yak: 1 },
  gedser: { az: 0.45, el: 0.07, yak: 1 },
  vindeby: { az: -0.32, el: 0.3, yak: 1, kirp: 1.35 },
  alacati: { az: 0.18, el: 0.2, yak: 1, kirp: 1.35 },
  hywind: { az: 0.62, el: 0.04, yak: 1 },
  mw15: { az: -0.45, el: 0.05, yak: 1 },
  mw26: { az: 0.25, el: -0.1, yak: 0.96 },
  n117: { az: 0.6, el: 0.05, yak: 0.98 },
};

const VS = `
attribute vec3 pB; attribute vec3 hA; attribute vec3 hB; attribute float rA; attribute float rB; attribute float tohum;
uniform float uMix, uZaman, uAciA, uAciB, uEksenA, uEksenB, uBoyut, uPR, uPatlama, uGiris, uMesafe, uFareG, uEn, uNefes;
uniform vec2 uFare; uniform vec4 uMaske; uniform vec3 uRenkY, uRenkR, uRenkZ;
varying vec3 vRenk; varying float vAlfa;
vec3 dondur(vec3 p, vec3 h, float a, float e) {
  vec3 q = p - h; float c = cos(a), s = sin(a);
  if (e < 0.5) q.xy = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  else q.xz = vec2(c * q.x - s * q.z, s * q.x + c * q.z);
  return q + h;
}
vec3 karma(float t) { return fract(sin(vec3(t * 127.1, t * 311.7, t * 74.7) + 1.3) * 43758.5453) - 0.5; }
void main() {
  float tA = mod(rA, 4.0), tB = mod(rB, 4.0);
  float gA = 1.0 - step(3.5, rA), gB = 1.0 - step(3.5, rB);
  float roA = step(0.5, tA) * step(tA, 1.5), roB = step(0.5, tB) * step(tB, 1.5);
  vec3 a = roA > 0.5 ? dondur(position, hA, uAciA, uEksenA) : position;
  vec3 b = roB > 0.5 ? dondur(pB, hB, uAciB, uEksenB) : pB;
  float m = clamp((uMix - tohum * 0.35) / 0.65, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(a, b, m);
  float yay = sin(m * 3.14159265);
  // geçişte noktalar rüzgârla savrulur: dikey eksen çevresinde girdap, hafif yükselme, dağılma
  float th = yay * uPatlama * (0.55 + tohum * 0.9);
  float c = cos(th), s = sin(th);
  p.xz = vec2(c * p.x - s * p.z, s * p.x + c * p.z);
  p += karma(tohum) * yay * uPatlama * 0.85;
  p.y += yay * uPatlama * 0.3 * (tohum - 0.3);
  p.x += yay * yay * uPatlama * 1.1 * (0.3 + tohum);   // rüzgâr yönünde akış
  // durağan nefes: noktalar çok az titreşir
  p += karma(tohum + 0.71) * uNefes * sin(uZaman * (0.6 + tohum) + tohum * 40.0);
  // giriş: geniş bir toz bulutundan yerine toplanır
  if (uGiris < 1.0) { vec3 d = karma(tohum + 0.37) * vec3(16.0, 9.0, 12.0); d.y += 1.5; p = mix(d, p, uGiris); }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 cp = projectionMatrix * mv;
  // imleç rüzgârı: ekran uzayında yakındaki noktalar kenara itilir
  if (uFareG > 0.001) {
    vec2 f = cp.xy / cp.w - uFare; f.x *= uEn;
    float etki = uFareG * exp(-dot(f, f) / 0.014);
    cp.xy += normalize(f + 1e-5) * etki * 0.05 * cp.w * vec2(1.0 / uEn, 1.0);
  }
  gl_Position = cp;
  float wR = mix(roA, roB, m);
  float wZ = mix(step(1.5, tA), step(1.5, tB), m);
  // metin sütununun arkası: zemin noktaları söner, yapı hafifçe kısılır (okunurluk)
  float mk = smoothstep(uMaske.z, uMaske.w, dot(cp.xy / cp.w, uMaske.xy));
  vRenk = mix(mix(uRenkY, uRenkR, wR), uRenkZ, wZ);
  float gor = mix(gA, gB, m);
  float derin = clamp(1.35 - (-mv.z - uMesafe) / (uMesafe * 0.8), 0.2, 1.0);
  vAlfa = gor * derin * (0.55 + 0.3 * wR) * (1.0 - wZ * 0.5) * (1.0 + yay * 0.9) * min(1.0, uGiris * 1.4 + 0.15) * mix(1.0, mix(0.4, 0.06, wZ), 1.0 - mk);
  gl_PointSize = uBoyut * uPR * clamp(uMesafe / -mv.z, 0.35, 2.4) * (1.0 + wR * 0.25);
}`;
const FS = `
precision mediump float;
varying vec3 vRenk; varying float vAlfa;
void main() {
  vec2 q = gl_PointCoord - 0.5; float d = dot(q, q);
  if (d > 0.25) discard;
  gl_FragColor = vec4(vRenk, exp(-d * 12.0) * vAlfa);
}`;
// arka plan tozu: yavaşça sürüklenen sönük noktalar (derinlik hissi)
const TVS = `
attribute float tohum; uniform float uZaman, uPR, uBoyut; varying float vA;
void main() {
  vec3 p = position; p.x = mod(p.x + uZaman * (0.05 + tohum * 0.08) + 14.0, 28.0) - 14.0;
  p.y += sin(uZaman * 0.3 + tohum * 20.0) * 0.12;
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv;
  vA = (0.12 + tohum * 0.22) * clamp(1.0 - (-mv.z - 6.0) / 30.0, 0.0, 1.0);
  gl_PointSize = uBoyut * uPR * (0.6 + tohum);
}`;
const TFS = `
precision mediump float; varying float vA;
void main() { vec2 q = gl_PointCoord - 0.5; float d = dot(q, q); if (d > 0.25) discard; gl_FragColor = vec4(0.62, 0.72, 0.78, exp(-d * 10.0) * vA); }`;

function webglVar() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (h) { return false; }
}

async function sahneKur() {
  const t0 = performance.now();
  const mobil = !GENIS.matches || matchMedia('(pointer: coarse)').matches;
  const hafif = prm.has('hafif');
  const orta = prm.get('onizleme') === 'orta';   // paylaşım görseli üretimi: kadraj ortada, metin maskesi yok
  let gpuZayif = false; try { gpuZayif = !!localStorage.getItem('dny-gpu-zayif') || Date.now() - Number(localStorage.getItem('ev-gpu-zayif') || 0) < 7 * 864e5; } catch (h) { /* depolama kapalı */ }
  const azKaynak = prm.get('kalite') !== 'yuksek' && (gpuZayif || (navigator.deviceMemory && navigator.deviceMemory <= 3) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
  const N = hafif ? 8000 : mobil ? (azKaynak ? 9000 : 13000) : (azKaynak ? 14000 : 22000);

  const THREE = await import('/assets/vendor/three.module.min.js?v=3eb31ec4');
  THREE.ColorManagement.enabled = false;
  const renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x070a0b, 1);
  let pr = Math.min(devicePixelRatio || 1, mobil ? 1.5 : 1.75);
  renderer.setPixelRatio(pr);
  const sh = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(32, 1, 0.05, 220);

  // nokta bulutu: A ve B konumları, göbekler, türler, tohum
  const geo = new THREE.BufferGeometry();
  const at = (ad, n, boyut) => { const a = new THREE.BufferAttribute(new Float32Array(n * boyut), boyut); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute(ad, a); return a; };
  const aPos = at('position', N, 3), aPB = at('pB', N, 3), aHA = at('hA', N, 3), aHB = at('hB', N, 3), aRA = at('rA', N, 1), aRB = at('rB', N, 1);
  aRA.array.fill(4); aRB.array.fill(4);
  const toh = new Float32Array(N); for (let i = 0; i < N; i++) toh[i] = Math.random();
  geo.setAttribute('tohum', new THREE.BufferAttribute(toh, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
  const U = {
    uMix: { value: 0 }, uZaman: { value: 0 }, uAciA: { value: 0 }, uAciB: { value: 0 }, uEksenA: { value: 0 }, uEksenB: { value: 0 },
    uBoyut: { value: mobil ? 2.1 : 2.0 }, uPR: { value: pr }, uPatlama: { value: hareketAz ? 0 : 0.55 }, uGiris: { value: hareketAz ? 1 : 0 },
    uMesafe: { value: 7 }, uFareG: { value: 0 }, uMaske: { value: new THREE.Vector4(1, 0, -2, -1.9) }, uFare: { value: new THREE.Vector2(9, 9) }, uEn: { value: 1 }, uNefes: { value: hareketAz ? 0 : 0.004 },
    uRenkY: { value: new THREE.Color(0xd2e2e0) }, uRenkR: { value: new THREE.Color(0xff9a62) }, uRenkZ: { value: new THREE.Color(0x5b8287) },
  };
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
  const bulut = new THREE.Points(geo, mat); bulut.frustumCulled = false; sh.add(bulut);

  const TN = mobil ? 900 : 1800, tg = new THREE.BufferGeometry(), tp = new Float32Array(TN * 3), tt = new Float32Array(TN);
  for (let i = 0; i < TN; i++) { tp[i * 3] = (Math.random() - 0.5) * 28; tp[i * 3 + 1] = (Math.random() - 0.4) * 12; tp[i * 3 + 2] = (Math.random() - 0.5) * 28; tt[i] = Math.random(); }
  tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('tohum', new THREE.BufferAttribute(tt, 1));
  const TU = { uZaman: U.uZaman, uPR: U.uPR, uBoyut: { value: 1.6 } };
  const toz = new THREE.Points(tg, new THREE.ShaderMaterial({ uniforms: TU, vertexShader: TVS, fragmentShader: TFS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }));
  toz.frustumCulled = false; sh.add(toz);

  // ışıma (yalnız masaüstü; yavaşsa kendiliğinden kapanır)
  let besteci = null, isima = null;
  if (!mobil && !hafif && !azKaynak) {
    try {
      const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }] = await Promise.all([
        import('/assets/vendor/pp/EffectComposer.js'), import('/assets/vendor/pp/RenderPass.js'), import('/assets/vendor/pp/UnrealBloomPass.js')]);
      besteci = new EffectComposer(renderer);
      besteci.addPass(new RenderPass(sh, kamera));
      isima = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.45, 0.2);
      besteci.addPass(isima);
    } catch (h) { besteci = null; }
  }

  // makine verisi: işçide üret, yakındaki dönemler önce
  const veri = {}, bekleyen = new Set();
  let isci = null;
  try {
    isci = new Worker(new URL('./uretici.js?v=b8952556', import.meta.url), { type: 'module' });
    isci.onmessage = (e) => { const v = e.data; bekleyen.delete(v.ad); if (!v.hata) veri[v.ad] = v; siradaki(); iste(); };
    isci.onerror = () => { isci = null; bekleyen.clear(); siradaki(); };
  } catch (h) { isci = null; }
  let yerelHazirla = null;
  async function yerelUret(ad) {
    if (!yerelHazirla) yerelHazirla = (await import('./makineler.js?v=9a8aabb4')).hazirla;
    await new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 120 }) : setTimeout(r, 16)));
    veri[ad] = yerelHazirla(ad, N); bekleyen.delete(ad); siradaki(); iste();
  }
  function siradaki() {
    if (bekleyen.size) return;
    const k = durum.k, adaylar = EV.map((e) => e.ad).filter((ad, i, d) => d.indexOf(ad) === i && !veri[ad]);
    if (!adaylar.length) return;
    adaylar.sort((a, b) => Math.abs(EV.findIndex((e) => e.ad === a) - k - 0.6) - Math.abs(EV.findIndex((e) => e.ad === b) - k - 0.6));
    const ad = adaylar[0]; bekleyen.add(ad);
    if (isci) isci.postMessage({ ad, N }); else yerelUret(ad);
  }
  siradaki();

  // tampona yükleme (A/B çifti değişince)
  let yukA = null, yukB = null;
  function yukle(v, pos, hub, rot) { pos.array.set(v.pos); hub.array.set(v.hub); rot.array.set(v.rot); pos.needsUpdate = hub.needsUpdate = rot.needsUpdate = true; }
  const aci = {};

  // kamera
  const hedef = new THREE.Vector3(), yumHedef = new THREE.Vector3(), tmp = new THREE.Vector3();
  let gen = 1, yuk = 1, kayX = 0, kayY = 0, yumMesafe = 0, ilkKare = true;
  const tanY = Math.tan(16 * Math.PI / 180);
  function boyut() {
    gen = innerWidth; yuk = innerHeight;
    const gnis = GENIS.matches;
    renderer.setSize(gen, yuk, false);
    if (besteci) { besteci.setPixelRatio(pr); besteci.setSize(gen, yuk); }
    kamera.aspect = gen / yuk;
    kayX = gnis ? gen * 0.19 : 0; kayY = gnis ? -yuk * 0.02 : yuk * 0.17;
    if (orta) { kayX = 0; kayY = 0; }
    kamera.setViewOffset(gen, yuk, -kayX, kayY, gen, yuk);
    // kart alanı: masaüstünde sol sütun, telefonda alt şerit (görsel üretiminde kapalı)
    if (orta) U.uMaske.value.set(1, 0, -3, -2.9); else if (gnis) U.uMaske.value.set(1, 0, -0.62, -0.12); else U.uMaske.value.set(0, 1, -0.78, -0.3);
    kamera.updateProjectionMatrix();
    U.uEn.value = gen / yuk;
  }
  boyut();
  function cerceve(v, poz) {
    const [hx, hy, hz] = v.kutu, gnis = GENIS.matches, a = gen / yuk;
    const ex = hx * Math.abs(Math.cos(poz.az)) + hz * Math.abs(Math.sin(poz.az));
    const fh = gnis ? 0.66 : 0.48, fw = gnis ? 0.48 : 0.86 * (poz.kirp || 1);
    return (Math.max(hy / (tanY * fh), ex / (tanY * a * fw)) + hz * 0.9) * poz.yak * (gnis ? 1 : poz.telYak || 1);
  }

  // imleç
  const fare = { x: 9, y: 9, hx: 9, hy: 9, son: 0 };
  if (inceImlec && !hareketAz) addEventListener('pointermove', (e) => { fare.hx = e.clientX / innerWidth * 2 - 1; fare.hy = -(e.clientY / innerHeight * 2 - 1); fare.son = performance.now(); if (fare.x > 5) { fare.x = fare.hx; fare.y = fare.hy; } iste(); }, { passive: true });

  let sonT = 0, sure = 0, girisT = -1, kareSay = 0, kareTop = 0, olcSay = 0, ilkHazir = false, sonCiz = 0, olcekGor = false;
  const kareler = [];
  function ciz(t, d) {
    const dt = sonT ? Math.min(0.05, (t - sonT) / 1000) : 0.016; sonT = t; sure += dt;
    // uzun süre etkileşim yoksa ~30 kare/sn yeter
    const bos = t - sonEtkilesim > 15000;
    if (bos && t - sonCiz < 30) return; sonCiz = t;
    const ka = Math.min(SON, d.k + 1);
    const A = veri[EV[d.k].ad], B = veri[EV[ka].ad] || A;
    if (!A) return;
    if (yukA !== A) { yukle(A, aPos, aHA, aRA); yukA = A; }
    if (yukB !== B) { yukle(B, aPB, aHB, aRB); yukB = B; }
    const mix = B === A ? 0 : d.mix;
    if (!ilkHazir) { ilkHazir = true; girisT = t; tani('hazir', { sure_ms: Math.round(performance.now() - t0), kalite: besteci ? 2 : mobil ? 0 : 1, neden: 'N=' + N }); }
    if (!hareketAz) U.uGiris.value = kirp((t - girisT) / 2600) < 1 ? 1 - Math.pow(1 - kirp((t - girisT) / 2600), 3) : 1;
    U.uMix.value = mix; U.uZaman.value = sure;
    for (const v of (A === B ? [A] : [A, B])) aci[v.ad] = (aci[v.ad] || 0) + (hareketAz ? 0 : dt * v.dev * 0.5);
    U.uAciA.value = aci[A.ad]; U.uAciB.value = aci[B.ad]; U.uEksenA.value = A.eksen; U.uEksenB.value = B.eksen;

    // kamera: dönem açıları arasında yumuşak geçiş + hafif salınım + imleç
    const pA = POZ[A.ad] || POZ.toz, pB = POZ[B.ad] || POZ.toz, km = yumusak(mix);
    const az = pA.az + (pB.az - pA.az) * km + (hareketAz ? 0 : Math.sin(sure * 0.11) * 0.07 + (fare.x < 5 ? fare.x * 0.08 : 0));
    const el = pA.el + (pB.el - pA.el) * km + (hareketAz ? 0 : Math.sin(sure * 0.07) * 0.025 + (fare.y < 5 ? fare.y * 0.04 : 0));
    const mA = cerceve(A, pA), mB = cerceve(B, pB), mesafe = Math.exp(Math.log(mA) + (Math.log(mB) - Math.log(mA)) * km);
    const tel = !GENIS.matches, tyA = tel ? pA.telY || 0 : 0, tyB = tel ? pB.telY || 0 : 0;
    hedef.set(A.kutu[3] + (B.kutu[3] - A.kutu[3]) * km, A.kutu[4] + tyA + (B.kutu[4] + tyB - A.kutu[4] - tyA) * km, A.kutu[5] + (B.kutu[5] - A.kutu[5]) * km);
    if (ilkKare) { yumHedef.copy(hedef); yumMesafe = mesafe; ilkKare = false; }
    const yk = hareketAz ? 1 : 1 - Math.exp(-dt * 5);
    yumHedef.lerp(hedef, yk); yumMesafe += (mesafe - yumMesafe) * yk;
    // girişte kamera uzaktan yaklaşır
    const gy = U.uGiris.value < 1 ? (1 - U.uGiris.value) * 0.6 : 0;
    const dd = yumMesafe * (1 + gy);
    kamera.position.set(yumHedef.x + Math.sin(az) * Math.cos(el) * dd, yumHedef.y + Math.sin(el) * dd, yumHedef.z + Math.cos(az) * Math.cos(el) * dd);
    kamera.lookAt(yumHedef);
    U.uMesafe.value = dd;

    // imleç rüzgârı: hareket edince güçlenir, durunca söner
    if (fare.x < 5) {
      fare.x += (fare.hx - fare.x) * Math.min(1, dt * 8); fare.y += (fare.hy - fare.y) * Math.min(1, dt * 8);
      const hedefG = t - fare.son < 900 ? 1 : 0; U.uFareG.value += (hedefG - U.uFareG.value) * Math.min(1, dt * (hedefG ? 6 : 1.5));
      U.uFare.value.set(fare.x, fare.y);
    }

    // ölçek çubuğu (ölçüsü kaynaklı makinelerde, dönem oturmuşken)
    if (olcekEl) {
      const ot = mix < 0.5 ? A : B, oturmus = mix < 0.18 || mix > 0.82;
      const gor = oturmus && ot.olcu && !kok.classList.contains('ev-los');
      if (gor) {
        const pxBirim = yuk / (2 * dd * tanY), mPx = ot.metreBirim / pxBirim;
        const L = [200, 100, 50, 25, 20, 10, 5, 2, 1].find((x) => x / mPx <= 170) || 1;
        olcekEl.style.setProperty('--olcek', Math.round(L / mPx) + 'px');
        const yaz = '≈ ' + L + ' m'; if (olcekYazi.textContent !== yaz) olcekYazi.textContent = yaz;
      }
      if (gor !== olcekGor) { olcekEl.classList.toggle('gor', gor); olcekGor = gor; }
    }

    if (besteci) besteci.render(); else renderer.render(sh, kamera);

    // uyarlanır kalite: ilk saniyelerde kareler yavaşsa ışımayı, sonra çözünürlüğü düşür
    if (!bos && dt > 0) { kareler.push(dt * 1000); if (kareler.length > 45) kareler.shift(); kareTop += dt * 1000; kareSay++; }
    if (kareler.length === 45 && olcSay < 2 && U.uGiris.value >= 1) {
      const ort = kareler.reduce((a, b) => a + b, 0) / 45;
      if (ort > 26) {
        if (besteci) { besteci = null; try { localStorage.setItem('ev-gpu-zayif', String(Date.now())); } catch (h) { /* yok */ } } else if (pr > 1) { pr = 1; renderer.setPixelRatio(1); U.uPR.value = 1; boyut(); }
        olcSay++; kareler.length = 0;
      } else olcSay = 2;
    }
  }
  const surekli = () => !kok.classList.contains('ev-bitti') || !ilkHazir;
  addEventListener('pagehide', () => { if (kareSay) tani('ozet', { kare_ms: Math.round(kareTop / kareSay), kalite: besteci ? 2 : mobil ? 0 : 1, neden: 'evre=' + etkin + ';pr=' + pr }); }, { once: true });
  kok.classList.add('ev-uc');
  const bilgi = () => ({ veri: Object.keys(veri), besteci: !!besteci, pr, N, giris: U.uGiris.value });
  return { ciz, boyut, surekli, bilgi };
}

if (tuval && webglVar() && !prm.has('duz')) {
  const basla = () => sahneKur().then((s) => { sahne = s; iste(); }).catch((h) => { kok.classList.add('ev-uc-yok'); tani('hata', { neden: String(h && h.message || h).slice(0, 150) }); });
  // ilk boyamayı geciktirmesin
  if (document.readyState === 'complete') setTimeout(basla, 0); else addEventListener('load', () => setTimeout(basla, 0), { once: true });
} else kok.classList.add('ev-uc-yok');
