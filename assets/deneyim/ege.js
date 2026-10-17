/* ege.js — kapak sahnesinin "dünyası": gerçek N117 modelinin arkasına yerleşen Ege atmosferi.
 *
 * Türbine, kameraya ve sahne grafiğine dokunmaz; yalnız sahneye yeni ve hafif katmanlar ekler:
 *   - ufka kadar uzanan kayalık sırtlar (4 katman, uzaklaştıkça puslanır: hava perspektifi)
 *   - batı yönünde Ege kıyısı: ufukta deniz şeridi
 *   - sırt eteklerinde alçak sis bantları (yavaş akar)
 *   - yüksek bulut katmanı (rüzgârla çok yavaş sürüklenir)
 *   - gece yıldızları
 * Renkler sahnenin o anki sis/gök rengi ve güneş yönünden türetilir; böylece perspektif, ışık
 * yönü ve renk türbinle aynı kalır. Mod değişince değerler birkaç saniyede kayar, sıçramaz.
 * Telefonda (lite) daha az köşe, daha basit gürültü ve daha az yıldız kullanılır.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';

// deterministik gürültü (her yüklemede aynı sırt silueti)
function h1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function g1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return h1(i) * (1 - u) + h1(i + 1) * u; }
function sirtGurultu(a, tohum) {
  // açıya bağlı, 2π'de kesintisiz: çember üstünde iki bileşenli örnekleme
  let t = 0, amp = 1, fr = 1, top = 0;
  for (let o = 0; o < 6; o++) {
    const x = Math.cos(a) * fr * 3.1 + tohum * 7.3, y = Math.sin(a) * fr * 3.1 - tohum * 3.9;
    const n = (g1(x * 1.7 + y * 0.6) + g1(y * 1.3 - x * 0.4 + 11.1)) * 0.5;
    t += (1 - Math.abs(n * 2 - 1)) * amp;   // sırtlı (ridged) profil: keskin tepeler, yumuşak etekler
    top += amp; amp *= 0.5; fr *= 2.07;
  }
  return t / top;
}

const SIRTLAR = [
  // r: yarıçap (m), y: taban üstü ortalama, a: genlik, pus: hava perspektifi (uzak = daha puslu)
  { r: 2080, y: 150, a: 230, pus: 0.80, tohum: 1.7 },
  { r: 1820, y: 95,  a: 170, pus: 0.64, tohum: 4.2 },
  { r: 1580, y: 55,  a: 120, pus: 0.47, tohum: 7.9 },
  { r: 1380, y: 25,  a: 80,  pus: 0.32, tohum: 2.6 },
];

const SIRT_VS = `
  attribute float aUst; attribute float aH;
  varying float vK; varying float vH; varying vec3 vW;
  void main(){ vK = aUst; vH = aH; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w; }`;
const SIRT_FS = `
  uniform vec3 uKoyu, uAcik, uPus, uIsik, uGunes; uniform float uPusG, uIsikG, uEtek;
  varying float vK; varying float vH; varying vec3 vW;
  void main(){
    float k = clamp(vW.y / max(vH, 1.0), 0.0, 1.0);
    vec3 c = mix(uKoyu, uAcik, pow(k, 1.6) * 0.65);
    // güneş tarafında tepe çizgisine sıcak ışık sızar (ters ışık)
    vec2 yon = normalize(vW.xz);
    float g = max(dot(yon, normalize(uGunes.xz)), 0.0);
    c += uIsik * uIsikG * pow(g, 5.0) * smoothstep(0.55, 1.0, k) * 0.55;
    // hava perspektifi + etekte biriken pus
    float pus = clamp(uPusG + (1.0 - k) * uEtek, 0.0, 1.0);
    gl_FragColor = vec4(mix(c, uPus, pus), 1.0);
  }`;

const DENIZ_FS = `
  uniform vec3 uDeniz, uPus, uIsik, uGunes; uniform float uPusG, uIsikG, uZaman;
  varying vec3 vW;
  float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main(){
    vec3 V = normalize(vW - cameraPosition);
    float d = length(vW.xz);
    vec2 yon = vW.xz / d;
    float g = max(dot(normalize(vec2(V.x, V.z)), normalize(uGunes.xz)), 0.0);
    // güneşe bakan yönde ışıltı yolu: ince kırpışan şeritler
    float parilti = pow(g, 40.0) * (0.55 + 0.45 * hs(floor(vW.xz * vec2(0.08, 0.5)) + floor(uZaman * 1.3)));
    vec3 c = uDeniz + uIsik * uIsikG * parilti * 0.9 + uIsik * uIsikG * pow(g, 6.0) * 0.12;
    float pus = clamp(uPusG + smoothstep(1500.0, 2150.0, d) * 0.25, 0.0, 1.0);
    gl_FragColor = vec4(mix(c, uPus, pus), 1.0);
  }`;

const SIS_VS = `
  attribute float aUst; varying float vK; varying vec3 vW;
  void main(){ vK = aUst; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w; }`;
const sisFS = lite => `
  uniform vec3 uPus, uIsik, uGunes; uniform float uGuc, uIsikG, uZaman, uTohum;
  varying float vK; varying vec3 vW;
  float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gr(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hs(i), hs(i+vec2(1,0)), f.x), mix(hs(i+vec2(0,1)), hs(i+vec2(1,1)), f.x), f.y); }
  void main(){
    float a = atan(vW.z, vW.x);
    vec2 p = vec2(a * 9.0 + uZaman * 0.012 + uTohum, vK * 2.2 - uZaman * 0.004);
    float n = ${lite ? 'gr(p * 1.4)' : '0.6 * gr(p * 1.4) + 0.3 * gr(p * 3.1 + 7.0) + 0.1 * gr(p * 6.7)'};
    float al = pow(1.0 - vK, 2.2) * smoothstep(0.0, 0.08, vK + 0.02) * (0.45 + 0.75 * n) * uGuc;
    vec2 yon = normalize(vW.xz);
    float g = max(dot(yon, normalize(uGunes.xz)), 0.0);
    vec3 c = uPus + uIsik * uIsikG * pow(g, 4.0) * 0.35;
    gl_FragColor = vec4(c, clamp(al, 0.0, 1.0));
  }`;

const bulutFS = lite => `
  uniform vec3 uGolge, uAcik, uIsik, uGunes, uPus; uniform float uOrt, uYog, uIsikG, uZaman, uSirrus;
  varying vec3 vW;
  float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gr(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hs(i), hs(i+vec2(1,0)), f.x), mix(hs(i+vec2(0,1)), hs(i+vec2(1,1)), f.x), f.y); }
  float fbm(vec2 p){ float t = 0.0, a = 0.5; for (int i = 0; i < ${lite ? 3 : 5}; i++){ t += a*gr(p); p = p*2.03 + 17.0; a *= 0.5; } return t; }
  void main(){
    vec2 p = vW.xz * ${lite ? '0.0016' : '0.00115'} + vec2(uZaman * 0.0035, uZaman * 0.0012);
    // sirrus: rüzgârla taranmış ince tül bulutlar (bir eksende uzar, diğerinde incelir)
    p = mix(p, vec2(p.x * 0.55 + p.y * 0.35, (p.y - p.x * 0.3) * 3.2), uSirrus);
    float n = fbm(p);
    float esik = mix(0.66, 0.36, uOrt);
    float yog = smoothstep(esik, esik + mix(0.22, 0.42, uSirrus), n) * mix(1.0, 0.78, uSirrus);
    float d = length(vW.xz - cameraPosition.xz);
    float kenar = 1.0 - smoothstep(2600.0, 5200.0, d);
    vec3 V = normalize(vW - cameraPosition);
    float g = max(dot(V, normalize(uGunes)), 0.0);
    // altı gölgeli, güneşe bakan kenarı aydınlık; ufka doğru gök pusuna karışır
    vec3 c = mix(uGolge, uAcik, smoothstep(0.35, 0.95, n));
    c += uIsik * uIsikG * (pow(g, 8.0) * 0.8 + pow(g, 2.0) * 0.15) * (1.0 - yog * 0.5);
    c = mix(c, uPus, smoothstep(1800.0, 5000.0, d) * 0.85);
    gl_FragColor = vec4(c, yog * kenar * uYog);
  }`;

function sirtGeo(s, seg) {
  const poz = [], ust = [], hh = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = i / seg * Math.PI * 2;
    // vadi boyunca hafif açılıp kapanan yarıçap: düz bir çember değil, katmanlı sırtlar
    const r = s.r * (1 + 0.05 * Math.sin(a * 3 + s.tohum) + 0.03 * Math.sin(a * 7.3 - s.tohum));
    const yuk = s.y + s.a * Math.pow(sirtGurultu(a, s.tohum), 1.35);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    poz.push(x, -70, z, x, yuk, z);
    ust.push(0, 1); hh.push(yuk, yuk);
    if (i < seg) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
  g.setAttribute('aUst', new THREE.Float32BufferAttribute(ust, 1));
  g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

function halkaGeo(r, yuk, seg, sapma) {
  const poz = [], ust = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const a = i / seg * Math.PI * 2;
    const rr = r * (1 + sapma * Math.sin(a * 5 + r));
    const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    poz.push(x, -8, z, x, yuk, z); ust.push(0, 1);
    if (i < seg) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
  g.setAttribute('aUst', new THREE.Float32BufferAttribute(ust, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* mod paletleri: koyu/açık sırt tonu (en yakın katman), deniz, bulut gölge/ışık, sis gücü, bulut örtüsü */
