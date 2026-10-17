/* Gerçek gökyüzü: Aliağa (38,85° K, 27,0° D) için güneş ve ay konumu, ay evresi ve en parlak yıldızlar.
 * Hesaplar düşük hassasiyetli gök mekaniği yaklaşımlarıdır (güneş/ay ~0,5°, yıldızlar J2000 koordinatı);
 * görsel amaçlıdır, gözlem için değil.
 * Dünya eksenleri: kuzey = -z, doğu = +x, yukarı = +y (türbinin rüzgâr yönüne dönüşüyle aynı çerçeve). */
const RAD = Math.PI / 180, GUN_MS = 86400000, J1970 = 2440588, J2000 = 2451545, EGIM = RAD * 23.4397;
const gunSay = t => t / GUN_MS - 0.5 + J1970 - J2000;
const sagAcilim = (l, b) => Math.atan2(Math.sin(l) * Math.cos(EGIM) - Math.tan(b) * Math.sin(EGIM), Math.cos(l));
const dikAcilim = (l, b) => Math.asin(Math.sin(b) * Math.cos(EGIM) + Math.cos(b) * Math.sin(EGIM) * Math.sin(l));
const yildizZamani = (d, lw) => RAD * (280.16 + 360.9856235 * d) - lw;
// güneyden batıya ölçülen azimut ve yükseklik
const azimut = (H, phi, dec) => Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
const yukseklik = (H, phi, dec) => Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));

function gunesKoord(d) {
  const M = RAD * (357.5291 + 0.98560028 * d);
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI;
  return { dec: dikAcilim(L, 0), ra: sagAcilim(L, 0) };
}
function ayKoord(d) {
  const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.22935 * d);
  const l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F), uz = 385001 - 20905 * Math.cos(M);
  return { ra: sagAcilim(l, b), dec: dikAcilim(l, b), uz };
}

// ad, sağ açıklık (saat), dik açıklık (°), kadir; renk: 0 beyaz, 1 mavimsi, 2 turuncu
const YILDIZ = [
  ['Sirius', 6.752, -16.72, -1.46, 1], ['Arcturus', 14.261, 19.18, -0.05, 2], ['Vega', 18.616, 38.78, 0.03, 1],
  ['Capella', 5.278, 46.0, 0.08, 0], ['Rigel', 5.242, -8.2, 0.13, 1], ['Procyon', 7.655, 5.22, 0.34, 0],
  ['Betelgeuse', 5.919, 7.41, 0.5, 2], ['Altair', 19.846, 8.87, 0.76, 0], ['Aldebaran', 4.599, 16.51, 0.86, 2],
  ['Antares', 16.49, -26.43, 0.96, 2], ['Spica', 13.42, -11.16, 0.97, 1], ['Pollux', 7.755, 28.03, 1.14, 2],
  ['Fomalhaut', 22.961, -29.62, 1.16, 0], ['Deneb', 20.69, 45.28, 1.25, 0], ['Regulus', 10.139, 11.97, 1.35, 1],
  ['Adhara', 6.977, -28.97, 1.5, 1], ['Castor', 7.577, 31.89, 1.58, 0], ['Shaula', 17.56, -37.1, 1.62, 1],
  ['Bellatrix', 5.419, 6.35, 1.64, 1], ['Elnath', 5.438, 28.61, 1.65, 1], ['Alnilam', 5.604, -1.2, 1.69, 1],
  ['Alnitak', 5.679, -1.94, 1.77, 1], ['Alioth', 12.9, 55.96, 1.77, 0], ['Dubhe', 11.062, 61.75, 1.79, 2],
  ['Mirfak', 3.405, 49.86, 1.79, 0], ['Wezen', 7.14, -26.39, 1.83, 0], ['Kaus Australis', 18.403, -34.38, 1.85, 0],
  ['Alkaid', 13.792, 49.31, 1.86, 1], ['Menkalinan', 5.992, 44.95, 1.9, 0], ['Alhena', 6.629, 16.4, 1.93, 0],
  ['Polaris', 2.53, 89.26, 1.98, 0], ['Mirzam', 6.378, -17.96, 1.98, 1], ['Alphard', 9.46, -8.66, 1.98, 2],
  ['Hamal', 2.12, 23.46, 2.0, 2], ['Diphda', 0.727, -17.99, 2.02, 2], ['Nunki', 18.921, -26.3, 2.05, 1],
  ['Alpheratz', 0.14, 29.09, 2.06, 1], ['Mirach', 1.163, 35.62, 2.05, 2], ['Saiph', 5.796, -9.67, 2.07, 1],
  ['Kochab', 14.845, 74.16, 2.08, 2], ['Rasalhague', 17.582, 12.56, 2.08, 0], ['Algol', 3.136, 40.96, 2.12, 1],
  ['Almach', 2.065, 42.33, 2.1, 2], ['Denebola', 11.818, 14.57, 2.14, 0], ['Schedar', 0.675, 56.54, 2.24, 2],
  ['Mintaka', 5.533, -0.3, 2.23, 1], ['Alphecca', 15.578, 26.71, 2.23, 0], ['Caph', 0.153, 59.15, 2.28, 0],
  ['Sadr', 20.37, 40.26, 2.23, 0], ['Eltanin', 17.943, 51.49, 2.24, 2], ['Mizar', 13.399, 54.93, 2.23, 0],
  ['Dschubba', 16.006, -22.62, 2.29, 1], ['Merak', 11.031, 56.38, 2.37, 0], ['Enif', 21.736, 9.88, 2.39, 2],
  ['Sabik', 17.173, -15.72, 2.43, 0], ['Scheat', 23.063, 28.08, 2.42, 2], ['Phecda', 11.897, 53.69, 2.44, 0],
  ['Gamma Cas', 0.945, 60.72, 2.47, 1], ['Markab', 23.079, 15.21, 2.49, 0], ['Menkar', 3.038, 4.09, 2.54, 2],
  ['Unukalhai', 15.738, 6.43, 2.63, 2], ['Ruchbah', 1.43, 60.24, 2.68, 0], ['Algenib', 0.22, 15.18, 2.83, 1],
  ['Alcyone', 3.791, 24.11, 2.87, 1], ['Cor Caroli', 12.934, 38.32, 2.89, 0], ['Albireo', 19.512, 27.96, 3.08, 2],
  ['Megrez', 12.257, 57.03, 3.31, 0], ['Segin', 1.907, 63.67, 3.37, 1],
];
const RENK = [[1, 0.98, 0.95], [0.82, 0.88, 1], [1, 0.8, 0.6]];

