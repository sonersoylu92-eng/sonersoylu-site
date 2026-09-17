// Nordex N117/3000 Delta — parametrik saha sahnesi
// Ana ölçüler (rotor çapı, kanat uzunluğu, göbek yüksekliği, kule çapları)
// üretici verilerinden; nasel oranları ve kanat profil dağılımı yaklaşıktır.
// 1 birim = 1 metre.
import * as THREE from '/assets/vendor/three.module.min.js';
import { OrbitControls } from '/assets/vendor/OrbitControls.js';

/* ---------------------------------------------------------------- veriler */

export const SPEC = {
  hubHeight: 120,         // m — N117/3000'in çelik kule seçeneği
  rotorDiameter: 116.8,
  bladeLength: 57.3,      // NR58.5 kanat
  hubDiameter: 3.6,
  towerBase: 4.30,        // m dış çap (karayolu taşıma sınırı)
  towerTop: 3.00,
  nacelleLen: 12.4,       // Delta naseli Gamma'ya göre genişletildi
  nacelleWid: 4.20,
  nacelleHei: 4.00,
  tilt: 5 * Math.PI / 180,
  coning: 2.5 * Math.PI / 180,
};

// kule segmentleri: alttan üste (uzunluk m, alt çap, üst çap)
const TOWER_SEGMENTS = (() => {
  const H = SPEC.hubHeight - 2.4;           // nasel yaw düzlemi
  const n = 5;
  const segs = [];
  let y = 0;
  for (let i = 0; i < n; i++) {
    const h = H / n;
    const d0 = THREE.MathUtils.lerp(SPEC.towerBase, SPEC.towerTop, y / H);
    const d1 = THREE.MathUtils.lerp(SPEC.towerBase, SPEC.towerTop, (y + h) / H);
    segs.push({ y0: y, h, d0, d1 });
    y += h;
  }
  return segs;
})();

/* --------------------------------------------------------------- malzeme */

const MAT = {
  steel:   new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.55, metalness: 0.15 }),
  steelDk: new THREE.MeshStandardMaterial({ color: 0xcfccc5, roughness: 0.6,  metalness: 0.2 }),
  grp:     new THREE.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 0.42, metalness: 0.02 }),
  blade:   new THREE.MeshStandardMaterial({ color: 0xefece6, roughness: 0.38, metalness: 0.02, side: THREE.DoubleSide }),
  tip:     new THREE.MeshStandardMaterial({ color: 0xc0392f, roughness: 0.45 }),
  cast:    new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.7,  metalness: 0.35 }),
  dark:    new THREE.MeshStandardMaterial({ color: 0x4a5158, roughness: 0.7,  metalness: 0.3 }),
  concrete:new THREE.MeshStandardMaterial({ color: 0xcfcac0, roughness: 0.95 }),
  rebar:   new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.8, metalness: 0.4 }),
  soil:    new THREE.MeshStandardMaterial({ color: 0xb2a48c, roughness: 1 }),
  ground:  new THREE.MeshStandardMaterial({ color: 0xb9b49f, roughness: 1 }),
  accent:  new THREE.MeshStandardMaterial({ color: 0xc0392f, roughness: 0.6 }),
  glassy:  new THREE.MeshStandardMaterial({ color: 0x2f3439, roughness: 0.3, metalness: 0.5 }),
};

/* ------------------------------------------------------------ kanat profili */

// NACA 63-4xx ailesine yakın, normalize (x 0..1, y ±)
const AF_X = [1,.95,.9,.8,.7,.6,.5,.4,.3,.2,.15,.1,.075,.05,.025,.0125,0,
              .0125,.025,.05,.075,.1,.15,.2,.3,.4,.5,.6,.7,.8,.9,.95,1];
const AF_Y = [0,.0147,.0271,.0489,.0665,.0796,.0879,.0905,.0863,.0741,.0651,.0532,.0459,.0369,.0263,.0189,0,
             -.0151,-.0203,-.0269,-.0313,-.0348,-.0399,-.0431,-.0451,-.0428,-.0369,-.0292,-.0209,-.0128,-.0055,-.0027,0];

