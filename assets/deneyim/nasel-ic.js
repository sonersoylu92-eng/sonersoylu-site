/* nasel-ic.js — N117 naselinin içi: güç aktarma ve elektrik sistemi.
 *
 * n117.js'teki dış model aynen kullanılıyor; bu dosya yalnızca naselin içini
 * ekliyor. Koordinatlar nasel yerel ekseninde (n117.js'teki "tilt" grubu):
 *   z: -6,2 (ön, rotor tarafı) → +6,2 (arka), y: taban −1,62 → tavan +1,78,
 *   x: sol duvar −1,95 → sağ duvar +1,95. Birim metre.
 * Oranlar N117/3000 Delta'nın 12,4 × 4,2 × 4,0 m nasel ölçüsüne göre;
 * parça yerleşimi temsili bir mühendislik görselleştirmesidir, üretici çizimi değildir.
 * Doku dosyası yok: her şey prosedürel, tek istekte yüklenir.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';

export function naselIciKur(opts = {}) {
  const hafif = !!opts.hafif;          // mobil: daha az ayrıntı
  const g = new THREE.Group();
  g.name = 'naselIci';

  /* ---- malzemeler: grafit, çelik, mat siyah, soğuk beyaz, ince camgöbeği ---- */
  const M = {
    duvar:  new THREE.MeshStandardMaterial({ color: 0x1d2125, roughness: 0.9, metalness: 0.05, side: THREE.DoubleSide }),
    kaburga:new THREE.MeshStandardMaterial({ color: 0x2a3036, roughness: 0.8,  metalness: 0.1 }),
    dokum:  new THREE.MeshStandardMaterial({ color: 0x4a5157, roughness: 0.6, metalness: 0.55 }),
    celik:  new THREE.MeshStandardMaterial({ color: 0x7f888f, roughness: 0.36, metalness: 0.85 }),
    parlak: new THREE.MeshStandardMaterial({ color: 0x9aa2a9, roughness: 0.24, metalness: 1.0 }),
    siyah:  new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.7,  metalness: 0.2 }),
    lastik: new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.95, metalness: 0.0 }),
    dolap:  new THREE.MeshStandardMaterial({ color: 0x9ea6ad, roughness: 0.62, metalness: 0.12 }),
    dolapK: new THREE.MeshStandardMaterial({ color: 0x6c757c, roughness: 0.5,  metalness: 0.4 }),
    kablo:  new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6,  metalness: 0.0 }),
    yag:    new THREE.MeshStandardMaterial({ color: 0x3c4248, roughness: 0.3,  metalness: 0.8 }),
    sari:   new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.55, metalness: 0.2 }),
    led:    new THREE.MeshStandardMaterial({ color: 0x0b0f12, emissive: 0x4fd6ea, emissiveIntensity: 2.2 }),
    lamba:  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe8f1ff, emissiveIntensity: 2.4 }),
    ekran:  new THREE.MeshStandardMaterial({ color: 0x0a1418, emissive: 0x1f6f7d, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3 }),
  };
  if (opts.envMap) {
    ['dokum', 'celik', 'parlak', 'yag', 'dolap', 'dolapK', 'siyah'].forEach(k => { M[k].envMap = opts.envMap; M[k].envMapIntensity = (k === 'dolap' || k === 'siyah') ? 0.18 : 0.4; });
  }

  const ekle = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, gel = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = !hafif; m.receiveShadow = true;
    gel.add(m); return m;
  };
  const kutu = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const silindirZ = (r0, r1, uz, seg = 32) => { const c = new THREE.CylinderGeometry(r0, r1, uz, seg); c.rotateX(Math.PI / 2); return c; };
  const cember = (r, t, seg = 48) => { const c = new THREE.TorusGeometry(r, t, 10, seg); return c; };

  // cıvata halkaları: tek InstancedMesh, yüzlerce cıvata tek çizim çağrısı
  const civataGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.06, 6); civataGeo.rotateX(Math.PI / 2);
  const civatalar = [];
  const halka = (cx, cy, z, r, n, yon = 1) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; civatalar.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z + 0.03 * yon]); } };

  const TABAN = -1.62, TAVAN = 1.78, SOL = -1.95, SAG = 1.95, ON = -6.1, ARKA = 6.1;
  const AKS = 0.0;       // ana mil ekseni (göbek merkeziyle aynı yükseklik)
  const HIZLI = 0.55;    // dişli çıkışı / jeneratör ekseni (yukarı kaçık)

  /* =================== kabuk: iç duvarlar, kaburgalar, tavan kapağı =================== */
  const kabuk = new THREE.Group(); kabuk.name = 'kabuk'; g.add(kabuk);
  const uz = ARKA - ON, gen = SAG - SOL, yuk = TAVAN - TABAN;
  ekle(new THREE.PlaneGeometry(uz, yuk), M.duvar, SOL, (TABAN + TAVAN) / 2, 0, 0, Math.PI / 2, 0, kabuk);
  ekle(new THREE.PlaneGeometry(uz, yuk), M.duvar, SAG, (TABAN + TAVAN) / 2, 0, 0, -Math.PI / 2, 0, kabuk);
  // tavan: servis kapağı açıklığı bırakarak dört parça (açıklık z 1,6–2,9, x −0,65–0,65)
  const KZ0 = 1.6, KZ1 = 2.9, KX = 0.65;
  const tavan = (x0, x1, z0, z1) => ekle(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.duvar, (x0 + x1) / 2, TAVAN, (z0 + z1) / 2, Math.PI / 2, 0, 0, kabuk);
  tavan(SOL, SAG, ON, KZ0); tavan(SOL, SAG, KZ1, ARKA); tavan(SOL, -KX, KZ0, KZ1); tavan(KX, SAG, KZ0, KZ1);
  // kapak çerçevesi
  ekle(kutu(KX * 2 + 0.16, 0.12, 0.08), M.celik, 0, TAVAN - 0.04, KZ0, 0, 0, 0, kabuk);
  ekle(kutu(KX * 2 + 0.16, 0.12, 0.08), M.celik, 0, TAVAN - 0.04, KZ1, 0, 0, 0, kabuk);
  ekle(kutu(0.08, 0.12, KZ1 - KZ0), M.celik, -KX, TAVAN - 0.04, (KZ0 + KZ1) / 2, 0, 0, 0, kabuk);
  ekle(kutu(0.08, 0.12, KZ1 - KZ0), M.celik, KX, TAVAN - 0.04, (KZ0 + KZ1) / 2, 0, 0, 0, kabuk);
  // ön perde: göbeğe geçiş deliği olan bölme
  {
    const s = new THREE.Shape(); s.moveTo(SOL, TABAN); s.lineTo(SAG, TABAN); s.lineTo(SAG, TAVAN); s.lineTo(SOL, TAVAN); s.lineTo(SOL, TABAN);
    const delik = new THREE.Path(); delik.absarc(0, AKS, 1.15, 0, Math.PI * 2, true); s.holes.push(delik);
    ekle(new THREE.ShapeGeometry(s, 32), M.duvar, 0, 0, ON, 0, 0, 0, kabuk);
  }
  // arka perde: servis kapısı açıklığıyla
  {
    const s = new THREE.Shape(); s.moveTo(SOL, TABAN); s.lineTo(SAG, TABAN); s.lineTo(SAG, TAVAN); s.lineTo(SOL, TAVAN); s.lineTo(SOL, TABAN);
    const kapi = new THREE.Path(); kapi.moveTo(-0.55, TABAN + 0.25); kapi.lineTo(0.55, TABAN + 0.25); kapi.lineTo(0.55, TABAN + 2.05); kapi.lineTo(-0.55, TABAN + 2.05); kapi.lineTo(-0.55, TABAN + 0.25); s.holes.push(kapi);
    ekle(new THREE.ShapeGeometry(s), M.duvar, 0, 0, ARKA, 0, Math.PI, 0, kabuk);
  }
  // GRP kabuk kaburgaları: her 1,2 m'de bir çerçeve (derinlik ve paralaks verir)
  for (let z = ON + 0.6; z < ARKA - 0.3; z += 1.2) {
    ekle(kutu(0.06, yuk, 0.12), M.kaburga, SOL + 0.04, (TABAN + TAVAN) / 2, z, 0, 0, 0, kabuk);
    ekle(kutu(0.06, yuk, 0.12), M.kaburga, SAG - 0.04, (TABAN + TAVAN) / 2, z, 0, 0, 0, kabuk);
    if (z < KZ0 - 0.1 || z > KZ1 + 0.1) ekle(kutu(gen, 0.06, 0.12), M.kaburga, 0, TAVAN - 0.04, z, 0, 0, 0, kabuk);
  }

  /* =================== zemin: ızgara, yürüyüş yolu, korkuluk =================== */
  {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'); x.fillStyle = '#1a1d20'; x.fillRect(0, 0, 64, 64);
    x.strokeStyle = '#5a6168'; x.lineWidth = 5;
    for (let i = 0; i <= 64; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 64); x.stroke(); }
    x.lineWidth = 2; for (let i = 0; i <= 64; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(64, i); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(gen * 4, uz * 4);
    t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace;
    const izgara = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, metalness: 0.6 });
    if (opts.envMap) { izgara.envMap = opts.envMap; izgara.envMapIntensity = 0.25; }
    const z = ekle(new THREE.PlaneGeometry(gen, uz), izgara, 0, TABAN, 0, -Math.PI / 2, 0, 0, kabuk);
    z.castShadow = false;
  }
  // korkuluklar: yürüyüş yolunun iki yanı
  if (!hafif) for (const x of [-1.3, 1.3]) {
    for (let z = -4.8; z <= 5.2; z += 1.6) ekle(new THREE.CylinderGeometry(0.022, 0.022, 1.05, 8), M.sari, x, TABAN + 0.52, z);
    ekle(silindirZ(0.024, 0.024, 10.0, 8), M.sari, x, TABAN + 1.05, 0.2);
    ekle(silindirZ(0.018, 0.018, 10.0, 8), M.sari, x, TABAN + 0.55, 0.2);
  }

  /* =================== yatak plakası ve jeneratör şasisi =================== */
  ekle(kutu(2.3, 0.62, 4.9), M.dokum, 0, TABAN + 0.31, -3.55);                    // dökme ana şasi
  ekle(kutu(0.24, 0.42, 4.6), M.celik, -0.95, TABAN + 0.21, 3.2);                  // arka I-kirişler
  ekle(kutu(0.24, 0.42, 4.6), M.celik, 0.95, TABAN + 0.21, 3.2);
  for (const z of [1.6, 3.2, 4.8]) ekle(kutu(2.0, 0.18, 0.2), M.celik, 0, TABAN + 0.38, z);

  /* =================== göbek flanşı ve rotor kilidi =================== */
  const onGrup = new THREE.Group(); onGrup.name = 'ana-yatak'; g.add(onGrup);
  ekle(silindirZ(1.0, 1.0, 0.16, 48), M.dokum, 0, AKS, -5.95, 0, 0, 0, onGrup);   // rotor kilit diski
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ekle(silindirZ(0.07, 0.07, 0.2, 12), M.siyah, Math.cos(a) * 0.78, AKS + Math.sin(a) * 0.78, -5.95, 0, 0, 0, onGrup); }
  halka(0, AKS, -5.87, 0.55, 20);
  // rotor kilidi pimi (sarı, bakımda takılan)
  ekle(kutu(0.3, 0.3, 0.5), M.sari, 0.0, AKS - 1.18, -5.7, 0, 0, 0, onGrup);

  /* =================== ana yatak ve ana mil =================== */
  ekle(silindirZ(1.02, 1.02, 1.0, 48), M.dokum, 0, AKS, -5.1, 0, 0, 0, onGrup);   // yatak gövdesi
  ekle(silindirZ(1.08, 1.08, 0.1, 48), M.celik, 0, AKS, -5.62, 0, 0, 0, onGrup);   // conta kapağı
  ekle(silindirZ(1.08, 1.08, 0.1, 48), M.celik, 0, AKS, -4.58, 0, 0, 0, onGrup);
  halka(0, AKS, -5.68, 0.96, 36, -1); halka(0, AKS, -4.53, 0.96, 36);
  ekle(kutu(2.15, 0.85, 0.9), M.dokum, 0, AKS - 0.85, -5.1, 0, 0, 0, onGrup);     // yatak ayağı
  ekle(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), M.yag, 0.55, AKS + 1.1, -5.1, 0, 0, 0, onGrup); // gres hattı
  const anaMil = new THREE.Group(); anaMil.name = 'ana-mil'; g.add(anaMil);
  ekle(silindirZ(0.44, 0.5, 2.1, 40), M.parlak, 0, AKS, -3.55, 0, 0, 0, anaMil);
  // büzme diski (shrink disc): mili dişli kutusuna kilitler
  ekle(silindirZ(0.8, 0.8, 0.34, 48), M.celik, 0, AKS, -2.72, 0, 0, 0, anaMil);
  halka(0, AKS, -2.9, 0.66, 30, -1);

  /* =================== dişli kutusu: 2 planet + 1 helisel kademe =================== */
  const disli = new THREE.Group(); disli.name = 'disli'; g.add(disli);
  ekle(silindirZ(1.22, 1.22, 1.05, 56), M.dokum, 0, AKS, -2.03, 0, 0, 0, disli);  // 1. planet kademe
  ekle(silindirZ(1.28, 1.28, 0.08, 56), M.celik, 0, AKS, -2.55, 0, 0, 0, disli);
  halka(0, AKS, -2.6, 1.18, 40, -1);
  ekle(silindirZ(1.02, 1.1, 0.78, 56), M.dokum, 0, AKS, -1.12, 0, 0, 0, disli);   // 2. planet kademe
  ekle(silindirZ(1.14, 1.14, 0.08, 56), M.celik, 0, AKS, -1.5, 0, 0, 0, disli);
  halka(0, AKS, -1.55, 1.07, 36, -1);
  ekle(kutu(1.85, 2.0, 0.92), M.dokum, 0, AKS + 0.3, -0.3, 0, 0, 0, disli);        // helisel kademe gövdesi
  ekle(kutu(1.95, 0.08, 1.0), M.celik, 0, AKS + 1.33, -0.3, 0, 0, 0, disli);
  // tork kolları ve elastomer takozlar
  for (const s of [-1, 1]) {
    ekle(kutu(0.6, 0.5, 0.75), M.dokum, s * 1.45, AKS - 0.1, -2.03, 0, 0, 0, disli);
    ekle(kutu(0.5, 0.26, 0.6), M.lastik, s * 1.45, AKS - 0.48, -2.03, 0, 0, 0, disli);
    ekle(kutu(0.5, 0.26, 0.6), M.lastik, s * 1.45, AKS + 0.28, -2.03, 0, 0, 0, disli);
  }
  // yağ filtresi ve pompa
  ekle(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 20), M.celik, -1.05, AKS - 0.95, -0.9, 0, 0, 0, disli);
  ekle(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 20), M.siyah, -1.05, AKS - 0.62, -0.9, 0, 0, 0, disli);
  // yağ hatları: dişliden tavandaki soğutucuya
  const boru = (noktalar, r, mat) => {
    const e = new THREE.CatmullRomCurve3(noktalar.map(p => new THREE.Vector3(...p)));
    return ekle(new THREE.TubeGeometry(e, hafif ? 24 : 64, r, 8, false), mat, 0, 0, 0, 0, 0, 0, disli);
  };
  boru([[-0.85, AKS + 0.9, -0.5], [-1.2, AKS + 1.35, 0.2], [-1.45, TAVAN - 0.35, 1.2], [-1.45, TAVAN - 0.35, 4.6]], 0.045, M.yag);
  boru([[-0.7, AKS + 0.95, -0.3], [-1.05, AKS + 1.45, 0.4], [-1.32, TAVAN - 0.28, 1.3], [-1.32, TAVAN - 0.28, 4.6]], 0.035, M.yag);
  boru([[-1.05, AKS - 0.45, -0.9], [-1.25, AKS + 0.2, -0.4], [-1.55, AKS + 0.9, 0.3], [-1.6, TAVAN - 0.5, 1.0]], 0.03, M.yag);

  /* =================== hızlı mil, fren diski, kaplin =================== */
  const kaplin = new THREE.Group(); kaplin.name = 'kaplin'; g.add(kaplin);
  ekle(silindirZ(0.13, 0.13, 0.9, 20), M.parlak, 0, HIZLI, 0.55, 0, 0, 0, kaplin);
  ekle(silindirZ(0.5, 0.5, 0.05, 48), M.celik, 0, HIZLI, 0.62, 0, 0, 0, kaplin);        // fren diski
  ekle(kutu(0.34, 0.3, 0.22), M.sari, 0, HIZLI + 0.46, 0.62, 0, 0, 0, kaplin);          // fren kaliperi
  ekle(silindirZ(0.3, 0.3, 0.08, 36), M.celik, 0, HIZLI, 1.02, 0, 0, 0, kaplin);        // kaplin flanşı
  ekle(silindirZ(0.3, 0.3, 0.08, 36), M.celik, 0, HIZLI, 2.0, 0, 0, 0, kaplin);
  ekle(silindirZ(0.15, 0.15, 0.9, 24), M.siyah, 0, HIZLI, 1.51, 0, 0, 0, kaplin);       // kompozit ara boru
  for (const z of [1.1, 1.92]) ekle(silindirZ(0.26, 0.26, 0.05, 36), M.lastik, 0, HIZLI, z, 0, 0, 0, kaplin); // disk paketleri
  halka(0, HIZLI, 0.96, 0.24, 8, -1); halka(0, HIZLI, 2.06, 0.24, 8);
  // kaplin koruyucu (yarım kafes)
  if (!hafif) ekle(new THREE.CylinderGeometry(0.46, 0.46, 1.05, 24, 1, true, Math.PI * 0.72, Math.PI * 0.56), M.sari, 0, HIZLI, 1.51, Math.PI / 2, 0, 0, kaplin).material = M.sari;

  /* =================== jeneratör (çift beslemeli asenkron) =================== */
  const jen = new THREE.Group(); jen.name = 'jenerator'; g.add(jen);
  ekle(silindirZ(0.86, 0.86, 2.35, 48), M.celik, 0, HIZLI, 3.3, 0, 0, 0, jen);
  for (let z = 2.3; z <= 4.3; z += 0.25) ekle(cember(0.87, 0.03, 48), M.dolapK, 0, HIZLI, z, 0, 0, 0, jen);  // soğutma kanatçıkları
  ekle(silindirZ(0.92, 0.92, 0.1, 48), M.dokum, 0, HIZLI, 2.1, 0, 0, 0, jen);
  ekle(silindirZ(0.92, 0.92, 0.1, 48), M.dokum, 0, HIZLI, 4.5, 0, 0, 0, jen);
  halka(0, HIZLI, 2.04, 0.84, 28, -1);
  ekle(silindirZ(0.5, 0.46, 0.6, 32), M.dokum, 0, HIZLI, 4.85, 0, 0, 0, jen);           // bilezik (slip ring) muhafazası
  ekle(kutu(1.05, 0.42, 1.5), M.dolapK, 0, HIZLI + 1.05, 3.3, 0, 0, 0, jen);             // soğutma fanı kanalı
  ekle(kutu(0.42, 0.55, 0.65), M.dolapK, 1.0, HIZLI + 0.1, 2.9, 0, 0, 0, jen);           // klemens kutusu
  for (const s of [-1, 1]) ekle(kutu(0.3, 0.5, 2.1), M.dokum, s * 0.62, HIZLI - 0.9, 3.3, 0, 0, 0, jen); // ayaklar
  // stator kabloları: klemens kutusundan kablo kanalına
  const kabloYolu = (noktalar, r) => {
    const e = new THREE.CatmullRomCurve3(noktalar.map(p => new THREE.Vector3(...p)));
    return ekle(new THREE.TubeGeometry(e, hafif ? 20 : 48, r, 8, false), M.kablo, 0, 0, 0, 0, 0, 0, jen);
  };
  for (let i = 0; i < 3; i++) kabloYolu([[1.1, HIZLI + 0.3, 2.75 + i * 0.12], [1.35, HIZLI + 0.9, 2.8 + i * 0.12], [1.5, TAVAN - 0.25, 3.0 + i * 0.12]], 0.035);

  /* =================== konvertör, üst kutu (top box), kontrol dolapları =================== */
  const konv = new THREE.Group(); konv.name = 'konvertor'; g.add(konv);
  const dolap = (x, z, gen_, yuk_, derin, yon, gel, ekranli) => {
    const y = TABAN + yuk_ / 2 + 0.05;
    ekle(kutu(derin, yuk_, gen_), M.dolap, x, y, z, 0, 0, 0, gel);
    const on = x - yon * (derin / 2 + 0.006);
    ekle(kutu(0.012, yuk_ - 0.06, 0.01), M.dolapK, on, y, z, 0, 0, 0, gel);                // kapı çizgisi
    ekle(kutu(0.03, 0.22, 0.03), M.siyah, on - yon * 0.02, y + 0.1, z + gen_ * 0.32, 0, 0, 0, gel); // kol
    for (let k = 0; k < 4; k++) ekle(kutu(0.01, 0.03, gen_ * 0.5), M.siyah, on, y - yuk_ * 0.3 + k * 0.06, z - gen_ * 0.1, 0, 0, 0, gel); // havalandırma
    for (let k = 0; k < 3; k++) ekle(kutu(0.02, 0.03, 0.03), M.led, on - yon * 0.01, y + yuk_ * 0.36, z - gen_ * 0.3 + k * 0.08, 0, 0, 0, gel);
    if (ekranli) ekle(kutu(0.02, 0.2, 0.3), M.ekran, on - yon * 0.01, y + 0.25, z - gen_ * 0.15, 0, 0, 0, gel);
  };
  // sağ duvar: kısmi konvertör dolapları
  for (let i = 0; i < 3; i++) dolap(SAG - 0.28, 1.6 + i * 1.08, 1.02, 2.0, 0.5, 1, konv, i === 1);
  const ustKutu = new THREE.Group(); ustKutu.name = 'ust-kutu'; g.add(ustKutu);
  // sol duvar arka: top box (nasel kontrol dolabı)
  dolap(SOL + 0.26, 4.75, 1.15, 1.7, 0.46, -1, ustKutu, true);
  // sol duvar: yardımcı elektrik panoları
  dolap(SOL + 0.22, 2.3, 0.9, 1.35, 0.38, -1, konv, false);
  dolap(SOL + 0.22, 3.3, 0.9, 1.35, 0.38, -1, konv, false);

  /* =================== kablo tavaları ve kuleye inen güç kabloları =================== */
  const kablolar = new THREE.Group(); kablolar.name = 'kablolar'; g.add(kablolar);
  const tava = (x, z0, z1) => {
    ekle(kutu(0.42, 0.04, z1 - z0), M.celik, x, TAVAN - 0.18, (z0 + z1) / 2, 0, 0, 0, kablolar);
    ekle(kutu(0.02, 0.1, z1 - z0), M.celik, x - 0.2, TAVAN - 0.14, (z0 + z1) / 2, 0, 0, 0, kablolar);
    ekle(kutu(0.02, 0.1, z1 - z0), M.celik, x + 0.2, TAVAN - 0.14, (z0 + z1) / 2, 0, 0, 0, kablolar);
    for (let k = 0; k < (hafif ? 3 : 6); k++) ekle(silindirZ(0.028, 0.028, z1 - z0, 8), M.kablo, x - 0.15 + k * 0.06, TAVAN - 0.13, (z0 + z1) / 2, 0, 0, 0, kablolar);
  };
  tava(1.5, -3.5, 5.6); tava(-0.95, -4.8, 5.6);
  // kuleye inen demet: yaw deliğinden aşağı sarkan güç kabloları (sarkma ilmeği)
  ekle(cember(0.62, 0.05, 40), M.celik, -0.2, TABAN + 0.01, 0.55, Math.PI / 2, 0, 0, kablolar);
  for (let k = 0; k < (hafif ? 4 : 8); k++) {
    const a = k / 8 * Math.PI * 2, r = 0.22;
    const e = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.4 - k * 0.04, TAVAN - 0.15, 1.2),
      new THREE.Vector3(0.6 + Math.cos(a) * 0.1, TAVAN - 0.6, 0.8),
      new THREE.Vector3(-0.2 + Math.cos(a) * r, 0.4, 0.55 + Math.sin(a) * r),
      new THREE.Vector3(-0.2 + Math.cos(a) * r, TABAN - 0.2, 0.55 + Math.sin(a) * r),
      new THREE.Vector3(-0.2 + Math.cos(a) * r, TABAN - 2.5, 0.55 + Math.sin(a) * r),
    ]);
    ekle(new THREE.TubeGeometry(e, hafif ? 24 : 60, 0.034, 8, false), M.kablo, 0, 0, 0, 0, 0, 0, kablolar);
  }

  /* =================== servis vinci rayı =================== */
  // ray tavan kapağında kesilir (kapak açıklığı boş kalır); araba ana milin üstünde
  ekle(kutu(0.16, 0.2, KZ0 - 0.1 - (ON + 0.7)), M.sari, 0, TAVAN - 0.12, (KZ0 - 0.1 + ON + 0.7) / 2);
  ekle(kutu(0.16, 0.2, ARKA - 0.4 - (KZ1 + 0.1)), M.sari, 0, TAVAN - 0.12, (ARKA - 0.4 + KZ1 + 0.1) / 2);
  ekle(kutu(0.34, 0.22, 0.4), M.siyah, 0, TAVAN - 0.33, -4.1);
  ekle(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), M.celik, 0, TAVAN - 0.68, -4.1);
  ekle(new THREE.TorusGeometry(0.06, 0.018, 8, 16, Math.PI * 1.4), M.sari, 0, TAVAN - 0.98, -4.1);

  /* =================== aydınlatma armatürleri (soğuk beyaz LED) =================== */
  const lambalar = [];
  for (let z = -4.8; z <= 5.4; z += 2.4) for (const x of [-1.55, 1.55]) {
    if (x > 0 && z > 1.2 && z < 4.8) continue;          // konvertörün üstü boş
    ekle(kutu(0.1, 0.05, 0.9), M.lamba, x, TAVAN - 0.06, z);
    lambalar.push([x, TAVAN - 0.25, z]);
  }

  /* ---- dönen parçalar: ana mil rotorla, hızlı taraf daha hızlı ---- */
  const kaplinPivot = new THREE.Group(); kaplinPivot.position.set(0, HIZLI, 0); g.add(kaplinPivot);
  g.remove(kaplin); kaplin.position.y = -HIZLI; kaplinPivot.add(kaplin);

  /* ---- cıvataların hepsi tek çizimde ---- */
  const civ = new THREE.InstancedMesh(civataGeo, M.siyah, civatalar.length);
  const mt = new THREE.Matrix4();
  civatalar.forEach((p, i) => { mt.makeTranslation(p[0], p[1], p[2]); civ.setMatrixAt(i, mt); });
  civ.castShadow = false; civ.receiveShadow = true;
  g.add(civ);

  /* ---- sabit parçaları malzemeye göre birleştir: ~350 çizim çağrısı → ~20 ----
   * Dönen gruplar (ana mil, kaplin) ve cıvatalar ayrı kalır. */
  if (!(typeof window !== 'undefined' && window.__deneyimBirlestirme === false)) birlestir(g, [anaMil, kaplinPivot, civ]);

  /* ---- anlatı durakları: HUD'un bağlandığı parça merkezleri (nasel yerel) ---- */
  const duraklar = {
    anaYatak:   new THREE.Vector3(0, AKS, -5.1),
    anaMil:     new THREE.Vector3(0, AKS, -3.55),
    disli:      new THREE.Vector3(0, AKS + 0.2, -1.4),
    kaplin:     new THREE.Vector3(0, HIZLI, 1.5),
    jenerator:  new THREE.Vector3(0, HIZLI, 3.3),
    konvertor:  new THREE.Vector3(SAG - 0.4, TABAN + 1.1, 2.7),
    ustKutu:    new THREE.Vector3(SOL + 0.4, TABAN + 1.0, 4.75),
    kablolar:   new THREE.Vector3(-0.2, TABAN + 0.4, 0.55),
    panolar:    new THREE.Vector3(SOL + 0.3, TABAN + 0.8, 2.8),
    kapak:      new THREE.Vector3(0, TAVAN, (KZ0 + KZ1) / 2),
  };

  return { grup: g, kabuk, lambalar, duraklar, anaMil, kaplinPivot, sinir: { TABAN, TAVAN, SOL, SAG, ON, ARKA, KZ0, KZ1, KX } };
}

