/* kapak.js — ana sayfa 3B kapağı: "Rüzgâr tüneli paftası"
 *
 * Tek sahne, üç duruş (kaydırmayla): AKIŞ → ÖLÇÜ → İÇERİSİ.
 * Türbin N117/3000 ölçülerinde (rotor 116,8 m, göbek 120 m) kurulur; 1 birim = 1 metre.
 * Canlı olanlar: rotor devri ve akış hızı (/api/ruzgar tahmininden, gerçek zaman ve gerçek ölçek),
 * ışık yönü ve gölge (Aliağa'da güneşin o anki konumu), pusula (rüzgârın geldiği yön).
 * Temsili olanlar: akış çizgileri (ideal disk kuramı, a = 1/3), uç girdapları ve nasel içi yerleşim.
 * Bütün geometri kodla üretilir; doku, model dosyası ve ek kütüphane yoktur.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';

const H = 120, R = 58.4, GOBEK_X = -4.4, IND = 1 / 3;
const TAU = Math.PI * 2, RAD = Math.PI / 180;
const kok = document.documentElement;
const kap = document.getElementById('kapak');
const tuval = document.getElementById('kpTuval');

const yumusak = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const ara = (a, b, t) => a + (b - a) * t;

/* ------------------------------------------------------------------ güneş */
function gunes(enlem, boylam, t) {
  const gun = (t - Date.UTC(t.getUTCFullYear(), 0, 0)) / 864e5;
  const y = TAU / 365 * (gun - 1 + (t.getUTCHours() - 12) / 24);
  const es = 229.18 * (0.000075 + 0.001868 * Math.cos(y) - 0.032077 * Math.sin(y) - 0.014615 * Math.cos(2 * y) - 0.040849 * Math.sin(2 * y));
  const eg = 0.006918 - 0.399912 * Math.cos(y) + 0.070257 * Math.sin(y) - 0.006758 * Math.cos(2 * y) + 0.000907 * Math.sin(2 * y) - 0.002697 * Math.cos(3 * y) + 0.00148 * Math.sin(3 * y);
  const dk = t.getUTCHours() * 60 + t.getUTCMinutes() + t.getUTCSeconds() / 60;
  const sa = ((dk + es + 4 * boylam) / 4 - 180) * RAD, f = enlem * RAD;
  const cz = Math.sin(f) * Math.sin(eg) + Math.cos(f) * Math.cos(eg) * Math.cos(sa);
  const yuk = 90 - Math.acos(Math.max(-1, Math.min(1, cz))) / RAD;
  const azm = (Math.atan2(Math.sin(sa), Math.cos(sa) * Math.sin(f) - Math.tan(eg) * Math.cos(f)) / RAD + 180 + 360) % 360;
  return { yuk, azm };   // yükseklik (°), kuzeyden saat yönünde azimut (°)
}