// istasyonlar: r/R, kiriş (m), burulma (°), kalınlık oranı (t/c), daire karışımı
const STATIONS = [
  { r: 0.000, c: 2.60, tw: 14.0, tc: 1.00,  cyl: 1.00 },
  { r: 0.030, c: 2.60, tw: 14.0, tc: 1.00,  cyl: 1.00 },
  { r: 0.060, c: 2.80, tw: 14.0, tc: 0.78,  cyl: 0.80 },
  { r: 0.110, c: 3.20, tw: 13.0, tc: 0.52,  cyl: 0.40 },
  { r: 0.170, c: 3.48, tw: 11.0, tc: 0.38,  cyl: 0.12 },
  { r: 0.220, c: 3.50, tw:  9.0, tc: 0.32,  cyl: 0.00 },
  { r: 0.300, c: 3.30, tw:  6.8, tc: 0.27,  cyl: 0.00 },
  { r: 0.400, c: 3.00, tw:  4.8, tc: 0.23,  cyl: 0.00 },
  { r: 0.500, c: 2.68, tw:  3.4, tc: 0.21,  cyl: 0.00 },
  { r: 0.600, c: 2.36, tw:  2.4, tc: 0.20,  cyl: 0.00 },
  { r: 0.700, c: 2.02, tw:  1.6, tc: 0.19,  cyl: 0.00 },
  { r: 0.800, c: 1.68, tw:  1.0, tc: 0.185, cyl: 0.00 },
  { r: 0.880, c: 1.38, tw:  0.6, tc: 0.18,  cyl: 0.00 },
  { r: 0.940, c: 1.10, tw:  0.3, tc: 0.175, cyl: 0.00 },
  { r: 0.980, c: 0.78, tw:  0.1, tc: 0.18,  cyl: 0.00 },
  { r: 1.000, c: 0.42, tw:  0.0, tc: 0.22,  cyl: 0.00 },
];

function sectionPoints(st, L) {
  const n = AF_X.length;
  const pts = [];
  const tw = st.tw * Math.PI / 180;
  const cos = Math.cos(tw), sin = Math.sin(tw);
  // profil merkezi: kiriş üzerinde %30 (pitch ekseni)
  for (let i = 0; i < n; i++) {
    // airfoil
    let x = (AF_X[i] - 0.30) * st.c;
    let y = AF_Y[i] * st.c * (st.tc / 0.18);
    // silindir karışımı (kök)
    if (st.cyl > 0) {
      const a = (i / (n - 1)) * Math.PI * 2;
      const R = st.c * 0.5 * 0.98;
      const cx = Math.cos(a) * R, cy = Math.sin(a) * R;
      x = THREE.MathUtils.lerp(x, cx, st.cyl);
      y = THREE.MathUtils.lerp(y, cy, st.cyl);
    }
    pts.push(new THREE.Vector2(x * cos - y * sin, x * sin + y * cos));
  }
  return pts;
}

function buildBlade(L) {
  const rows = STATIONS.map(st => {
    const p2 = sectionPoints(st, L);
    const span = st.r * L;
    // uca doğru hafif prebend (rüzgâr yönüne, +z)
    const bend = Math.pow(st.r, 2.6) * 2.4;
    return p2.map(p => new THREE.Vector3(p.x, span, p.y + bend));
  });

  const cols = rows[0].length;
  const pos = [], idx = [];
  rows.forEach(r => r.forEach(v => pos.push(v.x, v.y, v.z)));
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();

  const blade = new THREE.Group();
  blade.add(new THREE.Mesh(g, MAT.blade));

  // kök flanşı
  const root = new THREE.Mesh(
    new THREE.CylinderGeometry(1.12, 1.12, 0.45, 40),
    MAT.cast
  );
  root.position.y = 0.1;
  blade.add(root);

  // uç işareti (görünürlük boyası)
  const tipRows = rows.slice(-4);
  const tp = [], ti = [];
  tipRows.forEach(r => r.forEach(v => tp.push(v.x, v.y, v.z)));
  for (let i = 0; i < tipRows.length - 1; i++)
    for (let j = 0; j < cols - 1; j++) {
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      ti.push(a, c, b, b, c, d);
    }
  const tg = new THREE.BufferGeometry();
  tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3));
  tg.setIndex(ti);
  tg.computeVertexNormals();
  const tipMesh = new THREE.Mesh(tg, MAT.tip);
  tipMesh.scale.setScalar(1.004);
  blade.add(tipMesh);

  blade.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return blade;
}

