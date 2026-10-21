/* makineler.js — Rüzgârın evrimi: her dönemin makinesi nokta bulutu olarak (metre cinsinden, temsili çizim).
 *
 * Her yapıcı { p: [x,y,z,...], r: [0/1], h: [hx,hy,hz,...] } üretir: r=1 olan noktalar kendi göbeği (h) çevresinde döner.
 * Ölçüler kaynaklı olanlarda gerçek (rotor çapı, kule, kanat boyu); 9.–17. yüzyıl yapıları ile bazı kule boyları
 * temsilidir — sayfada "temsili çizim" diye yazar. Rotorlar kameraya (+z) bakar; panemone dikey eksende döner.
 */

function yeni() { return { p: [], r: [], h: [] }; }
let _rnd = 1, _K = 1, _zemin = 0;   // _K: yoğunluk çarpanı (hazirla ayarlar), _zemin: 1 iken eklenen noktalar zemin/deniz
const zemin = (f) => { _zemin = 1; f(); _zemin = 0; };
function rnd() { _rnd = (_rnd * 16807) % 2147483647; return (_rnd - 1) / 2147483646; }
function nokta(Y, x, y, z, hub) { Y.p.push(x, y, z); if (hub) { Y.r.push(1); Y.h.push(hub[0], hub[1], hub[2]); } else { Y.r.push(_zemin ? 2 : 0); Y.h.push(0, 0, 0); } }

