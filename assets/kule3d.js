/* kule3d.js — ana sayfa kapağı: kaydırdıkça N117 kulesine tırmanan 3B kamera.
 *
 * Aynı parametrik N117 modeli (n117.js) kullanılıyor. Sayfa kaydırıldıkça kamera
 * zeminden kule gövdesine, oradan nasele çıkıyor, en sonda rotorun önüne açılıyor.
 * Sağdaki kot göstergesi kameranın o anki gerçek yüksekliğini (metre) gösterir.
 * Rotor, Aliağa için göbek yüksekliğindeki tahmini rüzgârdan hesaplanan devirde
 * döner (--devir-sure; ana sayfadaki canlı veri betiği yazar).
 *
 * Çağıran taraf WebGL, reduced-motion ve saveData kontrolünü yapar. Sahne
 * kurulamazsa hiçbir şey kaybolmaz: kapak fotoğrafı ve metinler yerinde kalır.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';
import { createScene } from '/n117/n117.js?v=2a90e4df';

export function kuleBaslat(canvas, bolum, geri) {
  let S;
  try { S = createScene(canvas); } catch (err) { console.error('kule3d sahne:', err); return null; }
  const { renderer, camera, controls, parts, towerTopY, setLight } = S;
  const kok = document.documentElement;
  geri = geri || function () {};

  if (parts.crane) parts.crane.visible = false;
  if (parts.groundBlade) parts.groundBlade.visible = false;
  controls.enabled = false;

  const kucuk = innerWidth < 820;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, kucuk ? 1.4 : 1.75));
  camera.fov = kucuk ? 52 : 42;
  camera.near = 0.4;
  camera.updateProjectionMatrix();

  const hubY = towerTopY + 2.3;

  // Havacılık engel ışığı: naselin üstünde, kırmızı, yanıp söner (gerçek türbinlerde olduğu gibi).
  const isikGrubu = new THREE.Group();
  isikGrubu.position.set(0, S.SPEC.nacelleHei / 2 + 0.45, S.SPEC.nacelleLen / 2 - 1.2);
  const lamba = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff2a1a }));
  const hale = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,60,40,1)'); r.addColorStop(0.25, 'rgba(255,40,30,.55)'); r.addColorStop(1, 'rgba(255,30,20,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sp.scale.set(7, 7, 1); return sp;
  })();
  isikGrubu.add(lamba, hale);
  if (parts.yaw) parts.yaw.add(isikGrubu);
  const v = (x, y, z) => new THREE.Vector3(x, y, z);

  // Kamera yolu: [konum, bakış noktası]. Rotor -z yönüne bakıyor.
  const YOL = [
    [v(70, 6, 100),    v(0, 84, -8)],           // zemin: aşağıdan tüm türbin
    [v(38, 30, 56),    v(0, 62, 0)],            // kule gövdesi
    [v(42, 88, 60),    v(0, 110, -2)],          // tırmanış
    [v(22, 127, 30),   v(0, hubY - 0.4, -2)],   // nasel
    [v(70, 146, -96),  v(0, hubY, -6)],         // rotorun önüne dönüş
    [v(150, 106, -212), v(0, 82, -4)],          // geniş kadraj
  ];
  const konumEgri = new THREE.CatmullRomCurve3(YOL.map(k => k[0]), false, 'centripetal');
  const hedefEgri = new THREE.CatmullRomCurve3(YOL.map(k => k[1]), false, 'centripetal');

  const az = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isikModu() {
    const m = kok.getAttribute('data-vardiya');
    // Gece ışığında model neredeyse görünmüyor; kapak için gece ve alacakaranlık
    // aynı gün batımı ışığını kullanıyor. Gece olduğunu engel ışığı söylüyor.
    if (m === 'gece' || m === 'safak' || m === 'aksam' || m === 'altin') return 'sunset';
    return 'day';
  }
  let sonMod = null;
  function isik() { const m = isikModu(); if (m !== sonMod) { setLight(m); sonMod = m; } }
  isik();

  function devirRad() {
    const s = parseFloat(getComputedStyle(kok).getPropertyValue('--devir-sure'));
    return s > 0 ? (2 * Math.PI) / s : 0;
  }

  function ilerleme() {
    const r = bolum.getBoundingClientRect();
    const yol = r.height - innerHeight;
    if (yol <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / yol));
  }

  function olcek() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const pr = renderer.getPixelRatio();
    if (Math.round(w * pr) !== canvas.width || Math.round(h * pr) !== canvas.height) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  let p = ilerleme(), pHedef = p;
  const konum = new THREE.Vector3(), hedef = new THREE.Vector3();
  let gorunur = true, calisiyor = true, sonT = 0, ilk = true, sonIsik = 0, rafId = 0;

  new IntersectionObserver(es => { gorunur = es[0].isIntersecting; if (gorunur) baslat(); }, { rootMargin: '100px' }).observe(bolum);
  document.addEventListener('visibilitychange', () => { calisiyor = !document.hidden; if (calisiyor) baslat(); });

  function baslat() { if (!rafId) { sonT = 0; rafId = requestAnimationFrame(kare); } }

  function kare(t) {
    rafId = 0;
    if (!calisiyor || !gorunur) return;
    const dt = sonT ? Math.min(0.05, (t - sonT) / 1000) : 0;
    sonT = t;
    if (t - sonIsik > 4000) { isik(); sonIsik = t; }

    pHedef = ilerleme();
    p += (pHedef - p) * (az ? 1 : Math.min(1, dt * 5 || 1));
    const e = p * p * (3 - 2 * p) * 0.35 + p * 0.65;       // uçlarda yumuşak
    konumEgri.getPoint(e, konum);
    hedefEgri.getPoint(e, hedef);
    // hafif nefes: sahne donuk durmasın
    if (!az) konum.x += Math.sin(t / 5200) * 1.2;
    camera.position.copy(konum);
    camera.lookAt(hedef);

    if (parts.spin) parts.spin.rotation.z -= devirRad() * dt;
    isikGrubu.visible = (t % 2000) < 1000;
    if (parts.farm) parts.farm.children.forEach(f => { const r = f.getObjectByName && f.getObjectByName('rotor'); if (r) r.rotation.z -= (f.userData.speed || 0.2) * dt; });

    olcek();
    renderer.render(S.scene, camera);
    geri(p, Math.max(0, camera.position.y));
    if (ilk) { ilk = false; canvas.classList.add('hazir'); }
    rafId = requestAnimationFrame(kare);
  }
  baslat();

  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault(); calisiyor = false;
    if (rafId) cancelAnimationFrame(rafId);
    canvas.classList.remove('hazir');
  }, false);

  return S;
}