function birlestir(kok, haric) {
  kok.updateMatrixWorld(true);
  const kokTers = new THREE.Matrix4().copy(kok.matrixWorld).invert();
  const disla = new Set();
  haric.forEach(h => h && h.traverse(o => disla.add(o)));
  const kovalar = new Map();
  const silinecek = [];
  kok.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || disla.has(o)) return;
    const anahtar = o.material.uuid + (o.castShadow ? '|g' : '|-');
    if (!kovalar.has(anahtar)) kovalar.set(anahtar, { mat: o.material, golge: o.castShadow, parcalar: [] });
    const m = new THREE.Matrix4().multiplyMatrices(kokTers, o.matrixWorld);
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(m);
    kovalar.get(anahtar).parcalar.push(geo);
    silinecek.push(o);
  });
  silinecek.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
  for (const { mat, golge, parcalar } of kovalar.values()) {
    let n = 0; parcalar.forEach(p => { n += p.attributes.position.count; });
    const poz = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let k = 0;
    parcalar.forEach(p => {
      const c = p.attributes.position.count;
      poz.set(p.attributes.position.array, k * 3);
      if (p.attributes.normal) nor.set(p.attributes.normal.array, k * 3);
      if (p.attributes.uv) uv.set(p.attributes.uv.array, k * 2);
      k += c; p.dispose();
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(poz, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = golge; mesh.receiveShadow = true;
    kok.add(mesh);
  }
}