// a→b doğrusu boyunca, metre başına yog nokta
function cizgi(Y, a, b, yog, hub, sap = 0) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.ceil(L * yog * _K));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    nokta(Y, a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * sap, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * sap, a[2] + (b[2] - a[2]) * t + (rnd() - 0.5) * sap, hub);
  }
}
// çember: eksen 'y' (yatay düzlem) ya da 'z' (dikey düzlem, kameraya bakan)
function halka(Y, c, r, eksen, yog, hub) {
  const n = Math.max(8, Math.ceil(2 * Math.PI * r * yog * _K));
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, u = Math.cos(a) * r, v = Math.sin(a) * r;
    if (eksen === 'y') nokta(Y, c[0] + u, c[1], c[2] + v, hub); else nokta(Y, c[0] + u, c[1] + v, c[2], hub);
  }
}
// kutu: 12 kenar + yüzeylere seyrek dolgu
function kutu(Y, c, s, yog, hub, dolgu = 0.25) {
  const [x, y, z] = c, [w, h, d] = s.map(v => v / 2);
  const k = [[-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d], [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d]];
  [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
    .forEach(([i, j]) => cizgi(Y, [x + k[i][0], y + k[i][1], z + k[i][2]], [x + k[j][0], y + k[j][1], z + k[j][2]], yog, hub));
  const alan = 2 * (s[0] * s[1] + s[1] * s[2] + s[0] * s[2]), n = Math.ceil(alan * yog * yog * 0.02 * dolgu * 10 * _K);
  for (let i = 0; i < n; i++) {
    const f = Math.floor(rnd() * 6), u = rnd() * 2 - 1, v = rnd() * 2 - 1;
    const q = f < 2 ? [f ? w : -w, u * h, v * d] : f < 4 ? [u * w, f === 3 ? h : -h, v * d] : [u * w, v * h, f === 5 ? d : -d];
    nokta(Y, x + q[0], y + q[1], z + q[2], hub);
  }
}
// boru kule: alttan üste daralan, halkalar + yan çizgiler
function kule(Y, taban, r0, r1, boy, yog, halkaAra) {
  for (let yy = 0; yy <= boy; yy += halkaAra) { const r = r0 + (r1 - r0) * yy / boy; halka(Y, [taban[0], taban[1] + yy, taban[2]], r, 'y', yog * 0.6); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; cizgi(Y, [taban[0] + Math.cos(a) * r0, taban[1], taban[2] + Math.sin(a) * r0], [taban[0] + Math.cos(a) * r1, taban[1] + boy, taban[2] + Math.sin(a) * r1], yog * 0.7); }
}
// kafes kule: dört ayak, yatay kuşaklar ve çapraz bağlar
function kafes(Y, taban, a0, a1, boy, yog, kat) {
  const kose = (yy) => { const a = a0 + (a1 - a0) * yy / boy; return [[-a, -a], [a, -a], [a, a], [-a, a]].map(([u, v]) => [taban[0] + u, taban[1] + yy, taban[2] + v]); };
  const alt = kose(0), ust = kose(boy);
  for (let i = 0; i < 4; i++) cizgi(Y, alt[i], ust[i], yog);
  for (let k = 0; k <= kat; k++) {
    const yy = boy * k / kat, q = kose(yy);
    for (let i = 0; i < 4; i++) cizgi(Y, q[i], q[(i + 1) % 4], yog * 0.8);
    if (k < kat) { const q2 = kose(boy * (k + 1) / kat); for (let i = 0; i < 4; i++) cizgi(Y, q[i], q2[(i + 1) % 4], yog * 0.6); }
  }
}
// modern kanat planı: kök kirişinden uca daralan, ön ve arka kenar + orta hat (rotor düzleminde)
function kanat(Y, hub, boy, kokKiris, ucKiris, aci, yog, kok = 1.2) {
  const c = Math.cos(aci), s = Math.sin(aci), nx = -s, ny = c;
  const P = (r, w) => [hub[0] + c * r + nx * w, hub[1] + s * r + ny * w, hub[2]];
  const n = Math.ceil(boy * yog * _K);
  for (let i = 0; i <= n; i++) {
    const t = i / n, r = kok + t * boy, kir = (t < 0.18 ? kokKiris * (0.6 + 0.4 * t / 0.18) : kokKiris + (ucKiris - kokKiris) * (t - 0.18) / 0.82);
    nokta(Y, ...P(r, kir * 0.62), hub); nokta(Y, ...P(r, -kir * 0.38), hub);
    if (i % 2 === 0) nokta(Y, ...P(r, kir * 0.1), hub);
    if (rnd() < 0.5) nokta(Y, ...P(r, (rnd() - 0.38) * kir), hub);
  }
}
// eski yelken: kafesli dikdörtgen (r0→r1 boyunca, genişlik w), rotor düzleminde
function yelken(Y, hub, r0, r1, w, aci, yog) {
  const c = Math.cos(aci), s = Math.sin(aci), nx = -s, ny = c;
  const P = (r, u) => [hub[0] + c * r + nx * u, hub[1] + s * r + ny * u, hub[2]];
  cizgi(Y, P(0, 0), P(r1, 0), yog * 1.2, hub);                 // ana kol
  cizgi(Y, P(r0, -w * 0.1), P(r1, -w * 0.1), yog, hub); cizgi(Y, P(r0, w * 0.9), P(r1, w * 0.9), yog, hub);
  for (let r = r0; r <= r1 + 0.01; r += (r1 - r0) / 9) cizgi(Y, P(r, -w * 0.1), P(r, w * 0.9), yog, hub);   // çıtalar
  const n = Math.ceil((r1 - r0) * w * yog * 0.6 * _K);
  for (let i = 0; i < n; i++) nokta(Y, ...P(r0 + rnd() * (r1 - r0), -w * 0.1 + rnd() * w), hub);       // bez
}
// deniz yüzeyi: dalgalı halka ızgara
function deniz(Y, r, y0, yog) {
  for (let rr = r * 0.08; rr <= r; rr += r / 22) {
    const n = Math.ceil(2 * Math.PI * rr * yog * 0.18 * _K);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rr; nokta(Y, Math.cos(a) * rr, y0 + Math.sin(a * 5 + rr * 0.1) * r * 0.004, Math.sin(a) * rr); }
  }
}
// sırt: yumuşak tepe yüzeyi (karada)
function sirt(Y, gen, der, yuk, yog) {
  const n = Math.ceil(gen * der * yog * yog * 0.012 * _K);
  for (let i = 0; i < n; i++) {
    const x = (rnd() - 0.5) * gen, z = (rnd() - 0.5) * der;
    const y = yuk * Math.exp(-(z * z) / (der * der * 0.06)) * (0.8 + 0.2 * Math.cos(x / gen * 4));
    nokta(Y, x, y, z);
  }
}
// üç kanatlı modern türbin (boru kule, nasel, göbek); taban noktası verilir
function turbin(Y, taban, gobek, rotorR, yog, aciKaydir = 0, kuleR = [0.022, 0.014]) {
  const hy = taban[1] + gobek, hub = [taban[0], hy, taban[2] + rotorR * 0.07];
  kule(Y, taban, rotorR * kuleR[0] * 4, rotorR * kuleR[1] * 4, gobek - rotorR * 0.03, yog, gobek / 9);
  kutu(Y, [taban[0], hy, taban[2] - rotorR * 0.06], [rotorR * 0.075, rotorR * 0.075, rotorR * 0.22], yog * 1.4, null, 0.6);
  halka(Y, hub, rotorR * 0.035, 'z', yog * 3, hub);
  for (let k = 0; k < 3; k++) kanat(Y, hub, rotorR * 0.97, rotorR * 0.075, rotorR * 0.015, aciKaydir + k * 2.0944 + 0.3, yog, rotorR * 0.03);
  return hub;
}