/* ------------------------------------------------------------- bileşenler */

function ringFlange(r, t = 0.18) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r + 0.09, r + 0.09, t, 48), MAT.steelDk);
}

function buildFoundation() {
  const g = new THREE.Group();

  // geri dolgu tümseği
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(10.4, 11.6, 0.55, 56), MAT.soil);
  mound.position.y = 0.22; mound.receiveShadow = true; mound.castShadow = true;
  g.add(mound);

  // görünen plaka kenarı
  const slab = new THREE.Mesh(new THREE.CylinderGeometry(8.2, 8.6, 0.55, 56), MAT.concrete);
  slab.position.y = 0.55; slab.receiveShadow = true; slab.castShadow = true;
  g.add(slab);

  // kaide (pedestal)
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(3.15, 5.4, 2.05, 56), MAT.concrete);
  ped.position.y = 1.85; ped.castShadow = true; ped.receiveShadow = true;
  g.add(ped);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.15, 0.5, 56), MAT.concrete);
  collar.position.y = 3.05; collar.castShadow = true;
  g.add(collar);

  // ankraj kafesi (görünen üst bölüm)
  const cage = new THREE.Group();
  const N = 44;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = SPEC.towerBase / 2 + 0.10;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.0, 6), MAT.rebar);
    bar.position.set(Math.cos(a) * r, 3.6, Math.sin(a) * r);
    cage.add(bar);
  }
  const topRing = new THREE.Mesh(new THREE.TorusGeometry(SPEC.towerBase / 2 + 0.10, 0.045, 8, 64), MAT.rebar);
  topRing.rotation.x = Math.PI / 2; topRing.position.y = 4.03;
  cage.add(topRing);
  const midRing = new THREE.Mesh(new THREE.TorusGeometry(SPEC.towerBase / 2 + 0.10, 0.04, 8, 64), MAT.rebar);
  midRing.rotation.x = Math.PI / 2; midRing.position.y = 3.4;
  cage.add(midRing);
  cage.name = 'cage';
  g.add(cage);

  // taban flanşı
  const bf = ringFlange(SPEC.towerBase / 2, 0.26);
  bf.position.y = 3.43; bf.name = 'baseFlange';
  g.add(bf);

  return g;
}

function buildTowerSegment(seg, withDoor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(seg.d1 / 2, seg.d0 / 2, seg.h, 48, 1, true),
    MAT.steel
  );
  body.position.y = seg.h / 2;
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  const f = ringFlange(seg.d1 / 2);
  f.position.y = seg.h - 0.09;
  g.add(f);

  if (withDoor) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.0, 0.12), MAT.dark);
    door.position.set(0, 1.6, seg.d0 / 2 - 0.02);
    g.add(door);
  }
  return g;
}

function buildNacelle() {
  const g = new THREE.Group();
  const { nacelleLen: L, nacelleWid: W, nacelleHei: H } = SPEC;

  // yaw yatağı ve ana çatı
  const yawRing = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.55, 0.5, 40), MAT.cast);
  yawRing.position.y = -H / 2 - 0.05;
  g.add(yawRing);

  // GRP kapak — yuvarlatılmış gövde
  const shell = new THREE.Mesh(roundedBox(W, H, L, 0.55), MAT.grp);
  shell.castShadow = true; shell.receiveShadow = true;
  g.add(shell);

  // burun konisi (hub adaptörü tarafı)
  const nose = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.35, 1.2, 32), MAT.grp);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = -L / 2 - 0.5;
  nose.castShadow = true;
  g.add(nose);

  // arka bölme: soğutucu ve anemometre direği
  const cooler = new THREE.Mesh(new THREE.BoxGeometry(W * 0.72, 0.75, 1.5), MAT.steelDk);
  cooler.position.set(0, H / 2 + 0.35, L / 2 - 1.4);
  g.add(cooler);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), MAT.dark);
  mast.position.set(0, H / 2 + 1.0, L / 2 - 0.4);
  g.add(mast);
  const anem = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), MAT.dark);
  anem.position.set(0, H / 2 + 1.75, L / 2 - 0.4);
  g.add(anem);

  // servis kapağı / helideck izi
  const hatch = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 1.2), MAT.steelDk);
  hatch.position.set(0, H / 2 + 0.02, 0.6);
  g.add(hatch);

  // yan yazı şeridi (Nordex kimliği yerine nötr bant)
  const band = new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.22, 3.2), MAT.steelDk);
  band.position.set(0, -0.2, -1.2);
  g.add(band);

  return g;
}