const PALET = {
  day:    { koyu: '#4d5747', acik: '#8a8f78', deniz: '#4f7f95', golge: '#aab4bd', bAcik: '#f4f3ee', sis: 0.42, ort: 0.30, yog: 0.85, isik: 0.25, yildiz: 0 },
  sunset: { koyu: '#2b2c2c', acik: '#5b5048', deniz: '#36495a', golge: '#6b6575', bAcik: '#f3c79a', sis: 0.55, ort: 0.42, yog: 0.92, isik: 1.0, yildiz: 0 },
  night:  { koyu: '#05070c', acik: '#0e1320', deniz: '#0a1220', golge: '#121826', bAcik: '#283246', sis: 0.30, ort: 0.30, yog: 0.55, isik: 0.0, yildiz: 1 },
  // karşı ışıkta altın saat (saha fotoğrafından): sıcak pus, düşük kontrastlı uzak sırtlar, parlak tül bulut
  gunbatimi: { koyu: '#4f5348', acik: '#9c9a82', deniz: '#a3a993', golge: '#c9cec0', bAcik: '#fffaea', sis: 0.28, ort: 0.64, yog: 0.92, isik: 1.15, yildiz: 0 },
  // nasel çatısından açık sabah (saha fotoğrafı): pus yok denecek kadar az, uzak sırtlar maki yeşili
  nasel: { koyu: '#33402c', acik: '#6f7c5e', deniz: '#6f93ad', golge: '#cfd8df', bAcik: '#ffffff', sis: 0, ort: 0.15, yog: 0.0, isik: 0.2, yildiz: 0 },
  safak:  { koyu: '#141a28', acik: '#3a3c4c', deniz: '#22304a', golge: '#3b4561', bAcik: '#f0a878', sis: 0.6, ort: 0.45, yog: 0.9, isik: 0.8, yildiz: 0.3 },
};

