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
import { createScene, SPEC } from '/n117/n117.js?v=2a90e4df';
import { naselIciKur } from '/assets/deneyim/nasel-ic.js?v=7c5ea850';
import { RoomEnvironment } from '/assets/vendor/pp/RoomEnvironment.js';

/* anlatı durakları: HUD ve bölüm göstergesi buradan beslenir (değerler N117/3000 Delta üretici verisi) */
export const DURAKLAR = [
  { p: 0.41,  id: 'rotor',     ad: 'Rotor',              en: 'ROTOR',           bilgi: '116,8 m çap · 57,3 m kanat · 7,9–14,1 d/dk' },
  { p: 0.455, id: 'gobek',     ad: 'Göbek',              en: 'HUB',             bilgi: 'Üç kanat yatağı · kanat açısı burada ayarlanır' },
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
  const hemiTaban = hemi ? hemi.intensity : 1, dolguTaban = dolgu ? dolgu.intensity : 0.3;

  // ortam yansıması: yalnız iç metal malzemelere
  let env = null;
  try { const pm = new THREE.PMREMGenerator(renderer); env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } catch (e) { env = null; }

  const tilt = parts.nacelle.parent;
  const yaw = parts.yaw;
  const ic = naselIciKur({ hafif: mobil, envMap: env });
  tilt.add(ic.grup);
  ic.grup.visible = false;

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
  const KARE = [
    // dış görünüm: Ege sırtında uzaktan
    { p: 0.00, t: 'D', k: v(250, Z(30), 330),  h: v(0, Z(70), -5) },
    { p: 0.08, t: 'D', k: v(120, Z(12), 170),  h: v(0, Z(72), 0) },
    { p: 0.15, t: 'D', k: v(26, Z(3), 38),     h: v(0, Z(40), 0) },
    // kuleye tırmanış
    { p: 0.22, t: 'D', k: v(18, Z(40), 26),    h: v(0, Z(70), 0) },
    { p: 0.30, t: 'D', k: v(15, Z(100), 22),   h: v(0, Z(118), -1) },
    // nasele yaklaşma, rotor ve göbek
    { p: 0.37, t: 'D', k: v(11, 3.5, 13),      h: v(0, 0.5, -3) },
    { p: 0.41, t: 'D', k: v(26, 4, -26),       h: v(0, 0, -8) },
    { p: 0.455,t: 'D', k: v(4.2, 1.4, -15.5),  h: v(0, 0, -8) },
    // göbekten içeri: önce tüm naseli gösteren geniş plan, sonra güç akışı yönünde
    { p: 0.475,t: 'N', k: v(0.12, 0.08, -12.2),h: v(0, 0, -6.0), akis: true },   // burun ekseninde: kanat köklerinden uzak
    { p: 0.49, t: 'N', k: v(0.6, 0.45, -6.3),  h: v(0.9, 0.6, -4.5) },
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
  function isikModu() {
    const m = kok.getAttribute('data-vardiya');
    return (m === 'gece' || m === 'safak' || m === 'aksam' || m === 'altin') ? 'sunset' : 'day';
  }
  let sonMod = null;
  function isik() { const m = isikModu(); if (m !== sonMod) { setLight(m); sonMod = m; } }
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
  let p = ilerleme(), sonT = 0, rafId = 0, calisiyor = true, gorunur = true, ilk = true, sonIsik = 0;
  const kKonum = new THREE.Vector3(), kHedef = new THREE.Vector3(), yumHedef = new THREE.Vector3();
  let hedefIlk = true, icAyar = null;
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
    camera.position.copy(kKonum); camera.lookAt(yumHedef);

    // iç/dış geçişi
    naselYerel(camera.position, yerel);
    const b = ic.sinir;
    const icerde = (Math.abs(yerel.x) < 2.15 && yerel.y > b.TABAN - 0.2 && yerel.y < b.TAVAN + 0.15 && yerel.z > b.ON - 0.15 && yerel.z < b.ARKA + 0.2) ? 1 : 0;
    const yakin = p > 0.42 && p < 0.99;
    ic.grup.visible = yakin; icIsik.visible = yakin;
    parts.nacelle.visible = !icerde;
    // dış ortam ışığı içeride kısılır
    const kIc = icerde;
    // objektif değişimi: iç/dış geçişi karartmanın içinde olur, göze batmaz
    const fovHedef = kIc ? FOV_IC : FOV_DIS;
    if (Math.abs(camera.fov - fovHedef) > 0.05) { camera.fov += (fovHedef - camera.fov) * (anlik ? 1 : 1 - Math.exp(-dt * 5)); camera.updateProjectionMatrix(); }
    // içeride karanlık endüstriyel hava: yakın sis ve düşük pozlama
    if (kIc && !icAyar) { icAyar = { renk: scene.fog.color.getHex(), yakin: scene.fog.near, uzak: scene.fog.far, poz: renderer.toneMappingExposure }; }
    if (kIc) { scene.fog.color.setHex(0x0b0e11); scene.fog.near = 2.5; scene.fog.far = 19; renderer.toneMappingExposure = 0.92; }
    else if (icAyar) { scene.fog.color.setHex(icAyar.renk); scene.fog.near = icAyar.yakin; scene.fog.far = icAyar.uzak; renderer.toneMappingExposure = icAyar.poz; icAyar = null; }
    if (toz) toz.visible = !!kIc && yerel.y < ic.sinir.TAVAN - 0.3;
    if (hemi) hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, hemiTaban * (kIc ? 0.1 : 1), 1 - Math.exp(-dt * 6));
    if (dolgu) dolgu.intensity = dolguTaban * (kIc ? 0.1 : 1);
    huzmeMat.uniforms.uGuc.value = THREE.MathUtils.lerp(huzmeMat.uniforms.uGuc.value, kIc ? 1 : 0, 1 - Math.exp(-dt * 4));
    huzmeMat.uniforms.uZaman.value = t / 1000;
    if (toz) { toz.rotation.y = Math.sin(t / 9000) * 0.02; toz.position.y = Math.sin(t / 4000) * 0.03; }
    // geçişte kısa karartma: göbekten ve kapaktan geçerken
    const dip = Math.max(
      Math.abs(yerel.x) < 2.4 && Math.abs(yerel.y) < 2.4 ? yumusak(-10.4, -9.5, yerel.z) * (1 - yumusak(-5.85, -5.2, yerel.z)) : 0,
      Math.abs(yerel.x) < 1.2 && Math.abs(yerel.z - kapakZ) < 2.2 ? can(yerel.y, b.TAVAN + 0.25, 0.45) : 0);
    if (cb.karartma) cb.karartma(Math.min(1, dip));

    // mekanik: rotor gerçek devirde, ana mil onunla, hızlı taraf ~×100 (görsel olarak yavaşlatılmış)
    const w = devirRad();
    if (parts.spin) parts.spin.rotation.z -= w * dt;
    if (ic.anaMil) ic.anaMil.rotation.z -= w * dt;
    if (ic.kaplinPivot) ic.kaplinPivot.rotation.z -= (w > 0 ? 9.0 : 0) * dt;
    yawGuncelle(dt);

    // alan derinliği: bakılan noktaya odak
    if (bokeh) {
      const odak = camera.position.distanceTo(yumHedef);
      bokeh.uniforms.focus.value = odak;
      bokeh.uniforms.aperture.value = icerde ? 0.0009 : 0.00003;
      bokeh.uniforms.maxblur.value = icerde ? 0.007 : 0.003;
    }

    olcek();
    if (composer) composer.render(dt); else renderer.render(scene, camera);
    if (cb.ilerleme) cb.ilerleme(p, Math.max(0, camera.position.y), icerde);
    if (ilk) { ilk = false; canvas.classList.add('hazir'); if (cb.hazir) cb.hazir(); }
    rafId = requestAnimationFrame(kare);
  }
  baslat();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); calisiyor = false; if (rafId) cancelAnimationFrame(rafId); canvas.classList.remove('hazir'); if (cb.hata) cb.hata(); }, false);

  // test ve hata ayıklama için
  window.__deneyim = { S, ic, KARE, egriU, kEgri, hEgri, yaw, tilt, get p() { return p; } };
  return S;
}
