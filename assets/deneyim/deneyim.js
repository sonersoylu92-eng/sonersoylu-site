/* deneyim.js — "Türbinin içine" sinematik deneyimi.
 *
 * Mevcut altyapının üstüne kurulur:
 *   - n117.js  → dış model, arazi, gökyüzü, ışık modları (createScene)
 *   - nasel-ic.js → naselin içi (güç aktarma + elektrik)
 *   - three r169 (site içinde vendor), post-processing yalnız masaüstünde
 * Kaydırma ilerlemesi (0–1) bir kamera zaman çizelgesini sürer. Kamera
 * yolunun tamamı "yaw" ekseninde tanımlı: nasel gerçek rüzgâra döndüğünde
 * kadraj bozulmaz, yolculuk türbinle birlikte döner.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';
import { createScene, SPEC, araziY } from '/n117/n117.js?v=2675a459';
import { naselIciKur } from '/assets/deneyim/nasel-ic.js?v=7c5ea850';
import { kuleIciKur, kapiBosluguAc } from '/assets/deneyim/kule-ic.js?v=46e5de2b';
import { RoomEnvironment } from '/assets/vendor/pp/RoomEnvironment.js';

/* anlatı durakları: HUD ve bölüm göstergesi buradan beslenir (değerler N117/3000 Delta üretici verisi) */
export const DURAKLAR = [
  { p: 0.125, id: 'rotor',     ad: 'Rotor',              en: 'ROTOR',           bilgi: '116,8 m çap · 57,3 m kanat · 7,9–14,1 d/dk' },
  { p: 0.49,  id: 'gobek',     ad: 'Göbek',              en: 'HUB',             bilgi: 'Üç kanat yatağı · kanat açısı burada ayarlanır' },
  { p: 0.515, id: 'nasel',     ad: 'Nasel içi',          en: 'NACELLE',         bilgi: '12,4 × 4,2 × 4,0 m · yerden 120 m' },
  { p: 0.55,  id: 'anaYatak',  ad: 'Ana yatak',          en: 'MAIN BEARING',    bilgi: 'Rotorun ağırlığını ve itkisini taşır' },
  { p: 0.59,  id: 'anaMil',    ad: 'Ana mil',            en: 'MAIN SHAFT',      bilgi: 'Düşük devir, yüksek tork · göbekten dişli kutusuna' },
  { p: 0.635, id: 'disli',     ad: 'Dişli kutusu',       en: 'GEARBOX',         bilgi: '3 kademe · planet-planet-helisel' },
  { p: 0.685, id: 'kaplin',    ad: 'Kaplin',             en: 'COUPLING',        bilgi: 'Hızlı mil → jeneratör · fren diski ve kaliper' },
  { p: 0.76,  id: 'jenerator', ad: 'Jeneratör',          en: 'GENERATOR',       bilgi: '3.000 kW · çift beslemeli asenkron · 660 V' },
  { p: 0.845, id: 'konvertor', ad: 'Konvertör',          en: 'CONVERTER',       bilgi: 'Rotor devresini besler · şebekeye sabit frekans' },
  { p: 0.875, id: 'ustKutu',   ad: 'Üst kutu',           en: 'TOP BOX',         bilgi: 'Nasel kontrolü · PLC ve güvenlik zinciri' },
  { p: 0.905, id: 'panolar',   ad: 'Elektrik panoları',  en: 'CONTROL CABINETS',bilgi: 'Yardımcı güç · soğutma, aydınlatma, vinç devreleri' },
  { p: 0.93,  id: 'kablolar',  ad: 'Kablolar',           en: 'CABLES',          bilgi: 'Güç kabloları · kuleye inen sarkma ilmeği' },
];