export function gokKur(THREE, { lite = false, enlem = 38.85, boylam = 27.0, sabitZaman = null } = {}) {
  const phi = RAD * enlem, lw = RAD * -boylam;
  const grup = new THREE.Group(); grup.name = 'gercek-gok';
  const R = 1850;
  // yön: pusula azimutu (kuzeyden saat yönünde) ve yükseklikten dünya vektörü
  const yonYaz = (v, azGuney, h) => { const A = azGuney + Math.PI; return v.set(Math.sin(A) * Math.cos(h), Math.sin(h), -Math.cos(A) * Math.cos(h)); };

  // ---- yıldızlar ----
  const n = YILDIZ.length, poz = new Float32Array(n * 3), boy = new Float32Array(n), renk = new Float32Array(n * 3);
  YILDIZ.forEach(([, , , mag, r], i) => {
    boy[i] = Math.max(2.2, 5.6 - 1.05 * mag) * (lite ? 1.15 : 1);
    const c = RENK[r], par = THREE.MathUtils.clamp(1.05 - 0.17 * mag, 0.45, 1.25);
    renk.set([c[0] * par, c[1] * par, c[2] * par], i * 3);
  });
  const yg = new THREE.BufferGeometry();
  yg.setAttribute('position', new THREE.BufferAttribute(poz, 3));
  yg.setAttribute('aBoy', new THREE.BufferAttribute(boy, 1));
  yg.setAttribute('aRenk', new THREE.BufferAttribute(renk, 3));
  const ymat = new THREE.ShaderMaterial({
    uniforms: { uGor: { value: 0 }, uOlcek: { value: Math.min(2, window.devicePixelRatio || 1) } },
    vertexShader: `attribute float aBoy; attribute vec3 aRenk; varying vec3 vR; uniform float uOlcek;
      void main(){ vR = aRenk; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_PointSize = aBoy * uOlcek; }`,
    fragmentShader: `varying vec3 vR; uniform float uGor;
      void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); float a = smoothstep(0.5, 0.0, d); a *= a;
        gl_FragColor = vec4(vR, a * uGor); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const yildizlar = new THREE.Points(yg, ymat); yildizlar.frustumCulled = false; grup.add(yildizlar);

  // ---- ay: gerçek konumda, gerçek güneş yönüyle aydınlanan küre (evre ve hilalin yönü kendiliğinden doğru çıkar) ----
  const ayR = R * Math.tan(0.95 * RAD);   // görünür çapı ~1,9° (gerçeği 0,5°: ekranda seçilebilsin diye büyütüldü)
  const amat = new THREE.ShaderMaterial({
    uniforms: { uGunes: { value: new THREE.Vector3(0, 1, 0) }, uGor: { value: 0 }, uGece: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vY;
      void main(){ vN = normalize(mat3(modelMatrix) * normal); vY = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uGunes; uniform float uGor, uGece; varying vec3 vN; varying vec3 vY;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        vec3 n = normalize(vN);
        float isik = smoothstep(-0.04, 0.10, dot(n, normalize(uGunes)));
        vec3 p = normalize(vY) * 2.2;
        float deniz = smoothstep(0.42, 0.68, n3(p) * 0.6 + n3(p * 2.7) * 0.4);   // koyu "denizler"
        vec3 yuzey = mix(vec3(0.95, 0.93, 0.88), vec3(0.62, 0.62, 0.64), deniz * 0.75);
        vec3 renk = mix(vec3(0.05, 0.06, 0.08), yuzey, isik);
        float a = mix(isik, max(isik, 0.16), uGece) * uGor;
        gl_FragColor = vec4(renk, a);
      }`,
    transparent: true, depthWrite: false,
  });
  const ay = new THREE.Mesh(new THREE.SphereGeometry(ayR, 32, 20), amat); ay.frustumCulled = false; grup.add(ay);
  // ay halesi (ince, evreyle güçlenir)
  const hc = document.createElement('canvas'); hc.width = hc.height = 64;
  const hx = hc.getContext('2d'), hg = hx.createRadialGradient(32, 32, 0, 32, 32, 32);
  hg.addColorStop(0, 'rgba(220,230,255,0.55)'); hg.addColorStop(0.35, 'rgba(180,200,240,0.16)'); hg.addColorStop(1, 'rgba(160,180,230,0)');
  hx.fillStyle = hg; hx.fillRect(0, 0, 64, 64);
  const hdoku = new THREE.CanvasTexture(hc); hdoku.colorSpace = THREE.SRGBColorSpace;
  const hale = new THREE.Sprite(new THREE.SpriteMaterial({ map: hdoku, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false }));
  hale.scale.set(ayR * 9, ayR * 9, 1); grup.add(hale);

  const durum = { gunesYon: new THREE.Vector3(0, 1, 0), gunesH: 0, ayYon: new THREE.Vector3(0, 1, 0), ayH: 0, ayKesir: 0, ayEvre: 0, t: 0 };
  const _v = new THREE.Vector3();

  function hesapla(tarih = sabitZaman ? new Date(sabitZaman) : new Date()) {
    const d = gunSay(+tarih), st = yildizZamani(d, lw);
    const g = gunesKoord(d), gH = st - g.ra;
    durum.gunesH = yukseklik(gH, phi, g.dec); yonYaz(durum.gunesYon, azimut(gH, phi, g.dec), durum.gunesH);
    const a = ayKoord(d), aH = st - a.ra;
    durum.ayH = yukseklik(aH, phi, a.dec); yonYaz(durum.ayYon, azimut(aH, phi, a.dec), durum.ayH);
    // evre: güneş-ay açısal uzaklığından aydınlanan kesir
    const sd = 149598000, ph = Math.acos(Math.sin(g.dec) * Math.sin(a.dec) + Math.cos(g.dec) * Math.cos(a.dec) * Math.cos(g.ra - a.ra));
    const inc = Math.atan2(sd * Math.sin(ph), a.uz - sd * Math.cos(ph));
    const ang = Math.atan2(Math.cos(g.dec) * Math.sin(g.ra - a.ra), Math.sin(g.dec) * Math.cos(a.dec) - Math.cos(g.dec) * Math.sin(a.dec) * Math.cos(g.ra - a.ra));
    durum.ayKesir = (1 + Math.cos(inc)) / 2; durum.ayEvre = 0.5 + 0.5 * inc * (ang < 0 ? -1 : 1) / Math.PI;
    // yıldızlar
    YILDIZ.forEach(([, raS, decD], i) => {
      const ra = raS * 15 * RAD, dec = decD * RAD, H = st - ra;
      yonYaz(_v, azimut(H, phi, dec), yukseklik(H, phi, dec)).multiplyScalar(R);
      poz[i * 3] = _v.x; poz[i * 3 + 1] = _v.y; poz[i * 3 + 2] = _v.z;
    });
    yg.attributes.position.needsUpdate = true;
    ay.position.copy(durum.ayYon).multiplyScalar(R); hale.position.copy(ay.position);
    amat.uniforms.uGunes.value.copy(durum.gunesYon);
    durum.t = Date.now();
    return durum;
  }

  /* gece: 0–1 (gece kipi 1, alacakaranlık arası), kapali: 0–1 (bulut/yağmur/sis örtüsü) */
  const gor = { y: 0, a: 0 };
  function adim(kamera, dt, gece, kapali) {
    if (Date.now() - durum.t > 30000) hesapla();
    grup.position.copy(kamera.position);
    const k = 1 - Math.exp(-dt * 1.5);
    const yHedef = gece * (1 - kapali);
    const ufuk = THREE.MathUtils.smoothstep(durum.ayH / RAD, -0.6, 1.2);
    const aHedef = ufuk * (1 - kapali) * (gece > 0.5 ? 1 : 0.55);
    gor.y += (yHedef - gor.y) * k; gor.a += (aHedef - gor.a) * k;
    ymat.uniforms.uGor.value = gor.y; yildizlar.visible = gor.y > 0.01;
    amat.uniforms.uGor.value = gor.a; amat.uniforms.uGece.value = gece; ay.visible = gor.a > 0.01;
    hale.material.opacity = gor.a * gece * (0.25 + 0.75 * durum.ayKesir); hale.visible = hale.material.opacity > 0.01;
  }

  hesapla();
  return { grup, durum, hesapla, adim };
}
