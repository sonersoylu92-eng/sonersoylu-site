/* kule-ic.js — "Türbine gir" yolculuğunun kule bölümü: kule kapısı, dış merdiven, kule içi
 * (iç yüzey, flanş bağlantıları, platformlar, merdiven, kablo tavası, servis lambaları) ve
 * GENEL bir servis asansörü (tel kılavuzlu, kabin üstü tahrik; üretici modeli değildir).
 *
 * Koordinatlar KULE YERELİNDE: eksen x = z = 0, y = zeminden yükseklik (m), kapı +z yönünde.
 * Grup kulenin ekseninde durur; deneyim.js onu naselin yaw açısıyla birlikte döndürür (kule
 * simetrik olduğu için dışarıdan fark edilmez, kamera yolu ve kapı hep aynı hizada kalır).
 *
 * Ölçek kuralları (gerçek sahadaki mertebeler): kapı 0,9 × 2,05 m; flanş cıvatası ~M42, ~105 mm
 * aralık; merdiven basamak aralığı 280 mm, genişlik 420 mm; korkuluk 1,1 m; kabin ~0,8 × 0,8 m.
 * Dokular çalışma anında tuvalde üretilir; dışarıdan görsel yüklenmez.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';

export const KAPI = { gen: 0.9, alt: 0.30, ust: 2.35 };   // kapı açıklığı: genişlik, alt segment tabanına göre alt/üst (m)
const TABAN0 = 3.55;                                       // kule alt flanşı (kaide üstü)

/* ------------------------------------------------------------------ doku yardımcıları */
function tuval(w, h, ciz) { const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h); return c; }
function doku(c, renkli = true) {
  const t = new THREE.CanvasTexture(c); if (renkli) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function tohum(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function lekeler(x, w, h, n, renk, r0, r1, a0, a1, rnd) {
  for (let i = 0; i < n; i++) {
    const cx = rnd() * w, cy = rnd() * h, r = r0 + rnd() * (r1 - r0);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    const a = a0 + rnd() * (a1 - a0); g.addColorStop(0, renk.replace('A', a)); g.addColorStop(1, renk.replace('A', 0));
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
}
function tane(x, w, h, n, renk, a0, a1, rnd) {
  for (let i = 0; i < n; i++) { x.globalAlpha = a0 + rnd() * (a1 - a0); x.fillStyle = renk; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 1 + rnd() * 1.5); }
  x.globalAlpha = 1;
}
// yükseklik tuvalinden normal haritası (Sobel)
function normalHaritasi(yc, guc = 2) {
  const w = yc.width, h = yc.height, src = yc.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const ox = out.getContext('2d'), img = ox.createImageData(w, h), d = img.data;
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * guc, dy = (H(x, y + 1) - H(x, y - 1)) * guc;
    const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255;
  }
  ox.putImageData(img, 0, 0); return out;
}
function etiket(w, h, ciz) { return doku(tuval(w, h, ciz)); }

export function kuleIciKur({ SPEC, towerTopY, hafif = false, kapakXZ = new THREE.Vector2(-0.8, -0.8) }) {
  const g = new THREE.Group(); g.name = 'kuleIci';
  const H = towerTopY - TABAN0;
  const rDis = h => THREE.MathUtils.lerp(SPEC.towerBase, SPEC.towerTop, THREE.MathUtils.clamp((h - TABAN0) / H, 0, 1)) / 2;
  const rIc = h => rDis(h) - 0.035;
  const rnd = tohum(20130417);
  const TS = hafif ? 256 : 512;   // doku çözünürlüğü

  /* ================= dokular ================= */
  // kule iç yüzeyi: boyalı çelik; hafif renk dalgalanması, akıntı izi, çizik; üstte çevresel kaynak,
  // bir yerde boyuna kaynak dikişi. Bir karo ≈ 2,9 m yükseklik × yarım çevre.
  const duvarY = tuval(TS / 2, TS, (x, w, h) => {
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    const kaynak = (y) => { const g = x.createLinearGradient(0, y - 5, 0, y + 5); g.addColorStop(0, '#808080'); g.addColorStop(0.5, '#e8e8e8'); g.addColorStop(1, '#808080'); x.fillStyle = g; x.fillRect(0, y - 5, w, 10); };
    kaynak(4);
    const g2 = x.createLinearGradient(w * 0.37 - 4, 0, w * 0.37 + 4, 0); g2.addColorStop(0, '#808080'); g2.addColorStop(0.5, '#d8d8d8'); g2.addColorStop(1, '#808080'); x.fillStyle = g2; x.fillRect(w * 0.37 - 4, 0, 8, h);
    tane(x, w, h, 900, '#9a9a9a', 0.2, 0.6, rnd);
  });
  const duvarC = tuval(TS / 2, TS, (x, w, h) => {
    x.fillStyle = '#d3d2cb'; x.fillRect(0, 0, w, h);
    lekeler(x, w, h, 26, 'rgba(150,146,132,A)', 20, 90, 0.05, 0.14, rnd);
    lekeler(x, w, h, 18, 'rgba(236,236,230,A)', 25, 80, 0.06, 0.16, rnd);
    for (let i = 0; i < 16; i++) {   // yukarıdan inen akıntı izleri (yoğuşma, yağ)
      const sx = rnd() * w, sy = rnd() * h * 0.6, L = 40 + rnd() * h * 0.5, g = x.createLinearGradient(0, sy, 0, sy + L);
      g.addColorStop(0, 'rgba(110,98,80,.16)'); g.addColorStop(1, 'rgba(110,98,80,0)'); x.fillStyle = g; x.fillRect(sx, sy, 1 + rnd() * 2.5, L);
    }
    x.strokeStyle = 'rgba(95,92,86,.28)'; x.lineWidth = 0.7;
    for (let i = 0; i < 40; i++) { const sx = rnd() * w, sy = rnd() * h, a = rnd() * Math.PI; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * (4 + rnd() * 18), sy + Math.sin(a) * (4 + rnd() * 18)); x.stroke(); }
    tane(x, w, h, 2200, '#7d7a72', 0.05, 0.2, rnd);
    x.fillStyle = 'rgba(160,156,146,.55)'; x.fillRect(0, 0, w, 7); x.fillRect(w * 0.37 - 3, 0, 6, h);   // kaynak boyası biraz koyu
  });
  const duvarMap = doku(duvarC), duvarNor = doku(normalHaritasi(duvarY, 3), false);

  // ızgara platform: taşıyıcı çubuklar (≈30 mm) ve çapraz bağlar (≈100 mm); boşluklar saydam
  const izgaraC = tuval(256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#8a8f92'; for (let i = 0; i < w; i += 12.8) x.fillRect(i, 0, 3.2, h);
    x.fillStyle = '#7b8083'; for (let j = 0; j < h; j += 42.7) x.fillRect(0, j, w, 2.6);
    x.globalCompositeOperation = 'source-atop'; lekeler(x, w, h, 14, 'rgba(60,56,48,A)', 20, 70, 0.15, 0.35, rnd); tane(x, w, h, 1500, '#3d3b37', 0.1, 0.4, rnd);
  });
  const izgaraMap = doku(izgaraC);
  // çelik baklava sac (kabin tabanı), ortası aşınmış
  const baklavaY = tuval(128, 128, (x, w, h) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, w, h);
    for (let yy = 0; yy < h; yy += 16) for (let xx = 0; xx < w; xx += 16) {
      const o = ((yy / 16) % 2) * 8, cx = xx + o + 4, cy = yy + 8, a = ((yy / 16 + xx / 16) % 2) ? 0.6 : -0.6;
      x.save(); x.translate(cx, cy); x.rotate(a); const gr = x.createLinearGradient(-6, 0, 6, 0); gr.addColorStop(0, '#000'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(1, '#000'); x.fillStyle = gr; x.fillRect(-6, -1.4, 12, 2.8); x.restore();
    }
  });
  const baklavaC = tuval(256, 256, (x, w, h) => {
    x.fillStyle = '#a3a8ab'; x.fillRect(0, 0, w, h);
    lekeler(x, w, h, 1, 'rgba(200,204,206,A)', 90, 130, 0.35, 0.45, () => 0.5);   // ayak izi aşınması (alüminyum baklava sac)
    lekeler(x, w, h, 10, 'rgba(40,38,34,A)', 10, 40, 0.15, 0.35, rnd); tane(x, w, h, 1500, '#2c2b29', 0.1, 0.35, rnd);
  });
  const baklavaMap = doku(baklavaC), baklavaNor = doku(normalHaritasi(baklavaY, 4), false); baklavaNor.repeat.set(5, 5);
  // tel örgü (kabin üst yarısı ve kapı)
  const agC = tuval(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#4b5053'; x.lineWidth = 1.5; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke(); });
  const agMap = doku(agC); agMap.repeat.set(8, 9);
  // ışık havuzu (lamba çevresinde duvara düşen ışık)
  const havuzMap = doku(tuval(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 58, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,226,186,.55)'); g.addColorStop(0.35, 'rgba(255,214,170,.18)'); g.addColorStop(1, 'rgba(255,205,160,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }));
  // topraklama iletkeni: yeşil-sarı şerit
  const tprkMap = doku(tuval(8, 64, (x, w, h) => { x.fillStyle = '#2e8b3a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e1c11d'; for (let i = 0; i < h; i += 16) x.fillRect(0, i, w, 8); }));
  tprkMap.repeat.set(1, 180);

  /* ================= malzemeler ================= */
  const M = {
    duvar:   new THREE.MeshStandardMaterial({ map: duvarMap, normalMap: duvarNor, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.78, metalness: 0.18, side: THREE.BackSide }),
    flans:   new THREE.MeshStandardMaterial({ color: 0xbdbcb4, roughness: 0.62, metalness: 0.35, side: THREE.DoubleSide }),
    celik:   new THREE.MeshStandardMaterial({ color: 0x80878c, roughness: 0.55, metalness: 0.55 }),
    galvaniz:new THREE.MeshStandardMaterial({ color: 0x9da3a6, roughness: 0.5, metalness: 0.65 }),
    kenar:   new THREE.MeshStandardMaterial({ color: 0x9da3a6, roughness: 0.5, metalness: 0.65, side: THREE.DoubleSide }),
    boyali:  new THREE.MeshStandardMaterial({ color: 0xb8bcbd, roughness: 0.6, metalness: 0.3 }),
    koyu:    new THREE.MeshStandardMaterial({ color: 0x2f3438, roughness: 0.55, metalness: 0.45 }),
    sari:    new THREE.MeshStandardMaterial({ color: 0xc9961c, roughness: 0.58, metalness: 0.2 }),
    kablo:   new THREE.MeshStandardMaterial({ color: 0x151719, roughness: 0.72, metalness: 0.05 }),
    kabloGri:new THREE.MeshStandardMaterial({ color: 0x5b5f62, roughness: 0.7, metalness: 0.05 }),
    tprk:    new THREE.MeshStandardMaterial({ map: tprkMap, roughness: 0.6 }),
    lastik:  new THREE.MeshStandardMaterial({ color: 0x1b1c1d, roughness: 0.92, metalness: 0 }),
    mavi:    new THREE.MeshStandardMaterial({ color: 0x1f5c9e, roughness: 0.48, metalness: 0.3 }),
    maviSac: new THREE.MeshStandardMaterial({ color: 0x21609f, roughness: 0.52, metalness: 0.28, side: THREE.DoubleSide }),
    alu:     new THREE.MeshStandardMaterial({ color: 0xb7bcc0, roughness: 0.36, metalness: 0.85 }),
    izgara:  new THREE.MeshStandardMaterial({ map: izgaraMap, alphaTest: 0.5, roughness: 0.55, metalness: 0.6, side: THREE.DoubleSide }),
    baklava: new THREE.MeshStandardMaterial({ map: baklavaMap, normalMap: baklavaNor, roughness: 0.5, metalness: 0.7 }),
    ag:      new THREE.MeshStandardMaterial({ map: agMap, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.4 }),
    lens:    new THREE.MeshBasicMaterial({ color: 0xfff2dd, fog: false }),
    kirmizi: new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.45, emissive: 0x2a0503 }),
    yangin:  new THREE.MeshStandardMaterial({ color: 0xa81d16, roughness: 0.4, metalness: 0.2 }),
    havuz:   new THREE.MeshBasicMaterial({ map: havuzMap, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }),
  };
  const kutu = (w, h, d, m, x, y, z, par = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); par.add(o); return o; };
  const cubuk = (a, b, r, m, par = g, seg = 8) => {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), m);
    o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    par.add(o); return o;
  };
  const levhaMesh = (tex, w, h, par) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })); par.add(m); return m; };
  // duvara yaslı nesneyi yerleştir: açı (rad), yükseklik, duvardan içeri mesafe; yüzü merkeze bakar
  const duvaraKoy = (o, aci, y, ic = 0) => { const r = rIc(y) - ic; o.position.set(Math.sin(aci) * r, y, Math.cos(aci) * r); o.rotation.y = aci + Math.PI; return o; };
  const mt = new THREE.Matrix4(), q = new THREE.Quaternion(), s1 = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3(), eY = new THREE.Vector3(0, 1, 0);

  /* ================= yerleşim ================= */
  // servis asansörü kabini: Nordex kulelerindeki ZARGES tipi (≈ 0,73 × 0,93 × 2,30 m, 240 kg); mavi boyalı çerçeve, katlanır kapı
  const ASN = { x: 0, z: -0.8, gen: 0.73, der: 0.93, yuk: 2.3 };
  const tabanY = TABAN0 + KAPI.alt;
  const ustY = towerTopY - 3.0;
  const flansY = []; for (let k = 1; k < 5; k++) flansY.push(TABAN0 + H * k / 5);
  const platY = [tabanY, ...flansY.map(y => y - 1.05), ustY];
  const merdivenYon = kapakXZ.clone().normalize();
  const mAlt = new THREE.Vector3(merdivenYon.x * (rIc(tabanY) - 0.36), tabanY, merdivenYon.y * (rIc(tabanY) - 0.36));
  const mUst = new THREE.Vector3(kapakXZ.x, towerTopY + 0.4, kapakXZ.y);
  const merdivenXZ = y => { const f = (y - mAlt.y) / (mUst.y - mAlt.y); return new THREE.Vector2(THREE.MathUtils.lerp(mAlt.x, mUst.x, f), THREE.MathUtils.lerp(mAlt.z, mUst.z, f)); };
  const TAVA = -2.25;      // kablo tavası açısı
  const LAMBA = 0.55;      // servis lambaları açısı (kabin kapısından görünen duvar)
  const Hm = TABAN0 + H * 0.5;   // asansör besleme kablosunun bağlantı kutusu (kule ortası)

  /* ================= DIŞ: kapı, sahanlık, merdiven, levhalar ================= */
  const dis = new THREE.Group(); g.add(dis);
  const kR = rDis(tabanY + 1);
  const kapiY0 = TABAN0 + KAPI.alt, kapiY1 = TABAN0 + KAPI.ust, kapiOrta = (kapiY0 + kapiY1) / 2, kg = KAPI.gen, kh_ = kapiY1 - kapiY0;
  kutu(0.12, kh_ + 0.24, 0.16, M.boyali, -kg / 2 - 0.06, kapiOrta, kR + 0.02, dis);
  kutu(0.12, kh_ + 0.24, 0.16, M.boyali, kg / 2 + 0.06, kapiOrta, kR + 0.02, dis);
  kutu(kg + 0.24, 0.12, 0.16, M.boyali, 0, kapiY1 + 0.06, kR + 0.02, dis);
  kutu(kg + 0.24, 0.08, 0.2, M.celik, 0, kapiY0 - 0.04, kR + 0.03, dis);
  const kanatC = tuval(TS / 2, TS, (x, w, h) => {
    x.fillStyle = '#b7bbb9'; x.fillRect(0, 0, w, h);
    lekeler(x, w, h, 14, 'rgba(120,118,108,A)', 20, 60, 0.05, 0.14, rnd);
    const gr = x.createLinearGradient(0, h * 0.6, 0, h); gr.addColorStop(0, 'rgba(118,96,70,0)'); gr.addColorStop(1, 'rgba(118,96,70,.28)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(110,80,50,.10)'; x.fillRect(12 + rnd() * (w - 24), h * 0.3 + rnd() * h * 0.2, 1.3, h * (0.15 + rnd() * 0.3)); }
    // kol çevresinde el izi, alt kenarda tekme izi
    lekeler(x, w, h, 1, 'rgba(70,66,60,A)', 22, 30, 0.18, 0.22, (() => { let k = 0; return () => [0.18, 0.52, 0.5][k++ % 3]; })());
    x.fillStyle = 'rgba(60,58,54,.2)'; x.fillRect(w * 0.2, h * 0.92, w * 0.6, h * 0.05);
    x.strokeStyle = 'rgba(40,44,46,.5)'; x.lineWidth = 2; x.strokeRect(5, 5, w - 10, h - 10);
    x.fillStyle = '#4c5154'; for (let i = 0; i < 8; i++) x.fillRect(w * 0.28, h * 0.12 + i * h * 0.018, w * 0.44, h * 0.007);   // havalandırma panjuru
    x.fillStyle = '#2b2f32'; x.font = `bold ${Math.round(w * 0.05)}px sans-serif`; x.textAlign = 'center'; x.fillText('SERVİS GİRİŞİ', w / 2, h * 0.34);
    x.font = `${Math.round(w * 0.036)}px sans-serif`; x.fillText('Yalnızca yetkili personel', w / 2, h * 0.37);
  });
  const kanatPivot = new THREE.Group(); kanatPivot.position.set(kg / 2, kapiOrta, kR + 0.08); dis.add(kanatPivot);
  const kanatMat = new THREE.MeshStandardMaterial({ map: doku(kanatC), roughness: 0.62, metalness: 0.3 });
  const kanat = new THREE.Mesh(new THREE.BoxGeometry(kg, kh_, 0.05), [M.boyali, M.boyali, M.boyali, M.boyali, kanatMat, M.boyali]);
  kanat.position.set(-kg / 2, 0, 0); kanatPivot.add(kanat);
  const kapiKol = new THREE.Group(); kapiKol.position.set(-kg + 0.1, -0.02, 0.05); kanatPivot.add(kapiKol);
  kutu(0.03, 0.06, 0.04, M.galvaniz, 0, 0, 0, kapiKol); kutu(0.14, 0.025, 0.025, M.galvaniz, 0.06, 0, 0.03, kapiKol);   // kol tabanı + kol
  kutu(0.06, 0.2, 0.012, M.galvaniz, 0, -0.14, 0.0, kanatPivot).position.x = -kg + 0.1;                                 // kilit aynası
  for (const y of [-0.8, 0.0, 0.8]) kutu(0.04, 0.14, 0.06, M.koyu, 0.02, y, -0.01, kanatPivot);                         // menteşeler
  const disLevha = (tex, w, h, x, y) => { const m = levhaMesh(tex, w, h, dis); const a = x / kR; m.position.set(Math.sin(a) * (kR + 0.012), y, Math.cos(a) * (kR + 0.012)); m.rotation.y = a; return m; };
  disLevha(etiket(144, 200, (x, w, h) => {
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f4c20d'; x.beginPath(); x.moveTo(w / 2, 8); x.lineTo(w - 10, h * 0.52); x.lineTo(10, h * 0.52); x.closePath(); x.fill(); x.strokeStyle = '#111'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#111'; x.beginPath(); x.moveTo(w * 0.53, h * 0.17); x.lineTo(w * 0.43, h * 0.33); x.lineTo(w * 0.52, h * 0.33); x.lineTo(w * 0.45, h * 0.47); x.lineTo(w * 0.6, h * 0.28); x.lineTo(w * 0.51, h * 0.28); x.closePath(); x.fill();
    x.font = 'bold 16px sans-serif'; x.textAlign = 'center'; x.fillText('DİKKAT', w / 2, h * 0.66); x.font = 'bold 12px sans-serif'; x.fillText('YÜKSEK GERİLİM', w / 2, h * 0.76);
    x.font = '10px sans-serif'; x.fillText('Yetkisiz kişilerin', w / 2, h * 0.86); x.fillText('girmesi yasaktır', w / 2, h * 0.92);
    lekeler(x, w, h, 4, 'rgba(90,80,60,A)', 10, 30, 0.05, 0.12, rnd);
  }), 0.36, 0.5, -0.92, kapiOrta + 0.35);
  disLevha(etiket(144, 200, (x, w, h) => {
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h);
    const d = (cx, cy) => { x.fillStyle = '#1f5fa8'; x.beginPath(); x.arc(cx, cy, 26, 0, Math.PI * 2); x.fill(); };
    d(w * 0.3, h * 0.19); d(w * 0.7, h * 0.19); d(w * 0.3, h * 0.46); d(w * 0.7, h * 0.46);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(w * 0.3, h * 0.21, 15, Math.PI, 0); x.fill(); x.fillRect(w * 0.3 - 19, h * 0.21 - 1, 38, 4);
    x.fillRect(w * 0.7 - 3, h * 0.19 - 17, 6, 34); x.fillRect(w * 0.7 - 14, h * 0.19 - 6, 28, 5);
    x.fillRect(w * 0.3 - 13, h * 0.46 - 3, 26, 12); x.fillRect(w * 0.3 - 13, h * 0.46 - 14, 10, 12);
    x.beginPath(); x.arc(w * 0.7, h * 0.46, 13, 0, Math.PI * 2); x.fill(); x.fillStyle = '#1f5fa8'; x.beginPath(); x.arc(w * 0.7, h * 0.46, 7, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#111'; x.font = 'bold 10px sans-serif'; x.textAlign = 'center'; x.fillText('KİŞİSEL KORUYUCU', w / 2, h * 0.73); x.fillText('DONANIM ZORUNLUDUR', w / 2, h * 0.79);
    x.font = '9px sans-serif'; x.fillText('Baret · emniyet kemeri', w / 2, h * 0.87); x.fillText('iş ayakkabısı · eldiven', w / 2, h * 0.93);
    lekeler(x, w, h, 4, 'rgba(90,80,60,A)', 10, 30, 0.05, 0.12, rnd);
  }), 0.36, 0.5, 0.92, kapiOrta + 0.35);
  // sahanlık ve dış merdiven
  const sahanlikY = kapiY0 - 0.08;
  izgaraMap.repeat.set(1, 1);
  const izgaraKutu = (w, d, x, y, z, par) => { const geo = new THREE.BoxGeometry(w, 0.04, d); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 0.6, uv.getY(i) * d / 0.6); const m = new THREE.Mesh(geo, M.izgara); m.position.set(x, y, z); par.add(m); return m; };
  izgaraKutu(1.7, 1.3, 0, sahanlikY, kR + 0.65, dis);
  const zeminY = 0.83, basamak = 16, ris = (sahanlikY - zeminY) / basamak, run = 0.29, z0 = kR + 1.3;
  for (let i = 0; i < basamak; i++) izgaraKutu(1.0, run - 0.03, 0, sahanlikY - ris * (i + 1) + 0.02, z0 + run * (i + 0.5), dis);
  const zSon = z0 + run * basamak;
  for (const sx of [-0.53, 0.53]) {
    cubuk(new THREE.Vector3(sx, sahanlikY - 0.06, z0), new THREE.Vector3(sx, zeminY, zSon), 0.03, M.galvaniz, dis, 6);
    cubuk(new THREE.Vector3(sx, sahanlikY + 1.1, z0 - 0.35), new THREE.Vector3(sx, zeminY + 1.1, zSon), 0.021, M.galvaniz, dis, 8);
    cubuk(new THREE.Vector3(sx, sahanlikY + 0.55, z0 - 0.35), new THREE.Vector3(sx, zeminY + 0.55, zSon), 0.015, M.galvaniz, dis, 6);
    for (let i = 0; i <= 4; i++) { const f = i / 4, z = THREE.MathUtils.lerp(z0 - 0.35, zSon, f), y = THREE.MathUtils.lerp(sahanlikY, zeminY, Math.max(0, (z - z0) / (zSon - z0))); cubuk(new THREE.Vector3(sx, y, z), new THREE.Vector3(sx, y + 1.1, z), 0.018, M.galvaniz, dis, 6); }
  }
  for (const sx of [-0.85, 0.85]) {
    cubuk(new THREE.Vector3(sx, sahanlikY, kR + 0.06), new THREE.Vector3(sx, sahanlikY + 1.1, kR + 0.06), 0.02, M.galvaniz, dis, 6);
    cubuk(new THREE.Vector3(sx, sahanlikY + 1.1, kR + 0.06), new THREE.Vector3(sx, sahanlikY + 1.1, kR + 1.28), 0.021, M.galvaniz, dis, 8);
    cubuk(new THREE.Vector3(sx, sahanlikY + 0.55, kR + 0.06), new THREE.Vector3(sx, sahanlikY + 0.55, kR + 1.28), 0.015, M.galvaniz, dis, 6);
  }
  kutu(0.26, 0.09, 0.15, M.koyu, 0, kapiY1 + 0.34, kR + 0.08, dis);
  kutu(0.22, 0.015, 0.11, M.lens, 0, kapiY1 + 0.29, kR + 0.1, dis);

  /* ================= İÇ ================= */
  const ic = new THREE.Group(); g.add(ic);

  // --- kule iç yüzeyi: bölüm bölüm; taban bölümünde kapı boşluğu ---
  duvarMap.repeat.set(2, H / 5 / 2.9); duvarNor.repeat.copy(duvarMap.repeat);
  for (let k = 0; k < 5; k++) {
    const y0 = TABAN0 + H * k / 5, y1 = y0 + H / 5, r0 = rIc(y0), r1 = rIc(y1);
    if (k === 0) {
      const bos = 2 * Math.asin((KAPI.gen / 2 + 0.02) / r0);
      const ana = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, H / 5, 48, 1, true, bos / 2, Math.PI * 2 - bos), M.duvar); ana.position.y = (y0 + y1) / 2; ic.add(ana);
      const yama = (a, b) => {
        const geo = new THREE.CylinderGeometry(rIc(b), rIc(a), b - a, 4, 1, true, -bos / 2, bos);
        const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * bos / (Math.PI * 2), uv.getY(i) * (b - a) / (H / 5));
        const m = new THREE.Mesh(geo, M.duvar); m.position.y = (a + b) / 2; ic.add(m);
      };
      yama(y0, kapiY0); yama(kapiY1, y1);
    } else { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, H / 5, 48, 1, true), M.duvar); m.position.y = (y0 + y1) / 2; ic.add(m); }
  }
  // kapı iç kasası
  { const a = 0; const r = rIc(kapiOrta); for (const [w, h, x, y] of [[0.08, kh_ + 0.12, -kg / 2 - 0.04, kapiOrta], [0.08, kh_ + 0.12, kg / 2 + 0.04, kapiOrta], [kg + 0.16, 0.08, 0, kapiY1 + 0.04]]) kutu(w, h, 0.1, M.boyali, x, y, r - 0.03, ic); }

  // --- flanş bağlantıları: iki L-flanş, cıvata + somun + pul, tork işaretleri ---
  const flansProfil = r => [new THREE.Vector2(r + 0.01, -0.2), new THREE.Vector2(r - 0.19, -0.2), new THREE.Vector2(r - 0.2, -0.19), new THREE.Vector2(r - 0.2, -0.104),
    new THREE.Vector2(r - 0.192, -0.1), new THREE.Vector2(r - 0.2, -0.096), new THREE.Vector2(r - 0.2, -0.01), new THREE.Vector2(r - 0.19, 0), new THREE.Vector2(r + 0.01, 0)];
  const civN = hafif ? 60 : 112;
  const somunGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.036, 6), pulGeo = new THREE.CylinderGeometry(0.043, 0.043, 0.007, 16),
    disGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.034, 8), izGeo = new THREE.BoxGeometry(0.006, 0.004, 0.05);
  const nF = flansY.length, somun = new THREE.InstancedMesh(somunGeo, M.celik, civN * nF * 2), pul = new THREE.InstancedMesh(pulGeo, M.galvaniz, civN * nF * 2),
    dis_ = new THREE.InstancedMesh(disGeo, M.celik, civN * nF * 2), iz = new THREE.InstancedMesh(izGeo, new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.7 }), civN * nF);
  let ci = 0, ii = 0; const renk = new THREE.Color();
  flansY.forEach(y => {
    const r = rIc(y) + 0.035;
    const f = new THREE.Mesh(new THREE.LatheGeometry(flansProfil(r - 0.035), 96), M.flans); f.position.y = y + 0.1; ic.add(f);
    const rb = r - 0.035 - 0.1;
    for (let k = 0; k < civN; k++) {
      const a = (k + 0.5) / civN * Math.PI * 2, cx = Math.sin(a) * rb, cz = Math.cos(a) * rb;
      for (const [yy, yon] of [[y + 0.1, 1], [y - 0.1, -1]]) {   // üstte somun, altta cıvata başı (flanş yüzeyine oturur)
        q.setFromAxisAngle(eY, a + rnd() * 0.5);
        pv.set(cx, yy + yon * 0.0035, cz); mt.compose(pv, q, s1); pul.setMatrixAt(ci, mt);
        pv.set(cx, yy + yon * 0.025, cz); mt.compose(pv, q, s1); somun.setMatrixAt(ci, mt);
        pv.set(cx, yy + yon * (yon > 0 ? 0.058 : 0.046), cz); mt.compose(pv, q, s1); dis_.setMatrixAt(ci, mt);
        const t = 0.72 + rnd() * 0.3; renk.setRGB(t, t * 0.98, t * 0.95); somun.setColorAt(ci, renk); dis_.setColorAt(ci, renk);
        ci++;
      }
      if (rnd() < 0.86) {   // tork kontrolünden sonra çekilen boya çizgisi: somundan flanşa
        q.setFromAxisAngle(eY, a + 0.02); pv.set(Math.sin(a) * (rb - 0.03), y + 0.1 + 0.045, Math.cos(a) * (rb - 0.03)); mt.compose(pv, q, s1); iz.setMatrixAt(ii++, mt);
      }
    }
  });
  iz.count = ii;
  ic.add(somun, pul, dis_, iz);

  // --- platformlar: ızgara döşeme, kenar sacı, alt kirişler, asansör boşluğu korkuluğu, merdiven kapağı ---
  const asnDelik = { x0: -ASN.gen / 2 - 0.12, x1: ASN.gen / 2 + 0.12, z0: ASN.z - ASN.der / 2 - 0.12, z1: ASN.z + ASN.der / 2 + 0.12 };
  function platformKur(y, i) {
    const r = rIc(y) - 0.02;
    const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false);
    const m = merdivenXZ(y);
    if (i > 0) {
      const h = new THREE.Path(); h.moveTo(asnDelik.x0, -asnDelik.z1); h.lineTo(asnDelik.x1, -asnDelik.z1); h.lineTo(asnDelik.x1, -asnDelik.z0); h.lineTo(asnDelik.x0, -asnDelik.z0); h.lineTo(asnDelik.x0, -asnDelik.z1); s.holes.push(h);
      const dl = new THREE.Path(); const hw = 0.34; dl.moveTo(m.x - hw, -m.y - hw); dl.lineTo(m.x + hw, -m.y - hw); dl.lineTo(m.x + hw, -m.y + hw); dl.lineTo(m.x - hw, -m.y + hw); dl.lineTo(m.x - hw, -m.y - hw); s.holes.push(dl);
    }
    const geo = new THREE.ShapeGeometry(s, 48); geo.rotateX(-Math.PI / 2);
    const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) / 0.6, uv.getY(k) / 0.6);
    const d = new THREE.Mesh(geo, M.izgara); d.position.y = y; ic.add(d);
    // duvar kenarında taşıyıcı köşebent halka ve radyal kirişler (döşemenin altında)
    const hk = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.12, 64, 1, true), M.kenar); hk.position.y = y - 0.06; ic.add(hk);
    if (i > 0) for (let k = 0; k < 6; k++) {
      const a = k / 6 * Math.PI * 2 + 0.3;
      // asansör ve merdiven boşluğundan geçen kirişi koyma
      let carp = false; for (let t = 0.44; t <= 1.0; t += 0.04) { const px = Math.sin(a) * r * t, pz = Math.cos(a) * r * t;
        if ((px > asnDelik.x0 - 0.1 && px < asnDelik.x1 + 0.1 && pz > asnDelik.z0 - 0.1 && pz < asnDelik.z1 + 0.1) || Math.hypot(px - m.x, pz - m.y) < 0.55) carp = true; }
      if (carp) continue;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.12, r * 0.55), M.galvaniz);
      b.position.set(Math.sin(a) * r * 0.72, y - 0.08, Math.cos(a) * r * 0.72); b.rotation.y = a; ic.add(b);
    }
    if (i === 0) return;
    // asansör boşluğu: kenar sacı ve kapı tarafında korkuluk kapısı
    const { x0, x1, z0, z1 } = asnDelik;
    kutu(x1 - x0, 0.1, 0.012, M.sari, (x0 + x1) / 2, y + 0.05, z1, ic); kutu(0.012, 0.1, z1 - z0, M.sari, x0, y + 0.05, (z0 + z1) / 2, ic); kutu(0.012, 0.1, z1 - z0, M.sari, x1, y + 0.05, (z0 + z1) / 2, ic);
    for (const [px, pz] of [[x0, z1], [x1, z1], [x0, z0], [x1, z0]]) cubuk(new THREE.Vector3(px, y, pz), new THREE.Vector3(px, y + 1.1, pz), 0.02, M.sari, ic, 6);
    for (const hh of [0.55, 1.1]) for (const [a0, a1] of [[[x0, z1], [x0, z0]], [[x1, z1], [x1, z0]]]) cubuk(new THREE.Vector3(a0[0], y + hh, a0[1]), new THREE.Vector3(a1[0], y + hh, a1[1]), 0.017, M.sari, ic, 6);
    // merdiven kapağı: menteşeli, açık bekler
    const kp = kutu(0.66, 0.012, 0.66, M.galvaniz, 0, 0, 0, ic);
    const dis2 = new THREE.Vector3(merdivenYon.x, 0, merdivenYon.y).multiplyScalar(-0.34);
    kp.position.set(m.x + dis2.x, y + 0.32, m.y + dis2.z); kp.rotation.y = Math.atan2(merdivenYon.x, merdivenYon.y); kp.rotateX(-1.35);
  }
  platY.forEach(platformKur);

  // --- merdiven: C-profil yanlar, basamaklar, düşme durdurucu ray, duvar bağlantıları ---
  {
    const disa = new THREE.Vector3(merdivenYon.x, 0, merdivenYon.y), yan = new THREE.Vector3(-merdivenYon.y, 0, merdivenYon.x);
    const aci = Math.atan2(merdivenYon.x, merdivenYon.y), L = mAlt.distanceTo(mUst), orta = mAlt.clone().lerp(mUst, 0.5);
    const egim = new THREE.Quaternion().setFromUnitVectors(eY, mUst.clone().sub(mAlt).normalize());
    for (const sg of [-0.21, 0.21]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, L, 0.022), M.galvaniz); r.position.copy(orta).addScaledVector(yan, sg); r.quaternion.copy(egim); r.rotateY(aci - Math.PI / 2); ic.add(r); }
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.03, L, 0.014), M.galvaniz); ray.position.copy(orta).addScaledVector(disa, 0.035); ray.quaternion.copy(egim); ray.rotateY(aci - Math.PI / 2); ic.add(ray);
    const n = Math.floor(L / 0.28), bg = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 8); bg.rotateZ(Math.PI / 2);
    const bs = new THREE.InstancedMesh(bg, M.galvaniz, n); q.setFromAxisAngle(eY, aci);
    for (let i = 0; i < n; i++) { pv.lerpVectors(mAlt, mUst, (i + 0.5) / n); mt.compose(pv, q, s1); bs.setMatrixAt(i, mt); }
    ic.add(bs);
    const bn = Math.floor(L / 2.8), bb = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.04, 1), M.galvaniz, bn * 2);
    let bi = 0;
    for (let i = 0; i < bn; i++) {
      const y = mAlt.y + (i + 0.5) * (mUst.y - mAlt.y) / bn; const m = merdivenXZ(y), rw = rIc(y), d = rw - Math.hypot(m.x, m.y);
      for (const sg of [-0.21, 0.21]) { pv.set(m.x + yan.x * sg + disa.x * d / 2, y, m.y + yan.z * sg + disa.z * d / 2); q.setFromAxisAngle(eY, aci); mt.compose(pv, q, new THREE.Vector3(1, 1, Math.max(0.05, d))); bb.setMatrixAt(bi++, mt); }
    }
    ic.add(bb);
    // üst platformda nasel kapağına çıkış: sarı kapak çerçevesi
    const ku = merdivenXZ(ustY);
    for (const [dx, dz, w, d] of [[0, -0.34, 0.74, 0.04], [0, 0.34, 0.74, 0.04], [-0.35, 0, 0.04, 0.72], [0.35, 0, 0.04, 0.72]]) kutu(w, 0.08, d, M.sari, ku.x + dx, ustY + 0.04, ku.y + dz, ic);
  }

  // --- kablo tavası: kablo merdiveni, güç kabloları, kontrol kabloları, topraklama iletkeni, bağlar ---
  {
    const n0 = new THREE.Vector3(Math.sin(TAVA), 0, Math.cos(TAVA)), yan = new THREE.Vector3(-n0.z, 0, n0.x);
    const nokta = (y, ic_, sg) => { const r = rIc(y) - ic_; return new THREE.Vector3(n0.x * r + yan.x * sg, y, n0.z * r + yan.z * sg); };
    const y0 = tabanY, y1 = towerTopY - 0.4;
    for (const sg of [-0.21, 0.21]) cubuk(nokta(y0, 0.09, sg), nokta(y1, 0.09, sg), 0.012, M.galvaniz, ic, 4).scale.set(1.6, 1, 4);   // tava yan rayları
    const rn = Math.floor((y1 - y0) / 0.3), rg = new THREE.BoxGeometry(0.42, 0.018, 0.03), ri = new THREE.InstancedMesh(rg, M.galvaniz, rn);
    for (let i = 0; i < rn; i++) { const y = y0 + (i + 0.5) * 0.3; pv.copy(nokta(y, 0.1, 0)); q.setFromAxisAngle(eY, TAVA); mt.compose(pv, q, s1); ri.setMatrixAt(i, mt); }
    ic.add(ri);
    const kN = hafif ? 4 : 6;
    for (let k = 0; k < kN; k++) cubuk(nokta(y0, 0.15, -0.15 + k * 0.06), nokta(y1, 0.15, -0.15 + k * 0.06), 0.021, M.kablo, ic, 8);
    for (let k = 0; k < 3; k++) cubuk(nokta(y0, 0.13, 0.19 - k * 0.018), nokta(y1, 0.13, 0.19 - k * 0.018), 0.006, M.kabloGri, ic, 5);
    cubuk(nokta(y0, 0.13, 0.13), nokta(y1, 0.13, 0.13), 0.008, M.tprk, ic, 6);
    const bn = Math.floor((y1 - y0) / 0.9), bg = new THREE.BoxGeometry(0.4, 0.008, 0.05), bgm = new THREE.InstancedMesh(bg, M.lastik, bn);
    for (let i = 0; i < bn; i++) { const y = y0 + (i + 0.5) * 0.9; pv.copy(nokta(y, 0.17, 0)); q.setFromAxisAngle(eY, TAVA); mt.compose(pv, q, s1); bgm.setMatrixAt(i, mt); }
    ic.add(bgm);
  }

  // --- servis lambaları: IP korumalı LED armatür; altında duvara düşen ışık havuzu ---
  const lambaYler = []; platY.slice(1).forEach(y => lambaYler.push(y - 1.3)); for (let y = tabanY + 2.4; y < towerTopY - 2; y += 8) if (!lambaYler.some(v => Math.abs(v - y) < 3)) lambaYler.push(y);
  const armGeo = new THREE.BoxGeometry(0.09, 0.62, 0.07), lensGeo = new THREE.BoxGeometry(0.06, 0.56, 0.01);
  for (const y of lambaYler) {
    const a = LAMBA + (rnd() - 0.5) * 0.12;
    const arm = duvaraKoy(new THREE.Mesh(armGeo, M.koyu), a, y, 0.06); ic.add(arm);
    const lens = duvaraKoy(new THREE.Mesh(lensGeo, M.lens), a, y, 0.1); ic.add(lens);
    const hv = new THREE.Mesh(new THREE.CylinderGeometry(rIc(y) - 0.012, rIc(y) - 0.012, 3.0, 12, 1, true, a - 0.62, 1.24), M.havuz); hv.position.y = y - 0.25; ic.add(hv);
  }

  // --- kule dibi: pano, yangın söndürücü, levhalar ---
  { const pano = new THREE.Group(); ic.add(duvaraKoy(pano, 1.15, tabanY, 0.3));
    kutu(0.8, 2.0, 0.4, M.boyali, 0, 1.0, 0, pano); kutu(0.78, 0.02, 0.02, M.koyu, 0, 1.0, 0.205, pano); kutu(0.02, 1.9, 0.02, M.koyu, 0, 1.0, 0.205, pano);
    for (const x of [-0.3, 0.3]) kutu(0.03, 0.12, 0.03, M.koyu, x, 1.05, 0.215, pano);
    const pl = levhaMesh(etiket(128, 64, (x, w, h) => { x.fillStyle = '#f4c20d'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.fillText('DİKKAT', w / 2, 24); x.font = '11px sans-serif'; x.fillText('Enerjili pano', w / 2, 42); x.fillText('Yalnızca yetkili', w / 2, 56); }), 0.2, 0.1, pano); pl.position.set(0.2, 1.6, 0.203);
    const yy = new THREE.Group(); ic.add(duvaraKoy(yy, -0.75, tabanY + 0.9, 0.12));
    cubuk(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.5, 0), 0.075, M.yangin, yy, 16); kutu(0.05, 0.12, 0.04, M.koyu, 0, 0.56, 0, yy); kutu(0.2, 0.04, 0.12, M.koyu, 0, 0.3, -0.07, yy);
    const dl = levhaMesh(etiket(120, 150, (x, w, h) => { x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f5fa8'; x.beginPath(); x.arc(w / 2, 48, 36, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.fillRect(w / 2 - 12, 26, 24, 18); x.fillRect(w / 2 - 4, 44, 8, 22); x.fillStyle = '#111'; x.font = 'bold 11px sans-serif'; x.textAlign = 'center'; x.fillText('DÜŞME KORUMASI', w / 2, 104); x.font = '9.5px sans-serif'; x.fillText('Emniyet kemeri ve düşme', w / 2, 122); x.fillText('durdurucu takılmadan tırmanmayın', w / 2, 136); }), 0.24, 0.3, ic);
    duvaraKoy(dl, Math.atan2(merdivenYon.x, merdivenYon.y) + 0.34, tabanY + 1.55, 0.012);
  }

  /* ================= GENEL SERVİS ASANSÖRÜ ================= */
  // kılavuz teller (iki yanda), taşıyıcı ve emniyet halatları (kabin üstündeki tahrik ünitesinden geçer)
  const telUst = towerTopY - 0.6;
  kutu(1.4, 0.16, 0.12, M.celik, 0, telUst + 0.1, ASN.z, ic);   // üst askı kirişi
  for (const sx of [-ASN.gen / 2 - 0.07, ASN.gen / 2 + 0.07]) {
    cubuk(new THREE.Vector3(sx, tabanY, ASN.z), new THREE.Vector3(sx, telUst, ASN.z), 0.006, M.galvaniz, ic, 5);
    kutu(0.12, 0.3, 0.12, M.koyu, sx, tabanY + 0.15, ASN.z, ic);   // alt gergi ağırlığı
  }
  for (const sx of [-0.06, 0.06]) cubuk(new THREE.Vector3(sx, tabanY + 0.05, ASN.z - 0.18), new THREE.Vector3(sx, telUst, ASN.z - 0.18), 0.0045, M.galvaniz, ic, 5);
  // platform geçişlerinde tel kılavuzları
  platY.slice(1).forEach(y => { for (const sx of [-ASN.gen / 2 - 0.07, ASN.gen / 2 + 0.07]) kutu(0.08, 0.05, 0.12, M.sari, sx, y + 0.03, ASN.z, ic); });

  const kabin = new THREE.Group(); kabin.position.set(ASN.x, tabanY, ASN.z); ic.add(kabin);
  const { gen: kw, der: kd, yuk: kh } = ASN;
  // taban: alüminyum baklava sac, mavi alt çerçeve
  kutu(kw, 0.05, kd, M.baklava, 0, 0.025, 0, kabin); kutu(kw + 0.04, 0.08, kd + 0.04, M.mavi, 0, -0.04, 0, kabin);
  // köşe dikmeleri, üst çerçeve, tavan: mavi toz boyalı profil
  for (const sx of [-kw / 2, kw / 2]) for (const sz of [-kd / 2, kd / 2]) kutu(0.045, kh, 0.045, M.mavi, sx, kh / 2, sz, kabin);
  for (const sz of [-kd / 2, kd / 2]) kutu(kw, 0.06, 0.045, M.mavi, 0, kh, sz, kabin);
  for (const sx of [-kw / 2, kw / 2]) kutu(0.045, 0.06, kd, M.mavi, sx, kh, 0, kabin);
  kutu(kw - 0.02, 0.02, kd - 0.02, M.maviSac, 0, kh + 0.03, 0, kabin);
  // yan ve arka duvar: alt yarı mavi sac, üst yarı alüminyum tel örgü; ara kuşak
  const altH = 1.1;
  const yanDuvar = (sx) => {
    const alt = new THREE.Mesh(new THREE.PlaneGeometry(kd - 0.04, altH), M.maviSac); alt.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2; alt.position.set(sx, altH / 2 + 0.05, 0); kabin.add(alt);
    const ust = new THREE.Mesh(new THREE.PlaneGeometry(kd - 0.04, kh - altH - 0.1), M.ag); ust.rotation.y = alt.rotation.y; ust.position.set(sx, altH + (kh - altH) / 2, 0); kabin.add(ust);
    kutu(0.035, 0.035, kd, M.mavi, sx, altH + 0.05, 0, kabin);
  };
  yanDuvar(-kw / 2); yanDuvar(kw / 2);
  { const alt = new THREE.Mesh(new THREE.PlaneGeometry(kw - 0.04, altH), M.maviSac); alt.position.set(0, altH / 2 + 0.05, -kd / 2); kabin.add(alt);
    const ust = new THREE.Mesh(new THREE.PlaneGeometry(kw - 0.04, kh - altH - 0.1), M.ag); ust.position.set(0, altH + (kh - altH) / 2, -kd / 2); kabin.add(ust);
    kutu(kw, 0.035, 0.035, M.mavi, 0, altH + 0.05, -kd / 2, kabin); }
  // tutamak: iki yanda, 1,0 m'de, dirseklerle dikmeye bağlı (alüminyum)
  for (const sx of [-kw / 2 + 0.07, kw / 2 - 0.07]) {
    cubuk(new THREE.Vector3(sx, 1.0, -kd / 2 + 0.1), new THREE.Vector3(sx, 1.0, kd / 2 - 0.14), 0.016, M.alu, kabin, 10);
    for (const z of [-kd / 2 + 0.14, kd / 2 - 0.18]) cubuk(new THREE.Vector3(sx, 1.0, z), new THREE.Vector3(sx + Math.sign(sx) * 0.05, 1.0, z), 0.01, M.alu, kabin, 6);
  }
  // kumanda paneli: sağ duvarda; YUKARI / AŞAĞI / DUR, ACİL STOP, IŞIK
  const panel = new THREE.Group(); panel.position.set(kw / 2 - 0.05, 1.28, -0.12); panel.rotation.y = -Math.PI / 2; kabin.add(panel);
  kutu(0.2, 0.3, 0.06, M.koyu, 0, 0, -0.01, panel);
  const pYuz = levhaMesh(etiket(160, 240, (x, w, h) => {
    x.fillStyle = '#2d3236'; x.fillRect(0, 0, w, h); lekeler(x, w, h, 6, 'rgba(120,118,112,A)', 8, 26, 0.08, 0.2, rnd);
    x.fillStyle = '#e6e8e8'; x.font = 'bold 12px sans-serif'; x.textAlign = 'center';
    x.fillText('YUKARI', 48, 62); x.fillText('AŞAĞI', 48, 116); x.fillText('DUR', 48, 170); x.fillText('IŞIK', 118, 170);
    x.fillStyle = '#f4c20d'; x.beginPath(); x.arc(118, 70, 34, 0, Math.PI * 2); x.fill(); x.fillStyle = '#111'; x.font = 'bold 9px sans-serif'; x.fillText('ACİL STOP', 118, 118);
    x.fillStyle = '#c9cdcf'; x.font = '9px sans-serif'; x.fillText('SERVİS ASANSÖRÜ', w / 2, 212); x.fillText('Kumanda paneli', w / 2, 226);
  }), 0.2, 0.3, panel); pYuz.position.z = 0.021;
  const buton = (x, y, m, r = 0.016, d = 0.014) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, d, 20), m); b.rotation.x = Math.PI / 2; b.position.set(x, y, 0.021 + d / 2); panel.add(b); return b; };
  const pSx = v => (v / 160 - 0.5) * 0.2, pSy = v => (0.5 - v / 240) * 0.3;
  buton(pSx(48), pSy(40), M.lastik); buton(pSx(48), pSy(94), M.lastik); buton(pSx(48), pSy(148), M.lastik);
  buton(pSx(118), pSy(148), M.galvaniz, 0.012, 0.01);
  buton(pSx(118), pSy(70), M.kirmizi, 0.028, 0.03);
  const pilot = buton(pSx(118), pSy(196), new THREE.MeshBasicMaterial({ color: 0x46d06a, fog: false }), 0.006, 0.006);
  // kabin içi etiketler
  { const e1 = levhaMesh(etiket(200, 120, (x, w, h) => { x.fillStyle = '#f4c20d'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.fillRect(0, 0, w, 26); x.fillStyle = '#f4c20d'; x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; x.fillText('DİKKAT', w / 2, 19); x.fillStyle = '#111'; x.font = '12px sans-serif'; x.fillText('Yalnızca eğitimli ve yetkili', w / 2, 52); x.fillText('personel kullanabilir.', w / 2, 68); x.fillText('Kapı kilitlenmeden hareket etmez.', w / 2, 92); lekeler(x, w, h, 3, 'rgba(90,80,60,A)', 8, 22, 0.06, 0.12, rnd); }), 0.2, 0.12, kabin);
    e1.position.set(-kw / 2 + 0.005, 1.45, -0.12); e1.rotation.y = Math.PI / 2;
    const e2 = levhaMesh(etiket(160, 60, (x, w, h) => { x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h); x.fillStyle = '#111'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center'; x.fillText('SERVİS ASANSÖRÜ', w / 2, 26); x.font = '10px sans-serif'; x.fillText('Azami yük 240 kg', w / 2, 46); }), 0.16, 0.06, kabin);
    e2.position.set(0, altH - 0.12, -kd / 2 + 0.005); }
  // tavan lambası (IP korumalı) ve ışığı
  kutu(0.3, 0.035, 0.08, M.koyu, 0, kh - 0.03, 0.05, kabin); kutu(0.27, 0.006, 0.05, M.lens, 0, kh - 0.05, 0.05, kabin);
  const kabinIsik = new THREE.PointLight(0xffe9cf, hafif ? 1.6 : 1.2, 7, 1.6); kabinIsik.position.set(0, kh - 0.25, 0.1); kabin.add(kabinIsik);
  // tahrik ünitesi (kabin üstü) ve halat geçişi
  kutu(0.34, 0.28, 0.3, M.koyu, 0.05, kh + 0.19, -0.2, kabin); cubuk(new THREE.Vector3(-0.12, kh + 0.19, -0.2), new THREE.Vector3(-0.12 - 0.2, kh + 0.19, -0.2), 0.08, M.celik, kabin, 16);
  kutu(0.12, 0.12, 0.1, M.mavi, 0.05, kh + 0.39, -0.2, kabin);
  // katlanır kapı: iki kanat, menteşe sağ dikmede; açılırken dışarı doğru V şeklinde katlanır, uç üst rayda kayar
  kutu(kw, 0.04, 0.05, M.alu, 0, kh - 0.02, kd / 2 + 0.05, kabin);   // üst ray
  const kanatG = (kw - 0.05) / 2;
  const kanatYap = (par) => {
    const k = new THREE.Group(); par.add(k);
    for (const [w, h, x, y] of [[kanatG, 0.035, -kanatG / 2, kh - 0.08], [kanatG, 0.035, -kanatG / 2, 0.09], [0.035, kh - 0.16, -0.0175, kh / 2], [0.035, kh - 0.16, -kanatG + 0.0175, kh / 2], [kanatG, 0.03, -kanatG / 2, altH + 0.05]]) kutu(w, h, 0.025, M.mavi, x, y, 0, k);
    const alt = new THREE.Mesh(new THREE.PlaneGeometry(kanatG - 0.05, altH - 0.04), M.maviSac); alt.position.set(-kanatG / 2, (altH + 0.1) / 2, 0); k.add(alt);
    const ag = new THREE.Mesh(new THREE.PlaneGeometry(kanatG - 0.05, kh - altH - 0.2), M.ag); ag.position.set(-kanatG / 2, altH + (kh - altH) / 2 - 0.02, 0); k.add(ag);
    return k;
  };
  const kapiMenteşe = new THREE.Group(); kapiMenteşe.position.set(kw / 2 - 0.025, 0, kd / 2 + 0.035); kabin.add(kapiMenteşe);
  const kanat1 = kanatYap(kapiMenteşe);
  const orta = new THREE.Group(); orta.position.set(-kanatG, 0, 0); kanat1.add(orta);
  const kanat2 = kanatYap(orta);
  for (const y of [0.4, 1.2, 2.0]) { kutu(0.03, 0.08, 0.035, M.koyu, 0, y, 0, kapiMenteşe); kutu(0.03, 0.08, 0.035, M.koyu, 0, y, 0, orta); }
  kutu(0.025, 0.16, 0.045, M.alu, -kanatG + 0.04, 1.05, 0.03, kanat2);   // kapı kolu
  function kabinKapiAyarla(acik) {
    const t = THREE.MathUtils.clamp(acik, 0, 1) * 1.45;
    kanat1.rotation.y = t; orta.rotation.y = -2 * t;
  }
  kabinKapiAyarla(1);
  const kabinKapi = kapiMenteşe;
  const kilitDili = kutu(0.05, 0.025, 0.025, M.alu, -kw / 2 + 0.03, 1.2, kd / 2 + 0.07, kabin);
  // asansör besleme kablosu: kule ortasındaki kutudan sarkma ilmeği ile kabine
  const kutuKon = duvaraKoy(new THREE.Group(), Math.PI + 0.25, Hm, 0.1); ic.add(kutuKon); kutu(0.3, 0.4, 0.16, M.boyali, 0, 0, 0, kutuKon);
  const kA = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 1, 8), M.kablo), kB = kA.clone(), kC = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.013, 6, 16, Math.PI), M.kablo);
  ic.add(kA, kB, kC);
  const kx = 0.28, kzA = ASN.z - 0.22, kzB = ASN.z - 0.45, L_KABLO = (Hm - tabanY) + (0 - 0) + 0.2;
  cubuk(new THREE.Vector3(kx, Hm, kzB), new THREE.Vector3(kutuKon.position.x, Hm, kutuKon.position.z), 0.013, M.kablo, ic, 6);
  function kabloGuncelle(kabinY) {
    // ilmek dibi: iki kol boyunun toplamı sabit uzunluk (serbest sarkma), zemine inmez
    const yb = Math.max(tabanY + 0.12, (Hm + kabinY - L_KABLO) / 2);
    const la = Math.max(0.01, kabinY - yb), lb = Math.max(0.01, Hm - yb);
    kA.scale.y = la; kA.position.set(kx, yb + la / 2, kzA);
    kB.scale.y = lb; kB.position.set(kx, yb + lb / 2, kzB);
    kC.position.set(kx, yb, (kzA + kzB) / 2); kC.rotation.set(Math.PI, Math.PI / 2, 0);
  }
  kabloGuncelle(tabanY);

  // aydınlatma: giriş katı, yaw katı
  const girisIsik = new THREE.PointLight(0xffe4c4, hafif ? 3 : 2.4, 9, 1.5); girisIsik.position.set(0.4, tabanY + 2.6, 0.9); ic.add(girisIsik);
  const ustIsik = new THREE.PointLight(0xffe4c4, hafif ? 2 : 1.5, 7, 1.6); ustIsik.position.set(kapakXZ.x * 0.4, ustY + 1.25, kapakXZ.y * 0.4 + 0.3); ic.add(ustIsik);
  // nasel kapağından süzülen ışık
  { const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.66), new THREE.MeshBasicMaterial({ color: 0xfff0da, fog: false }));
    kp.rotation.x = Math.PI / 2; kp.position.set(kapakXZ.x, towerTopY - 0.12, kapakXZ.y); ic.add(kp);
    for (const [dx, dz, w, d] of [[0, -0.36, 0.8, 0.05], [0, 0.36, 0.8, 0.05], [-0.38, 0, 0.05, 0.76], [0.38, 0, 0.05, 0.76]]) kutu(w, 0.1, d, M.sari, kapakXZ.x + dx, towerTopY - 0.16, kapakXZ.y + dz, ic); }

  return {
    grup: g, kanatPivot, kapiKol, kabin, kabinKapi, kabinKapiAyarla, kilitDili, pilot, kabinIsik, girisIsik, ustIsik, ic, dis, kabloGuncelle,
    olcu: { tabanY, ustY, ASN, rIc, rDis, towerTopY, kapiY0, kapiY1, kR },
  };
}