/* ===================== dönemler ===================== */
export const MAKINE = {
  // giriş: rüzgâr girdabı — sarmal akımlar (dikey eksende döner)
  toz() {
    const Y = yeni(), hub = [0, 0, 0];
    for (let k = 0; k < 7; k++) {
      const r0 = 3 + k * 1.6, faz = k * 0.9;
      const m = Math.ceil(900 * _K); for (let i = 0; i < m; i++) { const t = i / m, a = faz + t * Math.PI * 6, r = r0 * (0.7 + 0.3 * Math.sin(t * 9 + k)); nokta(Y, Math.cos(a) * r, (t - 0.5) * 26 + Math.sin(a * 2) * 0.8, Math.sin(a) * r, hub); }
    }
    for (let i = 0, m = Math.ceil(2500 * _K); i < m; i++) { const a = rnd() * 6.283, r = 2 + rnd() * 16; nokta(Y, Math.cos(a) * r, (rnd() - 0.5) * 30 * Math.cos((r - 2) / 16 * 1.25), Math.sin(a) * r, hub); }
    return { Y, eksen: 1, dev: 0.3 };
  },
  // ~9. yy, Sistan: dikey milli değirmen, iki kalın duvar arasında (temsili)
  panemone() {
    const Y = yeni(), yog = 9, hub = [0, 4.6, 0];
    kutu(Y, [-3.4, 4, 0], [1.3, 8, 7.5], yog, null, 0.3); kutu(Y, [3.4, 4, 0], [1.3, 8, 7.5], yog, null, 0.3);
    kutu(Y, [0, 8.3, 0], [8, 0.5, 0.8], yog);                                   // üst kiriş ve yatak
    cizgi(Y, [0, 0.2, 0], [0, 8.1, 0], yog * 2, hub);                           // dikey mil
    for (let k = 0; k < 6; k++) {                                               // altı kasnaklı hasır yelken
      const a = k / 6 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), R = 2.5;
      for (const y of [2, 7]) cizgi(Y, [0, y, 0], [c * R, y, s * R], yog, hub);
      cizgi(Y, [c * R, 2, s * R], [c * R, 7, s * R], yog, hub); cizgi(Y, [c * 0.6, 2, s * 0.6], [c * 0.6, 7, s * 0.6], yog, hub);
      for (let i = 0, m = Math.ceil(160 * _K); i < m; i++) { const r = 0.6 + rnd() * (R - 0.6), y = 2 + rnd() * 5; nokta(Y, c * r, y, s * r, hub); }
    }
    zemin(() => { for (let x = -6; x <= 6; x += 0.25 / _K) for (let z = -5; z <= 5; z += 0.9) if (Math.abs(x) > 4.2 || Math.abs(z) > 4) nokta(Y, x, 0, z); });   // avlu zemini
    return { Y, eksen: 1, dev: 0.5 };
  },
  // 1185: direkli değirmen — bütün gövde bir direk üstünde döner (temsili)
  direkli() {
    const Y = yeni(), yog = 7, hub = [0, 8.6, 2.6];
    cizgi(Y, [-4, 0.3, 0], [4, 0.3, 0], yog); cizgi(Y, [0, 0.3, -4], [0, 0.3, 4], yog);                    // çapraz ayaklar
    for (const [x, z] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) cizgi(Y, [x, 0.4, z], [0, 3.6, 0], yog);         // destekler
    cizgi(Y, [0, 0, 0], [0, 5.2, 0], yog * 1.6);                                                            // ana direk
    kutu(Y, [0, 7.6, 0.2], [3.6, 5, 4.4], yog, null, 0.8);                                                  // gövde
    cizgi(Y, [-1.8, 10.1, -2], [0, 11.3, -2], yog); cizgi(Y, [1.8, 10.1, -2], [0, 11.3, -2], yog);           // çatı
    cizgi(Y, [-1.8, 10.1, 2.4], [0, 11.3, 2.4], yog); cizgi(Y, [1.8, 10.1, 2.4], [0, 11.3, 2.4], yog); cizgi(Y, [0, 11.3, -2], [0, 11.3, 2.4], yog);
    cizgi(Y, [0, 5.4, -2], [0, 0.6, -6.5], yog);                                                            // kuyruk (döndürme) kolu
    cizgi(Y, [0.6, 5.2, -2.1], [0.6, 0.3, -4.2], yog * 0.8); cizgi(Y, [-0.6, 5.2, -2.1], [-0.6, 0.3, -4.2], yog * 0.8);   // merdiven
    for (let k = 0; k < 4; k++) yelken(Y, hub, 1.0, 8.6, 1.9, k * Math.PI / 2 + 0.35, yog);
    return { Y, eksen: 0, dev: 1.0 };
  },
  // 13.–17. yy: kule / Hollanda değirmeni — sekizgen gövde sabit, başlık döner (temsili)
  kuleDegirmen() {
    const Y = yeni(), yog = 5, hub = [0, 16.4, 3.4];
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, b = (i + 1) / 8 * Math.PI * 2;
      cizgi(Y, [Math.cos(a) * 4.4, 0, Math.sin(a) * 4.4], [Math.cos(a) * 2.7, 14, Math.sin(a) * 2.7], yog);
      for (let yy = 0; yy <= 14; yy += 1.4) { const r = 4.4 - 1.7 * yy / 14; cizgi(Y, [Math.cos(a) * r, yy, Math.sin(a) * r], [Math.cos(b) * r, yy, Math.sin(b) * r], yog * 0.9); } }
    halka(Y, [0, 5, 0], 6.2, 'y', yog); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; cizgi(Y, [Math.cos(a) * 6.2, 5, Math.sin(a) * 6.2], [Math.cos(a) * 3.9, 4.2, Math.sin(a) * 3.9], yog); }   // balkon
    for (let i = 0; i < 9; i++) { const t = i / 8, r = 3 * Math.cos(t * Math.PI / 2); halka(Y, [0, 14 + Math.sin(t * Math.PI / 2) * 3.4, 0.3], Math.max(0.3, r), 'y', yog); }   // başlık
    for (let k = 0; k < 4; k++) yelken(Y, hub, 1.4, 11.5, 2.3, k * Math.PI / 2 + 0.6, yog);
    kutu(Y, [0, 1.3, 4.3], [1.4, 2.4, 0.4], yog);                                                           // kapı
    return { Y, eksen: 0, dev: 0.9 };
  },
  // 1854: Halladay — kendi kendini yöneten çok kanatlı rüzgâr pompası (temsili ölçü)
  pompa() {
    const Y = yeni(), yog = 9, hub = [0, 10.9, 1.0];
    kafes(Y, [0, 0, 0], 1.6, 0.35, 10.2, yog, 5);
    kutu(Y, [0, 10.9, 0.1], [0.6, 0.6, 1.4], yog * 1.5);
    cizgi(Y, [0, 10.6, 0], [0, 0.3, 0], yog * 0.7);                                                         // pompa çubuğu
    halka(Y, hub, 2.5, 'z', yog * 1.3, hub); halka(Y, hub, 1.5, 'z', yog * 1.3, hub); halka(Y, hub, 0.6, 'z', yog * 1.3, hub);
    for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283, c = Math.cos(a), s = Math.sin(a), nx = -s, ny = c;
      for (let r = 0.6; r <= 2.5; r += 0.12 / _K) { nokta(Y, hub[0] + c * r, hub[1] + s * r, hub[2], hub); nokta(Y, hub[0] + c * r + nx * 0.32, hub[1] + s * r + ny * 0.32, hub[2] + 0.05, hub); } }
    cizgi(Y, [0, 10.9, -0.3], [0, 10.9, -3.9], yog * 1.2);                                                  // kuyruk
    for (let yy = 10.0; yy <= 11.8; yy += 0.3) cizgi(Y, [0, yy, -2.4], [0, yy + (yy - 10.9) * 0.4, -4.2], yog);   // dümen levhası
    zemin(() => { for (let x = -5; x <= 5; x += 0.35 / _K) for (let z = -5; z <= 5; z += 1.2) nokta(Y, x, 0, z); });
    return { Y, eksen: 0, dev: 2.4 };
  },
  // 1888: Charles F. Brush — 17 m rotor, 144 kanat, 18 m kule, 12 kW
  brush() {
    const Y = yeni(), yog = 4, hub = [0, 18.6, 3.2];
    kafes(Y, [0, 0, 0], 3.6, 1.6, 18, yog * 1.4, 6);
    kutu(Y, [0, 1.6, 0], [9, 3.2, 9], yog, null, 0.7);                                                      // taban yapısı
    kutu(Y, [0, 18.6, -0.8], [2.4, 2.4, 7], yog * 1.4);
    halka(Y, hub, 8.5, 'z', yog * 2.2, hub); halka(Y, hub, 3.2, 'z', yog * 2.2, hub);
    for (let k = 0; k < 144; k++) { const a = k / 144 * 6.283; cizgi(Y, [hub[0] + Math.cos(a) * 3.2, hub[1] + Math.sin(a) * 3.2, hub[2]], [hub[0] + Math.cos(a) * 8.5, hub[1] + Math.sin(a) * 8.5, hub[2]], yog * 0.9, hub); }
    for (let i = 0; i <= 10; i++) { const z = -4 - i * 1.6; cizgi(Y, [0, 15.6, z], [0, 21.6, z], yog); }  // 18 m x 6 m dümen
    cizgi(Y, [0, 15.6, -4], [0, 15.6, -20], yog); cizgi(Y, [0, 21.6, -4], [0, 21.6, -20], yog);
    return { Y, eksen: 0, dev: 0.9, olcu: true };
  },
  // 1941: Smith–Putnam — 1,25 MW, 53 m rotor, iki kanat (8'er ton), 37 m çelik kafes kule; rotor kulenin arkasında
  smith() {
    const Y = yeni(), yog = 2.2, hub = [0, 38.4, -6.4];
    kafes(Y, [0, 0, 0], 5.2, 1.6, 37, yog * 1.3, 8);
    kutu(Y, [0, 38.4, -1.2], [3.4, 3.4, 9], yog * 2.2, null, 0.8);
    halka(Y, hub, 1.0, 'z', yog * 6, hub);
    for (let k = 0; k < 2; k++) kanat(Y, hub, 25.5, 3.6, 1.9, k * Math.PI + 0.5, yog * 1.6, 1.0);
    return { Y, eksen: 0, dev: 2.4, olcu: true };
  },
  // 1957: Gedser — Johannes Juul; 3 kanat, 24 m rotor, 200 kW; kanatları öndeki dikmeye bağlayan gergiler
  gedser() {
    const Y = yeni(), yog = 3.2, hub = [0, 25, 3.0], uc = [0, 25, 7.5];
    kule(Y, [0, 0, 0], 2.2, 1.2, 24, yog, 2);
    kutu(Y, [0, 25, 0.2], [2.2, 2.4, 5.2], yog * 1.8, null, 0.7);
    cizgi(Y, hub, uc, yog * 2, hub);                                                                         // ön dikme
    const orta = [];
    for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.4; kanat(Y, hub, 11.2, 1.5, 0.6, a, yog * 1.6, 0.8); orta.push([hub[0] + Math.cos(a) * 7, hub[1] + Math.sin(a) * 7, hub[2]]); }
    for (let k = 0; k < 3; k++) { cizgi(Y, uc, orta[k], yog * 1.5, hub); cizgi(Y, orta[k], orta[(k + 1) % 3], yog * 1.2, hub); }
    return { Y, eksen: 0, dev: 3.0, olcu: true };
  },
  // 1991: Vindeby — denizde 450 kW'lık 11 türbinin ilk dizisi (çizimde beşi; temsili ölçü)
  vindeby() {
    const Y = yeni(), yog = 1.4;
    zemin(() => deniz(Y, 150, 0, yog * 2));
    [[-110, -30], [-55, -10], [0, 10], [55, 30], [110, 50]].forEach(([x, z], i) => turbin(Y, [x, 4, z], 34, 18, yog * 2.4, i));
    return { Y, eksen: 0, dev: 3.0 };
  },
  // 1998: Alaçatı — Türkiye'nin ilk rüzgâr santrallerinden; 12 türbin, 7,2 MW (çizimde sırtta altısı; temsili)
  alacati() {
    const Y = yeni(), yog = 1.5;
    zemin(() => sirt(Y, 320, 160, 26, yog * 2.2));
    [-125, -75, -25, 25, 75, 125].forEach((x, i) => turbin(Y, [x, 24 + Math.cos(x / 320 * 4) * 4, 0], 44, 22, yog * 2.2, i * 0.7));
    return { Y, eksen: 0, dev: 2.6 };
  },
  // 2017: Hywind Scotland — yüzer gövde, üç çapa halatı; 6 MW'lık 5 türbin, 30 MW (çizim temsili)
  hywind() {
    const Y = yeni(), yog = 1.0;
    zemin(() => deniz(Y, 170, 0, yog * 2.4));
    const hub = turbin(Y, [0, 8, 0], 90, 77, yog * 2.6, 0, [0.03, 0.018]);
    kule(Y, [0, -78, 0], 7.5, 7.5, 86, yog * 1.2, 9);                                                          // su altındaki yüzer gövde
    for (let k = 0; k < 3; k++) { const a = k * 2.0944 + 0.5; cizgi(Y, [Math.cos(a) * 7, -40, Math.sin(a) * 7], [Math.cos(a) * 150, -100, Math.sin(a) * 150], yog * 1.6); }
    void hub;
    return { Y, eksen: 0, dev: 1.6 };
  },
  // 2022: Østerild prototipi — 15 MW, 236 m rotor, 115,5 m kanat, uç yüksekliği 280 m (göbek ≈ 162 m)
  mw15() {
    const Y = yeni(), yog = 0.55;
    zemin(() => deniz(Y, 220, 0, yog * 3.2));
    kule(Y, [0, -10, 0], 5, 5, 26, yog * 3, 4);                                                                 // tek kazık ve geçiş parçası
    turbin(Y, [0, 16, 0], 146, 118, yog * 1.8, 0.2, [0.02, 0.013]);
    return { Y, eksen: 0, dev: 1.3, olcu: true };
  },
  // 2025: Dongying test merkezi — 26 MW, 310 m rotor, 153 m kanat (göbek yüksekliği temsili)
  mw26() {
    const Y = yeni(), yog = 0.42;
    zemin(() => deniz(Y, 280, 0, yog * 3.2));
    kule(Y, [0, -12, 0], 6, 6, 30, yog * 3, 4);
    turbin(Y, [0, 18, 0], 175, 155, yog * 1.7, 0.5, [0.019, 0.012]);
    return { Y, eksen: 0, dev: 1.1, olcu: true };
  },
  // bugün, sahada: 3 MW sınıfı, 116,8 m rotor, 120 m göbek; dibinde 1,8 m'lik bir insan (ölçek)
  n117() {
    const Y = yeni(), yog = 0.9;
    zemin(() => sirt(Y, 260, 180, 8, yog * 2.6));
    turbin(Y, [0, 6, 0], 120, 58.4, yog * 2, 0.1, [0.034, 0.022]);
    // insan silueti: baş, gövde, kollar, bacaklar (kule dibinde, ölçek için)
    const i0 = [9, 6, 6];
    halka(Y, [i0[0], i0[1] + 1.65, i0[2]], 0.12, 'z', 40); cizgi(Y, [i0[0], i0[1] + 1.5, i0[2]], [i0[0], i0[1] + 0.9, i0[2]], 30);
    cizgi(Y, [i0[0], i0[1] + 0.9, i0[2]], [i0[0] - 0.2, i0[1], i0[2]], 30); cizgi(Y, [i0[0], i0[1] + 0.9, i0[2]], [i0[0] + 0.2, i0[1], i0[2]], 30);
    cizgi(Y, [i0[0], i0[1] + 1.35, i0[2]], [i0[0] - 0.35, i0[1] + 0.95, i0[2]], 30); cizgi(Y, [i0[0], i0[1] + 1.35, i0[2]], [i0[0] + 0.35, i0[1] + 0.95, i0[2]], 30);
    return { Y, eksen: 0, dev: 1.8, olcu: true };
  },
};