// iç aksam: kullanıcının "kesit" görünümü için
function buildDrivetrain() {
  const g = new THREE.Group();

  const mainShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 2.6, 24), MAT.cast);
  mainShaft.rotation.x = Math.PI / 2;
  mainShaft.position.z = -3.5;
  g.add(mainShaft);

  const bearing = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.85, 28), MAT.dark);
  bearing.rotation.x = Math.PI / 2;
  bearing.position.z = -4.3;
  g.add(bearing);

  const gearbox = new THREE.Mesh(roundedBox(2.0, 2.0, 2.6, 0.25), MAT.cast);
  gearbox.position.z = -1.4;
  g.add(gearbox);

  const hss = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.3, 16), MAT.steelDk);
  hss.rotation.x = Math.PI / 2; hss.position.z = 0.3;
  g.add(hss);

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.515, 0.515, 0.06, 32), MAT.dark);
  disc.rotation.x = Math.PI / 2; disc.position.z = 0.75;
  g.add(disc);

  const gen = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 2.6, 28), MAT.steelDk);
  gen.rotation.x = Math.PI / 2; gen.position.z = 2.4;
  g.add(gen);

  const genFin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 2.4), MAT.dark);
  genFin.position.set(0, 0.95, 2.4);
  g.add(genFin);

  const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 8.4), MAT.cast);
  bed.position.set(0, -1.35, -0.4);
  g.add(bed);

  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildHub() {
  const g = new THREE.Group();
  const R = SPEC.hubDiameter / 2;

  // dökme demir göbek
  const body = new THREE.Mesh(new THREE.SphereGeometry(R * 0.94, 32, 22), MAT.cast);
  body.scale.set(1, 1, 0.9);
  g.add(body);

  // GRP spinner — göbeği saran kapak
  const shell = new THREE.Mesh(new THREE.SphereGeometry(R * 1.14, 32, 24), MAT.grp);
  shell.scale.set(1, 1, 0.86);
  g.add(shell);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(R * 1.10, 2.3, 32), MAT.grp);
  nose.rotation.x = -Math.PI / 2;
  nose.position.z = -1.15;
  g.add(nose);

  // 3 pitch yatağı — kanat kökünün oturduğu bilezik
  for (let i = 0; i < 3; i++) {
    const a2 = i * Math.PI * 2 / 3;
    const r = R * 1.06;
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.34, 1.15, 32), MAT.cast);
    seat.position.set(Math.sin(a2) * r, Math.cos(a2) * r, 0);
    seat.rotation.z = -a2;
    g.add(seat);
    const lip = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.26, 0.16, 32), MAT.dark);
    lip.position.set(Math.sin(a2) * (r + 0.55), Math.cos(a2) * (r + 0.55), 0);
    lip.rotation.z = -a2;
    g.add(lip);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildCrane() {
  const g = new THREE.Group();

  const track = new THREE.Mesh(new THREE.BoxGeometry(7.5, 1.4, 12), MAT.dark);
  track.position.y = 0.7;
  g.add(track);

  const house = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 8.5), MAT.accent);
  house.position.y = 3.2;
  g.add(house);

  const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 3.0, 3.0), MAT.dark);
  counter.position.set(0, 3.4, 5.6);
  g.add(counter);

  // kafes bom
  const boom = new THREE.Group();
  const len = 96;
  const chords = [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]];
  chords.forEach(([x, z]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, len, 8), MAT.accent);
    c.position.set(x, len / 2, z);
    boom.add(c);
  });
  for (let i = 0; i < 22; i++) {
    const y = 2 + i * (len - 4) / 21;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.05, 6, 4), MAT.accent);
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI / 4;
    ring.position.y = y;
    boom.add(ring);
  }
  boom.position.y = 4.6;
  boom.rotation.x = -0.30;  // ~73° yükseklik
  boom.name = 'boom';
  g.add(boom);

  // halat + kanca
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 6), MAT.dark);
  rope.name = 'rope';
  g.add(rope);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.4), MAT.dark);
  hook.name = 'hook';
  g.add(hook);

  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

