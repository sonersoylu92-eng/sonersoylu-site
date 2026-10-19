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
import { createScene, SPEC, araziY } from '/n117/n117.js?v=weather2';
import { naselIciKur } from '/assets/deneyim/nasel-ic.js?v=f0ed1943';
import { kuleIciKur, kapiBosluguAc } from '/assets/deneyim/kule-ic.js?v=5bb97e53';
import { RoomEnvironment } from '/assets/vendor/pp/RoomEnvironment.js';
import { egeKur } from '/assets/deneyim/ege.js?v=ef6e542c';
import { gokKur } from '/assets/deneyim/gok.js?v=d466d467';
import { korfezKur } from '/assets/deneyim/korfez.js?v=af1ede38';

/* anlatı durakları: HUD ve bölüm göstergesi buradan beslenir (değerler N117/3000 Delta üretici verisi) */
export { DURAKLAR } from '/assets/deneyim/duraklar.js?v=1';

function yonHedefIlk() { const d = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--yon-derece')); return isFinite(d) ? -d * Math.PI / 180 : null; }

export function deneyimBaslat(canvas, bolum, cb = {}) {
  const mobil = matchMedia('(max-width: 820px)').matches || matchMedia('(pointer: coarse)').matches;
  /* hafif: telefonlar ve sayfa tarafının "orta güçte" bulduğu bilgisayarlar (eski Intel tümleşik ekran kartı, az bellek).
   * Kadraj ve kamera masaüstündeki gibi kalır; yalnız yük azalır: sade geometri, gölge ve efekt zinciri yok, 1× piksel. */
  const hafif = mobil || !!(cb && cb.hafif);
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const zorla = /[?&]uc=1\b/.test(location.search);   // tanı ve test: cihaz yetişemese de sahne açık kalır
  let performans = false;
  try { performans = new URLSearchParams(location.search).get('performance') === '1' || localStorage.getItem('ss-performance-mode') === '1'; } catch (e) {}
  const kok = document.documentElement;
  // ÖNİZLEME (V14 önerisi): saha fotoğrafındaki karşı ışıklı altın saat. Yalnız ?banner=gunbatimi ile açılır; canlı kapak değişmez.
  const GB = /[?&]banner=gunbatimi\b/.test(location.search);
  // V14 KAPAK (varsayılan): nasel çatısından bakış (saha fotoğrafı: maki kaplı Ege sırtları, toprak yollar, sırt boyunca türbinler).
  // ?banner=eski önceki V13 kapağını, ?banner=gunbatimi altın saat önizlemesini açar.
  const NC = !GB && !/[?&]banner=eski\b/.test(location.search);
  // V18 KAPAK (varsayılan): aynı nasel çatısı kadrajı; dünya Aliağa açığı, Çandarlı Körfezi'nin ağzında deniz üstü bir türbin
  // (korfez.js). ?banner=ege V14–V17 maki kapağını açar. Güneş İzmir'in gerçek konumundan hesaplanır; gün batımında kapak
  // kamerası denize, batan güneşe döner.
  const KORFEZ = NC && !/[?&]banner=ege\b/.test(location.search);

  let S;
  try { S = createScene(canvas, { lite: hafif }); } catch (e) { console.error('deneyim sahne:', e); return null; }
  const { renderer, scene, camera, controls, parts, towerTopY, setLight } = S;
  controls.enabled = false;
  if (parts.crane) parts.crane.visible = false;
  if (parts.groundBlade) parts.groundBlade.visible = false;
  // V10: gerçek türbinin arkasına Ege dünyası (sırtlar, kıyı, sis, bulut, yıldız); türbin ve kamera aynı kalır
  let ege = null;
  try { ege = egeKur(S, { lite: hafif }); } catch (e) { console.warn('ege atmosferi yok:', e); ege = null; }
  // gerçek gökyüzü: güneş ve ay konumu, ay evresi, parlak yıldızlar (önizleme: ?gokzaman=2026-10-20T21:00:00Z)
  let gok = null;
  try {
    const zz = new URLSearchParams(location.search).get('gokzaman');
    gok = gokKur(THREE, { lite: hafif, sabitZaman: zz && !isNaN(Date.parse(zz)) ? zz : null, ...(KORFEZ ? { enlem: 38.42, boylam: 27.14 } : {}) });   // körfez kapağı: İzmir
    S.scene.add(gok.grup);
  } catch (e) { console.warn('gök yok:', e); gok = null; }
  // nasel çatısı kapağında kamera ikaz lambasının birkaç metre yanında: yakın hale küçülür, başlığın arkasında kırmızı leke olmasın
  if (NC && parts.nacelle && parts.nacelle.userData.ikaz) parts.nacelle.userData.ikaz.forEach(k => k.children.forEach(o => { if (o.isSprite && o.scale.x > 1) o.scale.set(1.2, 1.2, 1); }));
  // kanat uçlarında kırmızı ikaz şeridi (sahadaki türbinlerdeki gibi uçtaki son birkaç metre); renk kanat boyunca yerel y'ye göre
  const ucMat = new Map();
  const ucBoya = (mat, esik) => {
    const anahtar = mat.uuid + ':' + esik.toFixed(1);
    if (ucMat.has(anahtar)) return ucMat.get(anahtar);
    const m = mat.clone();
    m.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vKanatY;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKanatY = position.y;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vKanatY;')
        .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.58, 0.02, 0.013), smoothstep(${(esik - 0.05).toFixed(2)}, ${(esik + 0.05).toFixed(2)}, vKanatY));`);
    };
    m.customProgramCacheKey = () => 'kanat-uc-' + esik.toFixed(1);
    ucMat.set(anahtar, m); return m;
  };
  const ucUygula = (kok, oran) => kok && kok.traverse(o => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = o.geometry.boundingBox, boy = bb.max.y - bb.min.y;
    if (boy > 30 && bb.max.x - bb.min.x < boy * 0.2) o.material = ucBoya(o.material, bb.max.y - boy * oran);
  });
  (parts.blades || []).forEach(k => ucUygula(k, 0.062));   // 57 m kanatta ~3,5 m
  ucUygula(parts.farm, 0.065);
  let korfez = null;
  if (KORFEZ) { try { korfez = korfezKur(S, { lite: hafif }); } catch (e) { console.warn('körfez yok:', e); korfez = null; } }
  if (ege) { ege.kameraBagla(camera); if (GB) { ege.ova(araziY); ege.sirrus(1); ege.haleAyarla(1); } if (NC && !korfez) ege.maki(araziY); if (korfez) ege.acikDeniz(); }

  const normalDpr = hafif ? 1 : Math.min(devicePixelRatio || 1, 1.6);
  const normalShadow = renderer.shadowMap.enabled && !hafif;
  renderer.setPixelRatio(performans ? 1 : normalDpr);
  renderer.shadowMap.enabled = normalShadow && !performans;
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;   // gölge haritasını döngü seyreltilmiş günceller
  const FOV_DIS = NC ? (mobil ? 70 : 62) : (mobil ? 58 : 42), FOV_IC = mobil ? 74 : 60;   // nasel çatısı önizlemesi: fotoğraftaki geniş açı   // içeride geniş objektif: dar nasel, gerçek ölçek
  camera.fov = FOV_DIS; camera.near = 0.05; camera.far = 6000; camera.updateProjectionMatrix();

  // sahnedeki mevcut ışıklar (n117.js): içeri girince dış ortam ışığı kısılır
  // Mobilde gölgeler kapalı olsa da güneş ışığı aynı nesne olarak kalır.
  const hemi = S.hemi, gunes = S.sun, dolgu = S.fill;
  let hemiTaban = hemi ? hemi.intensity : 1, dolguTaban = dolgu ? dolgu.intensity : 0.3, gunesTaban = gunes ? gunes.intensity : 1;

  // ortam yansıması: yalnız iç metal malzemelere
  let env = null;
  if (!hafif) {
    try { const pm = new THREE.PMREMGenerator(renderer); env = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); } catch (e) { env = null; }
  }

  const tilt = parts.nacelle.parent;
  const yaw = parts.yaw;
  /* nasel ↔ kule eşlemesi: kule (kapı +z yönünde) yaw ile birlikte döner, aradaki dönüş sabittir.
   * Nasel tabanındaki erişim kapağı, kablo ilmeği ve yaw pinyonları iki tarafta da aynı yerde kurulur. */
  const dAz = Math.atan2(26, 38), cA = Math.cos(dAz), sA = Math.sin(dAz);
  const tl2yaw = (x, z) => [x * cA + z * sA, -x * sA + z * cA];
  const yaw2tl = (x, z) => [x * cA - z * sA, x * sA + z * cA];
  tilt.updateWorldMatrix(true, false);
  const kuleM = new THREE.Matrix4().makeRotationY(yaw.rotation.y + dAz), kuleMT = kuleM.clone().invert(), tiltT = tilt.matrixWorld.clone().invert();
  const tl2n = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(kuleM).applyMatrix4(tiltT);
  const n2tl = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(tilt.matrixWorld).applyMatrix4(kuleMT);
  const TABAN_N = -1.62;
  const eksenN = tl2n(0, n2tl(0, TABAN_N, 0).y, 0);                  // kule ekseni, nasel tabanında
  const KAPAK_N = new THREE.Vector2(-0.55, 0.5);                        // erişim kapağı (nasel yerel x, z): yaw halkasının içinde, dişli kutusunun arkasında
  const yawN = [-30, 30, 90, 165, 210].map(d => new THREE.Vector2(eksenN.x + Math.cos(d * Math.PI / 180) * 1.08, eksenN.z + Math.sin(d * Math.PI / 180) * 1.08));
  const ic = naselIciKur({ hafif: hafif, envMap: env, kapak: KAPAK_N, yawMerkez: new THREE.Vector2(eksenN.x, eksenN.z), yawSurucu: yawN });
  tilt.add(ic.grup);
  ic.grup.visible = false;

  /* ---------------- kule: kapı, kule içi, servis asansörü ----------------
   * Kule yereli: kapı +z yönünde. Kule, kapı ve kule içi naselin yaw açısıyla birlikte döner;
   * böylece kamera yolu (yaw yerelinde) her rüzgâr yönünde kapıya aynı açıdan gelir. */
  const kapakV = n2tl(KAPAK_N.x, TABAN_N, KAPAK_N.y), kapakTL = [kapakV.x, kapakV.z];
  const zTL = n2tl(0, 0, 1).sub(n2tl(0, 0, 0)), kapakYon = new THREE.Vector2(zTL.x, zTL.z).normalize();   // naselin +z'si kule yerelinde
  const KAPAK = new THREE.Vector2(...tl2yaw(kapakV.x, kapakV.z));   // kapak, yaw yerelinde
  const kule = kuleIciKur({ SPEC, towerTopY, hafif: hafif, kapakXZ: new THREE.Vector2(kapakTL[0], kapakTL[1]), kapakYon, naselTabanY: kapakV.y,
    yawSurucu: yawN.map(q => { const v = n2tl(q.x, TABAN_N, q.y); return new THREE.Vector2(v.x, v.z); }) });
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
  (hafif ? ic.lambalar.filter((_, i, a) => i === 0 || i === a.length - 1) : ic.lambalar).forEach(p => {
    const l = new THREE.PointLight(0xfff0dc, hafif ? 9 : 4, hafif ? 7 : 5.5, 1.6);   // sıcak floresan (sahadaki makine dairesi gibi) l.position.set(...p); icIsik.add(l);
  });
  if (!hafif) { const camgobegi = new THREE.PointLight(0xffe2b8, 1.2, 3.2, 2); camgobegi.position.set(1.0, 0.4, 2.7); icIsik.add(camgobegi); }
  // açık renk kabuktan yansıyan dolgu ışığı: makine dairesi sahadaki gibi aydınlık kalsın (gölgelendirici sayısını değiştirmez)
  const icAmb = new THREE.AmbientLight(0xfff1dc, hafif ? 1.5 : 0.45); icIsik.add(icAmb);
  // tavan kapağından giren gün ışığı
  const { TAVAN, TABAN, KZ0, KZ1 } = ic.sinir;
  const kapakZ = (KZ0 + KZ1) / 2;
  const gunIsigi = new THREE.SpotLight(0xfff1dc, mobil ? 90 : 140, 14, 0.42, 0.75, 1.2);
  gunIsigi.position.set(-0.9, TAVAN + 4.2, kapakZ - 1.4);
  gunIsigi.target.position.set(0.35, TABAN, kapakZ + 1.0);
  if (!hafif) { gunIsigi.castShadow = true; gunIsigi.shadow.mapSize.set(1024, 1024); gunIsigi.shadow.bias = -0.0008; gunIsigi.shadow.camera.near = 1; gunIsigi.shadow.camera.far = 12; }
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
  if (!hafif) {
    const n = 420, pos = new Float32Array(n * 3), dir = new THREE.Vector3().subVectors(gunIsigi.target.position, gunIsigi.position);
    for (let i = 0; i < n; i++) {
      const t = 0.3 + Math.random() * 0.65, r = (0.2 + 0.9 * t) * Math.sqrt(Math.random()), a = Math.random() * Math.PI * 2;
      const p = gunIsigi.position.clone().addScaledVector(dir, t);
      pos[i * 3] = p.x + Math.cos(a) * r; pos[i * 3 + 1] = p.y + (Math.random() - 0.5) * 0.4; pos[i * 3 + 2] = p.z + Math.sin(a) * r;
    }
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    toz = new THREE.Points(tg, new THREE.PointsMaterial({ color: 0xfff4e2, size: 0.006, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
    icIsik.add(toz);
  }

  /* ---------------- kamera zaman çizelgesi ----------------
   * D = yaw eksenine göre (dış), N = nasel yerel (iç). Hepsi yaw yereline çevrilir.
   * p değerleri kaydırma oranı; iki kare arası yumuşak geçişle (dolly), karelerde hafif duraklama. */
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const yZemin = -(towerTopY + SPEC.nacelleHei / 2 + 0.25);   // yaw yerelinde yer seviyesi
  const Z = y => yZemin + y;                                  // yerden yükseklik → yaw yerel y
  const T = (x, h, z) => { const [a, b] = tl2yaw(x, z); return v(a, Z(h), b); };   // kule yereli → yaw yereli
  const tir = [kapakTL[0] - kapakYon.x * 0.1, kapakTL[1] - kapakYon.y * 0.1];         // tırmanırken kamera: kapak ortasının biraz içi (merdiven duvar tarafında)
  const KARE = [
    // dış görünüm: Ege sırtında uzaktan
    // açılış: yere yakın, türbin uzakta ama dev; masaüstünde kadrajın sağında (sol taraf kimliğe kalır)
    NC ? { p: 0.00, t: 'D', k: v(5, 14, 16), h: mobil ? v(-110, -150, -250) : v(-140, -118, -244) }
    : GB ? { p: 0.00, t: 'D', k: v(250, Z(1.6), 340), h: mobil ? v(0, Z(64), 0) : v(-57, Z(64), 41) }
       : { p: 0.00, t: 'D', k: v(132, Z(22), 182), h: mobil ? v(0, Z(60), 0) : v(-30, Z(74), 22) },
    // nasel çatısından inişte rotordan uzaklaşan ara nokta (kamera kanatların içinden geçmez)
    ...(NC ? [{ p: 0.04, t: 'D', k: v(46, Z(150), 74), h: v(0, Z(95), 0) }] : []),
    { p: 0.08, t: 'D', k: v(92, Z(3), 128),    h: mobil ? v(0, Z(72), 0) : v(-12, Z(70), 9) },
    // kulenin dibinde: rotora bakış
    { p: 0.125,t: 'D', k: v(15, Z(1.8), 24),   h: v(0, Z(76), -3) },
    // kule kapısı: dış merdiven, sahanlık, kapı açılır
    { p: 0.155,t: 'D', k: T(0, 2.55, 9.6),     h: T(0, 4.7, 2.2) },
    { p: 0.178,t: 'D', k: T(0.08, 5.42, 3.5),  h: T(-0.05, 4.95, 1.0) },
    { p: 0.194,t: 'D', k: T(0.04, 5.42, 3.2),  h: T(0, 5.0, 0.3) },
    { p: 0.207,t: 'D', k: T(0, 5.45, 1.85),    h: T(0, 5.5, -0.6), akis: true },
    // kule içi: karanlık silindir, yukarı bakış, servis asansörü
    { p: 0.224,t: 'D', k: T(0.3, 5.45, 0.9),   h: T(-0.15, 32, -0.4) },
    { p: 0.246,t: 'D', k: T(-0.06, 5.45, 0.75), h: T(-0.05, 5.2, -0.9) },
    { p: 0.264,t: 'D', k: T(-0.05, 5.5, -0.84), h: T(0.1, 6.1, 1.3) },
    // yukarı erişim: kabin kule boyunca çıkar
    // kapı kapanır, kilitlenir; kısa bekleme; sonra yumuşak kalkış, sabit çıkış, yavaşlayarak duruş
    { p: 0.292,t: 'D', k: T(0, 5.5, -0.82),    h: T(0.15, 6.0, 1.3) },
    // dikey yol düz kalsın diye ara noktalar; aralıklar yumuşak kalkış/duruş profiliyle (smoothstep)
    ...[0.25, 0.5, 0.75].map(f => { const e = f * f * (3 - 2 * f), y = 5.5 + (KO.ustY + 1.62 - 5.5) * e;
      return { p: 0.292 + (0.40 - 0.292) * f, t: 'D', k: T(0, y, -0.82), h: T(0.6, y + 0.95, 1.3), akis: true }; }),
    { p: 0.40, t: 'D', k: T(0, KO.ustY + 1.62, -0.82), h: T(0.15, KO.ustY + 2.1, 1.3) },
    { p: 0.406,t: 'D', k: T(0, KO.ustY + 1.62, -0.81), h: T(0.12, KO.ustY + 2.1, 1.3) },   // duruş: kilit açılır, kapı aralanır
    // yaw katı: kabinden çık, kablo ilmeğinin yanından merdivene; kapaktan ve şasi bacasından nasele tırman
    { p: 0.418,t: 'D', k: T(-0.34, KO.ustY + 1.62, -0.14), h: T(kapakTL[0], KO.ustY + 2.5, kapakTL[1]) },
    { p: 0.434,t: 'D', k: T(tir[0], KO.ustY + 1.74, tir[1]), h: T(kapakTL[0] + kapakYon.x * 0.1, towerTopY + 2.4, kapakTL[1] + kapakYon.y * 0.1) },
    { p: 0.45, t: 'D', k: T(tir[0], towerTopY + 0.4, tir[1]), h: T(tir[0] + kapakYon.x * 0.5, towerTopY + 3.6, tir[1] + kapakYon.y * 0.5), akis: true },
    // naselin tabanından içeri: makine
    { p: 0.468,t: 'N', k: v(KAPAK_N.x, TABAN + 1.66, KAPAK_N.y - 0.1), h: v(0.25, 0.3, 4.6) },
    { p: 0.49, t: 'N', k: v(-1.2, 1.0, -3.9),  h: v(0.3, 0.1, -6.2) },
    { p: 0.515,t: 'N', k: v(1.55, 1.35, -5.3), h: v(-0.3, -0.2, 3.5) },
    { p: 0.55, t: 'N', k: v(1.5, 0.55, -2.9),  h: v(0, -0.05, -5.0) },
    { p: 0.59, t: 'N', k: v(-1.1, 1.2, -4.3),  h: v(0.1, -0.1, -2.9) },
    { p: 0.612,t: 'N', k: v(1.35, 1.35, -1.6), h: v(-0.2, 0.2, -0.6), akis: true },
    { p: 0.635,t: 'N', k: v(1.6, 1.3, 0.6),    h: v(0, 0.0, -1.7) },
    { p: 0.685,t: 'N', k: v(1.1, 0.62, 1.35),  h: v(0, 0.5, 1.2) },
    // jeneratör: sahadaki kare gibi arkadan, ayakta durur yükseklikten; önde hortumlar ve gres pompası, ötede mavi gövde
    // sağdan, kaputun yanından arkaya; jeneratörün arkasından (bilezik muhafazasıyla arka perde arasından) sola geç
    { p: 0.705,t: 'N', k: v(1.15, 1.5, 2.3),   h: v(0.2, 1.0, 4.2), akis: true },
    { p: 0.728,t: 'N', k: v(1.12, 0.95, 5.6),  h: v(-0.9, 0.6, 5.2), akis: true },
    { p: 0.745,t: 'N', k: v(-0.25, 0.55, 5.95), h: v(-0.9, 0.6, 3.0), akis: true },
    // sahadaki karenin bakışı: sol arka köşede ayakta, hafif aşağı; önde döşeme ve dolaplar, sağda jeneratör boyunca
    { p: 0.76, t: 'N', k: v(-1.45, 0.22, 5.9), h: v(-0.15, -0.15, 1.0) },
    { p: 0.80, t: 'N', k: v(0.1, 0.9, 5.85),   h: v(0.8, 0.4, 3.5), akis: true },
    { p: 0.845,t: 'N', k: v(0.9, 1.2, 5.7),    h: v(1.55, -0.1, 2.4) },
    { p: 0.875,t: 'N', k: v(-0.25, 0.8, 5.8),  h: v(-1.6, -0.1, 4.6) },
    { p: 0.905,t: 'N', k: v(-1.0, 1.15, 5.2),  h: v(-1.75, -0.5, 2.8) },
    // Kamerayı önce kapağın altına al, açıklıktan dik yükselt, sonra yavaşça geriye aç.
    { p: 0.918,t: 'N', k: v(-0.2, 1.15, kapakZ - 0.2), h: v(0, 5.0, kapakZ + 3) },
    { p: 0.930,t: 'N', k: v(0, 1.45, kapakZ), h: v(0, 5.0, kapakZ + 7) },
    { p: 0.940,t: 'N', k: v(0, 1.83, kapakZ), h: v(0, 4.4, kapakZ + 8) },
    { p: 0.948,t: 'N', k: v(0, 2.65, kapakZ), h: v(0, 3.6, kapakZ + 12) },
    { p: 0.955,t: 'N', k: v(3.5, 5.5, kapakZ + 5), h: v(0, 2.0, kapakZ + 2) },
    { p: 0.965,t: 'N', k: v(8, 9, kapakZ + 14), h: v(0, 1.0, 0) },
    { p: 0.980,t: 'N', k: v(20, 16, kapakZ + 30), h: v(0, 0.5, -3) },
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
  let composer = null, bokeh = null, gtao = null;
  const ppHazir = hafif ? Promise.resolve() : Promise.all([
    import('/assets/vendor/pp/EffectComposer.js'), import('/assets/vendor/pp/RenderPass.js'),
    import('/assets/vendor/pp/BokehPass.js'), import('/assets/vendor/pp/UnrealBloomPass.js'), import('/assets/vendor/pp/OutputPass.js'),
    import('/assets/vendor/pp/GTAOPass.js').catch(() => null),
  ]).then(([EC, RP, BP, UB, OP, GT]) => {
    composer = new EC.EffectComposer(renderer);
    composer.addPass(new RP.RenderPass(scene, camera));
    /* Ortam örtmesi (GTAO), yalnız nasel içinde ve en yüksek kalitede: köşeler, makine dipleri, hortum ve kablo
     * arkaları, dolap araları gerçek fotoğraftaki gibi yumuşakça kararır. Yarım çözünürlükte hesaplanır, gürültüsü
     * Poisson süzgeciyle temizlenir; kalite düşerse kendiliğinden kapanır. */
    if (GT && GT.GTAOPass) {
      try {
        gtao = new GT.GTAOPass(scene, camera, 256, 256, undefined,
          { radius: 0.42, distanceExponent: 1.3, thickness: 1.4, scale: 1.2, samples: 12, distanceFallOff: 1, screenSpaceRadius: false },
          { lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 7, rings: 2, samples: 12 });
        gtao.blendIntensity = 0.92; gtao.enabled = false;
        const boyut = gtao.setSize.bind(gtao);
        gtao.setSize = (w, h) => boyut(Math.max(1, w >> 1), Math.max(1, h >> 1));
        // sahnenin tamamını her karede dolaşmak yerine: nokta/çizgi nesneleri ve ışık huzmesi bir kez listelenir
        let gizlenen = null;
        gtao.overrideVisibility = () => {
          if (!gizlenen) { gizlenen = []; scene.traverse(o => { if (o.isPoints || o.isLine || o === huzme) gizlenen.push(o); }); }
          gizlenen.forEach(o => { o.userData.__gtaoG = o.visible; o.visible = false; });
        };
        gtao.restoreVisibility = () => { if (gizlenen) gizlenen.forEach(o => { o.visible = o.userData.__gtaoG; }); };
        composer.addPass(gtao);
      } catch (e) { console.warn('GTAO yok:', e); gtao = null; }
    }
    bokeh = new BP.BokehPass(scene, camera, { focus: 20, aperture: 0.00004, maxblur: 0.006 });
    composer.addPass(bokeh);
    // karşı ışıkta gök zaten parlak: ışıma yalnız güneş çekirdeğinde kalsın, bütün gök sütleşmesin
    composer.addPass(new UB.UnrealBloomPass(new THREE.Vector2(256, 256), GB ? 0.22 : 0.28, GB ? 0.35 : 0.5, GB ? 0.985 : 0.88));
    composer.addPass(new OP.OutputPass());
    olcek(true);
  }).catch(e => { console.warn('post-processing yok:', e); composer = null; });

  /* ---------------- yardımcılar ---------------- */
  // Saat ve Aliağa hava kodu dış atmosferi belirler; iç mekân kendi ışığını korur.
  let hava = window.__sonerHava || null, havaSurum = 0, sonSurum = -1;
  // önizleme ve test: ?vardiya=gunduz|altin|aksam|gece gerçek saatin yerine geçer
  const zorVardiya = (location.search.match(/[?&]vardiya=(gunduz|safak|altin|aksam|gece)\b/) || [])[1] || null;
  window.addEventListener('ss:hava', e => { hava = e.detail; havaSurum++; kareSakla = true; if (!icAyar) isik(); });
  /* körfez kapağında vardiya doğrudan İzmir'deki gerçek güneş yüksekliğinden (gok.js, 30 sn'de bir) okunur:
   * gün batımı anı sayfanın 10 dakikalık etiket yenilemesini beklemez. */
  function vardiyaSimdi() {
    if (zorVardiya || !korfez || !gok) return zorVardiya || kok.dataset.vardiya;
    const d = gok.durum, h = d.gunesH * 180 / Math.PI;
    if (h < -6) return 'gece';
    if (h < 0) return d.gunesYon.x > 0 ? 'safak' : 'aksam';   // güneş doğuda: sabah
    return h < 8 ? 'altin' : 'gunduz';
  }
  function isikModu() {
    if (GB) return 'sunset';
    const v = vardiyaSimdi();
    if (korfez && v === 'safak') return 'safak';
    return v === 'gece' ? 'night' : v === 'aksam' || v === 'altin' ? 'sunset' : 'day';
  }
  let sonMod = null;
  let disPoz = renderer.toneMappingExposure, pozAnlik = disPoz;
  /* Atmosfer geçişi: saat ya da hava değişince gök, sis, güneş ve ortam ışığı ~2,5 sn'de kayar (ani ışık sıçraması yok).
   * İlk ayar ve iç mekân anlık uygulanır. */
  const SKY_RENK = ['c0', 'c1', 'c2', 'c3', 'uIsima', 'uBulutR', 'uBulutK'];
  function durumAl() {
    const u = S.sky.material.uniforms;
    return { bg: scene.background.clone(), fog: scene.fog.color.clone(), fn: scene.fog.near, ff: scene.fog.far,
      sc: gunes.color.clone(), sp: gunes.position.clone(), hc: hemi.color.clone(), hg: hemi.groundColor.clone(), fc: dolgu.color.clone(),
      sky: SKY_RENK.map(k => u[k].value.clone()), ig: u.uIsimaG.value, bu: u.uBulut.value, gv: u.uGunes.value.clone(),
      gi: gunesTaban, hi: hemiTaban, di: dolguTaban, poz: disPoz };
  }
  function durumKoy(a, b, t) {
    const u = S.sky.material.uniforms, L = THREE.MathUtils.lerp;
    scene.background.copy(a.bg).lerp(b.bg, t); scene.fog.color.copy(a.fog).lerp(b.fog, t);
    scene.fog.near = L(a.fn, b.fn, t); scene.fog.far = L(a.ff, b.ff, t);
    gunes.color.copy(a.sc).lerp(b.sc, t); gunes.position.copy(a.sp).lerp(b.sp, t);
    hemi.color.copy(a.hc).lerp(b.hc, t); hemi.groundColor.copy(a.hg).lerp(b.hg, t); dolgu.color.copy(a.fc).lerp(b.fc, t);
    SKY_RENK.forEach((k, i) => u[k].value.copy(a.sky[i]).lerp(b.sky[i], t));
    u.uIsimaG.value = L(a.ig, b.ig, t); u.uBulut.value = L(a.bu, b.bu, t); u.uGunes.value.copy(a.gv).lerp(b.gv, t).normalize();
    gunesTaban = L(a.gi, b.gi, t); hemiTaban = L(a.hi, b.hi, t); dolguTaban = L(a.di, b.di, t); disPoz = L(a.poz, b.poz, t);
  }
  /* gerçek güneş/ay ışığı: gündüz ve akşam güneş Aliağa'daki gerçek yönünden vurur (ışık için en az 3° yükseklik);
   * gece ay ufkun üstündeyse soluk ışık aydan gelir. */
  const _gokY = new THREE.Vector3(), _gokMin = Math.sin(3 * Math.PI / 180);
  function gokIsik() {
    const d = gok.durum;
    if (sonMod === 'night') { if (d.ayH > 3 * Math.PI / 180) gunes.position.copy(d.ayYon).multiplyScalar(420); return; }
    _gokY.copy(d.gunesYon); if (_gokY.y < _gokMin) { _gokY.y = _gokMin; _gokY.normalize(); }
    gunes.position.copy(_gokY).multiplyScalar(420);
    const u = S.sky.material.uniforms; if (u.uGunes) u.uGunes.value.copy(_gokY);
    if (ege) ege.gunesBak(_gokY);
  }
  // karşı ışık: güneş, kapak kamerasının türbine bakış yönünde, 11° solda ve ufkun 5,5° üstünde
  const _ka = new THREE.Vector3(), _ileri = new THREE.Vector3(), _sag = new THREE.Vector3(), _gy = new THREE.Vector3();
  function gunesKarsi() {
    _ka.copy(KARE[0].k).applyMatrix4(yaw.matrixWorld);
    _ileri.set(-_ka.x, 0, -_ka.z).normalize();
    _sag.set(-_ileri.z, 0, _ileri.x);
    const a = 11 * Math.PI / 180, e = 5.5 * Math.PI / 180;
    _gy.copy(_ileri).multiplyScalar(Math.cos(a)).addScaledVector(_sag, -Math.sin(a)).normalize().multiplyScalar(Math.cos(e)); _gy.y = Math.sin(e);
    gunes.position.copy(_gy).multiplyScalar(420);
    S.sky.material.uniforms.uGunes.value.copy(_gy);
    if (ege) ege.gunesBak(_gy);
  }
  let gecis = null, isikIlk = true, sonAtmT = 0, sonFaz = null;
  // süre duvar saatiyle ölçülür: yavaş cihazda ya da seyreltilmiş karede geçiş uzayıp yarım kalmaz
  function gecisAdim(bitir) {
    if (!gecis) return;
    gecis.t = bitir ? 1 : Math.min(1, (performance.now() - gecis.t0) / 2500);
    const e = gecis.t * gecis.t * (3 - 2 * gecis.t);
    durumKoy(gecis.a, gecis.b, e);
    if (gecis.t >= 1) gecis = null;
  }
  function isik() {
    const m = isikModu(), faz = korfez ? vardiyaSimdi() : null;
    if (m === sonMod && havaSurum === sonSurum && faz === sonFaz) return;
    const yumusat = !isikIlk && !icAyar && !az;
    const once = yumusat ? durumAl() : null;
    setLight(m); sonMod = m; sonSurum = havaSurum; sonFaz = faz;
    const tur = hava && hava.tur;
    const u = S.sky.material.uniforms;
    // nasel kapağı: fotoğraftaki berrak gün ışığı yalnız gündüz ve açık/parçalı havada; akşam, gece, yağmur ve fırtınada gerçek koşul
    const ncAcik = NC && !korfez && m === 'day' && (!tur || tur === 'acik' || tur === 'parcali');
    if (tur === 'bulutlu' || tur === 'yagmur' || tur === 'firtina' || tur === 'kar' || tur === 'sis') {
      const koyu = tur === 'yagmur' || tur === 'firtina';
      const renk = m === 'night' ? 0x26313c : tur === 'kar' ? 0xb2bbc2 : tur === 'firtina' ? 0x4d5864 : koyu ? 0x667380 : 0x909da7;
      scene.background.setHex(renk); scene.fog.color.setHex(renk);
      scene.fog.near = tur === 'sis' ? 90 : koyu ? 180 : tur === 'kar' ? 160 : 360;
      scene.fog.far = tur === 'sis' ? 670 : koyu ? 1100 : tur === 'kar' ? 1050 : 1700;
      gunes.intensity *= tur === 'sis' ? 0.22 : koyu ? 0.35 : 0.6;
      hemi.intensity *= tur === 'firtina' ? 0.65 : 0.85;
      if (u && u.uBulut) u.uBulut.value = 1;
      if (u && u.c0 && m !== 'night') {
        u.c0.value.setHex(tur === 'firtina' ? 0x3c4654 : koyu ? 0x525f70 : tur === 'kar' ? 0x8c9baa : 0x738695);
        u.c1.value.setHex(tur === 'firtina' ? 0x58636f : koyu ? 0x75818c : tur === 'kar' ? 0xb3c1ca : 0x9aabb6);
      }
    } else if (tur === 'acik' && m !== 'night') {
      u.uIsimaG.value = m === 'day' ? 0.5 : 0.8;
    } else if (tur === 'parcali') {
      // az/parçalı bulut: güneş görünür, ufukta dağınık bulut bandı
      if (u.uBulut) u.uBulut.value = 0.55;
      if (m !== 'night') u.uIsimaG.value = m === 'day' ? 0.35 : 0.65;
      gunes.intensity *= 0.9;
    }
    // gök bandındaki bulutların tonu ışık moduna uysun (gündüz beyaz-gri, akşam sıcak kenarlı, gece koyu)
    if (u.uBulutR && m !== 'safak') {
      const kapali = tur === 'bulutlu' || tur === 'yagmur' || tur === 'firtina' || tur === 'kar' || tur === 'sis';
      u.uBulutR.value.set(m === 'night' ? '#161c29' : m === 'sunset' ? '#5f5a69' : '#a9b4bf');
      u.uBulutK.value.set(m === 'night' ? '#2a3244' : m === 'sunset' ? '#f2c08f' : '#f6f6f2');
      if (kapali) { u.uBulutR.value.lerp(scene.fog.color, 0.5); u.uBulutK.value.lerp(scene.fog.color, 0.6); }
    }
    if (GB) {
      // saha fotoğrafından örneklenen tonlar: soluk mavi-gri zenit, güneş yanında açık sarı, sıcak ufuk pusu
      u.c0.value.set('#7f97a4'); u.c1.value.set('#adbcb9'); u.c2.value.set('#e6d79f'); u.c3.value.set('#c9bb88');
      u.uIsima.value.set('#ffeeb0'); u.uIsimaG.value = mobil ? 1.2 : 1.05;
      if (u.uBulut) { u.uBulut.value = 0.45; u.uBulutR.value.set('#b3b8a8'); u.uBulutK.value.set('#fff6d6'); }
      scene.background.set('#d4cca6'); scene.fog.color.set('#cfc69e'); scene.fog.near = 480; scene.fog.far = 3000;
      gunes.color.set('#ffe0a0'); gunes.intensity = 3.1;
      hemi.color.set('#a3afae'); hemi.groundColor.set('#2f2c21'); hemi.intensity = 0.46;
      dolgu.intensity = 0.04; renderer.toneMappingExposure = 0.96;
    }
    if (ncAcik) {
      // fotoğraftaki açık sabah: koyu mavi zenit, ufukta açık pus; bulut yok
      u.c0.value.set('#4e7fb6'); u.c1.value.set('#86abcd'); u.c2.value.set('#cad7df'); u.c3.value.set('#c4c6bd');
      u.uIsima.value.set('#fff3dc'); u.uIsimaG.value = 0.18; if (u.uBulut) u.uBulut.value = tur === 'parcali' ? 0.4 : 0;
      scene.background.set('#c8d4dc'); scene.fog.color.set('#a9bccb'); scene.fog.near = 1200; scene.fog.far = 6500;
      gunes.color.set('#fff6e8'); gunes.intensity = 2.6; gunes.position.set(-260, 190, -120);
      hemi.color.set('#cfe0ee'); hemi.groundColor.set('#6d6a55'); hemi.intensity = 1.05;
      dolgu.intensity = 0.3; renderer.toneMappingExposure = 1.02;
    }
    hemiTaban = hemi.intensity; dolguTaban = dolgu.intensity; gunesTaban = gunes.intensity;
    disPoz = renderer.toneMappingExposure;
    // körfez kapağında gök, ışık ve sis her karede korfez.js'ten gelir; burada yalnız bulut tonu seçilir
    const egeMod = korfez ? (m === 'night' ? 'korfezGece' : faz === 'altin' ? 'korfezAltin' : faz === 'aksam' || faz === 'safak' ? 'korfezAksam' : 'korfez') : m;
    if (ege) ege.ayarla(GB ? 'gunbatimi' : ncAcik ? 'nasel' : egeMod, GB || ncAcik ? 'acik' : tur);
    if (once) { gecis = { a: once, b: durumAl(), t: 0, t0: performance.now() }; durumKoy(once, gecis.b, 0); renderer.toneMappingExposure = pozAnlik; }
    else { gecis = null; if (ege) ege.anlik(); }
    isikIlk = false;
  }
  isik();
  // CSS değişkenleri (canlı rüzgâr) saniyede bir okunur; her karede getComputedStyle stil hesabını zorlar
  let cssT = -1e9, cssDevir = 0, cssYon = null, cssRz = null;
  function cssOku() {
    const n = performance.now(); if (n - cssT < 1000) return; cssT = n;
    const st = getComputedStyle(kok);
    const s = parseFloat(st.getPropertyValue('--devir-sure')); cssDevir = s > 0 ? 2 * Math.PI / s : 0;
    const d = parseFloat(st.getPropertyValue('--yon-derece')); cssYon = isFinite(d) ? -d * Math.PI / 180 : null;
    const r = parseFloat(st.getPropertyValue('--rz')); cssRz = isFinite(r) ? r * 25 : null;   // canli.js: v / 25
  }
  function devirRad() { cssOku(); return cssDevir; }
  function yonHedef() { cssOku(); return cssYon; }
  let yawIlk = true;
  function yawGuncelle(dt) {
    const h = yonHedef(); if (h === null) return;
    if (yawIlk) { yaw.rotation.y = h; yawIlk = false; return; }
    let f = Math.atan2(Math.sin(h - yaw.rotation.y), Math.cos(h - yaw.rotation.y));
    const adim = 0.3 * Math.PI / 180 * dt * 60; yaw.rotation.y += Math.max(-adim, Math.min(adim, f));
  }
  const sahneEl = canvas.parentElement;
  function ilerleme() {
    // yol, yapışkan sahnenin kendi yüksekliğiyle (100svh) ölçülür: iPhone'da adres çubuğu açılıp kapanınca
    // innerHeight değişir ve kamera sıçrardı; sahne yüksekliği sabit kalır.
    const r = bolum.getBoundingClientRect(), yol = r.height - (sahneEl.clientHeight || innerHeight);
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
  window.addEventListener('ss:performance', event => {
    performans = !!event.detail?.enabled;
    renderer.setPixelRatio(performans ? 1 : normalDpr);
    renderer.shadowMap.enabled = normalShadow && !performans;
    olcek(true);
  });
  const tmp = new THREE.Vector3(), yerel = new THREE.Vector3();
  const tiltTers = new THREE.Matrix4();
  function naselYerel(dunya, out) { tiltTers.copy(tilt.matrixWorld).invert(); return out.copy(dunya).applyMatrix4(tiltTers); }
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
    // dijital ikiz (Parça kâşifi): iç bileşenler yakından, dıştakiler yalnız seçilince ya da röntgende görünür
    { id: 'anaMil',    v: v(0.55, 0.6, -3.55),  ic: true },
    { id: 'kaplin',    v: v(0.45, 1.05, 0.62),  ic: true },
    { id: 'yaglama',   v: v(-1.05, 1.45, 0.4),  ic: true },
    { id: 'panolar',   v: v(-1.62, -0.75, 2.8), ic: true },
    { id: 'kontrol',   v: v(-1.55, 0.05, 4.75), ic: true },
    { id: 'gobek',     v: v(0.9, -0.6, -7.7),   ic: false, yalniz: true },
    { id: 'sogutma',   v: v(1.48, 2.3, 5.3),    ic: false, yalniz: true },
  ];
  /* ---------------- röntgen (X-ray) ve patlatma görünümü ----------------
   * Kamera naselin çevresinde yavaş bir yörüngeye alınır, dış kabuk kademeli saydamlaşır, bileşenler isteğe göre
   * kendi yönlerine açılır. Kaydırma hiçbir zaman engellenmez: sayfa tarafı kaydırınca röntgeni kapatır. */
  const rt = { acik: false, kabuk: 0.8, patlat: 0, pY: 0, aci: 0, g: 0, secili: null, hazir: false, kirli: false };
  const PATLAT = { anaYatak: v(0, 0, -1.4), anaMil: v(0, 0, -0.7), disli: v(0, 0.9, 0), kaplin: v(0, 0.8, 0.5), jenerator: v(0, 0.5, 1.6),
    konvertor: v(1.4, 0, 0), panolar: v(-1.4, 0, 0), ustKutu: v(-1.2, 0.8, 0.6), kablolar: v(0, 1.0, 0) };
  const NOKTA_PARCA = { anaYatak: 'anaYatak', anaMil: 'anaMil', disli: 'disli', yaglama: 'disli', kaplin: 'kaplin', jenerator: 'jenerator',
    konvertor: 'konvertor', panolar: 'panolar', kontrol: 'ustKutu' };
  const pg = ic.parcaGrup || {};
  const ilkKonum = {}; Object.keys(pg).forEach(k => { ilkKonum[k] = pg[k].position.clone(); });
  const kabukMat = [], rtSprite = [];   // ikaz lambası haleleri röntgende yakın plan parlamasın
  const rMerkez = new THREE.Vector3(), rKonum = new THREE.Vector3();
  function rontgenHazirla() {
    if (rt.hazir) return; rt.hazir = true;
    // malzemeler bu türbine kopyalanır: rüzgâr çiftliğindeki öbür türbinler ve ortak malzemeler etkilenmez
    parts.nacelle.traverse(o => { if (o.isSprite) rtSprite.push(o); else if (o.isMesh && o.material && !Array.isArray(o.material) && !(o.material.emissive && o.material.emissive.getHex())) { o.material = o.material.clone(); kabukMat.push(o.material); } });   // yanıp sönen ikaz lambası malzemesi ortak kalır
    Object.keys(pg).forEach(k => { if (k === 'kabuk') return; pg[k].traverse(o => {
      if (!o.isMesh || !o.material || Array.isArray(o.material) || !o.material.emissive) return;
      o.material = o.material.clone(); o.material.userData.e0 = o.material.emissive.getHex(); o.material.userData.ei0 = o.material.emissiveIntensity; }); });
  }
  function rontgenVurgu() {
    if (!rt.hazir) return;
    const sec = rt.acik && rt.secili ? NOKTA_PARCA[rt.secili] : null;
    Object.keys(pg).forEach(k => { if (k === 'kabuk') return; pg[k].traverse(o => {
      const m = o.isMesh && o.material; if (!m || !m.emissive || m.userData.e0 === undefined) return;
      if (k === sec) { m.emissive.setHex(0x1f8597); m.emissiveIntensity = Math.max(m.userData.ei0, 0.45); }
      else { m.emissive.setHex(m.userData.e0); m.emissiveIntensity = m.userData.ei0; } }); });
  }
  const nDunya = new THREE.Vector3(), nEkran = new THREE.Vector3(), nYon = new THREE.Vector3();
  const isin = new THREE.Raycaster();
  const kapanan = {}; let sonIsin = 0, vurguNokta = null;
  function noktalariGuncelle(t, icerde) {
    if (!cb.noktalar) return;
    const w = canvas.clientWidth, h = canvas.clientHeight, liste = [];
    const isinZamani = t - sonIsin > 220; if (isinZamani) sonIsin = t;
    for (const n of NOKTALAR) {
      nDunya.copy(n.v);
      const pk = NOKTA_PARCA[n.id]; if (pk && PATLAT[pk] && rt.pY > 0) nDunya.addScaledVector(PATLAT[pk], rt.pY * rt.g);
      tilt.localToWorld(nDunya);
      const d = camera.position.distanceTo(nDunya);
      const rontgen = rt.g > 0.6;
      const zor = n.id === vurguNokta || rontgen;   // Parça kâşifinde seçilen parça ya da röntgen: her açıdan işaretlensin
      let aday = zor || (n.yalniz ? false : n.ic ? (icerde && d < 5.2) : (!icerde && p > 0.1 && p < 0.145));
      if (aday) {
        nEkran.copy(nDunya).project(camera);
        aday = nEkran.z < 1 && Math.abs(nEkran.x) < 0.92 && Math.abs(nEkran.y) < 0.86;
      }
      if (aday && !zor && isinZamani) {
        nYon.subVectors(nDunya, camera.position).normalize();
        isin.set(camera.position, nYon); isin.far = d - 0.22;
        const hedefler = n.ic ? ic.grup.children : (parts.spin ? [parts.spin] : []);
        kapanan[n.id] = isin.intersectObjects(hedefler, true).some(o => o.object.visible !== false);
      }
      liste.push({ id: n.id, gor: !!aday && (zor || !kapanan[n.id]), x: (nEkran.x * 0.5 + 0.5) * w, y: (-nEkran.y * 0.5 + 0.5) * h, d });
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
  // Hareket saati: kendiliğinden olan hareketler (rotor, açılış kamera kayması, nefes, ikaz lambası) bununla ilerler.
  // Duraklatınca durur; kaydırmayla gelen kamera hareketi her zaman çalışır.
  let mt = 0, duraklat = false;
  let kareSay = 0, kareSakla = false, sonHedefP = null, durgunT = 0, sonAralik = 0;
  /* Uyarlanır kalite: kaydırma sırasında kare süresi ölçülür; cihaz yetişemiyorsa önce çözünürlük,
   * sonra efektler kademeli düşürülür, rahatladığında geri alınır. Hedef: her cihazda takılmadan kaydırma.
   * Kademe 0 tam kalite · 1 çözünürlük −%20 · 2 alan derinliği ve parlama kapalı · 3 çözünürlük −%40 */
  const KADEME_PR = mobil ? [0.9, 0.9, 0.75, 0.62] : [normalDpr, Math.max(1, normalDpr * 0.8), 1, 0.8];
  // telefonda hareket sırasında kare aralığı (ms): kademe 1'den itibaren 30 fps. Sabit 30, dalgalı 60'tan akıcı görünür.
  const KADEME_ARALIK = mobil ? [0, 32, 32, 32] : [0, 0, 0, 0];
  let kalite = 0, ortKare = 16.7, kotuT = 0, iyiT = 0, cokKotuT = 0, birakildi = false, yukselt = false;
  try { const k = parseInt(sessionStorage.getItem('dny-kalite'), 10); if (k >= 0 && k <= 3) kalite = k; } catch (e) {}
  function kaliteUygula() {
    if (performans) return;
    // yalnız çözünürlük değişiyorsa tuval yeniden boyutlanır; kare hızı kademesi takılma üretmez
    if (renderer.getPixelRatio() !== KADEME_PR[kalite]) { renderer.setPixelRatio(KADEME_PR[kalite]); olcek(true); }
    try { sessionStorage.setItem('dny-kalite', String(kalite)); } catch (e) {}
  }
  function kaliteOlc(araMs, t) {
    // yalnızca hareket sırasında ve sekme önplandayken ölç
    if (kaliteSabit || araMs <= 0 || araMs > 1500) return;   // sekme dönüşü gibi uzun aralar sayılmaz
    araMs = Math.min(araMs, 100);
    ortKare += (araMs - ortKare) * 0.08;
    const hedef = KADEME_ARALIK[kalite] ? 1000 / 29 : 1000 / 58;
    // en düşük kademede bile kare 40 ms'yi (25 fps) sürekli aşıyorsa cihaz bu sahneyi taşıyamıyor: bırak
    if (!zorla && kalite >= 3 && ortKare > (mobil ? 60 : 40)) { if (!cokKotuT) cokKotuT = t; if (t - cokKotuT > 2500) { birak('yavas'); return; } } else cokKotuT = 0;
    if (ortKare > hedef * 1.3) { iyiT = 0; if (!kotuT) kotuT = t; if (t - kotuT > 700 && kalite < 3) { kalite++; kaliteUygula(); kotuT = 0; ortKare = hedef; } }
    // kaliteyi geri yükseltmek tuvali yeniden boyutlandırır: kaydırma sırasında değil, parmak durunca yapılır
    else if (ortKare < hedef * 1.08) { kotuT = 0; if (!iyiT) iyiT = t; if (t - iyiT > 6000 && kalite > 0) { yukselt = true; iyiT = 0; } }
    else { kotuT = 0; iyiT = 0; }
  }
  if (kalite > 0) kaliteUygula();
  // test ve tanı kancası: kalite kademesini sabitler (önizleme görüntüleri yazılım GPU'sunda da en yüksek kademede alınsın)
  let kaliteSabit = false;
  S.kaliteZorla = k => { kaliteSabit = k != null; if (kaliteSabit) { kalite = k; kaliteUygula(); } return kalite; };
  function ilkKareyiSakla() {
    if (p > .02 || !canvas.width || !canvas.height) return;
    try {
      const k = document.createElement('canvas');
      const oran = Math.min(1, (mobil ? 540 : 960) / canvas.width);
      k.width = Math.max(1, Math.round(canvas.width * oran));
      k.height = Math.max(1, Math.round(canvas.height * oran));
      const ctx = k.getContext('2d', { alpha: false });
      ctx.drawImage(canvas, 0, 0, k.width, k.height);
      const w = canvas.clientWidth, h = canvas.clientHeight, v = kok.dataset.vardiya;
      const kodla = () => { try {
        const data = k.toDataURL('image/webp', .58);
        if (data.length < 5000) return;
        sessionStorage.setItem('dny-kare:' + location.pathname, JSON.stringify({ t: Date.now(), v, w, h, data }));
      } catch (e) { /* depolama dolu ya da kapalı */ } };
      if ('requestIdleCallback' in window) requestIdleCallback(kodla, { timeout: 4000 }); else setTimeout(kodla, 1500);
    } catch (e) { /* WebGL okuma ya da depolama engellenebilir */ }
  }
  const tlKam = new THREE.Vector3();
  const kabinIsikTaban = kule.kabinIsik.intensity, girisIsikTaban = kule.girisIsik.intensity, ustIsikTaban = kule.ustIsik.intensity;
  const kKonum = new THREE.Vector3(), kHedef = new THREE.Vector3(), yumHedef = new THREE.Vector3();
  /* Serbest bakış: kamera nasel çatısındayken (açılış kapağı ve çatı kapağından çıkış) ziyaretçi sürükleyerek
   * 360° etrafına bakar. Kaydırma başlayınca ya da çatıdan uzaklaşınca bakış yumuşakça senaryodaki yöne döner. */
  const bak = { yaw: 0, pitch: 0, hYaw: 0, hPitch: 0, alan: false, surukle: false };
  const _bakD = new THREE.Vector3(), _naselM = new THREE.Vector3();
  const _gbF = new THREE.Vector3(), _gbR = new THREE.Vector3(), _gbH = new THREE.Vector3(), _gbK = new THREE.Vector3(), _gbB = new THREE.Vector3(), _gbT = new THREE.Vector3();
  const gobek = parts.blades && parts.blades[0] ? parts.blades[0].parent : tilt;   // rotor göbeği (dönen grup)
  let gbE = 0;   // gün batımı kadrajının ağırlığı (0–1)
  let hedefIlk = true, icAyar = null, kabinOnce = null, asnHizYum = 0, kIcOnce = 0;
  pozAnlik = disPoz;
  new IntersectionObserver(es => { gorunur = es[0].isIntersecting; if (gorunur) baslat(); }, { rootMargin: '120px' }).observe(bolum);
  // sekme arkadayken geçen süre takılma sayılmasın: görünürlük değişince kare referansı sıfırlanır
  document.addEventListener('visibilitychange', () => { sonRaf = 0; sonT = 0; calisiyor = !document.hidden && !birakildi; if (calisiyor) baslat(); });
  /* Çizim döngüsü gölgelendirici ısınması bitmeden başlamaz. Eskiden görünürlük gözlemcisi döngüyü hemen başlatıyordu;
   * ısınma atlanıyor (tanı: "isinma 0>0>0"), kule kapısında ve nasel girişinde gölgelendiriciler kaydırırken derlenip
   * sahne 1,5–5 sn donuyor, cihaz da "zayıf" işaretlenip kapak fotoğrafa düşüyordu (17 Ekim, M1 Mac: p=0,4 2,5 sn). */
  let isindi = false;
  function baslat() { if (birakildi || !isindi) return; if (!rafId) { sonT = 0; rafId = requestAnimationFrame(kare); } }

  // donma kaydı: iki kare arası 200 ms'yi aşarsa nerede ve neden olduğunu anonim tanıya bildir
  let sonRaf = 0, sonIsMs = 0, takilmaSay = 0, sonProg = 0, sonGeo = 0, sonTex = 0, sonVh = innerHeight;
  function kare(t) {
    rafId = 0; if (!calisiyor || !gorunur) { sonRaf = 0; return; }
    const isBas = performance.now();
    if (sonRaf && t - sonRaf > 200 && !document.hidden && cb.takilma && takilmaSay < 8) {
      takilmaSay++;
      const inf = renderer.info;
      cb.takilma({ p: Math.round(p * 1000) / 1000, ms: Math.round(t - sonRaf), is: Math.round(sonIsMs),
        prog: inf.programs.length - sonProg, geo: inf.memory.geometries - sonGeo, tex: inf.memory.textures - sonTex,
        vh: sonVh + '>' + innerHeight, kalite });
    }
    sonRaf = t; sonVh = innerHeight;
    sonProg = renderer.info.programs.length; sonGeo = renderer.info.memory.geometries; sonTex = renderer.info.memory.textures;
    // kaydırma → ilerleme; ataletli (sinema kamerası dolly'si gibi)
    const hedefP = ilerleme();
    // kaydırma durduğunda sahne yalnızca rotor ve hafif kamera nefesi için çizilir: kare seyreltilir,
    // GPU ve pil boşa yorulmaz; parmak ya da tekerlek oynayınca hemen tam hıza döner.
    if (hedefP !== sonHedefP || Math.abs(hedefP - p) > 1e-4 || fare.deg || (rt.g > 0 && rt.g < 1) || Math.abs(rt.patlat - rt.pY) > 1e-3 || (rt.acik && !az && !duraklat) || bak.surukle || Math.abs(bak.yaw) + Math.abs(bak.pitch) > 1e-3) { sonHedefP = hedefP; durgunT = t; }
    const durgun = t - durgunT > 1200;
    // hareket varken ekranın kendi hızında (60/120 Hz) çizilir; boşta kare seyreltilir
    const hareketAralik = KADEME_ARALIK[kalite] || 0;
    const aralik = durgun ? (mobil ? 90 : (fare.var ? 0 : 33)) : hareketAralik;
    if (sonT && t - sonT < aralik) { rafId = requestAnimationFrame(kare); return; }
    if (!durgun && sonT && sonAralik === hareketAralik) kaliteOlc(t - sonT, t);
    if (durgun && yukselt) { yukselt = false; if (kalite > 0) { kalite--; kaliteUygula(); } }
    sonAralik = aralik;
    // gölge haritası her karede değil: hareketteyken iki karede bir, boştayken dört karede bir
    if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = kareSay % (durgun ? 4 : 2) === 0;
    const dt = sonT ? Math.min(0.05, (t - sonT) / 1000) : 0.016; sonT = t;
    if (!duraklat) mt += dt * 1000;
    if (t - sonIsik > 5000 && !icAyar) { isik(); sonIsik = t; }

    const anlik = az || window.__deneyimAnlik || window.__deneyimKes;
    window.__deneyimKes = false;
    // Telefonda kaydırma konumu tarayıcıdan düzensiz aralıklarla gelir (özellikle yukarı çekerken, alt çubuk
    // geri gelirken). Kamera konuma doğrudan bağlıyken bu düzensizlik takılma gibi görünüyordu; ~70 ms'lik
    // kısa bir yumuşatma sarsıntıyı alır, parmağı hissedilir biçimde geriden izlemez.
    const kSabit = mobil ? 14 : 2.6;
    const pAdim = anlik ? 1 : 1 - Math.exp(-dt * kSabit);
    p += (hedefP - p) * pAdim;
    if (Math.abs(hedefP - p) < 1e-5) p = hedefP;
    const u = egriU(p);
    kEgri.getPoint(u, kKonum); hEgri.getPoint(u, kHedef);
    // yaw yerelinden dünyaya
    kKonum.applyMatrix4(yaw.matrixWorld); kHedef.applyMatrix4(yaw.matrixWorld);
    if (hedefIlk) { yumHedef.copy(kHedef); hedefIlk = false; }
    yumHedef.lerp(kHedef, anlik ? 1 : 1 - Math.exp(-dt * (mobil ? 14 : 3.2)));   // bakış hafif geriden gelir: ağırlık hissi
    // çok hafif el-kamera nefesi (yalnız dışarıda belirgin)
    if (!az) { kKonum.y += Math.sin(mt / 2300) * 0.02; kKonum.x += Math.sin(mt / 3100) * 0.02; }
    // açılışta kamera kendiliğinden, çok yavaş türbine doğru ilerler (kaydırınca devri kaydırmaya bırakır)
    const disAgirlik = (1 - yumusak(0.36, 0.43, p)) + yumusak(0.975, 0.995, p);
    if (!az) {
      if (!hazirT) hazirT = t;
      const surun = NC ? 0 : (1 - Math.exp(-mt / 22000)) * 16 * (1 - yumusak(0, 0.05, p));
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
    // röntgen: kamera naselin sağ-önünden yavaş bir yörüngeye geçer; kapanınca kaydırma kamerasına süzülerek döner
    const rHedefG = rt.acik ? 1 : 0;
    rt.g += (rHedefG - rt.g) * (anlik ? 1 : 1 - Math.exp(-dt * 2.6)); if (Math.abs(rHedefG - rt.g) < 1e-3) rt.g = rHedefG;
    rt.pY += (rt.patlat - rt.pY) * (anlik ? 1 : 1 - Math.exp(-dt * 3.5)); if (Math.abs(rt.patlat - rt.pY) < 1e-3) rt.pY = rt.patlat;
    if (rt.g > 0) {
      if (rt.acik && !az && !duraklat) rt.aci += dt * 0.05;
      const R = mobil ? (innerWidth < innerHeight ? 24 : 18) : 16, a = -0.35 + rt.aci, e = yumusak(0, 1, rt.g);
      rMerkez.set(0, 0.2, -0.4); tilt.localToWorld(rMerkez);
      rKonum.set(Math.cos(a) * R, 4.6, Math.sin(a) * R); tilt.localToWorld(rKonum);
      kKonum.lerp(rKonum, e); yumHedef.lerp(rMerkez, e);
    }
    // kamera yere gömülmesin: arazinin 1,7 m üstünde kalır
    if (!sonIcerde && !sonKulede) { const yer = (korfez ? korfez.yerY(kKonum.x, kKonum.z) : ege ? ege.yerY(araziY, kKonum.x, kKonum.z) : araziY(kKonum.x, kKonum.z)) + 1.7; if (kKonum.y < yer) kKonum.y = yer; }
    // serbest bakış alanı: dışarıda, röntgen kapalı, nasele 48 m'den yakın (çatıda ya da çatının hemen üstünde)
    _naselM.setFromMatrixPosition(yaw.matrixWorld);
    bak.alan = !sonIcerde && !sonKulede && rt.g < 0.01 && kKonum.distanceTo(_naselM) < 48;
    if (!bak.surukle && (!bak.alan || Math.abs(hedefP - p) > 0.0015)) { const s = Math.exp(-dt * 2.4); bak.hYaw *= s; bak.hPitch *= s; }
    const bakAdim = anlik ? 1 : 1 - Math.exp(-dt * 12);
    bak.yaw += (bak.hYaw - bak.yaw) * bakAdim; bak.pitch += (bak.hPitch - bak.pitch) * bakAdim;
    if (Math.abs(bak.yaw) + Math.abs(bak.pitch) < 1e-4 && !bak.surukle) { bak.yaw = bak.hYaw = 0; bak.pitch = bak.hPitch = 0; }
    /* V18 gün batımı kadrajı: güneş ufka yakınken (İzmir'deki gerçek yüksekliği 7°'nin altında, −4°'nin üstünde) kapak kamerası
     * naselin çatısından türbinin güneşe göre karşı tarafına süzülür: rotor ve nasel batan (ya da doğan) güneşe karşı siluet,
     * ufuk karenin ortasına yakın, güneş kadrajın solunda. Güneş saatle çok yavaş yürüdüğü için geçiş fark edilmez;
     * kaydırma başlayınca kamera senaryodaki yoluna süzülür. */
    let bakH = yumHedef; gbE = 0;
    if (korfez && gok && rt.g < 0.01) {
      const gd = gok.durum, hG = gd.gunesH * 180 / Math.PI;
      const w = yumusak(13, 7, hG) * yumusak(-8, -4, hG) * (1 - yumusak(0, 0.035, p));
      if (w > 0.001) {
        _gbF.set(gd.gunesYon.x, 0, gd.gunesYon.z).normalize(); _gbR.set(-_gbF.z, 0, _gbF.x);
        gobek.getWorldPosition(_gbH);
        _gbK.copy(_gbH).addScaledVector(_gbF, mobil ? -138 : -112).addScaledVector(_gbR, mobil ? -24 : -52); _gbK.y += mobil ? 2 : 5;
        const sap = (mobil ? 3 : 11) * Math.PI / 180, eg = (mobil ? -2.5 : -1.2) * Math.PI / 180;
        _gbB.copy(_gbF).multiplyScalar(Math.cos(sap)).addScaledVector(_gbR, Math.sin(sap)); _gbB.y = Math.tan(eg); _gbB.normalize().multiplyScalar(400).add(_gbK);
        const e = w * w * (3 - 2 * w);
        kKonum.lerp(_gbK, e); bakH = _gbT.copy(yumHedef).lerp(_gbB, e); gbE = e;
      }
    }
    camera.position.copy(kKonum);
    if (bak.yaw || bak.pitch) {
      _bakD.subVectors(bakH, kKonum); const uz = _bakD.length() || 1;
      const yA = Math.atan2(_bakD.x, _bakD.z) - bak.yaw;
      const yE = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(_bakD.y / uz, -1, 1)) + bak.pitch, -1.38, 1.38);
      _bakD.set(Math.sin(yA) * Math.cos(yE), Math.sin(yE), Math.cos(yA) * Math.cos(yE)).multiplyScalar(uz).add(kKonum);
      camera.lookAt(_bakD);
    } else camera.lookAt(bakH);

    // iç/dış geçişi
    naselYerel(camera.position, yerel);
    const b = ic.sinir;
    const icerde = sonIcerde = (Math.abs(yerel.x) < 2.15 && yerel.y > b.TABAN - 0.2 && yerel.y < b.TAVAN + 0.15 && yerel.z > b.ON - 0.15 && yerel.z < b.ARKA + 0.2) ? 1 : 0;
    const yakin = p > 0.4 && p < 0.99;   // kule tepesinden kapağa bakarken naselin içi görünür
    // İç yüzeyler kapaktan dışarı bakınca da yerinde kalır; model bir karede kaybolmaz.
    ic.grup.visible = yakin;
    icIsik.visible = ic.grup.visible;
    gunIsigi.intensity = (mobil ? 90 : 140) * (1 - 0.85 * yumusak(0.925, 0.965, p));
    // kule içi mi? (kule yereline çevir: eksene uzaklık iç yarıçaptan küçük)
    kule.grup.updateMatrixWorld();
    kule.grup.worldToLocal(tlKam.copy(camera.position));
    const kulede = sonKulede = !icerde && tlKam.y > 3.6 && tlKam.y < towerTopY + 1.3 && Math.hypot(tlKam.x, tlKam.z) < KO.rIc(tlKam.y) - 0.01 ? 1 : 0;
    // Fiziksel çatı açıklığına yaklaşırken dış kabuk da görünür; geçişte yok olup geri gelmez.
    parts.nacelle.visible = (p >= 0.918 || !icerde) && !(kulede && tlKam.y > KO.ustY - 1);
    if (rt.g > 0.001) {
      rt.kirli = true;
      ic.grup.visible = true; icIsik.visible = true; parts.nacelle.visible = true;
      const op = 1 - rt.g * rt.kabuk * 0.92;
      for (const m of kabukMat) { m.transparent = op < 0.999; m.opacity = op; m.depthWrite = op > 0.6; }
      if (ic.kabuk) ic.kabuk.visible = op > 0.55;
      const k = rt.pY * rt.g;
      Object.keys(PATLAT).forEach(key => { if (pg[key]) pg[key].position.copy(ilkKonum[key]).addScaledVector(PATLAT[key], k); });
      if (ic.civatalar) ic.civatalar.visible = k < 0.02;
      for (const sp of rtSprite) sp.visible = rt.g < 0.5;
    } else if (rt.kirli) {
      for (const sp of rtSprite) sp.visible = true;
      rt.kirli = false;
      for (const m of kabukMat) { m.transparent = false; m.opacity = 1; m.depthWrite = true; }
      if (ic.kabuk) ic.kabuk.visible = true;
      Object.keys(PATLAT).forEach(key => { if (pg[key]) pg[key].position.copy(ilkKonum[key]); });
      if (ic.civatalar) ic.civatalar.visible = true;
    }
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
    const cikis = yumusak(0.918, 0.948, p);
    const icPay = kulede ? 1 : (p > 0.915 && p < 0.948 ? 1 - cikis : icerde ? 1 : 0);
    const kIc = icPay > 0.001;
    // objektif değişimi: iç/dış geçişi karartmanın içinde olur, göze batmaz
    // kule kapısında görüş kademeli genişler (kapıya yaklaşan gözün alanı); kule ve nasel içi aynı objektifle
    let fovHedef = THREE.MathUtils.lerp(FOV_DIS, FOV_IC, icPay);
    if (p > 0.15 && p < 0.47) fovHedef = THREE.MathUtils.lerp(FOV_DIS, FOV_IC, yumusak(0.158, 0.19, p));
    // jeneratör durağı: sahadaki kare gibi geniş objektif (dar nasel arkasından makinenin tamamı kadraja girsin)
    { const gn = yumusak(0.735, 0.755, p) * (1 - yumusak(0.775, 0.80, p)); if (gn > 0) fovHedef = THREE.MathUtils.lerp(fovHedef, mobil ? 92 : 80, gn); }
    if (Math.abs(camera.fov - fovHedef) > 0.05) { camera.fov += (fovHedef - camera.fov) * (anlik || (p > 0.15 && p < 0.47) ? 1 : 1 - Math.exp(-dt * 5)); camera.updateProjectionMatrix(); }
    // atmosfer geçişi (saat/hava): içeri girerken anında tamamlanır ki iç sis ayarı doğru değerden başlasın
    gecisAdim(kIc);
    if (GB && !kIc) gunesKarsi();
    if (gok && !GB && !kIc) gokIsik();
    const atmDt = sonAtmT ? Math.min(1, (t - sonAtmT) / 1000) : 0; sonAtmT = t;
    if (ege) { ege.grup.visible = icPay < 0.999; if (ege.grup.visible) ege.adim(atmDt, mt / 1000, !az && !duraklat); }
    if (gok) {
      const vv = vardiyaSimdi(), ht = hava && hava.tur;
      const gece = vv === 'gece' ? 1 : vv === 'aksam' ? 0.4 : vv === 'safak' ? 0.3 : 0;
      const kapali = ht === 'bulutlu' || ht === 'yagmur' || ht === 'firtina' || ht === 'kar' || ht === 'sis' ? 1 : ht === 'parcali' ? 0.3 : 0;
      let ayCarpan = 1;
      if (korfez) {
        korfez.grup.visible = icPay < 0.999;
        if (korfez.grup.visible && !kIc) {
          // körfez kapağı: gök modeli güneşin, ortam ışığının, pozlamanın ve sisin değerini her karede verir
          const g = gok.durum; cssOku();
          const L = korfez.adim({ kamera: camera, gunesYon: g.gunesYon, ayYon: g.ayYon, ayH: g.ayH, ayKesir: g.ayKesir, kapali: ht === 'parcali' ? 0.35 : kapali,
            yawY: yaw.rotation.y, zamanSn: mt / 1000, hareket: !az && !duraklat, ruzgar: cssRz, dogrudan: !composer });
          gunes.color.copy(L.gunesRenk); gunesTaban = L.gunesG;
          hemi.color.copy(L.hemiRenk); hemi.groundColor.copy(L.hemiZemin); hemiTaban = L.hemiG; dolguTaban = L.dolguG; disPoz = L.poz;
          scene.fog.color.copy(L.sis); scene.background.copy(L.sis); scene.fog.near = L.sisYakin; scene.fog.far = L.sisUzak;
          ayCarpan = L.ayGor;
        }
      }
      gok.grup.visible = icPay < 0.999; if (gok.grup.visible) gok.adim(camera, atmDt || 0.016, gece, kapali, ayCarpan);
    }
    // içeride karanlık endüstriyel hava: yakın sis ve düşük pozlama
    if (kIc && !icAyar) { icAyar = { renk: scene.fog.color.getHex(), yakin: scene.fog.near, uzak: scene.fog.far, poz: disPoz }; }
    if (kIc) { const sy = anlik ? 1 : 1 - Math.exp(-dt * 3);
      scene.fog.color.setHex(icAyar.renk).lerp(new THREE.Color(0x0b0e11), icPay);
      scene.fog.near += (THREE.MathUtils.lerp(icAyar.yakin, kulede ? 3.5 : 6, icPay) - scene.fog.near) * sy;
      scene.fog.far += (THREE.MathUtils.lerp(icAyar.uzak, kulede ? 42 : 34, icPay) - scene.fog.far) * sy; }   // açık renk makine dairesi uzakta kararmasın
    else if (icAyar) { scene.fog.color.setHex(icAyar.renk); scene.fog.near = icAyar.yakin; scene.fog.far = icAyar.uzak; icAyar = null; isik(); }
    // göz uyumu: iç ve dış arasında pozlama sıçramaz, göz alışır gibi bir iki saniyede yerine oturur
    const pozHedef = THREE.MathUtils.lerp(disPoz, kulede ? 0.9 : 0.92, icPay);
    kIcOnce = kIc;
    pozAnlik += (pozHedef - pozAnlik) * (anlik ? 1 : 1 - Math.exp(-dt * (kIc ? 1.15 : 1.7)));
    renderer.toneMappingExposure = pozAnlik;
    simsekAdim(t, hava && hava.tur === 'firtina' && !az && !kIc && !duraklat && !performans);
    if (toz) toz.visible = !!icerde && yerel.y < ic.sinir.TAVAN - 0.3;
    if (gunes) gunes.intensity = gunesTaban * (1 - icPay);
    if (hemi) hemi.intensity = THREE.MathUtils.lerp(hemi.intensity, hemiTaban * THREE.MathUtils.lerp(1, kulede ? 0.24 : 0.1, icPay), 1 - Math.exp(-dt * 6));
    if (dolgu) dolgu.intensity = dolguTaban * (1 - 0.9 * icPay);
    huzmeMat.uniforms.uGuc.value = THREE.MathUtils.lerp(huzmeMat.uniforms.uGuc.value, icerde ? 1 : 0, 1 - Math.exp(-dt * 4));
    huzmeMat.uniforms.uZaman.value = mt / 1000;
    if (toz) { toz.rotation.y = Math.sin(mt / 9000) * 0.02; toz.position.y = Math.sin(mt / 4000) * 0.03; }
    // Only the hub transition needs a brief occlusion; the open roof hatch stays visible.
    const dip = Math.abs(yerel.x) < 2.4 && Math.abs(yerel.y) < 2.4
      ? yumusak(-10.4, -9.5, yerel.z) * (1 - yumusak(-5.85, -5.2, yerel.z)) : 0;
    if (cb.karartma) cb.karartma(Math.min(1, dip));

    // mekanik: rotor gerçek devirde, ana mil onunla, hızlı taraf ~×100 (görsel olarak yavaşlatılmış)
    const w = devirRad();
    const hdt = duraklat ? 0 : dt;
    if (parts.spin) parts.spin.rotation.z -= w * hdt;
    if (ic.anaMil) ic.anaMil.rotation.z -= w * hdt;
    if (ic.kaplinPivot) ic.kaplinPivot.rotation.z -= (w > 0 ? 9.0 : 0) * hdt;
    if (ic.fan) ic.fan.rotation.x += 14 * hdt;   // yağ soğutucu fanı sürekli döner
    yawGuncelle(dt);
    kuleDondur();
    if (parts.farm && !az && !duraklat) parts.farm.children.forEach(k => { if (k.userData.spin) k.userData.spin.rotation.z -= k.userData.speed * dt; });
    if (parts.ikaz) parts.ikaz.guncelle(mt / 1000);   // nasel üstündeki kırmızı uçak ikaz lambaları

    // alan derinliği: bakılan noktaya odak
    if (bokeh) bokeh.enabled = !!icerde && kalite < 2;
    if (gtao) gtao.enabled = !!icerde && kalite < 1 && rt.g < 0.01;
    if (bokeh && bokeh.enabled) {
      const odak = gbE > 0.5 ? camera.position.distanceTo(_gbH) : camera.position.distanceTo(yumHedef);   // gün batımı kadrajında odak türbinde
      bokeh.uniforms.focus.value = odak;
      bokeh.uniforms.aperture.value = icerde ? 0.0009 : 0.00003;
      bokeh.uniforms.maxblur.value = icerde ? 0.007 : 0.003;
    }

    olcek();
    const cz = rt.g > 0.01 ? 0 : yumusak(0.972, 0.993, p);
    if (cz < 0.995) { if (composer && !performans && kalite < 2) composer.render(dt); else renderer.render(scene, camera); }
    else renderer.clear();
    if (cz > 0.002) cizimCiz(cz);
    // WebGL çizim arabelleği bir sonraki karede silinir: görüntüyü render'ın hemen ardından al.
    // İlk kare artık saklanmıyor: tuvali geri okumak telefonda ekran kartını bekletiyordu ve yenilemede eski kare görünüyordu.
    ++kareSay; kareSakla = false;
    if (cb.cizim) cb.cizim(cz);
    if (cb.ilerleme) cb.ilerleme(p, Math.max(0, camera.position.y), icerde);
    noktalariGuncelle(t, icerde);
    etiketleriGuncelle();
    fareIsinla(t);
    if (ilk) { ilk = false; canvas.classList.add('hazir'); if (cb.hazir) cb.hazir(); }
    sonIsMs = performance.now() - isBas;
    rafId = requestAnimationFrame(kare);
  }
  /* Şimşek (yalnız gök gürültülü havada, dışarıdayken): 6–16 sn'de bir, uzak ufukta zikzak bir çakma ve kısa bir
   * pozlama parlaması. Çift çakma 0,3 sn içinde biter; saniyede 3 flaş sınırının altında kalır. Hareket azaltılmışsa hiç yok. */
  let simsek = null, simsekT0 = 0, simsekSonraki = 0;
  const simsekMat = new THREE.MeshBasicMaterial({ color: 0xe9f0ff, transparent: true, opacity: 0, fog: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  function simsekKur() {
    if (simsek) { scene.remove(simsek); simsek.children.forEach(c => c.geometry.dispose()); }
    simsek = new THREE.Group();
    const serit = (noktalar, gen) => {
      const poz = [], idx = [];
      noktalar.forEach(([x, y], i) => { const g = gen * (1 - 0.6 * i / noktalar.length); poz.push(x - g, y, 0, x + g, y, 0);
        if (i < noktalar.length - 1) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } });
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); geo.setIndex(idx);
      simsek.add(new THREE.Mesh(geo, simsekMat));
    };
    const ana = []; let x = 0;
    for (let i = 0, n = 16; i <= n; i++) { ana.push([x, 620 - i * 610 / n]); x += (Math.random() - 0.5) * 70; }
    serit(ana, 3.2);
    const k = 4 + Math.floor(Math.random() * 5), dal = [ana[k]]; let dx = ana[k][0];
    for (let i = 1; i <= 6; i++) { dx += (Math.random() < 0.5 ? -1 : 1) * (15 + Math.random() * 30); dal.push([dx, ana[k][1] - i * 38]); }
    serit(dal, 1.6);
    // kameranın baktığı yönün ±50° içinde, sisin ardında ama görünür (sis kapalı malzeme)
    const yon = Math.atan2(-camera.getWorldDirection(_sd).x, -_sd.z) + (Math.random() - 0.5) * 1.75, uz = 780 + Math.random() * 380;
    simsek.position.set(camera.position.x - Math.sin(yon) * uz, 0, camera.position.z - Math.cos(yon) * uz);
    simsek.rotation.y = Math.atan2(camera.position.x - simsek.position.x, camera.position.z - simsek.position.z);
    scene.add(simsek);
  }
  const _sd = new THREE.Vector3();
  function simsekAdim(t, acik) {
    if (!acik) { simsekSonraki = 0; if (simsek && !simsekT0) simsek.visible = false; if (!simsekT0) return; }
    else if (!simsekSonraki) simsekSonraki = t + 2500 + Math.random() * 4500;
    else if (!simsekT0 && t >= simsekSonraki) { simsekT0 = t; simsekSonraki = t + 6000 + Math.random() * 10000; simsekKur(); }
    if (!simsekT0) return;
    const s = t - simsekT0;
    const f = s < 80 ? 1 : s < 190 ? 0.12 : s < 290 ? 0.75 : 0.75 * Math.exp(-(s - 290) / 150);
    if (s > 1400) { simsekT0 = 0; if (simsek) simsek.visible = false; return; }
    simsekMat.opacity = f; if (simsek) simsek.visible = f > 0.03;
    renderer.toneMappingExposure *= 1 + 0.9 * f;
  }
  window.__deneyimSimsek = () => { simsekSonraki = 1; };   // test kancası: bir sonraki karede çak
  // Gölgelendirici derlemesi: görünmeyen iç sahneler (kule, nasel) de dahil hepsi ilk kareden önce derlenir.
  // KHR_parallel_shader_compile olan cihazlarda (Chrome, Android) derleme ana iş parçacığını kilitlemez;
  // olmayanlarda bile donma kule kapısına gelince değil, sahne ilk açılırken ve tek seferde olur.
  // birak() çizim motorunu bu söz bitince kapatır: derleme sürerken dispose edilirse three.js'in
  // compileAsync yoklaması kapatılmış programlara bakıp hata atıyordu ("reading 'isReady'").
  let derlemeSozu = Promise.resolve();
  // Isınma raporu: arayuz.js 'hazir' tanısına ekler. iPhone'da ısınma sessizce atlanıyordu (tanı kayıtları: ilk
  // karede geo+145, kule kapısında geo+236…547); artık ne yüklendiği ve hangi adımın hata verdiği görünür.
  S.isinma = { once: 0, guvenli: 0, sonra: 0, hata: '' };
  function isinmaHatasi(adim, e) {
    if (!S.isinma.hata) S.isinma.hata = (adim + ':' + String(e && e.message || e)).replace(/\s+/g, ' ').slice(0, 90);
  }
  // Güvenli yükleme: bütün sahne, gölgelendiricisi başarısız olamayacak tek bir basit malzemeyle küçük, görünmez
  // bir hedefe bir kez çizilir. Böylece tüm geometri tamponları ekran kartına çıkar; dokular da tek tek yüklenir.
  // Işıklı ısınma bir cihazda hata verse bile kaydırırken parça yüklemesi (takılma) olmaz.
  function guvenliYukle() {
    const hedef = new THREE.WebGLRenderTarget(4, 4), basit = new THREE.MeshBasicMaterial();
    const oncekiHedef = renderer.getRenderTarget(), golge = renderer.shadowMap.autoUpdate;
    try {
      renderer.shadowMap.autoUpdate = false;
      scene.overrideMaterial = basit;
      renderer.setRenderTarget(hedef);
      renderer.render(scene, camera);
    } catch (e) { isinmaHatasi('guvenli', e); }
    finally {
      scene.overrideMaterial = null;
      renderer.setRenderTarget(oncekiHedef);
      renderer.shadowMap.autoUpdate = golge;
      hedef.dispose(); basit.dispose();
    }
    if (renderer.initTexture) {
      const goruldu = new Set();
      scene.traverse(o => {
        const ml = !o.material ? [] : Array.isArray(o.material) ? o.material : [o.material];
        ml.forEach(m => { for (const k in m) { const v = m[k]; if (v && v.isTexture && !goruldu.has(v)) { goruldu.add(v); try { renderer.initTexture(v); } catch (e) { isinmaHatasi('doku', e); } } } });
      });
    }
    S.isinma.guvenli = renderer.info.memory.geometries;
  }
  (function derleSonraBaslat() {
    let basladi = false;
    const git = () => { if (basladi) return; basladi = true; isindi = true; baslat(); };
    try {
      /* Işık düzenleri: three.js'te görünen ışık sayısı gölgelendiricinin parçasıdır. Yolculukta dört düzen var
       * (dışarı · kule ışıkları · kule + nasel · nasel). Hepsi burada, kapak dururken derlenir; yoksa kule
       * kapısında ve nasel girişinde sahne 0,3–2 sn donuyordu (kaydırırken yeniden derleme). */
      const altinda = (o, kok) => { for (let q = o.parent; q; q = q.parent) if (q === kok) return true; return false; };
      const isiklar = []; scene.traverse(o => { if (o.isLight) isiklar.push(o); });
      const kuleI = isiklar.filter(l => altinda(l, kule.ic)), icI = isiklar.filter(l => altinda(l, icIsik));
      const gizli = [], kesilen = [];
      scene.traverse(o => {
        if (!o.visible) { o.visible = true; gizli.push(o); }
        if (o.frustumCulled) { o.frustumCulled = false; kesilen.push(o); }
      });
      const derle = (sc, kam) => renderer.compileAsync ? renderer.compileAsync(sc, kam) : Promise.resolve(renderer.compile(sc, kam));
      const DUZEN = [[false, false], [true, false], [true, true], [false, true]];
      const duzen = ([k, n]) => { kuleI.forEach(l => { l.visible = k; }); icI.forEach(l => { l.visible = n; }); };
      const sozler = [];
      DUZEN.forEach(d => { duzen(d); sozler.push(derle(scene, camera)); });
      duzen([true, true]);
      // yolculuğun sonundaki teknik çizim geçişi de (ayrı zemin sahnesi + tek malzemeyle çizim)
      sozler.push(derle(cizimZemin, cizimKam));
      scene.overrideMaterial = cizimMat; sozler.push(derle(scene, camera)); scene.overrideMaterial = null;
      const geriAl = () => { gizli.forEach(o => { o.visible = false; }); kesilen.forEach(o => { o.frustumCulled = true; }); };
      const bitti = () => {
        if (basladi) return;
        // ısınma kareleri: her ışık düzeni bir kez gerçekten çizilir; geometri, dokular ve ekran kartının
        // çizim durumları şimdi hazırlanır (Safari/Metal bunları ilk çizimde kurar). Tuval henüz görünmez.
        S.isinma.once = renderer.info.memory.geometries;
        gizli.forEach(o => { o.visible = true; }); kesilen.forEach(o => { o.frustumCulled = false; });
        guvenliYukle();
        // gölge haritası da her düzende bir kez çizilir: derinlik gölgelendiricileri kaydırırken değil şimdi derlenir.
        // Her düzen kendi korumasında: biri hata verirse diğerleri yine ısınır (eskiden tek hata hepsini atlatıyordu).
        DUZEN.forEach(d => {
          try { duzen(d); if (renderer.shadowMap.enabled) renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); }
          catch (e) { isinmaHatasi('duzen' + DUZEN.indexOf(d), e); }
        });
        /* Masaüstünde sahne efekt zinciriyle (alan derinliği, parlama) bir ara hedefe çizilir. Ara hedefe çizimde
         * renk dönüşümü ve ton eşleme farklıdır, three.js her malzeme için ayrı gölgelendirici kurar. Ekrana yapılan
         * ısınma bunları kapsamıyordu: kule tepesinde ve nasel girişinde 11–18 gölgelendirici kaydırırken derlenip
         * sahne 0,4–1,7 sn takılıyordu (17 Ekim tanı: p=0,4 prog+18, p=0,47 prog+11). Her ışık düzeni ara hedefe de çizilir. */
        if (!hafif) {
          let araHedef = null; const oncekiHedef = renderer.getRenderTarget();
          try {
            araHedef = new THREE.WebGLRenderTarget(8, 8, { type: THREE.HalfFloatType });
            DUZEN.forEach(d => {
              try { duzen(d); renderer.setRenderTarget(araHedef); renderer.render(scene, camera); }
              catch (e) { isinmaHatasi('ara' + DUZEN.indexOf(d), e); }
            });
          } catch (e) { isinmaHatasi('ara-hedef', e); }
          finally { renderer.setRenderTarget(oncekiHedef); if (araHedef) araHedef.dispose(); }
        }
        try { duzen([true, true]); } catch (e) { isinmaHatasi('duzen-son', e); }
        try { cizimCiz(0.5); } catch (e) { isinmaHatasi('cizim', e); }
        try { renderer.clear(); } catch (e) { /* temizlik olmasa da sahne çalışır */ }
        S.isinma.sonra = renderer.info.memory.geometries;
        geriAl();
        try { icOrtamCek(); } catch (e) { isinmaHatasi('ortam', e); }
        git();
        // masaüstü efektleri (alan derinliği, parlama) nasel içinde ilk açıldığında derlenip takılmasın
        ppHazir.then(() => { if (!composer || !bokeh || birakildi) return; const ge = gtao ? gtao.enabled : false; try { const e = bokeh.enabled; bokeh.enabled = true; if (gtao) gtao.enabled = true; composer.render(0); bokeh.enabled = e; } catch (er) { /* efektsiz de çalışır */ } if (gtao) gtao.enabled = ge; derinlikIsit(); });
      };
      /* Alan derinliği, sahneyi tek bir derinlik malzemesiyle (overrideMaterial) yeniden çizer. three.js bu malzemenin
       * gölgelendiricisini de görünen ışık sayısına ve nesne türüne göre ayrı kurar. Kapakta yalnız dış düzen ve görünen
       * nesneler derleniyordu; kule içinde (p≈0,14), nasel girişinde (p≈0,4) ve nasel içinde (p≈0,47) 8–18 gölgelendirici
       * kaydırırken derlenip sahne 0,3–2,5 sn donuyordu (tanı 11–17 Ekim). Burada gizli parçalar dahil, her ışık
       * düzeni için derinlik çizimi küçük bir ara hedefe yapılır; ekrana hiçbir şey çıkmaz. */
      function derinlikIsit() {
        if (!bokeh || !bokeh.materialDepth || birakildi) return 0;
        const once = renderer.info.programs.length, onceki = renderer.getRenderTarget(), golgeIste = renderer.shadowMap.needsUpdate;
        const gz = [], kz = []; let hedef = null;
        try {
          scene.traverse(o => { if (!o.visible) { o.visible = true; gz.push(o); } if (o.frustumCulled) { o.frustumCulled = false; kz.push(o); } });
          hedef = new THREE.WebGLRenderTarget(8, 8, { type: THREE.HalfFloatType });
          renderer.shadowMap.needsUpdate = false;
          renderer.setRenderTarget(hedef);
          // alan derinliğinin derinlik malzemesi ve ortam örtmesinin normal malzemesi: ikisi de her ışık düzeninde
          [bokeh.materialDepth, gtao && gtao.normalMaterial].filter(Boolean).forEach(om => {
            scene.overrideMaterial = om;
            DUZEN.forEach(d => { try { duzen(d); renderer.render(scene, camera); } catch (e) { isinmaHatasi('derinlik' + DUZEN.indexOf(d), e); } });
          });
        } catch (e) { isinmaHatasi('derinlik', e); }
        finally {
          scene.overrideMaterial = null; renderer.setRenderTarget(onceki); renderer.shadowMap.needsUpdate = golgeIste;
          if (hedef) hedef.dispose();
          try { duzen([true, true]); } catch (e) { /* döngü ışıkları her karede yeniden ayarlar */ }
          gz.forEach(o => { o.visible = false; }); kz.forEach(o => { o.frustumCulled = true; });
        }
        S.isinma.derinlik = renderer.info.programs.length - once;
        return S.isinma.derinlik;
      }
      /* Makine dairesinin kendi ortam haritası: sahne sol yürüyüş yolunda göz hizasından küp kamerayla iki kez çekilir.
       * İlk çekimde yüzeyler yalnız lambalarla, ikincide ilk çekimin sektirdiği ışıkla da aydınlanır (iki sekme).
       * Sonuç her yüzeyin dolaylı ışığı ve yansımasıdır: krem kabuğun sıcak sekmesi mavi gövdeye, floresan tüplerin
       * uzun parlamaları boyaya, tavanın parıltısı baklava saça düşer. Işıklar yolculuktaki nasel içi düzeninde
       * (dış ışık kısık, kule ışıkları kapalı), sis içerideki değerinde: gölgelendirici anahtarları ısınmadakiyle aynı,
       * yeni derleme olmaz. Yükleme ekranı dururken bir kez yapılır. */
      function icOrtamCek() {
        if (hafif || !env || !ic.ortamAyarla || birakildi) return;
        const t0 = performance.now(), merkez = tilt.localToWorld(new THREE.Vector3(-1.25, 0.8, 1.5));
        const kayit = { ig: ic.grup.visible, ii: icIsik.visible, nv: parts.nacelle.visible, poz: scene.position.clone(), hu: huzmeMat.uniforms.uGuc.value,
          gu: gunes ? gunes.intensity : 0, he: hemi ? hemi.intensity : 0, do: dolgu ? dolgu.intensity : 0,
          sis: scene.fog ? [scene.fog.color.getHex(), scene.fog.near, scene.fog.far] : null, golge: renderer.shadowMap.needsUpdate,
          dis: [ege && ege.grup, gok && gok.grup, korfez && korfez.grup].filter(Boolean).map(o => [o, o.visible]) };
        const pm = new THREE.PMREMGenerator(renderer);
        let rt1 = null, rt2 = null;
        try {
          duzen([false, true]);
          ic.grup.visible = icIsik.visible = true; parts.nacelle.visible = false; huzmeMat.uniforms.uGuc.value = 1;
          if (gunes) gunes.intensity = 0; if (hemi) hemi.intensity *= 0.1; if (dolgu) dolgu.intensity *= 0.1;
          if (scene.fog) { scene.fog.color.setHex(0x0b0e11); scene.fog.near = 6; scene.fog.far = 34; }
          kayit.dis.forEach(([o]) => { o.visible = false; });
          scene.position.sub(merkez); scene.updateMatrixWorld(true);
          ic.ortamAyarla(null); envMalzemeSifir();
          renderer.shadowMap.needsUpdate = true; rt1 = pm.fromScene(scene, 0, 0.06, 60);
          ic.ortamAyarla(rt1.texture);
          renderer.shadowMap.needsUpdate = true; rt2 = pm.fromScene(scene, 0, 0.06, 60);
          ic.ortamAyarla(rt2.texture); rt1.dispose(); rt1 = null;
          icAmb.intensity = 0.16;                // dolgu artık çoğunlukla sekmeden geliyor
          S.isinma.ortam = Math.round(performance.now() - t0);
        } catch (e) {
          isinmaHatasi('ortam', e); ic.ortamAyarla(null); if (rt2) rt2.dispose();
        } finally {
          if (rt1) rt1.dispose(); pm.dispose();
          scene.position.copy(kayit.poz); scene.updateMatrixWorld(true);
          ic.grup.visible = kayit.ig; icIsik.visible = kayit.ii; parts.nacelle.visible = kayit.nv; huzmeMat.uniforms.uGuc.value = kayit.hu;
          if (gunes) gunes.intensity = kayit.gu; if (hemi) hemi.intensity = kayit.he; if (dolgu) dolgu.intensity = kayit.do;
          if (kayit.sis) { scene.fog.color.setHex(kayit.sis[0]); scene.fog.near = kayit.sis[1]; scene.fog.far = kayit.sis[2]; }
          kayit.dis.forEach(([o, v]) => { o.visible = v; });
          renderer.shadowMap.needsUpdate = true;
          try { duzen([true, true]); } catch (e) { /* döngü ışıkları her karede yeniden ayarlar */ }
        }
      }
      // ilk çekimde yüzeylerde stüdyo yansıması olmasın: yalnız lambaların doğrudan ışığı
      function envMalzemeSifir() { ic.grup.traverse(o => { if (o.material && o.material.envMap) o.material.envMapIntensity = 0; }); }
      S.icOrtamCek = icOrtamCek;
      S.derinlikIsit = derinlikIsit;   // tanı ve test: ikinci çağrı 0 yeni gölgelendirici vermeli
      geriAl();
      derlemeSozu = Promise.race([Promise.all(sozler).catch(() => {}), new Promise(r => setTimeout(r, 10000))]);
      Promise.all(sozler).then(bitti, bitti);
      setTimeout(() => {   // hiçbir durumda sahne bekletilmesin; derleme hiç bitmezse en azından parçalar yüklü başlasın
        if (basladi) return;
        isinmaHatasi('zaman-asimi', 'derleme bitmedi');
        gizli.forEach(o => { o.visible = true; }); kesilen.forEach(o => { o.frustumCulled = false; });
        guvenliYukle(); geriAl(); git();
      }, hafif ? 16000 : 8000);
    } catch (e) {
      // derleme hazırlığı daha baştan hata verdiyse ısınmasız başlamak yerine güvenli yüklemeyi yine de yap
      isinmaHatasi('hazirlik', e);
      try { scene.traverse(o => { if (!o.visible) { o.visible = true; o.userData.__gizliIdi = true; } }); guvenliYukle(); }
      finally { scene.traverse(o => { if (o.userData.__gizliIdi) { o.visible = false; delete o.userData.__gizliIdi; } }); }
      git();
    }
  })();
  function birak(neden) {
    if (birakildi) return; birakildi = true;
    calisiyor = false; if (rafId) cancelAnimationFrame(rafId); rafId = 0;
    canvas.classList.remove('hazir');
    try { sessionStorage.removeItem('dny-kalite'); } catch (e) {}
    if (cb.hata) cb.hata(typeof neden === 'string' ? neden : 'bilinmiyor', { kalite, kare_ms: Math.round(ortKare * 10) / 10 });
    derlemeSozu.then(() => { try { renderer.dispose(); } catch (e) {} });
  }
  S.birak = birak;
  S.durum = () => ({ kalite, kare_ms: Math.round(ortKare * 10) / 10, birakildi, duraklat });
  Object.defineProperty(S, 'bokeh', { get: () => bokeh });   // tanı ve test: alan derinliği geçişi
  Object.defineProperty(S, 'composer', { get: () => composer });
  Object.defineProperty(S, 'gtao', { get: () => gtao });
  // Kullanıcı denetimi: duraklat / devam ve açılış sekansını baştan oynatma
  S.duraklat = v => { duraklat = !!v; durgunT = performance.now(); baslat(); return duraklat; };
  S.noktaVurgula = id => { vurguNokta = id || null; if (rt.acik) { rt.secili = vurguNokta; rontgenVurgu(); } baslat(); };
  // röntgen: { acik, kabuk 0–1, patlat 0–1, aciEkle (radyan, sürükleme), secili (nokta kimliği) }
  S.rontgen = o => {
    o = o || {};
    if (o.acik !== undefined) { rt.acik = !!o.acik; if (rt.acik) rontgenHazirla(); else { rt.patlat = 0; rt.aci = 0; } }
    if (o.kabuk != null) rt.kabuk = Math.max(0, Math.min(1, +o.kabuk));
    if (o.patlat != null) rt.patlat = Math.max(0, Math.min(1, +o.patlat));
    if (o.aciEkle) rt.aci += o.aciEkle;
    if ('secili' in o) rt.secili = o.secili || null;
    rontgenVurgu(); durgunT = performance.now(); baslat();
    return { acik: rt.acik, kabuk: rt.kabuk, patlat: rt.patlat };
  };
  S.bastanOynat = () => { mt = 0; duraklat = false; durgunT = performance.now(); baslat(); };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); birak('baglam-kaybi'); }, false);

  // sayfa tarafı fare konumunu bildirir: nx, ny ∈ [-1, 1]; null → fare sahnede değil
  S.fare = (nx, ny) => {
    if (nx === null || nx === undefined) { fare.var = false; return; }
    fare.var = true; fare.x = nx; fare.y = ny; fare.deg = true;
  };
  // serbest bakış: sayfa tarafı sürüklemeyi piksel farkıyla bildirir
  S.bak = {
    alan: () => bak.alan,
    basla: () => { bak.surukle = true; durgunT = performance.now(); baslat(); },
    kaydir: (dx, dy) => {
      bak.hYaw += dx * 0.0052;
      bak.hPitch = THREE.MathUtils.clamp(bak.hPitch - dy * 0.0042, -1.25, 1.25);
      durgunT = performance.now(); baslat();
    },
    bitir: () => {
      bak.surukle = false;
      const tur = Math.round(bak.hYaw / (Math.PI * 2)); bak.hYaw -= tur * Math.PI * 2; bak.yaw -= tur * Math.PI * 2;   // geri dönüşte tur atmasın
    },
  };
  // test ve hata ayıklama için
  window.__deneyim = { S, gok, ic, kule, KARE, egriU, kEgri, hEgri, yaw, tilt, get p() { return p; } };
  return S;
}