/* Nokta bulutunu sahne birimine çevirir: yükseklik (ya da genişliğin bir kısmı) 2,6 birim, merkez orijin.
 * Yoğunluk, ham nokta sayısı N'nin ~%92'sine oturacak biçimde ayarlanır; kalan noktalar gizli (tür + 4) olarak
 * yapının üstüne yerleşir — dönüşümde görünmeden gelip sönerler.
 * Döner: konum, tür (0 yapı, 1 rotor, 2 zemin; +4 gizli), göbek (birim), konu kutusu, metre/birim. */
function uret(ad, tohum, K) { _rnd = tohum * 7919 + ad.length * 131 + 1; _K = K; const m = MAKINE[ad](); _K = 1; return m; }

export function hazirla(ad, N, tohum = 7) {
  let K = 1, m = uret(ad, tohum, K);
  for (let t = 0; t < 2; t++) {
    const n = m.Y.r.length, hedef = N * 0.92;
    if (Math.abs(n - hedef) < N * 0.06) break;
    K = Math.min(14, Math.max(0.25, K * hedef / n)); m = uret(ad, tohum, K);
  }
  _rnd = tohum * 104729 + ad.length * 17 + 3;
  const { p, r, h } = m.Y, n = r.length;
  // dönen noktalar için süpürme çemberi de kutuya girer (kanat ucu dönerken kadrajdan taşmasın)
  const ek = m.eksen === 1;
  const sup = (i, f) => {
    const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
    if (r[i] !== 1) { f(x, y, z); return; }
    const hx = h[i * 3], hy = h[i * 3 + 1], hz = h[i * 3 + 2];
    if (ek) { const d = Math.hypot(x - hx, z - hz); f(hx - d, y, hz - d); f(hx + d, y, hz + d); }
    else { const d = Math.hypot(x - hx, y - hy); f(hx - d, hy - d, z); f(hx + d, hy + d, z); }
  };
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < n; i++) sup(i, (x, y, z) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; });
  const boy = Math.max(y1 - y0, (x1 - x0) * 0.6, (z1 - z0) * 0.6), s = 2.6 / boy, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  // konu kutusu: zemin hariç (kamera bunu kadraja alır)
  let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, c0 = 1e9, c1 = -1e9;
  for (let i = 0; i < n; i++) { if (r[i] === 2) continue;
    sup(i, (X, Y, Z) => { const x = (X - cx) * s, y = (Y - cy) * s, z = (Z - cz) * s;
      if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y; if (z < c0) c0 = z; if (z > c1) c1 = z; }); }
  const pos = new Float32Array(N * 3), rot = new Float32Array(N), hub = new Float32Array(N * 3);
  const sira = new Uint32Array(n); for (let i = 0; i < n; i++) sira[i] = i;
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = sira[i]; sira[i] = sira[j]; sira[j] = t; }
  for (let k = 0; k < N; k++) {
    const i = sira[k % n], fazla = k >= n;
    pos[k * 3] = (p[i * 3] - cx) * s; pos[k * 3 + 1] = (p[i * 3 + 1] - cy) * s; pos[k * 3 + 2] = (p[i * 3 + 2] - cz) * s;
    rot[k] = r[i] + (fazla ? 4 : 0); hub[k * 3] = (h[i * 3] - cx) * s; hub[k * 3 + 1] = (h[i * 3 + 1] - cy) * s; hub[k * 3 + 2] = (h[i * 3 + 2] - cz) * s;
  }
  return { ad, pos, rot, hub, eksen: m.eksen, dev: m.dev, metreBirim: 1 / s, olcu: !!m.olcu, ham: n,
    kutu: [(a1 - a0) / 2, (b1 - b0) / 2, (c1 - c0) / 2, (a0 + a1) / 2, (b0 + b1) / 2, (c0 + c1) / 2] };
}
