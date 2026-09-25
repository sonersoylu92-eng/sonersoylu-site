/* kule-ic.js — "Türbine gir" yolculuğunun kule bölümü: kule kapısı, dış merdiven,
 * kule içi (platformlar, flanşlar, merdiven, kablo demeti, servis lambaları) ve servis asansörü.
 *
 * Koordinatlar KULE YERELİNDE: eksen x = z = 0, y = zeminden yükseklik (m), kapı +z yönünde.
 * Grup, sahnede kulenin ekseninde durur; deneyim.js onu naselin yaw açısıyla birlikte döndürür
 * (kule simetrik olduğu için dışarıdan fark edilmez, kamera yolu ve kapı hep aynı hizada kalır).
 * Yerleşim temsilidir: çelik kulelerde yaygın düzen (flanş altı platformlar, duvar boyu merdiven
 * ve düşme durdurucu ray, tel kılavuzlu servis asansörü); üretici çizimi değildir.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';

export const KAPI = { gen: 0.9, alt: 0.30, ust: 2.35 };   // kapı açıklığı: genişlik, alt segment tabanına göre alt/üst (m)
const TABAN0 = 3.55;                                       // kule alt flanşı (kaide üstü)

function doku(w, h, ciz) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  ciz(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function gurultu(x, w, h, n, renk, a0, a1) {
  for (let i = 0; i < n; i++) { x.fillStyle = renk; x.globalAlpha = a0 + Math.random() * (a1 - a0); x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
  x.globalAlpha = 1;
}

export function kuleIciKur({ SPEC, towerTopY, hafif = false, kapakXZ = new THREE.Vector2(-0.8, -0.8) }) {
  const g = new THREE.Group(); g.name = 'kuleIci';
  const H = towerTopY - TABAN0;
  const rDis = h => THREE.MathUtils.lerp(SPEC.towerBase, SPEC.towerTop, THREE.MathUtils.clamp((h - TABAN0) / H, 0, 1)) / 2;
  const rIc = h => rDis(h) - 0.035;

  /* ---------------- malzemeler ---------------- */
  const izgaraTex = doku(64, 64, (x, w, h) => {
    x.fillStyle = '#23272b'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#6a7178'; x.lineWidth = 5; for (let i = 0; i <= w; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
    x.lineWidth = 2; for (let i = 0; i <= h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  });
  izgaraTex.wrapS = izgaraTex.wrapT = THREE.RepeatWrapping;
  const M = {
    celik:  new THREE.MeshStandardMaterial({ color: 0x8e959b, roughness: 0.5, metalness: 0.6 }),
    galvaniz: new THREE.MeshStandardMaterial({ color: 0xa9adb0, roughness: 0.45, metalness: 0.75 }),
    koyu:   new THREE.MeshStandardMaterial({ color: 0x2b3035, roughness: 0.6, metalness: 0.5 }),
    sari:   new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: 0.55, metalness: 0.2 }),
    kablo:  new THREE.MeshStandardMaterial({ color: 0x131517, roughness: 0.75, metalness: 0.1 }),
    izgara: new THREE.MeshStandardMaterial({ map: izgaraTex, roughness: 0.6, metalness: 0.6, side: THREE.DoubleSide }),
    lamba:  new THREE.MeshBasicMaterial({ color: 0xfff1dc, fog: false }),
    kirmizi: new THREE.MeshStandardMaterial({ color: 0xb3261e, roughness: 0.5, emissive: 0x3a0806 }),
  };
  const kutu = (w, h, d, m, x, y, z, par = g) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); par.add(o); return o; };
  const cubuk = (a, b, r, m, par = g, seg = 8) => {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), m);
    o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    par.add(o); return o;
  };

  /* ---------------- yerleşim ----------------
   * asansör: kapıya bakan arka duvarda, kapısı kule merkezine dönük.
   * merdiven ve nasel kapağı: çağıran taraf (deneyim.js) naselin kapak konumunu verir; merdiven o yönde duvar boyunca. */
  const ASN = { x: 0, z: -0.85, gen: 0.8, der: 0.8, yuk: 2.25 };
  const tabanY = TABAN0 + KAPI.alt;               // giriş katı (kapı eşiği)
  const ustY = towerTopY - 3.0;                     // yaw katı platformu (yaw yatağının ~3 m altında)
  const flansY = []; for (let k = 1; k < 5; k++) flansY.push(TABAN0 + H * k / 5);
  const platY = [tabanY, ...flansY.map(y => y - 1.0), ustY];

  /* ---------------- dış: kapı çerçevesi, kanat, sahanlık, merdiven, levhalar ---------------- */
  const dis = new THREE.Group(); g.add(dis);
  const kR = rDis(tabanY + 1);
  const kapiY0 = TABAN0 + KAPI.alt, kapiY1 = TABAN0 + KAPI.ust, kapiOrta = (kapiY0 + kapiY1) / 2, kg = KAPI.gen;
  // çerçeve (kuleye kaynaklı takviye)
  kutu(0.14, kapiY1 - kapiY0 + 0.28, 0.16, M.celik, -kg / 2 - 0.07, kapiOrta, kR + 0.02, dis);
  kutu(0.14, kapiY1 - kapiY0 + 0.28, 0.16, M.celik, kg / 2 + 0.07, kapiOrta, kR + 0.02, dis);
  kutu(kg + 0.28, 0.14, 0.16, M.celik, 0, kapiY1 + 0.07, kR + 0.02, dis);
  kutu(kg + 0.28, 0.1, 0.18, M.celik, 0, kapiY0 - 0.05, kR + 0.02, dis);
  // kapı kanadı: dışarı açılır, menteşe +x tarafında
  const kanatTex = doku(256, 512, (x, w, h) => {
    x.fillStyle = '#b9bdbd'; x.fillRect(0, 0, w, h);
    gurultu(x, w, h, 2600, '#8d8f88', 0.05, 0.18);
    const gr = x.createLinearGradient(0, h * 0.55, 0, h); gr.addColorStop(0, 'rgba(120,96,70,0)'); gr.addColorStop(1, 'rgba(120,96,70,.22)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(110,80,50,.12)'; x.fillRect(12 + Math.random() * (w - 24), h * 0.3 + Math.random() * h * 0.2, 1.4, h * (0.2 + Math.random() * 0.3)); }
    x.strokeStyle = 'rgba(40,44,46,.55)'; x.lineWidth = 2; x.strokeRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#5a5f62'; for (let i = 0; i < 7; i++) x.fillRect(70, 70 + i * 11, w - 140, 4);        // havalandırma panjuru
    x.fillStyle = '#2b2f32'; x.font = 'bold 11px sans-serif'; x.textAlign = 'center'; x.fillText('SERVİS GİRİŞİ', w / 2, h * 0.34);
  });
  const kanatPivot = new THREE.Group(); kanatPivot.position.set(kg / 2, kapiOrta, kR + 0.08); dis.add(kanatPivot);
  const kanat = new THREE.Mesh(new THREE.BoxGeometry(kg, kapiY1 - kapiY0, 0.05),
    [M.celik, M.celik, M.celik, M.celik, new THREE.MeshStandardMaterial({ map: kanatTex, roughness: 0.62, metalness: 0.35 }), M.celik]);
  kanat.position.set(-kg / 2, 0, 0); kanatPivot.add(kanat);
  kutu(0.03, 0.18, 0.05, M.koyu, -kg + 0.1, -0.02, 0.05, kanatPivot);                 // kol
  kutu(0.08, 0.26, 0.04, M.galvaniz, -kg + 0.1, 0.05, 0.035, kanatPivot);             // kilit karşılığı
  for (const y of [-0.8, 0.8]) kutu(0.05, 0.16, 0.07, M.koyu, 0.02, y, 0, kanatPivot); // menteşeler
  // levhalar: sarı üçgen (tehlike) + mavi zorunluluk (KKD) + beyaz bilgi
  const levha = (w, h, ciz, x, y) => {
    const t = doku(Math.round(w * 400), Math.round(h * 400), ciz);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.55 }));
    const a = x / kR; m.position.set(Math.sin(a) * (kR + 0.012), y, Math.cos(a) * (kR + 0.012)); m.rotation.y = a; dis.add(m); return m;
  };
  levha(0.36, 0.5, (x, w, h) => {
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f4c20d'; x.beginPath(); x.moveTo(w / 2, 10); x.lineTo(w - 12, h * 0.52); x.lineTo(12, h * 0.52); x.closePath(); x.fill();
    x.strokeStyle = '#111'; x.lineWidth = 7; x.stroke();
    x.fillStyle = '#111'; x.beginPath(); x.moveTo(w * 0.53, h * 0.17); x.lineTo(w * 0.43, h * 0.33); x.lineTo(w * 0.52, h * 0.33); x.lineTo(w * 0.45, h * 0.47); x.lineTo(w * 0.6, h * 0.28); x.lineTo(w * 0.51, h * 0.28); x.closePath(); x.fill();
    x.fillStyle = '#111'; x.font = 'bold 20px sans-serif'; x.textAlign = 'center';
    x.fillText('DİKKAT', w / 2, h * 0.66); x.font = 'bold 15px sans-serif'; x.fillText('YÜKSEK GERİLİM', w / 2, h * 0.76);
    x.font = '12px sans-serif'; x.fillText('Yetkisiz kişilerin', w / 2, h * 0.86); x.fillText('girmesi yasaktır', w / 2, h * 0.92);
  }, -0.92, kapiOrta + 0.35);
  levha(0.36, 0.5, (x, w, h) => {
    x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h);
    const d = (cx, cy, r) => { x.fillStyle = '#1f5fa8'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); };
    d(w * 0.3, h * 0.2, 38); d(w * 0.7, h * 0.2, 38); d(w * 0.3, h * 0.47, 38); d(w * 0.7, h * 0.47, 38);
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(w * 0.3, h * 0.22, 22, Math.PI, 0); x.fill(); x.fillRect(w * 0.3 - 28, h * 0.22 - 2, 56, 6);            // baret
    x.fillRect(w * 0.7 - 5, h * 0.2 - 26, 10, 52); x.fillRect(w * 0.7 - 22, h * 0.2 - 10, 44, 8);                                // emniyet kemeri (sade)
    x.fillRect(w * 0.3 - 20, h * 0.47 - 6, 40, 20); x.fillRect(w * 0.3 - 20, h * 0.47 - 22, 16, 18);                             // iş ayakkabısı
    x.beginPath(); x.arc(w * 0.7, h * 0.47, 20, 0, Math.PI * 2); x.fill(); x.fillStyle = '#1f5fa8'; x.beginPath(); x.arc(w * 0.7, h * 0.47, 12, 0, Math.PI * 2); x.fill(); // eldiven (sade)
    x.fillStyle = '#111'; x.font = 'bold 13px sans-serif'; x.textAlign = 'center';
    x.fillText('KİŞİSEL KORUYUCU', w / 2, h * 0.74); x.fillText('DONANIM ZORUNLUDUR', w / 2, h * 0.8);
    x.font = '11px sans-serif'; x.fillText('Baret · emniyet kemeri', w / 2, h * 0.88); x.fillText('iş ayakkabısı · eldiven', w / 2, h * 0.93);
  }, 0.92, kapiOrta + 0.35);
  // sahanlık ve dış merdiven: kaide yakasının üstünden zemine
  const sahanlikY = kapiY0 - 0.08;
  const sah = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 1.3), M.izgara); sah.position.set(0, sahanlikY, kR + 0.65); dis.add(sah);
  izgaraTex.repeat.set(4, 4);
  const zeminY = 0.83, basamak = 16, ris = (sahanlikY - zeminY) / basamak, run = 0.29, z0 = kR + 1.3;
  for (let i = 0; i < basamak; i++) {
    const y = sahanlikY - ris * (i + 1), z = z0 + run * (i + 0.5);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, run - 0.02), M.izgara); b.position.set(0, y + 0.02, z); dis.add(b);
  }
  const zSon = z0 + run * basamak;
  for (const sx of [-0.55, 0.55]) {
    cubuk(new THREE.Vector3(sx, sahanlikY - 0.05, z0), new THREE.Vector3(sx, zeminY, zSon), 0.035, M.galvaniz, dis, 6);         // taşıyıcı
    cubuk(new THREE.Vector3(sx, sahanlikY + 1.0, z0 - 0.4), new THREE.Vector3(sx, zeminY + 1.0, zSon), 0.022, M.galvaniz, dis, 6);  // küpeşte
    for (let i = 0; i <= 4; i++) { const f = i / 4, z = THREE.MathUtils.lerp(z0 - 0.4, zSon, f), y = THREE.MathUtils.lerp(sahanlikY, zeminY, Math.max(0, (z - z0) / (zSon - z0))); cubuk(new THREE.Vector3(sx, y, z), new THREE.Vector3(sx, y + 1.0, z), 0.018, M.galvaniz, dis, 6); }
  }
  for (const sx of [-0.85, 0.85]) cubuk(new THREE.Vector3(sx, sahanlikY, kR + 0.05), new THREE.Vector3(sx, sahanlikY + 1.05, kR + 0.05), 0.02, M.galvaniz, dis, 6);
  for (const sx of [-0.85, 0.85]) cubuk(new THREE.Vector3(sx, sahanlikY + 1.05, kR + 0.05), new THREE.Vector3(sx, sahanlikY + 1.05, kR + 1.28), 0.022, M.galvaniz, dis, 6);
  // kapı üstü lamba
  kutu(0.24, 0.08, 0.14, M.koyu, 0, kapiY1 + 0.32, kR + 0.08, dis);
  kutu(0.2, 0.02, 0.1, M.lamba, 0, kapiY1 + 0.27, kR + 0.1, dis);

  /* ---------------- iç: platformlar, flanşlar ---------------- */
  const ic = new THREE.Group(); g.add(ic);
  const lambaTex = doku(64, 64, (x, w, h) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,215,.9)'); gr.addColorStop(0.3, 'rgba(255,220,180,.28)'); gr.addColorStop(1, 'rgba(255,210,170,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
  const haleMat = new THREE.SpriteMaterial({ map: lambaTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0.45 });

  // merdiven: giriş katında duvar dibinden, yaw katındaki nasel kapağının altına (duvar boyunca hafif eğik)
  const merdivenYon = kapakXZ.clone().normalize();
  const mAlt = new THREE.Vector3(merdivenYon.x * (rIc(tabanY) - 0.35), tabanY, merdivenYon.y * (rIc(tabanY) - 0.35));
  const mUst = new THREE.Vector3(kapakXZ.x, towerTopY + 0.4, kapakXZ.y);
  const merdivenXZ = y => { const f = (y - mAlt.y) / (mUst.y - mAlt.y); return new THREE.Vector2(THREE.MathUtils.lerp(mAlt.x, mUst.x, f), THREE.MathUtils.lerp(mAlt.z, mUst.z, f)); };
  const platformlar = [];
  function platformKur(y, i) {
    const r = rIc(y) - 0.02;
    const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false);
    if (i > 0) {   // asansör boşluğu (giriş katında kabin zemine oturur)
      const h = new THREE.Path(); const hx = ASN.gen / 2 + 0.12, hz0 = -(ASN.z) - ASN.der / 2 - 0.12, hz1 = -(ASN.z) + ASN.der / 2 + 0.12;
      h.moveTo(-hx, hz0); h.lineTo(hx, hz0); h.lineTo(hx, hz1); h.lineTo(-hx, hz1); h.lineTo(-hx, hz0); s.holes.push(h);
      const m = merdivenXZ(y), dl = new THREE.Path(); dl.absarc(m.x, -m.y, 0.24, 0, Math.PI * 2, true); s.holes.push(dl);   // merdiven boşluğu
    }
    const geo = new THREE.ShapeGeometry(s, 40); geo.rotateX(-Math.PI / 2);   // şekil y → -z; asansör z'si buna göre ters verildi
    const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 1.4, uv.getY(k) * 1.4);
    const m = new THREE.Mesh(geo, M.izgara); m.position.y = y; ic.add(m);
    kutu(ASN.gen + 0.24, 0.12, 0.04, M.sari, 0, y + 0.06, ASN.z + ASN.der / 2 + 0.12, ic).visible = i > 0;      // boşluk kenar bandı
    platformlar.push(m);
  }
  platY.forEach(platformKur);
  // flanş halkaları ve cıvatalar
  const civataGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.09, 6);
  const civataN = hafif ? 0 : 96;
  const civata = civataN ? new THREE.InstancedMesh(civataGeo, M.galvaniz, civataN * flansY.length * 2) : null;
  let ci = 0; const mt = new THREE.Matrix4();
  flansY.forEach(y => {
    const r = rIc(y);
    const tor = new THREE.Mesh(new THREE.TorusGeometry(r - 0.06, 0.07, 6, 56), M.celik); tor.rotation.x = Math.PI / 2; tor.position.y = y; ic.add(tor);
    if (civata) for (let k = 0; k < civataN; k++) {
      const a = k / civataN * Math.PI * 2;
      for (const dy of [-0.09, 0.09]) { mt.makeTranslation(Math.cos(a) * (r - 0.1), y + dy, Math.sin(a) * (r - 0.1)); civata.setMatrixAt(ci++, mt); }
    }
  });
  if (civata) ic.add(civata);

  /* ---------------- servis lambaları: duvar boyu, her ~6 m ---------------- */
  const lambaYon = 2.35;   // kule yerelinde açı (rad): merdiven ve asansörden ayrı bir duvar
  const lambaGeo = new THREE.BoxGeometry(0.1, 0.34, 0.06);
  for (let y = tabanY + 2.3; y < towerTopY - 1; y += 6.1) {
    const r = rIc(y) - 0.05, x = Math.sin(lambaYon) * r, z = Math.cos(lambaYon) * r;
    const l = new THREE.Mesh(lambaGeo, M.lamba); l.position.set(x, y, z); l.rotation.y = lambaYon; ic.add(l);
    const s = new THREE.Sprite(haleMat); s.position.set(x * 0.94, y, z * 0.94); s.scale.set(0.62, 0.62, 1); ic.add(s);
  }

  /* ---------------- merdiven + düşme durdurucu ray ---------------- */
  const merdiven = new THREE.Group(); ic.add(merdiven);
  {
    const basamakGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 6); basamakGeo.rotateZ(Math.PI / 2);
    const disa = new THREE.Vector3(merdivenYon.x, 0, merdivenYon.y);
    const yan = new THREE.Vector3(-merdivenYon.y, 0, merdivenYon.x).multiplyScalar(0.21);
    cubuk(mAlt.clone().add(yan), mUst.clone().add(yan), 0.02, M.galvaniz, merdiven, 6);
    cubuk(mAlt.clone().sub(yan), mUst.clone().sub(yan), 0.02, M.galvaniz, merdiven, 6);
    cubuk(mAlt.clone().addScaledVector(disa, 0.06), mUst.clone().addScaledVector(disa, 0.06), 0.014, M.sari, merdiven, 4);   // düşme durdurucu ray
    const n = Math.floor((mUst.y - mAlt.y) / 0.28);
    const basamaklar = new THREE.InstancedMesh(basamakGeo, M.galvaniz, n);
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(merdivenYon.x, merdivenYon.y));
    const s1 = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    for (let i = 0; i < n; i++) { p.lerpVectors(mAlt, mUst, i / n); mt.compose(p, q, s1); basamaklar.setMatrixAt(i, mt); }
    merdiven.add(basamaklar);
    const kb = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.025, 6, 24), M.sari); kb.rotation.x = Math.PI / 2;
    const ku = merdivenXZ(ustY); kb.position.set(ku.x, ustY + 0.04, ku.y); merdiven.add(kb);
  }

  /* ---------------- kablo demeti: yaw deliğinden duvara, aşağı ---------------- */
  const kabloYon = -2.2;
  const kN = hafif ? 3 : 6;
  for (let k = 0; k < kN; k++) {
    const a = kabloYon + (k - kN / 2) * 0.05;
    const alt = new THREE.Vector3(Math.sin(a) * (rIc(tabanY) - 0.1), tabanY, Math.cos(a) * (rIc(tabanY) - 0.1));
    const ust = new THREE.Vector3(Math.sin(a) * (rIc(towerTopY) - 0.1), towerTopY - 0.6, Math.cos(a) * (rIc(towerTopY) - 0.1));
    cubuk(alt, ust, 0.028, M.kablo, ic, 6);
  }
  if (!hafif) for (let y = tabanY + 1.2; y < towerTopY - 1; y += 2.4) {    // kelepçe
    const r = rIc(y) - 0.1; kutu(0.46, 0.06, 0.08, M.galvaniz, Math.sin(kabloYon) * r, y, Math.cos(kabloYon) * r, ic).rotation.y = kabloYon + Math.PI / 2;
  }

  /* ---------------- servis asansörü: kılavuz teller + kabin ---------------- */
  for (const sx of [-ASN.gen / 2 - 0.06, ASN.gen / 2 + 0.06]) cubuk(new THREE.Vector3(sx, tabanY, ASN.z), new THREE.Vector3(sx, towerTopY - 0.5, ASN.z), 0.006, M.galvaniz, ic, 4);
  cubuk(new THREE.Vector3(0, tabanY, ASN.z - ASN.der / 2 - 0.05), new THREE.Vector3(0, towerTopY - 0.5, ASN.z - ASN.der / 2 - 0.05), 0.008, M.galvaniz, ic, 4);   // taşıyıcı halat
  const kabin = new THREE.Group(); kabin.position.set(ASN.x, tabanY, ASN.z); ic.add(kabin);
  const agTex = doku(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(130,136,140,1)'; x.lineWidth = 1.4; for (let i = 0; i <= w; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } });
  agTex.wrapS = agTex.wrapT = THREE.RepeatWrapping; agTex.repeat.set(12, 32);
  const agMat = new THREE.MeshStandardMaterial({ map: agTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.7 });
  const { gen: kw, der: kd, yuk: kh } = ASN;
  kutu(kw, 0.06, kd, M.izgara, 0, 0.03, 0, kabin);
  kutu(kw, 0.05, kd, M.celik, 0, kh, 0, kabin);
  for (const sx of [-kw / 2, kw / 2]) for (const sz of [-kd / 2, kd / 2]) kutu(0.04, kh, 0.04, M.sari, sx, kh / 2, sz, kabin);
  for (const sx of [-kw / 2, kw / 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(kd, kh - 0.1), agMat); p.rotation.y = Math.PI / 2; p.position.set(sx, kh / 2, 0); kabin.add(p); }
  { const p = new THREE.Mesh(new THREE.PlaneGeometry(kw, kh - 0.1), agMat); p.position.set(0, kh / 2, -kd / 2); kabin.add(p); }
  for (const y of [1.0, 2.0]) for (const sx of [-kw / 2, kw / 2]) kutu(0.03, 0.03, kd, M.sari, sx, y, 0, kabin);
  const kabinKapi = new THREE.Mesh(new THREE.PlaneGeometry(kw - 0.02, kh - 0.12), agMat); kabinKapi.position.set(0, kh / 2, kd / 2 + 0.01); kabin.add(kabinKapi);
  kutu(0.16, 0.26, 0.08, M.koyu, kw / 2 - 0.12, 1.25, -kd / 2 + 0.06, kabin);                         // kumanda kutusu
  const acil = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12), M.kirmizi); acil.rotation.x = Math.PI / 2; acil.position.set(kw / 2 - 0.12, 1.31, -kd / 2 + 0.11); kabin.add(acil);
  kutu(0.24, 0.02, 0.06, M.lamba, 0, kh - 0.04, 0, kabin);
  const kabinIsik = new THREE.PointLight(0xffe9cf, hafif ? 2.2 : 1.7, 8, 1.5); kabinIsik.position.set(0, kh - 0.25, 0.1); kabin.add(kabinIsik);
  const girisIsik = new THREE.PointLight(0xffe4c4, hafif ? 3 : 2.4, 9, 1.5); girisIsik.position.set(0.4, tabanY + 2.6, 0.9); ic.add(girisIsik);
  const ustIsik = new THREE.PointLight(0xffe4c4, hafif ? 2 : 1.5, 7, 1.6); ustIsik.position.set(kapakXZ.x * 0.4, ustY + 1.25, kapakXZ.y * 0.4 + 0.3); ic.add(ustIsik);
  // nasel kapağı: yukarıdan, makine dairesinin ışığı süzülür
  { const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), new THREE.MeshBasicMaterial({ color: 0xfff0da, fog: false }));
    kp.rotation.x = Math.PI / 2; kp.position.set(kapakXZ.x, towerTopY - 0.12, kapakXZ.y); ic.add(kp);
    const kh = new THREE.Sprite(haleMat.clone()); kh.material.opacity = 0.7; kh.position.set(kapakXZ.x, towerTopY - 0.25, kapakXZ.y); kh.scale.set(2.0, 2.0, 1); ic.add(kh);
    for (const [dx, dz, w, d] of [[0, -0.4, 0.86, 0.06], [0, 0.4, 0.86, 0.06], [-0.4, 0, 0.06, 0.86], [0.4, 0, 0.06, 0.86]]) kutu(w, 0.08, d, M.sari, kapakXZ.x + dx, towerTopY - 0.16, kapakXZ.y + dz, ic);
  }
  kutu(0.1, 0.34, 0.06, M.lamba, Math.sin(lambaYon) * (rIc(ustY + 1.4) - 0.05), ustY + 1.4, Math.cos(lambaYon) * (rIc(ustY + 1.4) - 0.05), ic).rotation.y = lambaYon;

  return {
    grup: g, kanatPivot, kabin, kabinKapi, kabinIsik, girisIsik, ustIsik, ic, dis,
    olcu: { tabanY, ustY, ASN, rIc, rDis, towerTopY, kapiY0, kapiY1, kR },
  };
}

/* taban segmentine kapı boşluğu açar: gövde, boşluk bırakılarak yeniden kurulur, üst ve alt yamalar eklenir */
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
  // eski düz kapı kutusu artık gerekmiyor
  seg.children.forEach(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && Math.abs(o.geometry.parameters.width - 0.9) < 0.01) o.visible = false; });
}
