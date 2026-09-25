/* hero3d.js — kapaktaki dönen kanadın yerini alan 3B sahne.
 *
 * Fikir: SVG kanat sprite'ı yerine gerçek bir N117 modeli (n117.js'teki
 * aynı parametrik model) kapakta dönsün. Dönüş hızı hâlâ canli.js'in
 * belirlediği --devir-sure değişkeninden geliyor — yani önceki SVG rotor
 * neyi gösteriyorduysa bu da aynısını gösteriyor, sadece gerçek geometriyle.
 * Işık, günün vaktine (data-vardiya) göre değişiyor.
 *
 * Bu betik yalnızca sayfa yüklendikten SONRA, boşta bir anda devreye
 * giriyor (bkz. index.html'deki başlatma bloğu) — kapak fotoğrafı ilk
 * boyamayı (LCP) hep o karşılıyor, 3B sahne üstüne kademeli beliriyor.
 * WebGL yoksa, prefers-reduced-motion açıksa veya sahne kurulamazsa
 * fotoğraf olduğu gibi kalıyor; sayfa hiçbir şey kaybetmiyor.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';
import { createScene } from '/n117/n117.js?v=2675a459';

export function kapak3BBaslat(canvas) {
  let S;
  try {
    S = createScene(canvas);
  } catch (err) {
    console.error('kapak3b sahne:', err);
    return null;
  }

  const { renderer, scene, camera, controls, parts, towerTopY, setLight } = S;
  const kok = document.documentElement;

  // Sadece bitmiş makineyi göster: montaj vinci, sahadaki yedek kanat yok.
  if (parts.crane) parts.crane.visible = false;
  if (parts.groundBlade) parts.groundBlade.visible = false;

  // Kapak pasif bir sahne — ziyaretçi sürüklemesin, sayfa kaydırması
  // canvas'a takılmasın.
  controls.enabled = false;

  // Hero için biraz daha sıkı bir piksel oranı: ana sayfa herkesin ilk
  // gördüğü yer, kalite/performans dengesini buraya göre ayarlıyoruz.
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 820 ? 1.4 : 1.8));

  const hubY = towerTopY + 4;
  const hedefBak = new THREE.Vector3(2, hubY - 3, -2);
  const temelKonum = new THREE.Vector3(46, hubY - 10, 70);
  camera.fov = 44;
  camera.near = 0.5;
  camera.updateProjectionMatrix();
  camera.position.copy(temelKonum);

  /* ---- gerçek veriyle dönüş ve ışık ---- */
  function devirRad() {
    const ham = getComputedStyle(kok).getPropertyValue('--devir-sure').trim();
    const s = parseFloat(ham);
    return s > 0 ? (2 * Math.PI) / s : 0; // rad/s
  }
  function isikModu() {
    const v = kok.getAttribute('data-vardiya');
    if (v === 'gece') return 'night';
    if (v === 'safak' || v === 'aksam' || v === 'altin') return 'sunset';
    return 'day';
  }
  let sonMod = null;
  function isikGuncelle() {
    const m = isikModu();
    if (m !== sonMod) { setLight(m); sonMod = m; }
  }
  isikGuncelle();

  /* ---- hafif fare paralaksı (masaüstü) + kendi kendine yavaş süzülme ---- */
  let hdX = 0, hdY = 0, imX = 0, imY = 0;
  const az = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function elHareket(e) {
    hdX = (e.clientX / innerWidth) - 0.5;
    hdY = (e.clientY / innerHeight) - 0.5;
  }
  if (!az) window.addEventListener('pointermove', elHareket, { passive: true });

  /* ---- boyut ---- */
  function olcek() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h) {
      const pr = renderer.getPixelRatio();
      if (Math.round(w * pr) !== canvas.width || Math.round(h * pr) !== canvas.height) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
    }
  }

  /* ---- döngü ---- */
  let calisiyor = true;
  let sonKontrol = 0;
  let ilkKare = true;
  let sonT = 0;
  let rafId = 0;

  document.addEventListener('visibilitychange', () => {
    calisiyor = document.visibilityState !== 'hidden';
    if (calisiyor) { sonT = 0; rafId = requestAnimationFrame(kare); }
  });

  function kare(t) {
    if (!calisiyor) return;
    const dt = sonT ? Math.min(0.05, (t - sonT) / 1000) : 0;
    sonT = t;

    if (t - sonKontrol > 4000) { isikGuncelle(); sonKontrol = t; }

    if (parts.spin) parts.spin.rotation.z -= devirRad() * dt;
    if (parts.ikaz) parts.ikaz.guncelle(t / 1000);

    if (!az) {
      imX += (hdX - imX) * 0.02;
      imY += (hdY - imY) * 0.02;
    }
    const surukleme = t / 1000 * 0.045;
    camera.position.set(
      temelKonum.x + Math.sin(surukleme) * 5 - imX * 9,
      temelKonum.y + Math.sin(surukleme * 0.6) * 1.6 - imY * 4,
      temelKonum.z + Math.cos(surukleme) * 5
    );
    camera.lookAt(hedefBak);

    olcek();
    renderer.render(scene, camera);

    if (ilkKare) { ilkKare = false; canvas.classList.add('hazir'); }
    rafId = requestAnimationFrame(kare);
  }
  rafId = requestAnimationFrame(kare);

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    calisiyor = false;
    if (rafId) cancelAnimationFrame(rafId);
    canvas.classList.remove('hazir');
  }, false);

  return S;
}