function buildDistantTurbine() {
  const g = new THREE.Group();
  const H = 78;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 2.15, H, 12), MAT.steel);
  mast.position.y = H / 2;
  g.add(mast);
  const nac = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 9.6), MAT.grp);
  nac.position.y = H + 1.6;
  g.add(nac);
  const spin = new THREE.Group();
  spin.position.set(0, H + 1.6, -5.6);
  g.add(spin);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(1.5, 12, 8), MAT.cast);
  spin.add(hub);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.6, 44, 0.5), MAT.blade);
    b.geometry.translate(0, 22, 0);
    b.rotation.z = i * Math.PI * 2 / 3;
    spin.add(b);
  }
  g.userData.spin = spin;
  return g;
}

function buildPerson() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.85, 6, 12), MAT.accent);
  body.position.y = 1.02;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), MAT.dark);
  head.position.y = 1.70;
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.55, 6, 10), MAT.dark);
  legs.position.y = 0.42;
  [body, head, legs].forEach(m => { m.castShadow = true; g.add(m); });
  return g;
}

function roundedBox(w, h, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -d / 2);
  return g;
}

const SKY = {
  day:    ['#5f93c4', '#95b8d6', '#cfd9dc', '#c6bda9'],
  sunset: ['#2c4770', '#6d7a97', '#d9a273', '#c8a382'],
};