export function egeKur(S, { lite = false } = {}) {
  const { scene } = S;
  const grup = new THREE.Group();
  grup.name = 'ege';
  const ortak = {
    uPus: { value: new THREE.Color() }, uIsik: { value: new THREE.Color('#ffb070') },
    uGunes: { value: new THREE.Vector3(-0.9, 0.2, -0.4) }, uIsikG: { value: 0 }, uZaman: { value: 0 },
  };

  // sırtlar: uzaktan yakına çizilir (şeffaf değil; derinlik doğru sıralar)
  const sirtMat = [], sirtlar = [];
  SIRTLAR.forEach((s, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: SIRT_VS, fragmentShader: SIRT_FS, fog: false, side: THREE.DoubleSide,
      uniforms: {
        uKoyu: { value: new THREE.Color() }, uAcik: { value: new THREE.Color() },
        uPus: ortak.uPus, uIsik: ortak.uIsik, uGunes: ortak.uGunes, uIsikG: ortak.uIsikG,
        uPusG: { value: s.pus }, uEtek: { value: 0.3 },
      },
    });
    mat.userData.pus = s.pus;
    const m = new THREE.Mesh(sirtGeo(s, lite ? 180 : 420), mat);
    m.frustumCulled = false; m.renderOrder = -1 + i * 0.01;
    grup.add(m); sirtMat.push(mat); sirtlar.push(m);
  });

  // Ege kıyısı: batıda (-x) ufuk boyunca deniz şeridi; sırtların önünde, arazinin ardında
  const denizMat = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: DENIZ_FS, fog: false,
    uniforms: { uDeniz: { value: new THREE.Color() }, uPus: ortak.uPus, uIsik: ortak.uIsik, uGunes: ortak.uGunes,
      uIsikG: ortak.uIsikG, uZaman: ortak.uZaman, uPusG: { value: 0.3 } },
  });
  const deniz = new THREE.Mesh(new THREE.RingGeometry(1150, 2300, lite ? 48 : 96, 1, Math.PI * 0.62, Math.PI * 0.86), denizMat);
  deniz.rotation.x = -Math.PI / 2; deniz.position.y = -6;
  deniz.frustumCulled = false; deniz.renderOrder = -1;
  grup.add(deniz);

  // alçak sis bantları: kameradan uzak üç halka, sırt eteklerini ve vadileri yumuşatır
  const sisMat = [];
  [[620, 46, 0.6], [980, 70, 0.8], [1300, 95, 1]].forEach(([r, yuk, guc], i) => {
    if (lite && i === 0) return;
    const mat = new THREE.ShaderMaterial({
      vertexShader: SIS_VS, fragmentShader: sisFS(lite), fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uPus: ortak.uPus, uIsik: ortak.uIsik, uGunes: ortak.uGunes, uIsikG: ortak.uIsikG, uZaman: ortak.uZaman,
        uGuc: { value: 0 }, uTohum: { value: i * 13.7 } },
    });
    mat.userData.guc = guc;
    const m = new THREE.Mesh(halkaGeo(r, yuk, lite ? 96 : 200, 0.04), mat);
    m.frustumCulled = false; m.renderOrder = 2;
    grup.add(m); sisMat.push(mat);
  });

  // yüksek bulut katmanı
  const bulutMat = new THREE.ShaderMaterial({
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: bulutFS(lite), fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uGolge: { value: new THREE.Color() }, uAcik: { value: new THREE.Color() }, uIsik: ortak.uIsik, uGunes: ortak.uGunes,
      uPus: ortak.uPus, uOrt: { value: 0.3 }, uYog: { value: 0.8 }, uIsikG: ortak.uIsikG, uZaman: ortak.uZaman, uSirrus: { value: 0 } },
  });
  const bulut = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000, 1, 1), bulutMat);
  bulut.rotation.x = -Math.PI / 2; bulut.position.y = 720;
  bulut.frustumCulled = false; bulut.renderOrder = 1;
  grup.add(bulut);

  // yıldızlar (gece)
  let yildiz = null;
  {
    const n = lite ? 380 : 900, p = [];
    for (let i = 0; i < n; i++) {
      const u = h1(i * 3.1 + 0.5), v = h1(i * 7.7 + 1.3);
      const a = u * Math.PI * 2, y = 0.08 + Math.pow(v, 0.8) * 0.92;
      const rr = Math.sqrt(1 - y * y);
      p.push(Math.cos(a) * rr * 2000, y * 2000, Math.sin(a) * rr * 2000);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    yildiz = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe6ff, size: lite ? 1.6 : 1.4, sizeAttenuation: false,
      transparent: true, opacity: 0, depthWrite: false, fog: false }));
    yildiz.frustumCulled = false; yildiz.renderOrder = -1;
    grup.add(yildiz);
  }
  // güneş halesi: düşük güneşin çevresindeki ışıma (masaüstünde bloom ile birleşir, telefonda tek başına yeter)
  const hale = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,250,228,1)'); r.addColorStop(0.08, 'rgba(255,244,205,.95)'); r.addColorStop(0.22, 'rgba(255,236,180,.42)');
    r.addColorStop(0.5, 'rgba(255,226,160,.12)'); r.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending, opacity: 0 }));
    sp.renderOrder = 3; sp.frustumCulled = false; sp.visible = false;
    return sp;
  })();
  grup.add(hale);
  scene.add(grup);
  let haleG = 0, sirrusHedef = 0, sirrusSimdi = 0;
  const _gv = new THREE.Vector3();
  /* karşı ışık: güneşi kameranın baktığı yöne, türbinin biraz soluna ve ufka yakın yerleştirir */
  function gunesBak(yon) { hedef.gunes.copy(yon); }
  function haleAyarla(g) { haleG = g; }
  function sirrus(v) { sirrusHedef = v; }
  /* ova: türbinin çevresi fotoğraftaki gibi düz tarla; uzak tepeler ve sırtlar yerinde kalır.
   * araziY yalnız kamera zemin denetimi için aynı katsayıyla düzeltilir. */
  function ovaKatsayi(x, z) { const d = Math.hypot(x, z); const t = Math.min(1, Math.max(0, (d - 520) / 380)); return 0.1 + 0.9 * t * t * (3 - 2 * t); }
  let ovaAcik = false;
  function ova(araziY) {
    if (ovaAcik) return; ovaAcik = true;
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== 'PlaneGeometry') return;
      const pr = o.geometry.parameters || {};
      if (pr.width === 2600) {                       // arazi (geometri dünya ekseninde)
        const pos = o.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) pos.setY(i, pos.getY(i) * ovaKatsayi(pos.getX(i), pos.getZ(i)));
        pos.needsUpdate = true; o.geometry.computeVertexNormals(); o.geometry.computeBoundingSphere();
      } else if (pr.width === 11 && pr.height === 300) {   // saha yolu araziye otursun
        o.updateMatrixWorld(true);
        const pos = o.geometry.attributes.position, v = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i); o.localToWorld(v);
          v.y = araziY(v.x, v.z) * ovaKatsayi(v.x, v.z) + 0.08; o.worldToLocal(v);
          pos.setXYZ(i, v.x, v.y, v.z);
        }
        pos.needsUpdate = true; o.geometry.computeVertexNormals();
      }
    });
    if (S.parts && S.parts.farm) S.parts.farm.children.forEach(t => { t.position.y = araziY(t.position.x, t.position.z) * ovaKatsayi(t.position.x, t.position.z) - 1.5; });
    sirtlar.forEach(m => { m.scale.y = 0.55; });    // fotoğraftaki gibi alçak, puslu uzak dağlar: düşük güneş görünür kalır
  }
  /* MAKİ (önizleme): nasel çatısından bakışta yakın arazi "HD" görünsün.
   * Arazi gölgelendiricisine dünya koordinatlı ayrıntı: kireçtaşı açıklıklar üstünde koyu yeşil maki öbekleri;
   * uzakta ortalama tona karışır (kıpırdama yok). Arazi üstüne serilmiş toprak yollar ve sırtlarda birleşik
   * tek parça (tek çizim çağrısı) ek türbin dizileri. */
  let makiAcik = false, pusCarpan = 1;
  function maki(araziY, { lite: hafif = lite } = {}) {
    if (makiAcik) return; makiAcik = true; pusCarpan = 0.35;
    sirtlar.forEach(m => { m.scale.y = 0.45; });   // uzak sırtlar alçak: fotoğraftaki gibi tepe dizileri ufka iner
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry || o.geometry.type !== 'PlaneGeometry' || (o.geometry.parameters || {}).width !== 2600) return;
      o.material.onBeforeCompile = sh => {
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMakiW;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMakiW = (modelMatrix * vec4(position, 1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vMakiW;
float mkH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mkN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mkH(i), mkH(i+vec2(1,0)), f.x), mix(mkH(i+vec2(0,1)), mkH(i+vec2(1,1)), f.x), f.y); }`)
          .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec2 w = vMakiW.xz;
  float alan = mkN(w * 0.0045) * 0.55 + mkN(w * 0.016 + 4.0) * 0.45 + 0.08;           // açıklık / sık maki bölgeleri
  float yog = smoothstep(0.30, 0.66, alan);
  float k = mkN(w * 0.20) * 0.52 + mkN(w * 0.52 + 7.0) * 0.32 + mkN(w * 1.3 + 3.0) * 0.16;   // 1–3 m'lik çalı öbekleri
  float esik = 0.62 - yog * 0.40;
  float cali = smoothstep(esik - 0.035, esik + 0.035, k);
  float golgeli = smoothstep(esik, esik + 0.18, k);                         // öbeğin içi koyu, kenarı açık
  vec3 toprak = mix(vec3(0.40, 0.33, 0.24), vec3(0.47, 0.42, 0.34), mkN(w * 0.04));
  toprak *= 0.86 + 0.24 * mkN(w * 0.8 + 1.7);
  vec3 yesil = mix(vec3(0.085, 0.12, 0.055), vec3(0.03, 0.05, 0.026), golgeli) * (0.85 + 0.3 * mkN(w * 0.27 + 11.0));
  vec3 renk = mix(toprak, yesil, cali);
  float uzak = smoothstep(220.0, 700.0, distance(vMakiW, cameraPosition));
  renk = mix(renk, mix(toprak, yesil * 1.25, mix(0.80, 0.95, yog)), uzak);
  float merkez = 1.0 - smoothstep(40.0, 75.0, length(w));                   // montaj platformu: mevcut çakıl tonu
  diffuseColor.rgb = mix(renk, diffuseColor.rgb, merkez);
}`);
      };
      o.material.needsUpdate = true;
    });
    // toprak yollar: arazinin 0,3 m üstünde serili şeritler
    const yolMat = new THREE.MeshStandardMaterial({ color: 0xc2a27a, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const YOLLAR = [
      [[0, 0], [-60, 110], [-40, 260], [-160, 420], [-330, 470], [-560, 430]],
      [[0, 0], [120, -90], [300, -120], [470, -260], [690, -320]],
      [[-60, 110], [80, 230], [260, 330], [420, 520], [560, 700]],
      [[120, -90], [60, -280], [-120, -430], [-260, -640]],
    ];
    YOLLAR.forEach(noktalar => {
      const egri = new THREE.CatmullRomCurve3(noktalar.map(([x, z]) => new THREE.Vector3(x, 0, z)));
      const n = Math.ceil(egri.getLength() / (hafif ? 9 : 4)), poz = [], idx = [];
      const a = new THREE.Vector3(), t = new THREE.Vector3();
      for (let i = 0; i <= n; i++) {
        egri.getPointAt(i / n, a); egri.getTangentAt(i / n, t);
        const nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1, gen = 3.2;
        for (const s of [-1, 1]) { const x = a.x + nx / l * gen * s, z = a.z + nz / l * gen * s; poz.push(x, araziY(x, z) + 0.3, z); }
        if (i < n) { const b = i * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, yolMat); m.receiveShadow = true; grup.add(m);
    });
    // sırtlardaki ek türbinler: tek birleşik geometri (çizim çağrısı: 1)
    const adaylar = [];
    for (let r = 330; r <= 1250; r += 55) for (let a = 0; a < Math.PI * 2; a += 55 / r) {
      const x = Math.cos(a) * r, z = Math.sin(a) * r; adaylar.push([x, z, araziY(x, z) + 0.004 * r]);
    }
    adaylar.sort((p, q) => q[2] - p[2]);
    const mevcut = S.parts && S.parts.farm ? S.parts.farm.children.map(c => [c.position.x, c.position.z]) : [];
    const secilen = [];
    for (const c of adaylar) {
      if (secilen.length >= (hafif ? 18 : 40)) break;
      if ([...secilen, ...mevcut].every(q => Math.hypot(q[0] - c[0], q[1] - c[1]) > 135) && Math.hypot(c[0], c[1]) > 300) secilen.push(c);
    }
    const parcalar = [];
    const ekle = (geo, m) => { const g = geo.toNonIndexed(); g.applyMatrix4(m); parcalar.push(g); };
    const M = new THREE.Matrix4(), R = new THREE.Matrix4(), T = new THREE.Matrix4();
    secilen.forEach(([x, z], i) => {
      const ol = 1.0 + h1(i * 1.7) * 0.15, yon = 0.4 + (h1(i * 3.1) - 0.5) * 0.25, aci = h1(i * 5.3) * 2.1;
      const taban = new THREE.Matrix4().makeTranslation(x, araziY(x, z) - 1.2, z).multiply(new THREE.Matrix4().makeRotationY(yon)).multiply(new THREE.Matrix4().makeScale(ol, ol, ol));
      ekle(new THREE.CylinderGeometry(1.0, 1.7, 76, 10), M.copy(taban).multiply(T.makeTranslation(0, 38, 0)));
      ekle(new THREE.CapsuleGeometry(1.7, 5.5, 3, 8), M.copy(taban).multiply(T.makeTranslation(0, 77.5, 0.5)).multiply(R.makeRotationX(Math.PI / 2)));
      for (let k = 0; k < 3; k++) {
        const kanat = new THREE.BoxGeometry(1.1, 40, 0.28); kanat.translate(0, 21, 0);
        ekle(kanat, M.copy(taban).multiply(T.makeTranslation(0, 77.5, -3.4)).multiply(R.makeRotationZ(aci + k * Math.PI * 2 / 3)));
      }
    });
    if (parcalar.length) {
      const say = parcalar.reduce((t, g) => t + g.attributes.position.count, 0);
      const pz = new Float32Array(say * 3), nr = new Float32Array(say * 3); let o = 0;
      parcalar.forEach(g => { pz.set(g.attributes.position.array, o * 3); nr.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pz, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nr, 3)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xf6f7f4, emissive: 0x3a3b38, roughness: 0.5, metalness: 0 }));
      m.castShadow = false; m.receiveShadow = false; grup.add(m);
    }
    return secilen.length;
  }
  function yerY(araziY, x, z) { return araziY(x, z) * (ovaAcik ? ovaKatsayi(x, z) : 1); }

  /* hedef değerler ve yumuşak geçiş */
  const R = () => new THREE.Color();
  const simdi = { pus: R(), isik: R(), koyu: R(), acik: R(), deniz: R(), golge: R(), bAcik: R(), gunes: new THREE.Vector3(),
    isikG: 0, sis: 0, ort: 0, yog: 0, yildiz: 0, pusEk: 0 };
  const hedef = { pus: R(), isik: R(), koyu: R(), acik: R(), deniz: R(), golge: R(), bAcik: R(), gunes: new THREE.Vector3(),
    isikG: 0, sis: 0, ort: 0, yog: 0, yildiz: 0, pusEk: 0 };
  let ilk = true;

  function uygula() {
    ortak.uPus.value.copy(simdi.pus); ortak.uIsik.value.copy(simdi.isik);
    ortak.uGunes.value.copy(simdi.gunes); ortak.uIsikG.value = simdi.isikG;
    sirtMat.forEach((m, i) => {
      const u = m.uniforms;
      // uzak katmanlar koyu tona daha az iner: tepe çizgileri birbirinden ayrılır
      const t = i / (sirtMat.length - 1);
      u.uKoyu.value.copy(simdi.koyu).lerp(simdi.pus, (1 - t) * 0.25);
      u.uAcik.value.copy(simdi.acik).lerp(simdi.pus, (1 - t) * 0.2);
      u.uPusG.value = Math.min(0.97, m.userData.pus * pusCarpan + simdi.pusEk * (0.6 + 0.4 * (1 - t)));
      u.uEtek.value = 0.25 + simdi.sis * 0.35;
    });
    denizMat.uniforms.uDeniz.value.copy(simdi.deniz);
    denizMat.uniforms.uPusG.value = Math.min(0.95, 0.28 + simdi.pusEk);
    sisMat.forEach(m => { m.uniforms.uGuc.value = simdi.sis * m.userData.guc; });
    bulutMat.uniforms.uGolge.value.copy(simdi.golge); bulutMat.uniforms.uAcik.value.copy(simdi.bAcik);
    bulutMat.uniforms.uOrt.value = simdi.ort; bulutMat.uniforms.uYog.value = simdi.yog;
    yildiz.material.opacity = simdi.yildiz * 0.5; yildiz.visible = simdi.yildiz > 0.01;
  }

  /* mod + hava: sahnenin son sis rengi ve güneşi okunur (setLight ve hava ayarı yapıldıktan sonra çağrılır) */
  function ayarla(mod, tur) {
    const P = PALET[mod] || PALET.day;
    const kapali = tur === 'bulutlu' || tur === 'yagmur' || tur === 'firtina' || tur === 'kar' || tur === 'sis';
    const koyuHava = tur === 'yagmur' || tur === 'firtina';
    hedef.pus.copy(scene.fog.color);
    hedef.isik.copy(S.sun.color);
    hedef.gunes.copy(S.sun.position).normalize();
    hedef.koyu.set(P.koyu); hedef.acik.set(P.acik); hedef.deniz.set(P.deniz);
    hedef.golge.set(P.golge); hedef.bAcik.set(P.bAcik);
    const parcali = tur === 'parcali';
    hedef.isikG = kapali ? P.isik * 0.15 : parcali ? P.isik * 0.85 : P.isik;
    hedef.sis = Math.min(1, P.sis + (tur === 'sis' ? 0.55 : kapali ? 0.2 : 0));
    hedef.ort = kapali ? (koyuHava ? 0.95 : 0.8) : tur === 'acik' ? P.ort * 0.6 : parcali ? Math.min(0.75, P.ort + 0.22) : P.ort;
    hedef.yog = kapali ? 0.97 : P.yog;
    hedef.yildiz = kapali ? 0 : P.yildiz;
    hedef.pusEk = tur === 'sis' ? 0.5 : koyuHava ? 0.3 : kapali ? 0.15 : 0;
    if (kapali) { hedef.golge.lerp(scene.fog.color, 0.5).multiplyScalar(0.85); hedef.bAcik.lerp(scene.fog.color, 0.55); }
    if (ilk) { anlik(); ilk = false; }
  }
  function anlik() {
    ['pus', 'isik', 'koyu', 'acik', 'deniz', 'golge', 'bAcik'].forEach(k => simdi[k].copy(hedef[k]));
    simdi.gunes.copy(hedef.gunes);
    ['isikG', 'sis', 'ort', 'yog', 'yildiz', 'pusEk'].forEach(k => { simdi[k] = hedef[k]; });
    uygula();
  }
  // her karede: ~2,5 sn'lik üstel yaklaşım; zaman yalnız hareket serbestken ilerler
  function adim(dt, mtSn, hareket) {
    const a = 1 - Math.exp(-dt * 1.6);
    ['pus', 'isik', 'koyu', 'acik', 'deniz', 'golge', 'bAcik'].forEach(k => simdi[k].lerp(hedef[k], a));
    simdi.gunes.lerp(hedef.gunes, a);
    ['isikG', 'sis', 'ort', 'yog', 'yildiz', 'pusEk'].forEach(k => { simdi[k] += (hedef[k] - simdi[k]) * a; });
    if (hareket) ortak.uZaman.value = mtSn;
    sirrusSimdi += (sirrusHedef - sirrusSimdi) * a; bulutMat.uniforms.uSirrus.value = sirrusSimdi;
    uygula();
    if (kamera) {
      const op = haleG * Math.max(0, Math.min(1, simdi.gunes.y * 8 + 0.6));
      hale.visible = op > 0.01; hale.material.opacity = op;
      if (hale.visible) { _gv.copy(simdi.gunes).normalize().multiplyScalar(1500); hale.position.copy(kamera.position).add(_gv); const sc = lite ? 520 : 470; hale.scale.set(sc, sc, 1); }
    }
  }
  let kamera = null;
  function kameraBagla(k) { kamera = k; }
  return { grup, ayarla, adim, anlik, gunesBak, haleAyarla, sirrus, ova, maki, yerY, kameraBagla };
}