function yonHedefIlk() { const d = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--yon-derece')); return isFinite(d) ? -d * Math.PI / 180 : null; }

export function deneyimBaslat(canvas, bolum, cb = {}) {
  const mobil = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches;
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const kok = document.documentElement;

  let S;
  try { S = createScene(canvas); } catch (e) { console.error('deneyim sahne:', e); return null; }
  const { renderer, scene, camera, controls, parts, towerTopY, setLight } = S;
  controls.enabled = false;
  if (parts.crane) parts.crane.visible = false;
  if (parts.groundBlade) parts.groundBlade.visible = false;

  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobil ? 1.25 : 1.6));
  if (mobil) renderer.shadowMap.enabled = false;
  const FOV_DIS = mobil ? 58 : 42, FOV_IC = mobil ? 74 : 60;   // içeride geniş objektif: dar nasel, gerçek ölçek
  camera.fov = FOV_DIS; camera.near = 0.05; camera.far = 6000; camera.updateProjectionMatrix();

  // sahnedeki mevcut ışıklar (n117.js): içeri girince dış ortam ışığı kısılır
  let hemi = null, gunes = null, dolgu = null;
  scene.traverse(o => { if (o.isHemisphereLight) hemi = o; else if (o.isDirectionalLight) { if (o.castShadow) gunes = o; else dolgu = o; } });
  let hemiTaban = hemi ? hemi.intensity : 1, dolguTaban = dolgu ? dolgu.intensity : 0.3, gunesTaban = gunes ? gunes.intensity : 1;

  // ortam yansıması: yalnız iç metal malzemelere
  let env = null;
  try { const pm = new THREE.PMREMGenerator(renderer); env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } catch (e) { env = null; }

  const tilt = parts.nacelle.parent;
  const yaw = parts.yaw;
  const ic = naselIciKur({ hafif: mobil, envMap: env });
  tilt.add(ic.grup);
  ic.grup.visible = false;

  /* ---------------- kule: kapı, kule içi, servis asansörü ----------------
   * Kule yereli: kapı +z yönünde. Kule, kapı ve kule içi naselin yaw açısıyla birlikte döner;
   * böylece kamera yolu (yaw yerelinde) her rüzgâr yönünde kapıya aynı açıdan gelir. */
  const KAPAK = new THREE.Vector2(-0.9, 0.65);            // nasel tabanındaki erişim kapağı (yaw yerelinde x, z)
  const dAz = Math.atan2(26, 38), cA = Math.cos(dAz), sA = Math.sin(dAz);
  const tl2yaw = (x, z) => [x * cA + z * sA, -x * sA + z * cA];
  const yaw2tl = (x, z) => [x * cA - z * sA, x * sA + z * cA];
  const kapakTL = yaw2tl(KAPAK.x, KAPAK.y);
  const kule = kuleIciKur({ SPEC, towerTopY, hafif: mobil, kapakXZ: new THREE.Vector2(kapakTL[0], kapakTL[1]) });
  scene.add(kule.grup);
  kapiBosluguAc(parts.towerSegs[0]);
  function kuleDondur() {
    const r = yaw.rotation.y + dAz;
    kule.grup.rotation.y = r; parts.towerSegs.forEach(sg => { sg.rotation.y = r; });
    if (parts.kuleIkaz) parts.kuleIkaz.rotation.y = r;
  }
  { const h0 = yonHedefIlk(); if (h0 !== null) yaw.rotation.y = h0; }
  kuleDondur();
  const KO = kule.olcu;

  /* ---------------- iç aydınlatma ---------------- */
  const icIsik = new THREE.Group(); tilt.add(icIsik); icIsik.visible = false;
  (mobil ? ic.lambalar.filter((_, i) => i % 2 === 0) : ic.lambalar).forEach(p => {
    const l = new THREE.PointLight(0xdfe9ff, mobil ? 6.5 : 4, 5.5, 1.6); l.position.set(...p); icIsik.add(l);
  });
  const camgobegi = new THREE.PointLight(0x4fd6ea, 1.6, 3.2, 2); camgobegi.position.set(1.0, 0.4, 2.7); icIsik.add(camgobegi);
  // tavan kapağından giren gün ışığı
  const { TAVAN, TABAN, KZ0, KZ1 } = ic.sinir;
  const kapakZ = (KZ0 + KZ1) / 2;
  const gunIsigi = new THREE.SpotLight(0xfff1dc, mobil ? 90 : 140, 14, 0.42, 0.75, 1.2);
  gunIsigi.position.set(-0.9, TAVAN + 4.2, kapakZ - 1.4);
  gunIsigi.target.position.set(0.35, TABAN, kapakZ + 1.0);
  if (!mobil) { gunIsigi.castShadow = true; gunIsigi.shadow.mapSize.set(1024, 1024); gunIsigi.shadow.bias = -0.0008; gunIsigi.shadow.camera.near = 1; gunIsigi.shadow.camera.far = 12; }
  icIsik.add(gunIsigi, gunIsigi.target);

  // hacimsel ışık huzmesi: yumuşak kenarlı, eklemeli koni (gerçek sis hesabı yerine ucuz ve inandırıcı)
  const huzmeMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uGuc: { value: 0.0 }, uZaman: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uGuc; uniform float uZaman; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float kenar = pow(abs(dot(vN,vV)), 1.6); float boy = smoothstep(0.0,0.35,vY)*smoothstep(1.0,0.55,vY);
        float titre = 0.92 + 0.08*sin(uZaman*0.7 + vY*6.0);
        gl_FragColor = vec4(vec3(1.0,0.95,0.86)*kenar*boy*uGuc*titre*0.22, 1.0); }`,
  });
  const huzmeUz = gunIsigi.position.distanceTo(gunIsigi.target.position);
  const huzmeGeo = new THREE.CylinderGeometry(0.55, 1.55, huzmeUz, 40, 1, true);
  huzmeGeo.translate(0, -huzmeUz / 2, 0);
  const huzme = new THREE.Mesh(huzmeGeo, huzmeMat);
  huzme.position.copy(gunIsigi.position);
  huzme.lookAt(gunIsigi.target.position); huzme.rotateX(-Math.PI / 2);
  huzme.renderOrder = 5;
  icIsik.add(huzme);

  // huzmede süzülen toz (yalnız masaüstü)
  let toz = null;
  if (!mobil) {
    const n = 420, pos = new Float32Array(n * 3), dir = new THREE.Vector3().subVectors(gunIsigi.target.position, gunIsigi.position);
    for (let i = 0; i < n; i++) {
      const t = 0.3 + Math.random() * 0.65, r = (0.2 + 0.9 * t) * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
      const p = gunIsigi.position.clone().addScaledVector(dir, t);
      pos[i * 3] = p.x + Math.cos(a) * r; pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.4; pos[i * 3 + 2] = p.z + Math.sin(a) * r;
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    toz = new THREE.Points(tg, new THREE.PointsMaterial({ color: 0xfff4e2, size: 0.012, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    icIsik.add(toz);
  }

  /* ---------------- kamera zaman çizelgesi ----------------
   * D = yaw eksenine göre (dış), N = nasel yerel (iç). Hepsi yaw yereline çevrilir.
   * p değerleri kaydırma oranı; iki kare arası yumuşak geçişle (dolly), karelerde hafif duraklama. */
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const yZemin = -(towerTopY + SPEC.nacelleHei / 2 + 0.25);   // yaw yerelinde yer seviyesi
  const Z = y => yZemin + y;                                  // yerden yükseklik → yaw yerel y
  const T = (x, h, z) => { const [a, b] = tl2yaw(x, z); return v(a, Z(h), b); };   // kule yereli → yaw yereli
  const KARE = [
    // dış görünüm: Ege sırtında uzaktan
    // açılış: yere yakın, türbin uzakta ama dev; masaüstünde kadrajın sağında (sol taraf kimliğe kalır)
    { p: 0.00, t: 'D', k: v(122, Z(1.8), 168), h: mobil ? v(0, Z(76), 0) : v(-27, Z(68), 20) },
    { p: 0.08, t: 'D', k: v(92, Z(3), 128),    h: mobil ? v(0, Z(72), 0) : v(-12, Z(70), 9) },
    // kulenin dibinde: rotora bakış
    { p: 0.125,t: 'D', k: v(15, Z(1.8), 24),   h: v(0, Z(76), -3) },
    // kule kapısı: dış merdiven, sahanlık, kapı açılır
    { p: 0.155,t: 'D', k: T(0, 2.55, 9.6),     h: T(0, 4.7, 2.2) },
    { p: 0.178,t: 'D', k: T(0, 5.4, 3.35),     h: T(0, 4.95, 1.0) },
    { p: 0.194,t: 'D', k: T(0, 5.4, 3.1),      h: T(0, 5.0, 0.3) },
    { p: 0.207,t: 'D', k: T(0, 5.45, 1.85),    h: T(0, 5.5, -0.6), akis: true },
    // kule içi: karanlık silindir, yukarı bakış, servis asansörü
    { p: 0.224,t: 'D', k: T(0.3, 5.45, 0.9),   h: T(-0.15, 32, -0.4) },
    { p: 0.246,t: 'D', k: T(-0.06, 5.45, 0.75), h: T(-0.05, 5.2, -0.9) },
    { p: 0.264,t: 'D', k: T(-0.05, 5.5, -0.98), h: T(0.1, 6.1, 1.3) },
    // yukarı erişim: kabin kule boyunca çıkar
    // kapı kapanır, kilitlenir; kısa bekleme; sonra yumuşak kalkış, sabit çıkış, yavaşlayarak duruş
    { p: 0.292,t: 'D', k: T(0, 5.5, -1.0),     h: T(0.15, 6.0, 1.3) },
    // dikey yol düz kalsın diye ara noktalar; aralıklar yumuşak kalkış/duruş profiliyle (smoothstep)
    ...[0.25, 0.5, 0.75].map(f => { const e = f * f * (3 - 2 * f), y = 5.5 + (KO.ustY + 1.62 - 5.5) * e;
      return { p: 0.292 + (0.40 - 0.292) * f, t: 'D', k: T(0, y, -1.0), h: T(0.6, y + 0.95, 1.3), akis: true }; }),
    { p: 0.40, t: 'D', k: T(0, KO.ustY + 1.62, -1.0), h: T(0.15, KO.ustY + 2.1, 1.3) },
    { p: 0.406,t: 'D', k: T(0, KO.ustY + 1.62, -0.99), h: T(0.12, KO.ustY + 2.1, 1.3) },   // duruş: kilit açılır, kapı aralanır
    // yaw katı: kabinden çık, merdivenle nasel kapağına
    { p: 0.418,t: 'D', k: T(-0.1, KO.ustY + 1.62, 0.45), h: T(kapakTL[0], KO.ustY + 2.35, kapakTL[1]) },
    { p: 0.434,t: 'D', k: T(kapakTL[0] * 0.72, KO.ustY + 1.62, kapakTL[1] * 0.72 + 0.05), h: v(KAPAK.x + 0.1, Z(KO.ustY + 6.5), KAPAK.y - 3.2) },
    { p: 0.45, t: 'D', k: v(KAPAK.x, Z(towerTopY + 1.1), KAPAK.y), h: v(KAPAK.x + 0.4, Z(towerTopY + 3.4), KAPAK.y - 3.6), akis: true },
    // naselin tabanından içeri: makine
    { p: 0.468,t: 'N', k: v(KAPAK.x, TABAN + 1.66, KAPAK.y), h: v(0.25, 0.3, 4.6) },
    { p: 0.49, t: 'N', k: v(-1.2, 1.0, -3.9),  h: v(0.3, 0.1, -6.2) },
    { p: 0.515,t: 'N', k: v(1.55, 1.35, -5.3), h: v(-0.3, -0.2, 3.5) },
    { p: 0.55, t: 'N', k: v(1.5, 0.55, -2.9),  h: v(0, -0.05, -5.0) },
    { p: 0.59, t: 'N', k: v(-1.1, 1.2, -4.3),  h: v(0.1, -0.1, -2.9) },
    { p: 0.612,t: 'N', k: v(1.35, 1.35, -1.6), h: v(-0.2, 0.2, -0.6), akis: true },
    { p: 0.635,t: 'N', k: v(1.6, 1.3, 0.6),    h: v(0, 0.0, -1.7) },
    { p: 0.685,t: 'N', k: v(1.1, 0.62, 1.35),  h: v(0, 0.5, 1.2) },
    { p: 0.76, t: 'N', k: v(1.15, 1.35, 1.45), h: v(-0.1, 0.45, 3.7) },
    { p: 0.80, t: 'N', k: v(0.98, 1.45, 3.1),  h: v(0.4, 0.6, 4.8), akis: true },
    { p: 0.845,t: 'N', k: v(0.9, 1.2, 5.7),    h: v(1.55, -0.1, 2.4) },
    { p: 0.875,t: 'N', k: v(-0.25, 0.8, 5.8),  h: v(-1.6, -0.1, 4.6) },
    { p: 0.905,t: 'N', k: v(-1.0, 1.15, 5.2),  h: v(-1.75, -0.5, 2.8) },
    { p: 0.93, t: 'N', k: v(-0.9, 1.3, 1.95),  h: v(-0.2, -1.4, 0.55) },
    // tavan kapağından dışarı, kahraman kadrajı
    { p: 0.955,t: 'N', k: v(0, 1.62, kapakZ - 0.3), h: v(0, 4.5, kapakZ + 0.5) },
    { p: 0.975,t: 'N', k: v(0.6, 4.2, kapakZ + 1.2),h: v(0, 1.2, -5) },
    { p: 1.00, t: 'D', k: v(88, -8, -150),     h: v(0, -12, -6) },
  ];
  tilt.updateMatrixWorld(true); yaw.updateMatrixWorld(true);
  const yawTers = new THREE.Matrix4().copy(yaw.matrixWorld).invert();
  const naselYaw = new THREE.Matrix4().multiplyMatrices(yawTers, tilt.matrixWorld);   // nasel yerel → yaw yerel
  KARE.forEach(k => { if (k.t === 'N') { k.k.applyMatrix4(naselYaw); k.h.applyMatrix4(naselYaw); } });
  const kEgri = new THREE.CatmullRomCurve3(KARE.map(k => k.k), false, 'centripetal', 0.5);
  const hEgri = new THREE.CatmullRomCurve3(KARE.map(k => k.h), false, 'centripetal', 0.5);
  const n1 = KARE.length - 1;
  function egriU(p) {
    let i = 0; while (i < n1 - 1 && p > KARE[i + 1].p) i++;
    const a = KARE[i].p, b = KARE[i + 1].p, f = Math.min(1, Math.max(0, (p - a) / (b - a)));
    const yum = f * f * (3 - 2 * f);                    // karede hafif yavaşlama: sinematik "vuruş"
    const w = (KARE[i].akis || KARE[i + 1].akis) ? 0.2 : 0.55;   // ara noktada durmadan geç
    return (i + (f * (1 - w) + yum * w)) / n1;
  }

  /* ---------------- post-processing: alan derinliği + hafif parlama (masaüstü) ---------------- */
  let composer = null, bokeh = null;
  const ppHazir = mobil ? Promise.resolve() : Promise.all([
    import('/assets/vendor/pp/EffectComposer.js'), import('/assets/vendor/pp/RenderPass.js'),
    import('/assets/vendor/pp/BokehPass.js'), import('/assets/vendor/pp/UnrealBloomPass.js'), import('/assets/vendor/pp/OutputPass.js'),
  ]).then(([EC, RP, BP, UB, OP]) => {
    composer = new EC.EffectComposer(renderer);
    composer.addPass(new RP.RenderPass(scene, camera));
    bokeh = new BP.BokehPass(scene, camera, { focus: 20, aperture: 0.00004, maxblur: 0.006 });
    composer.addPass(bokeh);
    composer.addPass(new UB.UnrealBloomPass(new THREE.Vector2(256, 256), 0.28, 0.5, 0.88));
    composer.addPass(new OP.OutputPass());
    olcek(true);
  }).catch(e => { console.warn('post-processing yok:', e); composer = null; });

  /* ---------------- yardımcılar ---------------- */
  // kapak sahnesinin ışığı sabit: mavi saat → şafak (sinematik atmosfer; saatten bağımsız)
  function isikModu() { return 'safak'; }
  let sonMod = null;
  let disPoz = renderer.toneMappingExposure, pozAnlik = disPoz;
  function isik() { const m = isikModu(); if (m !== sonMod) { setLight(m); sonMod = m; if (hemi) hemiTaban = hemi.intensity; if (dolgu) dolguTaban = dolgu.intensity; if (gunes) gunesTaban = gunes.intensity; disPoz = renderer.toneMappingExposure; } }
  isik();
  function devirRad() { const s = parseFloat(getComputedStyle(kok).getPropertyValue('--devir-sure')); return s > 0 ? 2 * Math.PI / s : 0; }
  function yonHedef() { const d = parseFloat(getComputedStyle(kok).getPropertyValue('--yon-derece')); return isFinite(d) ? -d * Math.PI / 180 : null; }
  let yawIlk = true;
  function yawGuncelle(dt) {
    const h = yonHedef(); if (h === null) return;
    if (yawIlk) { yaw.rotation.y = h; yawIlk = false; return; }
    let f = Math.atan2(Math.sin(h - yaw.rotation.y), Math.cos(h - yaw.rotation.y));
    const adim = 0.3 * Math.PI / 180 * dt * 60; yaw.rotation.y += Math.max(-adim, Math.min(adim, f));
  }
  function ilerleme() {
    const r = bolum.getBoundingClientRect(), yol = r.height - innerHeight;
    return yol <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / yol));
  }
  function olcek(zorla) {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    const pr = renderer.getPixelRatio();
    if (zorla || Math.round(w * pr) !== canvas.width || Math.round(h * pr) !== canvas.height) {
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
      if (composer) { composer.setPixelRatio(pr); composer.setSize(w, h); }
    }
  }
  const tmp = new THREE.Vector3(), yerel = new THREE.Vector3();
  const tiltTers = new THREE.Matrix4();
  function naselYerel(dunya, out) { tiltTers.copy(tilt.matrixWorld).invert(); return out.copy(dunya).applyMatrix4(tiltTers); }
  const can = (x, m, s) => Math.exp(-((x - m) / s) * ((x - m) / s));
  const yumusak = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------------- döngü ---------------- */
  /* ---------------- teknik işaret noktaları (hotspot) ----------------
   * Parça yüzeyine yakın noktalar nasel yerelinde; ekrana izdüşürülüp sayfaya bildirilir.
   * Önündeki parça tarafından kapanan nokta gösterilmez (seyrek ışın testi). */
  const NOKTALAR = [
    { id: 'anaYatak',  v: v(0.75, 0.75, -5.1),  ic: true },
    { id: 'disli',     v: v(0.7, 1.0, -2.0),    ic: true },
    { id: 'jenerator', v: v(0.65, 1.2, 3.3),    ic: true },
    { id: 'konvertor', v: v(1.40, -0.3, 2.7),   ic: true },
    { id: 'yaw',       v: v(-0.2, -1.55, 0.55), ic: true },
    { id: 'pitch',     v: v(0, 2.3, -7.95),     ic: false },
  ];
  const nDunya = new THREE.Vector3(), nEkran = new THREE.Vector3(), nYon = new THREE.Vector3();
  const isin = new THREE.Raycaster();
  const kapanan = {}; let sonIsin = 0;
  function noktalariGuncelle(t, icerde) {
    if (!cb.noktalar) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, liste = [];
    const isinZamani = t - sonIsin > 220; if (isinZamani) sonIsin = t;
    for (const n of NOKTALAR) {
      nDunya.copy(n.v); tilt.localToWorld(nDunya);
      const d = camera.position.distanceTo(nDunya);
      let aday = n.ic ? (icerde && d < 5.2) : (!icerde && p > 0.1 && p < 0.145);
      if (aday) {
        nEkran.copy(nDunya).project(camera);
        aday = nEkran.z < 1 && Math.abs(nEkran.x) < 0.92 && Math.abs(nEkran.y) < 0.86;
      }
      if (aday && isinZamani) {
        nYon.subVectors(nDunya, camera.position).normalize();
        isin.set(camera.position, nYon); isin.far = d - 0.22;
        const hedefler = n.ic ? ic.grup.children : (parts.spin ? [parts.spin] : []);
        kapanan[n.id] = isin.intersectObjects(hedefler, true).some(o => o.object.visible !== false);
      }
      liste.push({ id: n.id, gor: !!aday && !kapanan[n.id], x: (nEkran.x * 0.5 + 0.5) * w, y: (-nEkran.y * 0.5 + 0.5) * h, d });
    }
    cb.noktalar(liste);
  }

  /* ---------------- dış teknik etiketler (ince çizgili işaretler) ----------------
   * Dünya konumu her karede hesaplanır, ekrana izdüşürülüp sayfaya bildirilir; hangi aralıkta
   * görüneceğine sayfa (arayuz.js) karar verir. */
  const ETIKET = [
    { id: 'kule',  f: o => o.set(0, towerTopY * 0.46, 0) },
    { id: 'yaw',   f: o => o.set(0, -SPEC.nacelleHei / 2 - 0.3, 0).applyMatrix4(yaw.matrixWorld) },
    { id: 'nasel', f: o => o.set(0, SPEC.nacelleHei / 2, 2.4).applyMatrix4(tilt.matrixWorld) },
    { id: 'gobek', f: o => parts.spin.getWorldPosition(o) },
    { id: 'rotor', f: o => { parts.spin.getWorldPosition(o); o.y -= 30; return o; } },
  ];
  const eDunya = new THREE.Vector3(), eEkran = new THREE.Vector3();
  function etiketleriGuncelle() {
    if (!cb.etiketler) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    cb.etiketler(ETIKET.map(e => {
      e.f(eDunya); eEkran.copy(eDunya).project(camera);
      const x = (eEkran.x * 0.5 + 0.5) * w, y = (-eEkran.y * 0.5 + 0.5) * h;
      return { id: e.id, x, y, ekranda: eEkran.z < 1 && x > w * 0.04 && x < w * 0.96 && y > h * 0.1 && y < h * 0.9 };
    }), p);
  }

  /* ---------------- fare: çok hafif derinlik tepkisi ve parça üzerine gelme ---------------- */
  const fare = { var: false, x: 0, y: 0, sx: 0, sy: 0, deg: false, sonIsin: 0, tur: null };
  const fareIsin = new THREE.Raycaster(), fareNdc = new THREE.Vector2();
  const HEDEF = [
    { tur: 'rotor', kok: parts.spin },
    { tur: 'nasel', kok: parts.nacelle },
    ...parts.towerSegs.map(k => ({ tur: 'kule', kok: k })),
  ];
  function turBul(o) { while (o) { for (const hd of HEDEF) if (hd.kok === o) return hd.tur; o = o.parent; } return null; }
  function fareIsinla(t) {
    if (!cb.uzerinde) return;
    let tur = null;
    if (fare.var && !mobil && p < 0.12) {
      if (!fare.deg && t - fare.sonIsin < 400) return;
      if (t - fare.sonIsin < 90) return;
      fare.sonIsin = t; fare.deg = false;
      fareNdc.set(fare.x, -fare.y); fareIsin.setFromCamera(fareNdc, camera);
      const vur = fareIsin.intersectObjects(HEDEF.map(hd => hd.kok), true).find(o => o.object.visible !== false && !o.object.isSprite);
      tur = vur ? turBul(vur.object) : null;
    }
    if (tur !== fare.tur) { fare.tur = tur; cb.uzerinde(tur); }
  }

  /* ---------------- imza geçişi: gerçek türbin → teknik çizim ----------------
   * Aynı sahne ikinci kez, tek bir "çizim" malzemesiyle çizilir: lacivert dolgu, kenar
   * (siluet) çizgileri ve zeminde ölçek ızgarası. Üstüne saydamlıkla bindirildiği için geçiş
   * yumuşak bir çapraz geçiştir. */
  const cizimMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: true, depthTest: true, toneMapped: false, fog: false,
    uniforms: { uC: { value: 0 }, uDolgu: { value: new THREE.Color('#0f2036') }, uCizgi: { value: new THREE.Color('#d9ecff') }, uIzgara: { value: new THREE.Color('#5a9fd0') } },
    vertexShader: `#include <common>
      varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vNw;
      void main(){
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <project_vertex>
        vN = normalize(transformedNormal); vV = -mvPosition.xyz;
        vec4 wp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
        #endif
        vW = (modelMatrix * wp).xyz;
        vNw = inverseTransformDirection(transformedNormal, viewMatrix);
      }`,
    fragmentShader: `uniform float uC; uniform vec3 uDolgu, uCizgi, uIzgara;
      varying vec3 vN; varying vec3 vV; varying vec3 vW; varying vec3 vNw;
      void main(){
        float uz = length(vV);
        float r = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float yukari = smoothstep(0.72, 0.95, vNw.y);
        float kenar = smoothstep(0.58, 0.9, r) * (1.0 - smoothstep(320.0, 1400.0, uz)) * (1.0 - 0.92 * smoothstep(0.55, 0.85, vNw.y));
        vec2 q = vW.xz / 24.0; vec2 gg = abs(fract(q - 0.5) - 0.5) / fwidth(q);
        float izgara = (1.0 - min(min(gg.x, gg.y), 1.0)) * yukari * (1.0 - smoothstep(180.0, 900.0, uz));
        vec3 c = uDolgu * (1.0 - 0.45 * smoothstep(200.0, 1500.0, uz)) + uCizgi * kenar * 0.85 + uIzgara * izgara * 0.32;
        gl_FragColor = vec4(c, uC);
        #include <colorspace_fragment>
      }`,
  });
  const cizimZeminMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#0a1628'), transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false });
  const cizimZemin = new THREE.Scene(); { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cizimZeminMat); q.position.z = -0.5; q.frustumCulled = false; cizimZemin.add(q); }
  const cizimKam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const cizimGizle = [];
  scene.traverse(o => {
    if (o.isSprite || o.isPoints || o.isLine) cizimGizle.push(o);
    else if (o.isMesh && o.material && o.material.side === THREE.BackSide && o.geometry.parameters && o.geometry.parameters.radius > 1000) cizimGizle.push(o);   // gök kubbesi
  });
  cizimGizle.push(ic.grup, icIsik);
  function cizimCiz(c) {
    const kapali = [];
    cizimGizle.forEach(o => { if (o.visible) { o.visible = false; kapali.push(o); } });
    const oto = renderer.autoClear, golge = renderer.shadowMap.autoUpdate, arka = scene.background, sis = scene.fog;
    renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(null);
    renderer.clearDepth();
    cizimZeminMat.opacity = c; renderer.render(cizimZemin, cizimKam);
    cizimMat.uniforms.uC.value = c;
    scene.background = null; scene.fog = null; scene.overrideMaterial = cizimMat;
    renderer.render(scene, camera);
    scene.overrideMaterial = null; scene.background = arka; scene.fog = sis;
    renderer.autoClear = oto; renderer.shadowMap.autoUpdate = golge;
    kapali.forEach(o => { o.visible = true; });
  }

  let p = ilerleme(), sonT = 0, rafId = 0, calisiyor = true, gorunur = true, ilk = true, sonIsik = 0, hazirT = 0, sonIcerde = 0, sonKulede = 0;
  const tlKam = new THREE.Vector3();
  const kabinIsikTaban = kule.kabinIsik.intensity, girisIsikTaban = kule.girisIsik.intensity, ustIsikTaban = kule.ustIsik.intensity;
  const kKonum = new THREE.Vector3(), kHedef = new THREE.Vector3(), yumHedef = new THREE.Vector3();
  let hedefIlk = true, icAyar = null, kabinOnce = null, asnHizYum = 0, kIcOnce = 0;
  pozAnlik = disPoz;
  new IntersectionObserver(es => { gorunur = es[0].isIntersecting; if (gorunur) baslat(); }, { rootMargin: '120px' }).observe(bolum);
  document.addEventListener('visibilitychange', () => { calisiyor = !document.hidden; if (calisiyor) baslat(); });
  function baslat() { if (!rafId) { sonT = 0; rafId = requestAnimationFrame(kare); } }

  function kare(t) {
    rafId = 0; if (!calisiyor || !gorunur) return;
    const dt = sonT ? Math.min(0.05, (t - sonT) / 1000) : 0.016; sonT = t;
    if (t - sonIsik > 5000 && !icAyar) { isik(); sonIsik = t; }

    // kaydırma → ilerleme; ataletli (sinema kamerası dolly'si gibi)
    const hedefP = ilerleme();
    const anlik = az || window.__deneyimAnlik || window.__deneyimKes;   // test/erişilebilirlik/bölüm atlama: ataletsiz
    window.__deneyimKes = false;
    p += (hedefP - p) * (anlik ? 1 : 1 - Math.exp(-dt * 2.6));
    const u = egriU(p);
    kEgri.getPoint(u, kKonum); hEgri.getPoint(u, kHedef);
    // yaw yerelinden dünyaya
    kKonum.applyMatrix4(yaw.matrixWorld); kHedef.applyMatrix4(yaw.matrixWorld);
    if (hedefIlk) { yumHedef.copy(kHedef); hedefIlk = false; }
    yumHedef.lerp(kHedef, anlik ? 1 : 1 - Math.exp(-dt * 3.2));   // bakış hafif geriden gelir: ağırlık hissi
    // çok hafif el-kamera nefesi (yalnız dışarıda belirgin)
    if (!az) { kKonum.y += Math.sin(t / 2300) * 0.02; kKonum.x += Math.sin(t / 3100) * 0.02; }
    // açılışta kamera kendiliğinden, çok yavaş türbine doğru ilerler (kaydırınca devri kaydırmaya bırakır)
    const disAgirlik = (1 - yumusak(0.36, 0.43, p)) + yumusak(0.975, 0.995, p);
    if (!az) {
      if (!hazirT) hazirT = t;
      const surun = (1 - Math.exp(-(t - hazirT) / 22000)) * 16 * (1 - yumusak(0, 0.05, p));
      if (surun > 0.01) { tmp.subVectors(yumHedef, kKonum); tmp.y = 0; if (tmp.lengthSq() > 1) kKonum.addScaledVector(tmp.normalize(), surun); }
      // fareye çok hafif derinlik tepkisi (kamera 1–2 derecelik kayar)
      fare.sx += ((fare.var ? fare.x : 0) - fare.sx) * (1 - Math.exp(-dt * 1.8));
      fare.sy += ((fare.var ? fare.y : 0) - fare.sy) * (1 - Math.exp(-dt * 1.8));
      if (!mobil && disAgirlik > 0.01 && (Math.abs(fare.sx) + Math.abs(fare.sy)) > 0.001) {
        const uzak = kKonum.distanceTo(yumHedef) * 0.016 * disAgirlik;
        tmp.subVectors(yumHedef, kKonum).normalize().cross(camera.up).normalize();
        kKonum.addScaledVector(tmp, fare.sx * uzak); kKonum.y -= fare.sy * uzak * 0.5;
      }
    }
    // kamera yere gömülmesin: arazinin 1,7 m üstünde kalır
    if (!sonIcerde && !sonKulede) { const yer = araziY(kKonum.x, kKonum.z) + 1.7; if (kKonum.y < yer) kKonum.y = yer; }
    camera.position.copy(kKonum); camera.lookAt(yumHedef);

    // iç/dış geçişi
    naselYerel(camera.position, yerel);
    const b = ic.sinir;
    const icerde = sonIcerde = (Math.abs(yerel.x) < 2.15 && yerel.y > b.TABAN - 0.2 && yerel.y < b.TAVAN + 0.15 && yerel.z > b.ON - 0.15 && yerel.z < b.ARKA + 0.2) ? 1 : 0;
    const yakin = p > 0.42 && p < 0.99;
    ic.grup.visible = yakin; icIsik.visible = yakin;
    parts.nacelle.visible = !icerde;
    // kule içi mi? (kule yereline çevir: eksene uzaklık iç yarıçaptan küçük)
    kule.grup.updateMatrixWorld();
    kule.grup.worldToLocal(tlKam.copy(camera.position));
    const kulede = sonKulede = !icerde && tlKam.y > 3.6 && tlKam.y < towerTopY + 1.3 && Math.hypot(tlKam.x, tlKam.z) < KO.rIc(tlKam.y) - 0.01 ? 1 : 0;
    const kuleBolum = p > 0.14 && p < 0.47;
    kule.ic.visible = kuleBolum;
    kule.kabinIsik.intensity = kuleBolum ? kabinIsikTaban : 0; kule.girisIsik.intensity = kuleBolum ? girisIsikTaban : 0; kule.ustIsik.intensity = kuleBolum ? ustIsikTaban : 0;
    // kapı: sahanlıkta açılır; kabin: altta bekler, kapısı kapanır, kamerayla birlikte çıkar, üstte açılır
    // kule kapısı: kol aşağı, kilit dili çekilir, kanat önce aralanır sonra açılır
    kule.kapiKol.rotation.z = -0.75 * yumusak(0.176, 0.181, p);
    kule.kanatPivot.rotation.y = 0.07 * yumusak(0.181, 0.185, p) + 1.66 * yumusak(0.186, 0.199, p);
    // kabin: altta bekler; kapı kapanır ve kilitlenir; kalkar, çıkar, yavaşlayıp durur; kilit açılır, kapı aralanır, açılır
    const kabinY = p < 0.272 ? KO.tabanY : (p > 0.405 ? KO.ustY : THREE.MathUtils.clamp(camera.position.y - 1.65, KO.tabanY, KO.ustY));
    const asnHiz = kabinOnce === null ? 0 : Math.abs(kabinY - kabinOnce) / Math.max(dt, 0.001); kabinOnce = kabinY;
    asnHizYum += (asnHiz - asnHizYum) * (1 - Math.exp(-dt * 4));
    // çalışan tahrik ünitesinin titreşimi: hızla orantılı, milimetre mertebesinde
    const titre = az ? 0 : Math.min(1, asnHizYum / 2.5) * 0.0022 * (Math.sin(t * 0.145) + 0.6 * Math.sin(t * 0.211 + 1.3));
    kule.kabin.position.y = kabinY + titre;
    if (titre) camera.position.y += titre;
    if (kuleBolum) kule.kabloGuncelle(kule.kabin.position.y);
    const kabinAcik = THREE.MathUtils.clamp(1 - yumusak(0.266, 0.279, p) + 0.05 * yumusak(0.4035, 0.4065, p) + 0.95 * yumusak(0.407, 0.418, p), 0, 1);
    kule.kabinKapiAyarla(kabinAcik);
    kule.kilitDili.position.x = -KO.ASN.gen / 2 + 0.03 + 0.035 * (yumusak(0.279, 0.284, p) - yumusak(0.4, 0.4035, p));
    kule.pilot.material.color.setHex(asnHizYum > 0.05 ? 0xf2b233 : 0x46d06a);
    if (cb.ses) cb.ses({ disari: kIcOnce ? 0 : 1, kule: sonKulede, asnHiz: asnHizYum, kapi: yumusak(0.186, 0.199, p), kabinKapi: kabinAcik, p });
    // dış ortam ışığı içeride kısılır (nasel ya da kule)
    const kIc = icerde || kulede;
    // objektif değişimi: iç/dış geçişi karartmanın içinde olur, göze batmaz
    const fovHedef = kIc ? FOV_IC : FOV_DIS;
    if (Math.abs(camera.fov - fovHedef) > 0.05) { camera.fov += (fovHedef - camera.fov) * (anlik ? 1 : 1 - Math.exp(-dt * 5)); camera.updateProjectionMatrix(); }
    // içeride karanlık endüstriyel hava: yakın sis ve düşük pozlama
    if (kIc && !icAyar) { icAyar = { renk: scene.fog.color.getHex(), yakin: scene.fog.near, uzak: scene.fog.far, poz: disPoz }; }
    if (kIc) { scene.fog.color.setHex(0x0b0e11); scene.fog.near = kulede ? 3.5 : 2.5; scene.fog.far = kulede ? 42 : 19; }
    else if (icAyar) { scene.fog.color.setHex(icAyar.renk); scene.fog.near = icAyar.yakin; scene.fog.far = icAyar.uzak; icAyar = null; }
    // göz uyumu: aydınlıktan karanlığa girince sahne önce koyu görünür, ~2 sn'de açılır; tersi de öyle
    const pozHedef = kIc ? (kulede ? 0.9 : 0.92) : disPoz;
    if (kIc !== kIcOnce && !anlik) pozAnlik = pozHedef * (kIc ? 0.36 : 1.9);
    kIcOnce = kIc;
    pozAnlik += (pozHedef - pozAnlik) * (anlik ? 1 : 1 - Math.exp(-dt * (kIc ? 1.15 : 1.7)));
    renderer.toneMappingExposure = pozAnlik;
    if (toz) toz.visible = !!icerde && yerel.y < ic.sinir.TAVAN - 0.3;
    if (gunes) gunes.intensity = gunesTaban * (kIc ? 0 : 1);
    if (hemi) hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, hemiTaban * (kIc ? (kulede ? 0.24 : 0.1) : 1), 1 - Math.exp(-dt * 6));
    if (dolgu) dolgu.intensity = dolguTaban * (kIc ? 0.1 : 1);
    huzmeMat.uniforms.uGuc.value = THREE.MathUtils.lerp(huzmeMat.uniforms.uGuc.value, icerde ? 1 : 0, 1 - Math.exp(-dt * 4));
    huzmeMat.uniforms.uZaman.value = t / 1000;
    if (toz) { toz.rotation.y = Math.sin(t / 9000) * 0.02; toz.position.y = Math.sin(t / 4000) * 0.03; }
    // geçişte kısa karartma: göbekten ve kapaktan geçerken
    const dip = Math.max(
      Math.abs(yerel.x) < 2.4 && Math.abs(yerel.y) < 2.4 ? yumusak(-10.4, -9.5, yerel.z) * (1 - yumusak(-5.85, -5.2, yerel.z)) : 0,
      Math.abs(yerel.x) < 1.2 && Math.abs(yerel.z - kapakZ) < 2.2 ? can(yerel.y, b.TAVAN + 0.25, 0.45) : 0,
      // kule kapısından geçiş ve nasel tabanındaki kapaktan çıkış
      Math.abs(tlKam.x) < 1.2 && tlKam.y < 7.5 && tlKam.y > 2 ? can(tlKam.z, KO.kR - 0.15, 0.3) * 0.9 : 0,
      Math.abs(yerel.x - KAPAK.x) < 0.9 && Math.abs(yerel.z - KAPAK.y) < 0.9 ? can(yerel.y, b.TABAN - 0.35, 0.5) : 0);
    if (cb.karartma) cb.karartma(Math.min(1, dip));

    // mekanik: rotor gerçek devirde, ana mil onunla, hızlı taraf ~×100 (görsel olarak yavaşlatılmış)
    const w = devirRad();
    if (parts.spin) parts.spin.rotation.z -= w * dt;
    if (ic.anaMil) ic.anaMil.rotation.z -= w * dt;
    if (ic.kaplinPivot) ic.kaplinPivot.rotation.z -= (w > 0 ? 9.0 : 0) * dt;
    yawGuncelle(dt);
    kuleDondur();
    if (parts.farm && !az) parts.farm.children.forEach(k => { if (k.userData.spin) k.userData.spin.rotation.z -= k.userData.speed * dt; });
    if (parts.ikaz) parts.ikaz.guncelle(t / 1000);   // nasel üstündeki kırmızı uçak ikaz lambaları

    // alan derinliği: bakılan noktaya odak
    if (bokeh) {
      const odak = camera.position.distanceTo(yumHedef);
      bokeh.uniforms.focus.value = odak;
      bokeh.uniforms.aperture.value = icerde ? 0.0009 : 0.00003;
      bokeh.uniforms.maxblur.value = icerde ? 0.007 : 0.003;
    }

    olcek();
    const cz = yumusak(0.972, 0.993, p);
    if (cz < 0.995) { if (composer) composer.render(dt); else renderer.render(scene, camera); }
    else renderer.clear();
    if (cz > 0.002) cizimCiz(cz);
    if (cb.cizim) cb.cizim(cz);
    if (cb.ilerleme) cb.ilerleme(p, Math.max(0, camera.position.y), icerde);
    noktalariGuncelle(t, icerde);
    etiketleriGuncelle();
    fareIsinla(t);
    if (ilk) { ilk = false; canvas.classList.add('hazir'); if (cb.hazir) cb.hazir(); }
    rafId = requestAnimationFrame(kare);
  }
  baslat();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); calisiyor = false; if (rafId) cancelAnimationFrame(rafId); canvas.classList.remove('hazir'); if (cb.hata) cb.hata(); }, false);

  // sayfa tarafı fare konumunu bildirir: nx, ny ∈ [-1, 1]; null → fare sahnede değil
  S.fare = (nx, ny) => {
    if (nx === null || nx === undefined) { fare.var = false; return; }
    fare.var = true; fare.x = nx; fare.y = ny; fare.deg = true;
  };
  // test ve hata ayıklama için
  window.__deneyim = { S, ic, kule, KARE, egriU, kEgri, hEgri, yaw, tilt, get p() { return p; } };
  return S;
}