function skyDome(mode) {
  const stops = (SKY[mode] || SKY.day).map(h => new THREE.Color(h));
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      c0: { value: stops[0] }, c1: { value: stops[1] },
      c2: { value: stops[2] }, c3: { value: stops[3] },
    },
    vertexShader: `
      varying vec3 vP;
      void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 c0,c1,c2,c3; varying vec3 vP;
      void main(){
        float h = clamp(vP.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(c3, c2, smoothstep(0.20, 0.50, h));
        c = mix(c, c1, smoothstep(0.46, 0.66, h));
        c = mix(c, c0, smoothstep(0.62, 0.96, h));
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(2200, 40, 24), mat);
  m.renderOrder = -1;
  return m;
}

/* ------------------------------------------------------------------ arazi */

// deterministik, kütüphanesiz yükselti alanı — Ege tepeleri hissi
function hills(x, z) {
  return (
    Math.sin(x * 0.0042 + 1.3) * Math.cos(z * 0.0037 - 0.7) * 26 +
    Math.sin(x * 0.0091 - 2.1) * Math.cos(z * 0.0104 + 1.9) * 11 +
    Math.sin((x + z) * 0.0175 + 0.4) * 4.2 +
    Math.sin(x * 0.041) * Math.cos(z * 0.037) * 1.1
  );
}

function buildTerrain() {
  const size = 2600, seg = 190;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position;
  const col = [];
  const soil = new THREE.Color(0xc2a87e);
  const scrub = new THREE.Color(0x76835a);
  const rock = new THREE.Color(0x9c968a);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const d = Math.hypot(x, z);
    // montaj platformu düz kalsın, dışarı doğru araziye karışsın
    const blend = THREE.MathUtils.smoothstep(d, 52, 190);
    const h = (hills(x, z) + Math.sin(x * 0.13 + z * 0.09) * 0.5) * blend;
    pos.setY(i, h);

    const veg = THREE.MathUtils.clamp(
      0.5 + 0.34 * Math.sin(x * 0.021 + 0.7) * Math.cos(z * 0.026 - 1.2)
          + 0.22 * Math.sin(x * 0.078 - 1.7) * Math.cos(z * 0.069 + 0.5), 0, 1);
    const steep = Math.min(Math.abs(hills(x + 7, z) - hills(x - 7, z)) * 0.10, 1);
    tmp.copy(soil).lerp(scrub, Math.min(veg * 1.15, 1) * blend).lerp(rock, steep * 0.45);
    col.push(tmp.r, tmp.g, tmp.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();

  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ sahne */

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 820 ? 1.6 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc9cfd0);
  const sky = skyDome('day');
  scene.add(sky);
  scene.fog = new THREE.Fog(0xc9cfd0, 520, 2400);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 6000);
  camera.position.set(146, 96, 182);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 14;
  controls.maxDistance = 900;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.target.set(0, 74, 0);

  // ışık
  const hemi = new THREE.HemisphereLight(0xdfe9f2, 0xb2a98f, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dd, 2.2);
  sun.position.set(-150, 245, 150);
  sun.castShadow = true;
  const small = Math.min(innerWidth, innerHeight) < 820;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  const d = 145;
  sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;  sun.shadow.camera.bottom = -d;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 620;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.5;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd6e4f2, 0.32);
  fill.position.set(120, 70, -140);
  scene.add(fill);

  // arazi
  const ground = buildTerrain();
  scene.add(ground);

  const padMat = new THREE.MeshStandardMaterial({ color: 0xc6bfae, roughness: 1 });
  const pad = new THREE.Mesh(new THREE.CircleGeometry(48, 56), padMat);
  pad.rotation.x = -Math.PI / 2; pad.position.y = 0.06; pad.receiveShadow = true;
  scene.add(pad);

  const roadMat = new THREE.MeshStandardMaterial({ color: 0xbdb5a2, roughness: 1 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(11, 300, 1, 60), roadMat);
  road.rotation.x = -Math.PI / 2;
  {
    const rp = road.geometry.attributes.position;
    for (let i = 0; i < rp.count; i++) {
      const lx = rp.getX(i), lz = rp.getZ(i);
      const wx = lx * Math.cos(0.42) - lz * Math.sin(0.42) - 96;
      const wz = lx * Math.sin(0.42) + lz * Math.cos(0.42) + 132;
      const dd = Math.hypot(wx, wz);
      rp.setY(i, hills(wx, wz) * THREE.MathUtils.smoothstep(dd, 52, 190) + 0.08);
    }
    road.geometry.computeVertexNormals();
  }
  road.rotation.z = 0.42;
  road.position.set(-96, 0, 132);
  road.receiveShadow = true;
  scene.add(road);

  /* ---- parçalar ---- */
  const parts = {};

  parts.foundation = buildFoundation();
  scene.add(parts.foundation);

  parts.towerSegs = TOWER_SEGMENTS.map((seg, i) => {
    const m = buildTowerSegment(seg, i === 0);
    m.position.y = 3.55 + seg.y0;
    scene.add(m);
    return m;
  });

  const towerTopY = 3.55 + TOWER_SEGMENTS.reduce((a, s) => a + s.h, 0);

  // nacelle grubu
  const yaw = new THREE.Group();
  yaw.position.y = towerTopY + SPEC.nacelleHei / 2 + 0.25;
  scene.add(yaw);
  parts.yaw = yaw;

  const tilt = new THREE.Group();
  tilt.rotation.x = -SPEC.tilt;
  yaw.add(tilt);

  parts.nacelle = buildNacelle();
  tilt.add(parts.nacelle);

  parts.drivetrain = buildDrivetrain();
  parts.drivetrain.visible = false;
  tilt.add(parts.drivetrain);

  // rotor
  const spin = new THREE.Group();
  spin.position.z = -SPEC.nacelleLen / 2 - 1.75;
  tilt.add(spin);
  parts.spin = spin;

  parts.hub = buildHub();
  spin.add(parts.hub);

  parts.blades = [];
  for (let i = 0; i < 3; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = i * Math.PI * 2 / 3;
    const cone = new THREE.Group();
    cone.rotation.x = SPEC.coning;
    const b = buildBlade(SPEC.bladeLength);
    b.position.y = SPEC.hubDiameter / 2 - 0.35;
    cone.add(b);
    holder.add(cone);
    spin.add(holder);
    parts.blades.push(holder);
  }

  // uzaktaki türbinler (saha hissi)
  parts.farm = new THREE.Group();
  [[-392, 330, 1.25], [-618, 420, 1.35], [338, 470, 1.3], [574, 318, 1.4], [-122, 556, 1.35], [146, 658, 1.3]]
    .forEach(([x, z, sc], i) => {
      const t = buildDistantTurbine();
      t.position.set(x, 0, z);
      t.rotation.y = (i * 0.7) % Math.PI;
      t.scale.setScalar(sc);
      t.userData.speed = 0.16 + i * 0.03;
      parts.farm.add(t);
    });
  scene.add(parts.farm);

  // etiket bağlantı noktaları (hotspot)
  const A = {};
  const mk = (parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); return o; };
  A.gearbox     = mk(tilt, 0, 0.7, -1.4);
  A.mainBearing = mk(tilt, 0, 0.6, -4.4);
  A.brake       = mk(tilt, 0.7, 0.2, 0.75);
  A.generator   = mk(tilt, 0, 0.9, 2.4);
  A.anemo       = mk(tilt, 0, SPEC.nacelleHei / 2 + 1.8, SPEC.nacelleLen / 2 - 0.4);
  A.yawDrive    = mk(yaw, 1.3, -SPEC.nacelleHei / 2 - 0.2, 0);
  A.pitch       = mk(spin, 1.7, 1.7, 0.3);
  A.bladeRoot   = mk(parts.blades[0], 1.2, 4.0, 0.4);
  A.cage        = new THREE.Object3D(); A.cage.position.set(0, 3.9, 2.4); scene.add(A.cage);
  A.flange      = new THREE.Object3D(); A.flange.position.set(2.2, 22.4, 0); scene.add(A.flange);
  parts.anchors = A;

  // vinç ve insan
  parts.crane = buildCrane();
  parts.crane.position.set(-40, 0, 10);
  parts.crane.rotation.y = Math.atan2(40, -10);
  scene.add(parts.crane);

  parts.person = buildPerson();
  parts.person.position.set(11, 0, 9);
  scene.add(parts.person);

  // yerdeki kanat (montaj öncesi sahada bekleyen)
  parts.groundBlade = (() => {
    const g = new THREE.Group();
    const b = buildBlade(SPEC.bladeLength);
    b.rotation.z = Math.PI / 2;
    b.rotation.y = 0.12;
    g.add(b);
    g.position.set(-26, 1.5, 46);
    g.rotation.y = 0.5;
    // sehpalar
    [8, 24, 38].forEach(x => {
      const st = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 2.6), MAT.dark);
      st.position.set(-x, -1.4 + 0.7, 0);
      g.add(st);
    });
    return g;
  })();
  scene.add(parts.groundBlade);

  function setLight(mode) {
    const sunset = mode === 'sunset';
    const st = (sunset ? SKY.sunset : SKY.day);
    ['c0', 'c1', 'c2', 'c3'].forEach((k, i) => sky.material.uniforms[k].value.set(st[i]));
    scene.background.set(sunset ? 0xc9ac8c : 0xc9cfd0);
    scene.fog.color.set(sunset ? 0xc9ac8c : 0xc9cfd0);
    sun.color.set(sunset ? 0xffab63 : 0xfff2dd);
    sun.intensity = sunset ? 2.3 : 2.2;
    sun.position.set(sunset ? -330 : -150, sunset ? 78 : 245, sunset ? 170 : 150);
    hemi.color.set(sunset ? 0xcdd4e0 : 0xdfe9f2);
    hemi.groundColor.set(sunset ? 0x6b6151 : 0xb2a98f);
    hemi.intensity = sunset ? 0.62 : 1.15;
    fill.intensity = sunset ? 0.18 : 0.32;
    renderer.toneMappingExposure = sunset ? 1.0 : 1.05;
  }

  return { renderer, scene, camera, controls, parts, towerTopY, SPEC, setLight };
}

/* ------------------------------------------------------------- aşamalar */

export const BAKIS = [
  { id: 'genel', ad: 'Genel', cam: { pos: [152, 104, -204], target: [0, 80, -4] } },
  { id: 'kule',  ad: 'Kule',  cam: { pos: [40, 26, 56],     target: [0, 40, 0] } },
  { id: 'nasel', ad: 'Nasel', cam: { pos: [17, 128, 26],    target: [0, 120.5, -1] } },
  { id: 'kanat', ad: 'Kanat', cam: { pos: [126, 158, -142], target: [0, 130, -8] } },
];