/* taban segmentine kapı boşluğu açar: gövde boşluk bırakılarak yeniden kurulur, üst ve alt yamalar eklenir.
 * Kulenin dış yüzü tek taraflı kalır; içeriyi kule içi grubundaki iç yüzey gösterir. */
export function kapiBosluguAc(seg, kapi = KAPI) {
  const govde = seg.children.find(o => o.isMesh && o.geometry.type === 'CylinderGeometry');
  if (!govde) return;
  const { radiusTop: r1, radiusBottom: r0, height: h, radialSegments: n } = govde.geometry.parameters;
  const rA = y => THREE.MathUtils.lerp(r0, r1, y / h);
  const bosluk = 2 * Math.asin((kapi.gen / 2 + 0.02) / rA(kapi.alt));
  const yeni = new THREE.CylinderGeometry(r1, r0, h, Math.max(n, 64), 1, true, bosluk / 2, Math.PI * 2 - bosluk);
  govde.geometry.dispose(); govde.geometry = yeni;
  const yama = (y0, y1) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rA(y1), rA(y0), y1 - y0, 6, 1, true, -bosluk / 2, bosluk), govde.material);
    m.position.y = (y0 + y1) / 2; m.castShadow = true; m.receiveShadow = true; seg.add(m); return m;
  };
  yama(0, kapi.alt); yama(kapi.ust, h);
  // kapı kalınlığı: açıklığın yan ve üst yüzleri (duvar kesiti)
  const kalin = 0.035, cx = kapi.gen / 2 + 0.02, rk = rA((kapi.alt + kapi.ust) / 2);
  const m = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.6, metalness: 0.4 });
  for (const sx of [-cx, cx]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.01, kapi.ust - kapi.alt, kalin), m); k.position.set(sx, (kapi.alt + kapi.ust) / 2, rk - kalin / 2); seg.add(k); }
  { const k = new THREE.Mesh(new THREE.BoxGeometry(cx * 2, 0.01, kalin), m); k.position.set(0, kapi.ust, rk - kalin / 2); seg.add(k); }
  seg.children.forEach(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && Math.abs(o.geometry.parameters.width - 0.9) < 0.01) o.visible = false; });
}