/* ------------------------------------------------------------------ geometri yardımcıları */
function loft(halkalar, kapakli = true) {
  const n = halkalar[0].length, m = halkalar.length, pos = [], idx = [];
  for (const h of halkalar) for (const p of h) pos.push(p[0], p[1], p[2]);
  for (let i = 0; i < m - 1; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + j, d = (i + 1) * n + (j + 1) % n;
    idx.push(a, c, b, b, c, d);
  }
  if (kapakli) for (const i of [0, m - 1]) {
    const h = halkalar[i]; let cx = 0, cy = 0, cz = 0;
    for (const p of h) { cx += p[0]; cy += p[1]; cz += p[2]; }
    const ci = pos.length / 3; pos.push(cx / n, cy / n, cz / n);
    for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n; if (i === 0) idx.push(ci, a, b); else idx.push(ci, b, a); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  // yön denetimi: orta halkada normal dışa bakmıyorsa bütün üçgenleri çevir
  const k = Math.floor(m / 2), h = halkalar[k]; let cx = 0, cy = 0, cz = 0;
  for (const p of h) { cx += p[0]; cy += p[1]; cz += p[2]; } cx /= n; cy /= n; cz /= n;
  const na = g.attributes.normal, vi = k * n;
  if ((h[0][0] - cx) * na.getX(vi) + (h[0][1] - cy) * na.getY(vi) + (h[0][2] - cz) * na.getZ(vi) < 0) {
    for (let t = 0; t < idx.length; t += 3) { const q = idx[t + 1]; idx[t + 1] = idx[t + 2]; idx[t + 2] = q; }
    g.setIndex(idx); g.computeVertexNormals();
  }
  return g;
}
const halkaX = (x, r, n, cy = 0, cz = 0) => Array.from({ length: n }, (_, j) => { const a = j / n * TAU; return [x, cy + r * Math.cos(a), cz + r * Math.sin(a)]; });
const halkaY = (y, r, n) => Array.from({ length: n }, (_, j) => { const a = j / n * TAU; return [r * Math.cos(a), y, r * Math.sin(a)]; });
const kutuHalkaX = (x, w, h, n, cy = 0, us = 5) => Array.from({ length: n }, (_, j) => {
  const a = j / n * TAU, c = Math.cos(a), s = Math.sin(a), e = 2 / us;
  return [x, cy + h / 2 * Math.sign(c) * Math.pow(Math.abs(c), e), w / 2 * Math.sign(s) * Math.pow(Math.abs(s), e)];
});

/* Kalın çizgi: her parça ekran uzayında genişletilen bir dörtgen (WebGL'de çizgi kalınlığı 1 pikselle sınırlı). */
class Hatlar {
  constructor() { this.p = []; this.o = []; this.c = []; this.u = []; this.f = []; this.i = []; this.n = 0; }
  ekle(a, b, ua = 0, ub = 1, faz = 0) {
    for (const k of [[0, -1], [0, 1], [1, -1], [1, 1]]) { this.p.push(a[0], a[1], a[2]); this.o.push(b[0], b[1], b[2]); this.c.push(k[0], k[1]); this.u.push(ua, ub); this.f.push(faz); }
    const k = this.n; this.i.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); this.n += 4; return this;
  }
  yol(nk, uFn, faz = 0) { for (let i = 0; i < nk.length - 1; i++) this.ekle(nk[i], nk[i + 1], uFn ? uFn(i) : i, uFn ? uFn(i + 1) : i + 1, faz); return this; }
  cember(merkez, r, duzlem, n = 96, tireli = false) {
    const nk = [];
    for (let j = 0; j <= n; j++) { const a = j / n * TAU, c = Math.cos(a) * r, s = Math.sin(a) * r;
      nk.push(duzlem === 'x' ? [merkez[0], merkez[1] + c, merkez[2] + s] : [merkez[0] + c, merkez[1], merkez[2] + s]); }
    return this.yol(nk, tireli ? (i) => i / n * TAU * r : null);
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('diger', new THREE.Float32BufferAttribute(this.o, 3));
    g.setAttribute('kose', new THREE.Float32BufferAttribute(this.c, 2));
    g.setAttribute('uu', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('faz', new THREE.Float32BufferAttribute(this.f, 1));
    g.setIndex(this.i); return g;
  }
}

const HAT_VS = `
attribute vec3 diger; attribute vec2 kose; attribute vec2 uu; attribute float faz;
uniform vec2 coz; uniform float gen;
varying float vU; varying float vFaz; varying float vX;
void main(){
  vec4 a = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec4 b = projectionMatrix * modelViewMatrix * vec4(diger, 1.0);
  vec2 sa = a.xy / max(a.w, 1e-4) * coz, sb = b.xy / max(b.w, 1e-4) * coz;
  vec2 d = sb - sa; float l = length(d); d = l > 1e-5 ? d / l : vec2(1.0, 0.0);
  vec4 p = mix(a, b, kose.x);
  p.xy += vec2(-d.y, d.x) * kose.y * gen / coz * p.w;
  if (a.w <= 0.0 || b.w <= 0.0) p = vec4(2.0, 2.0, 2.0, 1.0);
  gl_Position = p;
  vU = mix(uu.x, uu.y, kose.x); vFaz = faz; vX = mix(position.x, diger.x, kose.x);
}`;
const HAT_FS = `
uniform vec3 renk; uniform float opak; uniform float zaman; uniform float tire;
varying float vU; varying float vFaz; varying float vX;
void main(){
  float a = opak;
  #ifdef AKIS
    float k = fract(vU / tire - zaman + vFaz);
    float d = smoothstep(0.0, 0.05, k) * smoothstep(0.34, 0.24, k);
    a *= mix(0.13, 1.0, d);
    a *= smoothstep(-250.0, -170.0, vX) * smoothstep(330.0, 210.0, vX);
  #endif
  #ifdef TIRE
    a *= step(fract(vU / tire), 0.55);
  #endif
  #ifdef SONUM
    a *= (1.0 - vU) * (1.0 - vU);
  #endif
  if (a < 0.01) discard;
  gl_FragColor = vec4(renk, a);
  #include <colorspace_fragment>
}`;
const KONTUR_VS = `
uniform vec2 coz; uniform float gen;
void main(){
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vec4 n = projectionMatrix * vec4(normalize(normalMatrix * normal), 0.0);
  vec2 d = n.xy * coz; float l = length(d);
  if (l > 1e-6) p.xy += d / l * gen * 2.0 / coz * p.w;
  gl_Position = p;
}`;
const KONTUR_FS = `
uniform vec3 renk; uniform float opak;
void main(){ gl_FragColor = vec4(renk, opak);
  #include <colorspace_fragment>
}`;
const ZEMIN_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const ZEMIN_FS = `
uniform vec3 renk; uniform float opak; varying vec3 vW;
float cizgi(float s){ vec2 c = vW.xz / s; vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c); return 1.0 - min(min(g.x, g.y), 1.0); }
void main(){
  float r = length(vW.xz);
  float a = (cizgi(10.0) * 0.3 + cizgi(50.0) * 0.7) * opak * smoothstep(620.0, 40.0, r);
  if (a < 0.004) discard;
  gl_FragColor = vec4(renk, a);
  #include <colorspace_fragment>
}`;

/* ------------------------------------------------------------------ sahne */
function baslat() {
  const hareketAz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sorgu = new URLSearchParams(location.search);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: tuval, antialias: true, alpha: false, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw 0;
  } catch (e) { kap.classList.add('statik'); return; }
  renderer.autoClear = false;
  const sahne = new THREE.Scene(), icSahne = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(32, 1, 2, 6000);
  const coz = new THREE.Vector2(1, 1);
  let dpr = 1, W = 1, Hh = 1;
  // döngü durumu en başta tanımlanır: canlı veri sahne kurulmadan önce gelmiş olabilir
  let p = 0, kirli = true, gorunur = true, durakla = hareketAz, son = performance.now(), aci = 0.4, akisZ = 0, saat = 0, ilk = true, rafNo = 0;

  /* renkler CSS'ten okunur: tema değişince sahne de değişir */
  const R_ = { kagit: new THREE.Color(), murekkep: new THREE.Color(), hat: new THREE.Color(), buz: new THREE.Color(), yuzey: new THREE.Color(), golge: new THREE.Color(), ic: new THREE.Color() };
  const malzemeler = [];
  const hatMat = (renk, gen, ek = {}) => {
    const m = new THREE.ShaderMaterial({
      vertexShader: HAT_VS, fragmentShader: HAT_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      defines: ek.tanim || {},
      uniforms: { coz: { value: coz }, gen: { value: gen }, renk: { value: renk }, opak: { value: 1 }, zaman: { value: 0 }, tire: { value: ek.tire || 1 } },
    });
    m.userData.gen = gen; malzemeler.push(m); return m;
  };
  const konturMat = (renk, gen) => {
    const m = new THREE.ShaderMaterial({ vertexShader: KONTUR_VS, fragmentShader: KONTUR_FS, side: THREE.BackSide,
      uniforms: { coz: { value: coz }, gen: { value: gen }, renk: { value: renk }, opak: { value: 1 } } });
    m.userData.gen = gen; malzemeler.push(m); return m;
  };
  const yuzeyMat = new THREE.MeshLambertMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const icMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const kontur = konturMat(R_.murekkep, 1.15), icKontur = konturMat(R_.murekkep, 1.0);
  icKontur.transparent = true;
  const golgeMat = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, depthWrite: false });
  const golgeKaynak = [];

  const yarimKure = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
  const isik = new THREE.DirectionalLight(0xffffff, 1);
  sahne.add(yarimKure, isik, isik.target);
  const icYarim = new THREE.HemisphereLight(0xffffff, 0xffffff, 1), icIsik = new THREE.DirectionalLight(0xffffff, 1.2);
  icIsik.position.set(-0.4, 1, 0.9); icSahne.add(icYarim, icIsik);

  function govde(geo, ust, golge = true) {
    const m = new THREE.Mesh(geo, yuzeyMat), k = new THREE.Mesh(geo, kontur);
    ust.add(k, m); if (golge) golgeKaynak.push(m); return m;
  }

  /* --- kule: beş kademeli konik çelik boru, kademe flanşları çizgi olarak */
  const turbin = new THREE.Group(); sahne.add(turbin);
  const KULE = [[0, 2.15], [30, 2.05], [60, 1.9], [90, 1.72], [117.6, 1.52]];
  govde(loft(KULE.map(([y, r]) => halkaY(y, r, 40))), turbin);
  govde(loft([halkaY(117.6, 1.75, 32), halkaY(118.35, 1.75, 32)]), turbin, false);
  const ince = new Hatlar();
  for (const [y, r] of KULE.slice(1, 4)) ince.cember([0, y, 0], r + 0.03, 'y', 48);
  ince.cember([0, 0.2, 0], 2.6, 'y', 48);                                   // temel halkası
  ince.yol([[-2.17, 0.3, -0.45], [-2.14, 2.5, -0.45], [-2.14, 2.5, 0.45], [-2.17, 0.3, 0.45]]);   // kule kapısı
  // rüzgâr ölçer direği (nasel arkası)
  ince.ekle([9.2, H + 2.45, 0], [9.2, H + 4.1, 0]).ekle([9.2, H + 4.1, -0.6], [9.2, H + 4.1, 0.6]).ekle([9.2, H + 4.1, 0.6], [9.2, H + 4.45, 0.6]).ekle([9.2, H + 4.1, -0.6], [9.2, H + 4.45, -0.6]);
  const inceMat = hatMat(R_.murekkep, 1.1);
  turbin.add(new THREE.Mesh(ince.geo(), inceMat));

  /* --- nasel: yuvarlatılmış kutu kesitlerinden */
  const NASEL = [[-2.2, 3.3, 3.5], [-1.2, 3.9, 4.0], [1.5, 4.2, 4.2], [8.2, 4.2, 4.2], [10.1, 3.8, 3.9], [10.8, 3.1, 3.3]];
  const naselGeo = loft(NASEL.map(([x, w, h]) => kutuHalkaX(x, w, h, 44, H + 0.35)));
  const naselYuzey = new THREE.MeshLambertMaterial({ color: 0xffffff, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const nasel = new THREE.Mesh(naselGeo, naselYuzey);
  turbin.add(new THREE.Mesh(naselGeo, kontur), nasel); golgeKaynak.push(nasel);

  /* --- uçak ikaz lambaları: nasel üstünde iki kırmızı, yanıp sönen */
  const lambaMat = new THREE.MeshBasicMaterial({ color: 0xff3a2f });
  const haleDoku = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,90,70,1)'); g.addColorStop(0.25, 'rgba(255,60,45,.55)'); g.addColorStop(1, 'rgba(255,40,30,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const haleMat = new THREE.SpriteMaterial({ map: haleDoku, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const haleler = [];
  for (const z of [-1.15, 1.15]) {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), lambaMat); l.position.set(3.2, H + 2.58, z); turbin.add(l);
    const s = new THREE.Sprite(haleMat); s.position.copy(l.position); turbin.add(s); haleler.push(s);
  }

  /* --- rotor: burun konisi + üç kanat (kök dairesinden profile geçen, burulmalı ve daralan loft) */
  const rotor = new THREE.Group(); rotor.position.set(GOBEK_X, H, 0); turbin.add(rotor);
  const BURUN = [[-2.7, 0.06], [-2.45, 0.75], [-1.9, 1.35], [-1.0, 1.78], [0.2, 1.92], [1.4, 1.92], [2.15, 1.76]];
  govde(loft(BURUN.map(([x, r]) => halkaX(x, r, 36))), rotor);
  const kanatGeo = (() => {
    const hk = [], N = 20, M = 30;
    for (let k = 0; k <= M; k++) {
      const s = k / M, r = 1.55 + s * (R - 1.55);
      const c = s < 0.18 ? ara(2.4, 3.9, yumusak(0, 0.18, s)) : 3.9 * (1 - 0.87 * Math.pow((s - 0.18) / 0.82, 0.85));
      const kal = ara(1, 0.21, yumusak(0, 0.3, s)) * ara(1, 0.78, s);
      const daire = 1 - yumusak(0, 0.14, s);
      const bur = (16 * Math.pow(1 - s, 2.2) - 1.5) * RAD, cs = Math.cos(bur), sn = Math.sin(bur);
      const h = [];
      for (let j = 0; j < N; j++) {
        const f = j / N * TAU, x = 0.5 * (1 - Math.cos(f));
        const yt = 5 * kal * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x * x * x - 0.1036 * x * x * x * x) * (f < Math.PI ? 1 : -1);
        const u = ara(x - 0.3, x - 0.5, daire) * c, v = ara(yt, 0.5 * Math.sin(f), daire) * c;
        // u: hücum kenarından firar kenarına (dönüş yönünün tersi), v: kalınlık (rüzgâr yönü)
        h.push([u * sn + v * cs, r, -u * cs + v * sn]);
      }
      hk.push(h);
    }
    return loft(hk);
  })();
  for (let k = 0; k < 3; k++) { const g = new THREE.Group(); g.rotation.x = k * TAU / 3; rotor.add(g); govde(kanatGeo, g); }

  /* --- uç girdapları: her kanat ucundan geriye uzanan sarmal (rotorla birlikte döner) */
  const girdapGrup = new THREE.Group(); rotor.add(girdapGrup);
  const gh = new Hatlar(), FMAX = TAU * 1.5;
  for (let k = 0; k < 3; k++) {
    const nk = [], t0 = k * TAU / 3;
    for (let f = 0; f <= FMAX; f += 0.09) { const r = R * (1 + 0.16 * (1 - Math.exp(-f / 5))); nk.push([f, r * Math.cos(t0 - f), r * Math.sin(t0 - f)]); }
    gh.yol(nk, (i) => i * 0.09 / FMAX);
  }
  const girdapMat = hatMat(R_.hat, 1.2, { tanim: { SONUM: '' } });
  girdapGrup.add(new THREE.Mesh(gh.geo(), girdapMat));

  /* --- akış çizgileri: ideal disk kuramıyla genişleyen akım borusu; tireler rüzgârın hızında ilerler */
  const f_ = (x) => x < 0 ? 0.8165 + 0.1835 * Math.exp(x / 45) : 1.4142 - 0.4142 * Math.exp(-x / 70);
  const ah = new Hatlar();
  const tohum = [];
  [[0.3, 4], [0.62, 7], [0.92, 10]].forEach(([q, n], s) => { for (let j = 0; j < n; j++) tohum.push({ ic: true, q: q * R, a: (j + s * 0.37) / n * TAU }); });
  [[1.14, 10]].forEach(([q, n], s) => { for (let j = 0; j < n; j++) tohum.push({ ic: false, q: q * R, a: (j + 0.5 + s * 0.31) / n * TAU }); });
  let ti = 0;
  for (const t of tohum) {
    const nk = [], T = []; let sure = 0, on = null;
    for (let x = -260; x <= 330; x += 7) {
      const f = f_(x), r = t.ic ? t.q * f : Math.sqrt(t.q * t.q + R * R * (f * f - 0.6667));
      const p = [GOBEK_X + x, H + r * Math.cos(t.a), r * Math.sin(t.a)];
      if (on) { const u = t.ic ? 1 - IND * (1 + (x - 3.5) / Math.sqrt((x - 3.5) * (x - 3.5) + R * R)) : 1; sure += 7 / u; }
      nk.push(p); T.push(sure); on = p;
    }
    if (Math.min(...nk.map((p) => p[1])) < 6) continue;
    ah.yol(nk, (i) => T[i], (ti++ * 0.618) % 1);
  }
  const akisMat = hatMat(R_.hat, 1.3, { tanim: { AKIS: '' }, tire: 46 });
  const akis = new THREE.Mesh(ah.geo(), akisMat); akis.frustumCulled = false; sahne.add(akis);
  const girdapAg = girdapGrup.children[0]; girdapAg.frustumCulled = false;

  /* --- ölçü çizgileri (ÖLÇÜ duruşunda görünür) */
  const oh = new Hatlar(), th = new Hatlar();
  const ust = H + R + 11, sol = -(R + 13);
  th.cember([GOBEK_X, H, 0], R, 'x', 160, true);                                           // süpürülen alan
  oh.ekle([GOBEK_X, ust, -R], [GOBEK_X, ust, R]);                                          // rotor çapı
  oh.ekle([GOBEK_X, H, -R], [GOBEK_X, ust + 3, -R]).ekle([GOBEK_X, H, R], [GOBEK_X, ust + 3, R]);
  oh.ekle([GOBEK_X, 0, sol], [GOBEK_X, H, sol]);                                           // göbek yüksekliği
  oh.ekle([GOBEK_X, 0, -3], [GOBEK_X, 0, sol - 3]).ekle([GOBEK_X, H, -3], [GOBEK_X, H, sol - 3]);
  for (const [y, z] of [[ust, -R], [ust, R], [0, sol], [H, sol]]) oh.ekle([GOBEK_X, y - 2, z - 2], [GOBEK_X, y + 2, z + 2]);   // ölçü okları (45° çentik)
  oh.ekle([GOBEK_X, H - 3, 0], [GOBEK_X, H + 3, 0]).ekle([GOBEK_X, H, -3], [GOBEK_X, H, 3]);    // eksen işareti
  const olcuMat = hatMat(R_.murekkep, 1.2), tireMat = hatMat(R_.hat, 1.2, { tanim: { TIRE: '' }, tire: 5 });
  const olcu = new THREE.Group(); olcu.add(new THREE.Mesh(oh.geo(), olcuMat), new THREE.Mesh(th.geo(), tireMat)); sahne.add(olcu);

  /* --- zemin: metrik ızgara (10 m / 50 m), gölge ve pusula */
  const zeminMat = new THREE.ShaderMaterial({ vertexShader: ZEMIN_VS, fragmentShader: ZEMIN_FS, transparent: true, depthWrite: false,
    uniforms: { renk: { value: R_.murekkep }, opak: { value: 0.3 } } });
  const zemin = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), zeminMat); zemin.position.y = 0.04; zemin.renderOrder = -1; sahne.add(zemin);
  const golgeGrup = new THREE.Group(); golgeGrup.renderOrder = -2; sahne.add(golgeGrup);
  const golgeler = golgeKaynak.map((k) => { const m = new THREE.Mesh(k.geometry, golgeMat); m.matrixAutoUpdate = false; m.frustumCulled = false; m.renderOrder = -2; golgeGrup.add(m); return [m, k]; });
  const pusula = new THREE.Group(); sahne.add(pusula);
  const ph = new Hatlar(); ph.cember([0, 0.1, 0], 34, 'y', 96);
  for (let d = 0; d < 360; d += 15) { const a = d * RAD, r1 = d % 90 === 0 ? 28 : 31.5; ph.ekle([Math.sin(a) * r1, 0.1, -Math.cos(a) * r1], [Math.sin(a) * 34, 0.1, -Math.cos(a) * 34]); }
  ph.ekle([0, 0.1, -34], [-3.2, 0.1, -42]).ekle([0, 0.1, -34], [3.2, 0.1, -42]).ekle([-3.2, 0.1, -42], [0, 0.1, -48]).ekle([3.2, 0.1, -42], [0, 0.1, -48]);   // kuzey oku (yerelde −Z)
  const pusulaMat = hatMat(R_.murekkep, 1.1); pusulaMat.uniforms.opak.value = 0.7;
  pusula.add(new THREE.Mesh(ph.geo(), pusulaMat));

  /* --- nasel içi (İÇERİSİ duruşunda ayrı geçişte, derinlik temizlenip üstüne çizilir) */
  const ic = new THREE.Group(); icSahne.add(ic);
  const icParca = (geo) => { ic.add(new THREE.Mesh(geo, icKontur), new THREE.Mesh(geo, icMat)); };
  const silX = (dizi, cy = H, n = 30) => loft(dizi.map(([x, r]) => halkaX(x, r, n, cy)));
  icParca(loft([[-1.9, 3.0], [9.9, 3.0]].map(([x, w]) => kutuHalkaX(x, w, 0.4, 20, H - 1.5, 8))));   // şase
  icParca(silX([[-2.1, 1.05], [-0.9, 1.05]]));                                        // ana yatak
  icParca(silX([[-0.9, 0.55], [1.8, 0.42]]));                                         // ana mil
  icParca(silX([[1.8, 1.25], [3.0, 1.25], [3.0, 1.0], [3.9, 1.0], [3.9, 0.72], [4.6, 0.72]]));   // dişli kutusu
  icParca(silX([[4.6, 0.11], [6.2, 0.11]], H + 0.42, 12));                            // hızlı mil
  icParca(silX([[4.95, 0.56], [5.07, 0.56]], H + 0.42));                              // fren diski
  icParca(silX([[6.2, 0.7], [6.35, 0.95], [9.2, 0.95], [9.35, 0.7]], H + 0.42));      // jeneratör

  /* --- etiketler (HTML; her karede 3B noktadan ekrana izdüşürülür) */
  const katman = document.getElementById('kpEtiket');
  const etiketler = [];
  const EN = /^en/i.test(kok.lang || '');
  const etiket = (grup, p, tr, en, hiza = '') => {
    if (!katman) return null;
    const el = document.createElement('span'); el.className = 'kp-et ' + hiza; el.textContent = EN ? en : tr; katman.appendChild(el);
    const e = { grup, p: new THREE.Vector3(...p), el, ust: null }; etiketler.push(e); return e;
  };
  etiket('olcu', [GOBEK_X, ust, 0], 'Rotor çapı 116,8 m', 'Rotor diameter 116.8 m', 'kp-et-ust');
  etiket('olcu', [GOBEK_X, H * 0.5, sol], 'Göbek yüksekliği 120 m', 'Hub height 120 m', 'kp-et-sag');
  etiket('olcu', [GOBEK_X, H - R, 0], 'Süpürülen alan 10.715 m²', 'Swept area 10,715 m²', 'kp-et-alt');
  etiket('ic', [GOBEK_X, H + 1.9, 0], 'Rotor göbeği', 'Rotor hub', 'kp-et-ust');
  etiket('ic', [0.4, H + 1.0, 0], 'Ana yatak ve mil', 'Main bearing and shaft', 'kp-et-ust');
  etiket('ic', [3.0, H - 1.25, 0], 'Dişli kutusu', 'Gearbox', 'kp-et-alt');
  etiket('ic', [7.8, H + 1.4, 0], 'Jeneratör', 'Generator', 'kp-et-ust');
  const kuzeyEt = etiket('pusula', [0, 0.1, -54], 'K', 'N', 'kp-et-orta'); if (kuzeyEt) kuzeyEt.ust = pusula;

  /* ------------------------------------------------------------------ tema ve ışık */
  let gece = false, gunesYuk = 30, isikYon = new THREE.Vector3(-0.4, 0.8, 0.45).normalize(), ruzgarYon = 315;
  function renkleriOku() {
    const cs = getComputedStyle(kok), oku = (ad, hedef) => { const v = cs.getPropertyValue(ad).trim(); if (v) hedef.set(v); };
    oku('--kagit', R_.kagit); oku('--murekkep', R_.murekkep); oku('--hat', R_.hat); oku('--buz', R_.buz); oku('--yuzey', R_.yuzey); oku('--golge', R_.golge); oku('--ic', R_.ic);
    gece = kok.getAttribute('data-tema') === 'gece';
    yuzeyMat.color.copy(R_.yuzey); naselYuzey.color.copy(R_.yuzey); icMat.color.copy(R_.ic); golgeMat.color.copy(R_.golge);
    yarimKure.color.copy(R_.yuzey).lerp(new THREE.Color(0xffffff), 0.5); yarimKure.groundColor.copy(R_.buz);
    icYarim.color.set(0xffffff); icYarim.groundColor.copy(R_.buz);
    yarimKure.intensity = gece ? 2.1 : 2.35; isik.intensity = gece ? 1.5 : 1.25;
    icYarim.intensity = gece ? 1.9 : 2.2;
    zeminMat.uniforms.opak.value = gece ? 0.34 : 0.26;
    haleMat.opacity = gece ? 1 : 0.5;
    renderer.setClearColor(R_.kagit, 1);
    isikKur();
  }
  /* Gerçek kuzey: rüzgâr sahnede +X yönünde eser; rüzgârın GELDİĞİ yön (meteorolojik) −X'tir.
     Kuzey = (−cos θ, 0, sin θ). Güneş, kuzeyden saat yönünde azimutla yerleştirilir. */
  function isikKur() {
    const t = sorgu.get('gokzaman') ? new Date(sorgu.get('gokzaman')) : new Date();
    const g = gunes(38.85, 27.0, isFinite(t.getTime()) ? t : new Date());
    gunesYuk = g.yuk;
    const th = ruzgarYon * RAD, nx = -Math.cos(th), nz = Math.sin(th);
    pusula.rotation.y = Math.atan2(-nx, -nz);   // yereldeki −Z kuzeye baksın
    if (g.yuk > 2) {
      const A = g.azm * RAD, e = Math.max(g.yuk, 7) * RAD, sx = nx * Math.cos(A) - nz * Math.sin(A), sz = nx * Math.sin(A) + nz * Math.cos(A);
      isikYon.set(sx * Math.cos(e), Math.sin(e), sz * Math.cos(e)).normalize();
    } else isikYon.set(-0.5, 0.62, 0.6).normalize();   // gece: okunaklılık için sabit dolgu ışığı (gölge çizilmez)
    isik.position.copy(isikYon).multiplyScalar(400); isik.target.position.set(0, 60, 0);
    golgeGrup.visible = g.yuk > 2;
  }
  const golgeM = new THREE.Matrix4();
  function golgeGuncelle() {
    if (!golgeGrup.visible) return;
    const L = isikYon;   // güneşe doğru; izdüşüm ışık boyunca y=0 düzlemine
    golgeM.set(1, -L.x / L.y, 0, 0, 0, 0, 0, 0.02, 0, -L.z / L.y, 1, 0, 0, 0, 0, 1);
    for (const [m, k] of golgeler) { m.matrix.multiplyMatrices(golgeM, k.matrixWorld); m.matrixWorldNeedsUpdate = true; }
  }

  /* ------------------------------------------------------------------ kamera duruşları */
  const D = [
    { t: [14, 94, 0], d: [-0.84, -0.13, 0.52], fov: 30, w: 230, h: 226, ox: 0.17, oy: 0.0 },      // AKIŞ
    { t: [GOBEK_X, 101, 0], d: [-1, 0.0, 0.0], fov: 11, w: 176, h: 250, ox: 0.15, oy: 0.0 },       // ÖLÇÜ (ön görünüş, tele)
    { t: [4.2, H + 0.2, 0], d: [0.12, 0.2, 1], fov: 28, w: 20, h: 11.5, ox: 0.04, oy: 0.07 },      // İÇERİSİ
  ];
  const DD = [   // dik ekran (telefon)
    { t: [8, 92, 0], d: [-0.9, -0.1, 0.42], fov: 34, w: 156, h: 214, ox: 0, oy: 0.02 },
    { t: [GOBEK_X, 98, 0], d: [-1, 0.0, 0.0], fov: 13, w: 176, h: 262, ox: 0, oy: -0.01 },
    { t: [3.4, H + 0.2, 0], d: [0.12, 0.25, 1], fov: 30, w: 19, h: 12, ox: 0, oy: 0.1 },
  ];
  const ZAMAN = [0, 0.1, 0.4, 0.54, 0.84, 1], SIRA = [0, 0, 1, 1, 2, 2];
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), sag = new THREE.Vector3(), yuk = new THREE.Vector3(), hedef = new THREE.Vector3();
  function kameraKur(p) {
    const liste = W / Hh < 0.8 ? DD : D;
    let i = 0; while (i < ZAMAN.length - 2 && p > ZAMAN[i + 1]) i++;
    const k = yumusak(ZAMAN[i], ZAMAN[i + 1], p), a = liste[SIRA[i]], b = liste[SIRA[i + 1]];
    const fov = ara(a.fov, b.fov, k), w = ara(a.w, b.w, k), h = ara(a.h, b.h, k), tn = Math.tan(fov * RAD / 2), en = W / Hh;
    // uzaklık logaritmik aralanır: yakınlaşma hissi doğrusal kalır
    const uz = (q) => Math.max(q.h / 2 / Math.tan(q.fov * RAD / 2), q.w / 2 / (Math.tan(q.fov * RAD / 2) * en));
    const dist = Math.exp(ara(Math.log(uz(a)), Math.log(uz(b)), k));
    hedef.set(ara(a.t[0], b.t[0], k), ara(a.t[1], b.t[1], k), ara(a.t[2], b.t[2], k));
    v1.set(ara(a.d[0], b.d[0], k), ara(a.d[1], b.d[1], k), ara(a.d[2], b.d[2], k)).normalize();
    kamera.fov = fov; kamera.aspect = en; kamera.near = Math.max(1, dist * 0.02); kamera.far = dist + 2600; kamera.updateProjectionMatrix();
    kamera.position.copy(hedef).addScaledVector(v1, dist); kamera.up.set(0, 1, 0); kamera.lookAt(hedef);
    kamera.updateMatrixWorld();
    sag.setFromMatrixColumn(kamera.matrixWorld, 0); yuk.setFromMatrixColumn(kamera.matrixWorld, 1);
    const gh2 = 2 * dist * tn, ox = ara(a.ox, b.ox, k), oy = ara(a.oy, b.oy, k);
    kamera.position.addScaledVector(sag, -ox * gh2 * en).addScaledVector(yuk, -oy * gh2);
    if (kamera.position.y < 3) kamera.position.y = 3;
    kamera.updateMatrixWorld();
  }

  /* ------------------------------------------------------------------ boyut */
  const kutu = tuval.parentElement;
  function boyut() {
    const w = kutu.clientWidth, h = kutu.clientHeight; if (!w || !h) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = w; Hh = h; renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    coz.set(w * dpr, h * dpr);
    const kalin = dpr * (w < 600 ? 0.9 : 1);
    for (const m of malzemeler) m.uniforms.gen.value = m.userData.gen * kalin;
    kirli = true;
  }

  /* ------------------------------------------------------------------ canlı veri */
  let devirHedef = 12.6, devir = 12.6, hiz = 9, hizHedef = 9, durdu = false;
  function veri(d) {
    if (!d || !isFinite(d.v)) return;
    hizHedef = Math.max(0.5, d.v); durdu = d.durum === 'durdu';
    devirHedef = durdu ? 0 : (d.devir > 0 ? d.devir : 7.9);   // beklemede: en düşük işletme devri (gösterim; panelde açıkça yazar)
    if (isFinite(d.yon) && Math.abs(d.yon - ruzgarYon) > 0.5) { ruzgarYon = d.yon; isikKur(); }
    kirli = true;
  }
  addEventListener('ss:ruzgar', (e) => veri(e.detail));
  if (window.__sonerRuzgar) veri(window.__sonerRuzgar);
  addEventListener('pafta:tema', () => { renkleriOku(); kirli = true; });
  setInterval(() => { isikKur(); kirli = true; }, 60000);

  /* ------------------------------------------------------------------ döngü */
  const iz = new THREE.Vector3();
  function ilerleme() {
    const r = kap.getBoundingClientRect(), yol = r.height - innerHeight;
    const q = yol > 40 ? Math.min(1, Math.max(0, -r.top / yol)) : 0;
    if (q !== p) { p = q; kirli = true; }
    const asama = p < 0.25 ? 0 : p < 0.66 ? 1 : 2;
    if (kap.dataset.asama !== String(asama)) kap.dataset.asama = String(asama);
  }
  function kare(simdi) {
    rafNo = 0;
    const dt = Math.min(0.1, (simdi - son) / 1000); son = simdi;
    ilerleme();
    const oynuyor = !durakla && !document.hidden;
    if (oynuyor) {
      devir += (devirHedef - devir) * Math.min(1, dt * 0.8); hiz += (hizHedef - hiz) * Math.min(1, dt * 0.8);
      aci += devir * TAU / 60 * dt; akisZ += hiz * dt / 46; saat += dt;
    }
    if (oynuyor || kirli) {
      kirli = false;
      const wOlcu = yumusak(0.26, 0.4, p) * (1 - yumusak(0.56, 0.66, p));
      const wIc = yumusak(0.66, 0.84, p);
      const wAkis = 1 - yumusak(0.12, 0.36, p) + 0.35 * yumusak(0.66, 0.84, p);
      rotor.rotation.x = aci;
      const om = devir * TAU / 60;
      girdapGrup.visible = om > 0.05 && p < 0.33;
      if (om > 0.05) girdapGrup.scale.x = hiz * (1 - IND) / om;
      girdapMat.uniforms.opak.value = 0.85 * (1 - yumusak(0.1, 0.32, p));
      akisMat.uniforms.zaman.value = akisZ; akisMat.uniforms.opak.value = 0.9 * wAkis; akis.visible = wAkis > 0.01;
      olcu.visible = wOlcu > 0.01; olcuMat.uniforms.opak.value = wOlcu; tireMat.uniforms.opak.value = wOlcu;
      const yan = (saat % 1.5) < 0.32 ? 1 : 0.12;
      lambaMat.color.setRGB(1, 0.2 * yan, 0.16 * yan).multiplyScalar(0.35 + 0.65 * yan);
      for (const s of haleler) s.scale.setScalar((gece ? 7 : 3.2) * yan);
      icMat.opacity = wIc; icKontur.uniforms.opak.value = wIc;
      kameraKur(p);
      turbin.updateMatrixWorld(true); golgeGuncelle();
      renderer.clear(); renderer.render(sahne, kamera);
      if (wIc > 0.01) { renderer.clearDepth(); renderer.render(icSahne, kamera); }
      // etiketler
      for (const e of etiketler) {
        const w = e.grup === 'olcu' ? wOlcu : e.grup === 'ic' ? wIc : (1 - yumusak(0.5, 0.64, p)) * 0.9;
        if (w < 0.02) { if (e.el.style.opacity !== '0') e.el.style.opacity = '0'; continue; }
        iz.copy(e.p); if (e.ust) iz.applyMatrix4(e.ust.matrixWorld);
        iz.project(kamera);
        const disarida = iz.z > 1 || Math.abs(iz.x) > 1.05 || Math.abs(iz.y) > 1.05;
        e.el.style.opacity = disarida ? '0' : w.toFixed(2);
        e.el.style.transform = 'translate3d(' + ((iz.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-iz.y * 0.5 + 0.5) * Hh).toFixed(1) + 'px,0)';
      }
      if (ilk) { ilk = false; kap.classList.add('hazir'); window.__kapak = { hazir: true, durum: () => ({ gunesYuk, golge: golgeGrup.visible, isik: isikYon.toArray(), devir, hiz, ruzgarYon, p }) }; }
    }
    if (gorunur) rafNo = requestAnimationFrame(kare);
  }
  const uyandir = () => { if (!rafNo && gorunur) { son = performance.now(); rafNo = requestAnimationFrame(kare); } };

  renkleriOku(); boyut();
  if ('ResizeObserver' in window) new ResizeObserver(boyut).observe(kutu); else addEventListener('resize', boyut);
  if ('IntersectionObserver' in window) new IntersectionObserver((g) => { gorunur = g[0].isIntersecting; uyandir(); }, { rootMargin: '80px' }).observe(kap);
  addEventListener('scroll', () => { kirli = true; }, { passive: true });
  document.addEventListener('visibilitychange', () => { son = performance.now(); });
  const dugme = document.getElementById('kpDurakla');
  if (dugme) {
    const yaz = () => { dugme.setAttribute('aria-pressed', String(durakla)); dugme.textContent = durakla ? (EN ? 'Resume motion' : 'Hareketi başlat') : (EN ? 'Pause motion' : 'Hareketi durdur'); };
    yaz(); dugme.hidden = false;
    dugme.addEventListener('click', () => { durakla = !durakla; yaz(); kirli = true; });
  }
  // gölgelendiriciler ilk kareden önce derlensin (iç sahne dâhil): kaydırırken takılma olmasın
  kameraKur(0); try { renderer.compile(sahne, kamera); renderer.compile(icSahne, kamera); } catch (e) {}
  tuval.addEventListener('webglcontextlost', (e) => { e.preventDefault(); kap.classList.remove('hazir'); kap.classList.add('statik'); gorunur = false; });
  uyandir();
}

if (kap && tuval) { try { baslat(); } catch (e) { kap.classList.add('statik'); try { console.error('[kapak]', e); } catch (_) {} } }
