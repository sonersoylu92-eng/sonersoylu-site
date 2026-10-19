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
  // tabandaki erişim kapağı, yaw ekseni (kablo ilmeği) ve yaw sürücüleri — nasel yerel (x, z); deneyim.js kuleyle eşleyip verir
  const KP = opts.kapak || new THREE.Vector2(-0.55, 0.5), YM = opts.yawMerkez || new THREE.Vector2(0, -0.14);
  const YS = opts.yawSurucu || [-30, 30, 90, 165, 195].map(d => new THREE.Vector2(YM.x + Math.cos(d * Math.PI / 180) * 1.08, YM.y + Math.sin(d * Math.PI / 180) * 1.08));
  const g = new THREE.Group();
  g.name = 'naselIci';

  /* ---- malzemeler: sahadaki makine dairesinden (Soner'in kendi çektiği kare, Ekim 2026): krem GRP kabuk,
   * galvaniz tavan rayları, alüminyum baklava döşeme, mavi jeneratör, sarı kaldırma kulakları, sıcak floresan ışık ---- */
  const M = {
    duvar:  new THREE.MeshStandardMaterial({ color: 0xcfc9bb, roughness: 0.9, metalness: 0.02, side: THREE.DoubleSide, emissive: 0x5e574a, emissiveIntensity: 1 }),   // GRP kabuk ışığı yayar
    kaburga:new THREE.MeshStandardMaterial({ color: 0xb8b2a4, roughness: 0.8,  metalness: 0.05 }),
    galv:   new THREE.MeshStandardMaterial({ color: 0x9da2a2, roughness: 0.42, metalness: 0.78 }),
    mavi:   new THREE.MeshStandardMaterial({ color: 0x31639a, roughness: 0.5,  metalness: 0.28 }),
    maviK:  new THREE.MeshStandardMaterial({ color: 0x26517e, roughness: 0.55, metalness: 0.3 }),
    pirinc: new THREE.MeshStandardMaterial({ color: 0xb48f4c, roughness: 0.32, metalness: 0.9 }),
    gres:   new THREE.MeshStandardMaterial({ color: 0xd8c277, roughness: 0.3,  metalness: 0.05, emissive: 0x3a2f10, emissiveIntensity: 0.35 }),
    dokum:  new THREE.MeshStandardMaterial({ color: 0x5a6268, roughness: 0.55, metalness: 0.5 }),
    celik:  new THREE.MeshStandardMaterial({ color: 0x7f888f, roughness: 0.36, metalness: 0.85 }),
    parlak: new THREE.MeshStandardMaterial({ color: 0x9aa2a9, roughness: 0.24, metalness: 1.0 }),
    siyah:  new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.7,  metalness: 0.2 }),
    lastik: new THREE.MeshStandardMaterial({ color: 0x101113, roughness: 0.95, metalness: 0.0 }),
    dolap:  new THREE.MeshStandardMaterial({ color: 0xd3cfc4, roughness: 0.6,  metalness: 0.08 }),
    dolapK: new THREE.MeshStandardMaterial({ color: 0x6c757c, roughness: 0.5,  metalness: 0.4 }),
    kablo:  new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6,  metalness: 0.0 }),
    yag:    new THREE.MeshStandardMaterial({ color: 0x3c4248, roughness: 0.3,  metalness: 0.8 }),
    sari:   new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.55, metalness: 0.2 }),
    kirmizi:new THREE.MeshStandardMaterial({ color: 0x7a1010, emissive: 0xc0281e, emissiveIntensity: 0.9, roughness: 0.4 }),
    led:    new THREE.MeshStandardMaterial({ color: 0x0b0f12, emissive: 0x4fd6ea, emissiveIntensity: 2.2 }),
    lamba:  new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0d6, emissiveIntensity: 2.6 }),
    ekran:  new THREE.MeshStandardMaterial({ color: 0x0a1418, emissive: 0x1f6f7d, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3 }),
  };
  // tavan, ön/arka perde ve köşe kavisleri: düz krem GRP (yan duvarlar kendi dokusunu alır)
  M.tavan = M.duvar.clone();
  // hafif kipte çevre haritası yok: metalik yüzeyler kararmasın diye metaliklik düşürülür
  if (hafif) Object.values(M).forEach(m => { m.metalness *= 0.35; });
  /* Çevre haritası (masaüstü): başta stüdyo ortamı yalnız metallerde. deneyim.js ısınmadan sonra makine dairesinin
   * kendisini küp kamerayla çeker (ortamAyarla): o zaman her yüzey odanın gerçek ışığını alır. Krem kabuktan sekip
   * mavi gövdeye düşen sıcak ışık, boyada floresan tüplerin uzun yansımaları, baklava saçta tavanın parıltısı buradan gelir.
   * Bütün malzemelerde envMap baştan tanımlı: dokuyu sonradan değiştirmek yeni gölgelendirici derletmez. */
  const ENV_ILK = { dokum: 0.4, celik: 0.4, parlak: 0.4, yag: 0.4, dolapK: 0.4, galv: 0.4, mavi: 0.4, maviK: 0.4, pirinc: 0.4, dolap: 0.18, siyah: 0.18 };
  // makine dairesinin kendi ışığıyla: dağınık yüzeylerde dolaylı aydınlatma, metallerde yansıma
  // tek noktadan çekilen küp, makinelerin arka yüzlerine düşen sekmeyi eksik sayar: metallerde ve boyada biraz yükseltilir
  const ENV_IC = { duvar: 1.0, tavan: 1.0, kaburga: 1.0, dolap: 1.25, dolapK: 1.4, mavi: 1.45, maviK: 1.45, dokum: 1.6, celik: 1.6, parlak: 1.6, galv: 1.6,
    pirinc: 1.5, gres: 1.2, sari: 1.2, siyah: 1.1, lastik: 1.0, kablo: 1.0, yag: 1.5 };
  const envMalzeme = [];   // [malzeme, ilk, iç]
  const envEkle = (m, ilk, icD) => { if (!opts.envMap) return; m.envMap = opts.envMap; m.envMapIntensity = ilk; envMalzeme.push([m, ilk, icD]); };
  if (opts.envMap) Object.keys(ENV_IC).forEach(k => envEkle(M[k], ENV_ILK[k] || 0, ENV_IC[k]));

  const ekle = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, gel = g) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    m.castShadow = !hafif; m.receiveShadow = true;
    gel.add(m); return m;
  };
  /* Kutular pah kırılmış: gerçek saç ve döküm parçalarda hiçbir kenar bıçak gibi keskin değildir. 2 cm'lik
   * yuvarlatma kenarda ince bir parlama çizgisi verir; göz bunu "gerçek nesne" diye okur. İnce şeritler düz kalır. */
  const _n = new THREE.Vector3();
  const kutu = (w, h, d) => {
    const en = Math.min(w, h, d);
    if (en < (hafif ? 0.15 : 0.06)) return new THREE.BoxGeometry(w, h, d);
    const r = Math.min(0.022, en / 5), b = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3).toNonIndexed();
    const p = b.attributes.position.array, n = b.attributes.normal.array, yar = 0.5 / 3, bx = w / 2 - r, by = h / 2 - r, bz = d / 2 - r;
    for (let i = 0; i < p.length; i += 3) {
      const sx = Math.sign(p[i]), sy = Math.sign(p[i + 1]), sz = Math.sign(p[i + 2]);
      _n.set(p[i] - sx * yar, p[i + 1] - sy * yar, p[i + 2] - sz * yar).normalize();
      p[i] = bx * sx + _n.x * r; p[i + 1] = by * sy + _n.y * r; p[i + 2] = bz * sz + _n.z * r;
      n[i] = _n.x; n[i + 1] = _n.y; n[i + 2] = _n.z;
    }
    return b;
  };
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
  /* GRP kabuk dokusu (yan duvarlar): kalıptan çıkmış reçine yüzeyi, 2,4 m'de bir panel birleşim flanşı,
   * tabana doğru hafif kirlenme ve gölge (köşelerde ışık azalır). Aynı doku ışıma haritası da olur. */
  {
    const N = hafif ? 128 : 256, c = document.createElement('canvas'); c.width = N; c.height = N;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, N);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#f7f6f2'); gr.addColorStop(0.86, '#e2ded5'); gr.addColorStop(1, '#bdb8ad');
    x.fillStyle = gr; x.fillRect(0, 0, N, N);
    for (let i = 0; i < (hafif ? 60 : 160); i++) {   // reçine dalgası: çok düşük kontrastlı geniş lekeler
      const r = N * (0.04 + Math.random() * 0.12), px = Math.random() * N, py = Math.random() * N, g2 = x.createRadialGradient(px, py, 0, px, py, r);
      const a = 0.025 + Math.random() * 0.03, k = Math.random() < 0.5 ? '120,112,96' : '255,255,250';
      g2.addColorStop(0, 'rgba(' + k + ',' + a + ')'); g2.addColorStop(1, 'rgba(' + k + ',0)'); x.fillStyle = g2; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    // birleşim flanşı: koyu ince yarık + yanında ışık alan kenar
    const fx = N * 0.5; x.fillStyle = 'rgba(70,62,50,0.32)'; x.fillRect(fx - 1, 0, 2, N); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(fx + 1, 0, 2, N);
    x.fillStyle = 'rgba(70,62,50,0.12)'; x.fillRect(fx - 7, 0, 5, N);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(uz / 2.4, 1); t.anisotropy = 4;
    M.duvar.map = t; M.duvar.emissiveMap = t;
  }
  ekle(new THREE.PlaneGeometry(uz, yuk), M.duvar, SOL, (TABAN + TAVAN) / 2, 0, 0, Math.PI / 2, 0, kabuk);
  ekle(new THREE.PlaneGeometry(uz, yuk), M.duvar, SAG, (TABAN + TAVAN) / 2, 0, 0, -Math.PI / 2, 0, kabuk);
  // duvar–tavan köşesi: sahadaki gibi kalıplanmış kavis (keskin köşe yok, floresan ışığı kavisten yumuşakça kayar)
  for (const s of [-1, 1]) {
    const R = 0.3, kv = new THREE.CylinderGeometry(R, R, uz, hafif ? 6 : 12, 1, true, s < 0 ? Math.PI : Math.PI / 2, Math.PI / 2);
    kv.rotateX(Math.PI / 2);
    ekle(kv, M.tavan, s * (SAG - R), TAVAN - R, 0, 0, 0, 0, kabuk).castShadow = false;
  }
  // tavan: dış kabukla aynı hizadaki servis açıklığını dört parçayla çevrele.
  const KZ0 = 1.2, KZ1 = 4.2, KX = 1.05;
  const tavan = (x0, x1, z0, z1) => ekle(new THREE.PlaneGeometry(x1 - x0, z1 - z0), M.tavan, (x0 + x1) / 2, TAVAN, (z0 + z1) / 2, Math.PI / 2, 0, 0, kabuk);
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
    ekle(new THREE.ShapeGeometry(s, 32), M.tavan, 0, 0, ON, 0, 0, 0, kabuk);
  }
  // arka perde: servis kapısı açıklığıyla
  {
    const s = new THREE.Shape(); s.moveTo(SOL, TABAN); s.lineTo(SAG, TABAN); s.lineTo(SAG, TAVAN); s.lineTo(SOL, TAVAN); s.lineTo(SOL, TABAN);
    const kapi = new THREE.Path(); kapi.moveTo(-0.55, TABAN + 0.25); kapi.lineTo(0.55, TABAN + 0.25); kapi.lineTo(0.55, TABAN + 2.05); kapi.lineTo(-0.55, TABAN + 2.05); kapi.lineTo(-0.55, TABAN + 0.25); s.holes.push(kapi);
    ekle(new THREE.ShapeGeometry(s), M.tavan, 0, 0, ARKA, 0, Math.PI, 0, kabuk);
  }
  // GRP kabuk kaburgaları: sahadaki kabuk iç yüzü düz; çerçeveler yalnız tavanda, sığ birer flanş olarak kalır
  for (let z = ON + 0.6; z < ARKA - 0.3; z += 2.4) {
    if (z < KZ0 - 0.1 || z > KZ1 + 0.1) ekle(kutu(gen - 0.5, 0.035, 0.1), M.kaburga, 0, TAVAN - 0.02, z, 0, 0, 0, kabuk);
  }

  /* =================== zemin: ızgara, yürüyüş yolu, korkuluk =================== */
  {
    /* alüminyum baklava (gözyaşı) desenli döşeme levhaları: 1,2 × 1,2 m levha, kenarlarda ek yeri, ayak izinden
     * matlaşmış orta şerit. Kabartmalar için ayrıca yükseklikten üretilen normal haritası var: ışık her
     * kabartmanın bir yanını parlatır, öbür yanını karartır (fotoğraftaki gibi). */
    const N = hafif ? 512 : 1024, ADIM = N / 25, c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'); x.fillStyle = '#b4b9bc'; x.fillRect(0, 0, N, N);
    for (let i = 0; i < N * 3; i++) { x.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '50,54,58') + ',' + (0.02 + Math.random() * 0.04) + ')'; x.fillRect(Math.random() * N, Math.random() * N, 2 + Math.random() * N / 25, 1); }
    { const gr = x.createLinearGradient(0, 0, N, 0); gr.addColorStop(0, 'rgba(80,78,72,0)'); gr.addColorStop(0.5, 'rgba(80,78,72,0.10)'); gr.addColorStop(1, 'rgba(80,78,72,0)'); x.fillStyle = gr; x.fillRect(0, 0, N, N); }
    // yükseklik tuvali: kabartma = beyaz, saç = siyah
    const yc = document.createElement('canvas'); yc.width = yc.height = N; const y = yc.getContext('2d'); y.fillStyle = '#000'; y.fillRect(0, 0, N, N);
    x.lineCap = y.lineCap = 'round';
    const KB = ADIM * 0.26;
    for (let gy = 0; gy < 25; gy++) for (let gx = 0; gx < 25; gx++) {
      const cx = gx * ADIM + ADIM / 2, cy = gy * ADIM + ADIM / 2, a = ((gx + gy) % 2 ? 1 : -1) * Math.PI / 4;
      const dx = Math.cos(a) * KB, dy = Math.sin(a) * KB;
      x.lineWidth = ADIM * 0.17; x.strokeStyle = '#d6dadc'; x.beginPath(); x.moveTo(cx - dx, cy - dy); x.lineTo(cx + dx, cy + dy); x.stroke();
      for (const [lw, k] of [[ADIM * 0.2, '#555'], [ADIM * 0.13, '#aaa'], [ADIM * 0.06, '#fff']]) { y.lineWidth = lw; y.strokeStyle = k; y.beginPath(); y.moveTo(cx - dx, cy - dy); y.lineTo(cx + dx, cy + dy); y.stroke(); }
    }
    // levha ek yeri: koyu yarık
    x.fillStyle = 'rgba(30,32,34,0.75)'; x.fillRect(0, 0, N, 2); x.fillRect(0, 0, 2, N);
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, 2, N, 1); x.fillRect(2, 0, 1, N);
    // normal haritası (Sobel)
    const hv = y.getImageData(0, 0, N, N).data, nc = document.createElement('canvas'); nc.width = nc.height = N;
    const nx = nc.getContext('2d'), nd = nx.createImageData(N, N), H = (i, j) => hv[(((j + N) % N) * N + ((i + N) % N)) * 4] / 255, GUC = hafif ? 2.2 : 3.2;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const ddx = (H(i + 1, j) - H(i - 1, j)) * GUC, ddy = (H(i, j + 1) - H(i, j - 1)) * GUC, l = Math.hypot(ddx, ddy, 1), o = (j * N + i) * 4;
      nd.data[o] = (-ddx / l * 0.5 + 0.5) * 255; nd.data[o + 1] = (ddy / l * 0.5 + 0.5) * 255; nd.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; nd.data[o + 3] = 255;
    }
    nx.putImageData(nd, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 1.2, 1 / 1.2);   // 1,2 m levha, ~4,8 cm kabartma aralığı
    t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
    const tn = new THREE.CanvasTexture(nc); tn.wrapS = tn.wrapT = THREE.RepeatWrapping; tn.repeat.copy(t.repeat); tn.anisotropy = 8;
    const izgara = new THREE.MeshStandardMaterial({ map: t, normalMap: tn, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.4, metalness: hafif ? 0.3 : 0.55 });
    envEkle(izgara, 0.25, 1.0);
    // döşeme: kuleden çıkış kapağı ve kablo ilmeği için iki açıklık (şekil y = −z)
    const sk = new THREE.Shape(); sk.moveTo(SOL, -ARKA); sk.lineTo(SAG, -ARKA); sk.lineTo(SAG, -ON); sk.lineTo(SOL, -ON); sk.lineTo(SOL, -ARKA);
    { const h = new THREE.Path(); h.moveTo(KP.x - 0.3, -KP.y - 0.3); h.lineTo(KP.x - 0.3, -KP.y + 0.3); h.lineTo(KP.x + 0.3, -KP.y + 0.3); h.lineTo(KP.x + 0.3, -KP.y - 0.3); h.lineTo(KP.x - 0.3, -KP.y - 0.3); sk.holes.push(h); }
    { const h = new THREE.Path(); h.absarc(YM.x, -YM.y, 0.3, 0, Math.PI * 2, true); sk.holes.push(h); }
    const z = ekle(new THREE.ShapeGeometry(sk, 40), izgara, 0, TABAN, 0, -Math.PI / 2, 0, 0, kabuk);
    z.castShadow = false;
  }
  // korkuluklar: yürüyüş yolunun iki yanı
  if (!hafif) for (const x of [-1.3, 1.3]) {
    for (let z = -4.8; z <= 5.2; z += 1.6) ekle(new THREE.CylinderGeometry(0.022, 0.022, 1.05, 8), M.galv, x, TABAN + 0.52, z);
    ekle(silindirZ(0.024, 0.024, 10.0, 8), M.galv, x, TABAN + 1.05, 0.2);
    ekle(silindirZ(0.018, 0.018, 10.0, 8), M.galv, x, TABAN + 0.55, 0.2);
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
  /* Sahadaki gibi: mavi gövde, üstte köşeli hava-hava soğutucu kaputu, yanda mavi bağlantı dolapları,
   * kaputtan inen iki soğutma hortumu (pirinç vanalı), sarı kaldırma kulakları ve otomatik gres pompası. */
  const jen = new THREE.Group(); jen.name = 'jenerator'; g.add(jen);
  ekle(silindirZ(0.86, 0.86, 2.35, 48), M.mavi, 0, HIZLI, 3.3, 0, 0, 0, jen);
  for (let z = 2.3; z <= 4.3; z += 0.25) ekle(cember(0.87, 0.03, 48), M.maviK, 0, HIZLI, z, 0, 0, 0, jen);  // soğutma kanatçıkları
  ekle(silindirZ(0.92, 0.92, 0.1, 48), M.mavi, 0, HIZLI, 2.1, 0, 0, 0, jen);
  ekle(silindirZ(0.92, 0.92, 0.1, 48), M.mavi, 0, HIZLI, 4.5, 0, 0, 0, jen);
  halka(0, HIZLI, 2.04, 0.84, 28, -1);
  ekle(kutu(1.2, 1.15, 0.62), M.mavi, 0, HIZLI - 0.02, 4.86, 0, 0, 0, jen);             // bilezik (slip ring) muhafazası: köşeli kapak
  ekle(kutu(1.24, 0.04, 0.66), M.maviK, 0, HIZLI + 0.57, 4.86, 0, 0, 0, jen);
  ekle(kutu(0.5, 0.36, 0.02), M.maviK, 0.25, HIZLI + 0.05, 5.18, 0, 0, 0, jen);            // muayene kapağı
  {
    // soğutucu kaputu: kesiti yamuk, boyuna uzanan köşeli gövde (kesit x–y, z boyunca çekilir)
    const k = new THREE.Shape();
    // tavan (1,78) ve vinç rayı ile çakışmasın: üst yüz 1,67'de, kaput 2,2–4,3 arasında
    k.moveTo(-0.92, 0); k.lineTo(0.92, 0); k.lineTo(0.92, 0.26); k.lineTo(0.62, 0.5); k.lineTo(-0.5, 0.5); k.lineTo(-0.92, 0.28); k.lineTo(-0.92, 0);
    const kg = new THREE.ExtrudeGeometry(k, { depth: 2.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
    ekle(kg, M.mavi, 0, HIZLI + 0.62, 2.2, 0, 0, 0, jen);
    ekle(kutu(1.86, 0.05, 2.14), M.maviK, 0, HIZLI + 0.64, 3.25, 0, 0, 0, jen);          // kaput alt flanşı
    ekle(kutu(0.16, 0.36, 0.12), M.maviK, -0.62, HIZLI + 0.92, 4.36, 0, 0, 0, jen);       // arka hava ağzı dirseği
    for (const z of [2.6, 3.1, 3.6, 4.05]) ekle(kutu(1.2, 0.02, 0.02), M.maviK, 0.05, HIZLI + 1.13, z, 0, 0, 0, jen);  // kaput panel çizgileri
  }
  // sol yan: kaputun altında üst üste mavi bağlantı (klemens) dolapları
  for (const [y, h] of [[HIZLI - 0.02, 0.62], [HIZLI - 0.72, 0.62]]) {
    ekle(kutu(0.36, h, 1.9), M.mavi, -1.02, y, 3.25, 0, 0, 0, jen);
    ekle(kutu(0.012, h - 0.08, 0.012), M.maviK, -1.205, y, 2.85, 0, 0, 0, jen);
    ekle(kutu(0.012, h - 0.08, 0.012), M.maviK, -1.205, y, 3.65, 0, 0, 0, jen);
    ekle(kutu(0.03, 0.05, 0.12), M.siyah, -1.215, y + h * 0.3, 3.0, 0, 0, 0, jen);      // kapı kolu
  }
  ekle(kutu(0.42, 0.55, 0.65), M.mavi, 1.0, HIZLI + 0.1, 2.9, 0, 0, 0, jen);           // klemens kutusu (sağ)
  for (const s of [-1, 1]) ekle(kutu(0.3, 0.5, 2.1), M.dokum, s * 0.62, HIZLI - 0.9, 3.3, 0, 0, 0, jen); // ayaklar
  // sarı kaldırma kulakları: delikli plaka, gövdenin iki yanında
  {
    const ks = new THREE.Shape(); ks.moveTo(-0.16, 0); ks.lineTo(0.16, 0); ks.lineTo(0.12, 0.22); ks.absarc(0, 0.22, 0.12, 0, Math.PI, false); ks.lineTo(-0.16, 0);
    const d = new THREE.Path(); d.absarc(0, 0.2, 0.06, 0, Math.PI * 2, true); ks.holes.push(d);
    const kulak = new THREE.ExtrudeGeometry(ks, { depth: 0.04, bevelEnabled: false, curveSegments: 16 });
    for (const sx of [-1, 1]) for (const z of [2.45, 4.35]) ekle(kulak, M.sari, sx * 0.97, HIZLI + 0.5, z, 0, sx * Math.PI / 2, 0, jen);
  }
  // otomatik gres pompası: sarı hazne, siyah kapak ve taban; koridora bakan sol yanda, kaputun altında bir konsolda
  {
    const gx = -1.05, gy = HIZLI + 0.75, gz = 3.95;
    ekle(kutu(0.16, 0.04, 0.2), M.maviK, gx + 0.1, gy - 0.2, gz, 0, 0, 0, jen);         // konsol
    ekle(new THREE.CylinderGeometry(0.15, 0.15, 0.06, 28), M.siyah, gx, gy - 0.16, gz, 0, 0, 0, jen);
    ekle(new THREE.CylinderGeometry(0.14, 0.145, 0.24, 28), M.gres, gx, gy, gz, 0, 0, 0, jen);
    ekle(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 28), M.siyah, gx, gy + 0.145, gz, 0, 0, 0, jen);
    ekle(kutu(0.06, 0.08, 0.06), M.sari, gx - 0.12, gy - 0.12, gz + 0.1, 0, 0, 0, jen);   // dağıtıcı bloğu
  }
  // soğutma hortumları: kaputun arka yüzünden pirinç vanalarla çıkar, koridor tarafından (sol arka) döşemeye kıvrılır
  for (let i = 0; i < 2; i++) {
    const hx = -(0.25 + i * 0.13), hy = HIZLI + 0.98 - i * 0.12, hz = 4.32;
    ekle(silindirZ(0.045, 0.045, 0.16, 16), M.pirinc, hx, hy, hz + 0.08, 0, 0, 0, jen);              // vana gövdesi
    ekle(kutu(0.02, 0.09, 0.02), M.pirinc, hx, hy + 0.08, hz + 0.08, 0, 0, 0, jen);                   // vana kolu
    ekle(silindirZ(0.05, 0.05, 0.06, 16), M.pirinc, hx, hy, hz + 0.2, 0, 0, 0, jen);                 // rakor
    const e = new THREE.CatmullRomCurve3([
      new THREE.Vector3(hx, hy, hz + 0.22), new THREE.Vector3(hx - 0.25, hy - 0.05, hz + 0.42),
      new THREE.Vector3(-0.98 - i * 0.05, HIZLI + 0.3, hz + 0.3), new THREE.Vector3(-1.0 - i * 0.06, TABAN + 0.5, hz + 0.05 - i * 0.1),
      new THREE.Vector3(-1.0 - i * 0.06, TABAN + 0.08, hz - 0.35 - i * 0.12),
    ], false, 'centripetal');
    ekle(new THREE.TubeGeometry(e, hafif ? 28 : 64, 0.04, 10, false), M.lastik, 0, 0, 0, 0, 0, 0, jen);
  }
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
  // sol duvar: yardımcı elektrik panoları (ayrı grup: röntgen/patlatma görünümünde kendi yönüne açılır)
  const panolar = new THREE.Group(); panolar.name = 'panolar'; g.add(panolar);
  dolap(SOL + 0.22, 2.3, 0.9, 1.35, 0.38, -1, panolar, false);
  dolap(SOL + 0.22, 3.3, 0.9, 1.35, 0.38, -1, panolar, false);

  /* =================== kablo tavaları ve kuleye inen güç kabloları =================== */
  const kablolar = new THREE.Group(); kablolar.name = 'kablolar'; g.add(kablolar);
  const tava = (x, z0, z1) => {
    ekle(kutu(0.42, 0.04, z1 - z0), M.celik, x, TAVAN - 0.18, (z0 + z1) / 2, 0, 0, 0, kablolar);
    ekle(kutu(0.02, 0.1, z1 - z0), M.celik, x - 0.2, TAVAN - 0.14, (z0 + z1) / 2, 0, 0, 0, kablolar);
    ekle(kutu(0.02, 0.1, z1 - z0), M.celik, x + 0.2, TAVAN - 0.14, (z0 + z1) / 2, 0, 0, 0, kablolar);
    for (let k = 0; k < (hafif ? 3 : 6); k++) ekle(silindirZ(0.028, 0.028, z1 - z0, 8), M.kablo, x - 0.15 + k * 0.06, TAVAN - 0.13, (z0 + z1) / 2, 0, 0, 0, kablolar);
  };
  tava(1.5, -3.5, 5.6); tava(-0.95, -4.8, 5.6);
  // kuleye inen demet: arka tavadan sağ yandan döşemeye iner, dişli kutusunun altından yaw eksenindeki
  // açıklığa girer ve kuleye sarkar (kule tarafında serbest ilmek olarak devam eder)
  ekle(cember(0.3, 0.035, 40), M.lastik, YM.x, TABAN + 0.02, YM.y, Math.PI / 2, 0, 0, kablolar);
  for (let k = 0; k < (hafif ? 4 : 8); k++) {
    const a = k / 8 * Math.PI * 2, r = 0.1, bx = YM.x + Math.cos(a) * r, bz = YM.y + Math.sin(a) * r;
    const e = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.4 - k * 0.04, TAVAN - 0.15, 1.2),
      new THREE.Vector3(1.5 - k * 0.025, TAVAN - 0.7, 0.98),
      new THREE.Vector3(1.48 - k * 0.025, TABAN + 0.55, 0.9 - k * 0.012),
      new THREE.Vector3(1.05 - k * 0.02, TABAN + 0.2, 0.78 - k * 0.015),
      new THREE.Vector3(YM.x + 0.32 + Math.cos(a) * 0.05, TABAN + 0.16, YM.y + 0.3 + Math.sin(a) * 0.05),
      new THREE.Vector3(bx, TABAN - 0.1, bz),
      new THREE.Vector3(bx, TABAN - 0.95, bz),
    ], false, 'centripetal');
    ekle(new THREE.TubeGeometry(e, hafif ? 36 : 80, 0.019, 8, false), M.kablo, 0, 0, 0, 0, 0, 0, kablolar);
  }

  /* =================== tabandaki erişim kapağı ve yaw sürücüleri =================== */
  {
    const kg = new THREE.Group(); kg.name = 'taban-kapagi'; g.add(kg);
    // sarı çerçeve (topuk levhası), açık kapak (dış kenarda menteşeli, dik durur), merdiven tutamakları, arka korkuluk
    for (const [w, d, x, z] of [[0.7, 0.05, 0, -0.325], [0.7, 0.05, 0, 0.325], [0.05, 0.6, -0.325, 0], [0.05, 0.6, 0.325, 0]]) ekle(kutu(w, 0.1, d), M.sari, KP.x + x, TABAN + 0.05, KP.y + z, 0, 0, 0, kg);
    const mp = new THREE.Group(); mp.position.set(KP.x - 0.35, TABAN + 0.1, KP.y); mp.rotation.z = 1.72; kg.add(mp);
    ekle(kutu(0.6, 0.03, 0.6), M.celik, 0.3, 0, 0, 0, 0, 0, mp); ekle(kutu(0.04, 0.035, 0.6), M.sari, 0.58, 0.01, 0, 0, 0, 0, mp);
    for (const sx of [-0.21, 0.21]) { ekle(new THREE.CylinderGeometry(0.02, 0.02, 1.05, 10), M.sari, KP.x + sx, TABAN + 0.52, KP.y + 0.3, 0, 0, 0, kg);
      ekle(new THREE.SphereGeometry(0.024, 10, 8), M.sari, KP.x + sx, TABAN + 1.05, KP.y + 0.3, 0, 0, 0, kg); }
    for (const sx of [-0.33, 0.33]) ekle(new THREE.CylinderGeometry(0.022, 0.022, 1.1, 8), M.sari, KP.x + sx, TABAN + 0.55, KP.y - 0.33, 0, 0, 0, kg);
    for (const hh of [0.55, 1.1]) ekle(new THREE.CylinderGeometry(0.02, 0.02, 0.66, 8), M.sari, KP.x, TABAN + hh, KP.y - 0.33, 0, 0, Math.PI / 2, kg);
    // yaw sürücüleri: gövde (dişli kutusu) şasiye cıvatalı, üstte motor ve fren
    for (const p of YS) {
      ekle(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 24), M.dokum, p.x, TABAN + 0.03, p.y, 0, 0, 0, kg);
      ekle(new THREE.CylinderGeometry(0.15, 0.16, 0.42, 24), M.dokum, p.x, TABAN + 0.27, p.y, 0, 0, 0, kg);
      ekle(new THREE.CylinderGeometry(0.125, 0.125, 0.3, 24), M.dolapK, p.x, TABAN + 0.63, p.y, 0, 0, 0, kg);
      ekle(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 20), M.siyah, p.x, TABAN + 0.82, p.y, 0, 0, 0, kg);
      ekle(kutu(0.1, 0.1, 0.08), M.siyah, p.x + 0.13, TABAN + 0.62, p.y, 0, 0, 0, kg);   // klemens kutusu
    }
  }

  /* =================== servis vinci rayı =================== */
  // ray tavan kapağında kesilir (kapak açıklığı boş kalır); araba ana milin üstünde
  ekle(kutu(0.16, 0.2, KZ0 - 0.1 - (ON + 0.7)), M.galv, 0, TAVAN - 0.12, (KZ0 - 0.1 + ON + 0.7) / 2);
  ekle(kutu(0.16, 0.2, ARKA - 0.4 - (KZ1 + 0.1)), M.galv, 0, TAVAN - 0.12, (ARKA - 0.4 + KZ1 + 0.1) / 2);
  // tavan iskeleti: boyuna galvaniz C-profiller, askı çubukları ve enine kirişler (kapak açıklığı boş kalır)
  {
    const cProfil = (x, z0, z1) => {
      const L = z1 - z0, zc = (z0 + z1) / 2;
      ekle(kutu(0.14, 0.02, L), M.galv, x, TAVAN - 0.36, zc);
      ekle(kutu(0.02, 0.12, L), M.galv, x - 0.06, TAVAN - 0.3, zc);
      ekle(kutu(0.14, 0.02, L), M.galv, x, TAVAN - 0.24, zc);
      for (let z = z0 + 0.3; z < z1; z += 1.2) {
        ekle(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), M.galv, x, TAVAN - 0.12, z);   // askı çubuğu
        ekle(kutu(0.1, 0.04, 0.08), M.galv, x, TAVAN - 0.02, z);                               // tavan pabucu
      }
    };
    for (const x of [-1.2, 1.2]) { cProfil(x, ON + 0.5, KZ0 - 0.15); cProfil(x, KZ1 + 0.15, ARKA - 0.3); }
    for (let z = ON + 1.1; z < ARKA - 0.3; z += 2.4) if (z < KZ0 - 0.2 || z > KZ1 + 0.2) ekle(kutu(2.55, 0.1, 0.06), M.galv, 0, TAVAN - 0.33, z);
    // ikaz kulesi (kırmızı–sarı sinyal lambası): tavandaki rayda
    ekle(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), M.siyah, -0.62, TAVAN - 0.4, -1.4, 0, 0, Math.PI / 2);
    ekle(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 16), M.sari, -0.56, TAVAN - 0.4, -1.4, 0, 0, Math.PI / 2);
    ekle(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 16), M.kirmizi, -0.51, TAVAN - 0.4, -1.4, 0, 0, Math.PI / 2);
  }
  // sarı–siyah ikaz şeritleri: ön perdede kirişin altı ve arka kapının üstü
  {
    const c = document.createElement('canvas'); c.width = 128; c.height = 16;
    const x = c.getContext('2d'); x.fillStyle = '#e2b414'; x.fillRect(0, 0, 128, 16); x.fillStyle = '#151515';
    for (let i = -16; i < 128; i += 32) { x.beginPath(); x.moveTo(i, 16); x.lineTo(i + 16, 0); x.lineTo(i + 32, 0); x.lineTo(i + 16, 16); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
    const serit = new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, metalness: 0.05 }); envEkle(serit, 0, 1.0);
    const sg = (w) => { const q = new THREE.PlaneGeometry(w, 0.12); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * w * 4); return q; };
    ekle(sg(SAG - SOL - 0.4), serit, 0, TAVAN - 0.5, ON + 0.03, 0, 0, 0, kabuk).castShadow = false;
    ekle(sg(1.3), serit, 0, TABAN + 2.15, ARKA - 0.03, 0, Math.PI, 0, kabuk).castShadow = false;
  }
  ekle(kutu(0.34, 0.22, 0.4), M.siyah, 0, TAVAN - 0.33, -4.1);
  ekle(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), M.celik, 0, TAVAN - 0.68, -4.1);
  ekle(new THREE.TorusGeometry(0.06, 0.018, 8, 16, Math.PI * 1.4), M.sari, 0, TAVAN - 0.98, -4.1);

  /* =================== aydınlatma armatürleri (soğuk beyaz LED) =================== */
  const lambalar = [];
  for (let z = -4.8; z <= 5.4; z += 2.4) for (const x of [-1.55, 1.55]) {
    if (x > 0 && z > 1.2 && z < 4.8) continue;          // konvertörün üstü boş
    ekle(kutu(0.13, 0.06, 1.3), M.galv, x, TAVAN - 0.05, z);         // floresan armatür gövdesi
    ekle(silindirZ(0.025, 0.025, 1.2, 10), M.lamba, x, TAVAN - 0.1, z);   // floresan tüp
    lambalar.push([x, TAVAN - 0.25, z]);
  }
  // arka geçidin üstünde bir armatür daha: jeneratörün arka yüzü ve sol koridor sahadaki gibi aydınlık
  ekle(kutu(1.3, 0.06, 0.13), M.galv, -0.85, TAVAN - 0.05, ARKA - 0.45);
  ekle(silindirZ(0.025, 0.025, 1.2, 10), M.lamba, -0.85, TAVAN - 0.1, ARKA - 0.45, 0, Math.PI / 2, 0);
  lambalar.push([-0.85, TAVAN - 0.3, ARKA - 0.6]);

  /* =================== V22 saha ayrıntısı: boya dokusu, ikaz etiketleri, soğutma fanı, saha düzeni, temas gölgeleri ===================
   * Hepsi prosedürel (dosya yok). Etiketler ISO 7010 genel işaretleri; hiçbir üretici adı ya da logo yok. */
  const doku = (w, h, ciz, renkli = true) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; ciz(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (renkli) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
  };
  // boya ve GRP yüzeyi: hafif dalgalı pürüzlülük (ışık parlaması yüzeyde düzgün kayar, plastik görünmez)
  // (V23) eski benekli doku gerçek ekran kartında kumlu görünüyordu: yerine geniş, çok düşük kontrastlı dalga ve
  // silinme izi (el değen yerlerde boya biraz daha parlak) — yansıma yüzeyde canlı ama düzgün kayar
  const purus = doku(256, 256, (x, w, h) => {
    x.fillStyle = '#a8a8a8'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const r = 12 + Math.random() * 48, px = Math.random() * w, py = Math.random() * h, v = Math.random() < 0.5 ? 135 : 200, gr = x.createRadialGradient(px, py, 0, px, py, r);
      gr.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',0.35)'); gr.addColorStop(1, 'rgba(' + v + ',' + v + ',' + v + ',0)'); x.fillStyle = gr; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(120,120,120,0.18)'; x.fillRect(Math.random() * w, Math.random() * h, 8 + Math.random() * 40, 1); }   // ince silinme çizgileri
  }, false);
  purus.wrapS = purus.wrapT = THREE.RepeatWrapping; purus.repeat.set(1.5, 1.5);
  for (const k of ['mavi', 'maviK', 'dolap']) { M[k].roughnessMap = purus; }
  M.mavi.roughness = 0.55; M.maviK.roughness = 0.6;
  // ikaz etiketleri: sarı üçgen elektrik tehlikesi (W012) ve sıcak yüzey (W017), mavi daire "kulak koruyucu tak" (M003)
  const etiketMat = (ciz) => { const m = new THREE.MeshStandardMaterial({ map: doku(128, 128, ciz), alphaTest: 0.5, transparent: false, roughness: 0.5, metalness: 0, side: THREE.DoubleSide }); envEkle(m, 0, 1.0); return m; };
  const ucgen = (x, w) => { x.beginPath(); x.moveTo(w / 2, 8); x.lineTo(w - 6, w - 14); x.lineTo(6, w - 14); x.closePath(); };
  const etElektrik = etiketMat((x, w) => { ucgen(x, w); x.fillStyle = '#111'; x.fill(); x.save(); x.translate(w / 2, w / 2 + 6); x.scale(0.8, 0.8); x.translate(-w / 2, -w / 2 - 6); ucgen(x, w); x.fillStyle = '#f2c200'; x.fill(); x.restore();
    x.fillStyle = '#111'; x.beginPath(); x.moveTo(70, 38); x.lineTo(50, 78); x.lineTo(64, 76); x.lineTo(56, 104); x.lineTo(80, 66); x.lineTo(66, 68); x.closePath(); x.fill(); });
  const etSicak = etiketMat((x, w) => { ucgen(x, w); x.fillStyle = '#111'; x.fill(); x.save(); x.translate(w / 2, w / 2 + 6); x.scale(0.8, 0.8); x.translate(-w / 2, -w / 2 - 6); ucgen(x, w); x.fillStyle = '#f2c200'; x.fill(); x.restore();
    x.strokeStyle = '#111'; x.lineWidth = 6; for (const dx of [-14, 0, 14]) { x.beginPath(); x.moveTo(64 + dx, 96); x.bezierCurveTo(56 + dx, 84, 72 + dx, 74, 64 + dx, 60); x.stroke(); } x.fillRect(40, 98, 48, 6); });
  const etKulak = etiketMat((x, w) => { x.fillStyle = '#fff'; x.beginPath(); x.arc(w / 2, w / 2, 60, 0, 7); x.fill(); x.fillStyle = '#1f5fae'; x.beginPath(); x.arc(w / 2, w / 2, 55, 0, 7); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 9; x.beginPath(); x.arc(64, 62, 26, Math.PI, 0); x.stroke(); x.fillStyle = '#fff'; x.fillRect(30, 58, 16, 28); x.fillRect(82, 58, 16, 28); });
  const etiket = (mat, bx, by, bz, ry, boy = 0.13) => { const m = ekle(new THREE.PlaneGeometry(boy, boy), mat, bx, by, bz, 0, ry, 0, jen); m.castShadow = false; return m; };
  etiket(etElektrik, -1.215, HIZLI + 0.12, 3.35, -Math.PI / 2);            // sol bağlantı dolabı
  etiket(etElektrik, -1.215, HIZLI - 0.58, 3.35, -Math.PI / 2);
  etiket(etSicak, -0.945, HIZLI + 0.95, 3.0, -Math.PI / 2 - 0.4, 0.12);     // kaput yanı
  etiket(etElektrik, 1.215, HIZLI + 0.2, 2.9, Math.PI / 2, 0.11);           // sağ klemens kutusu
  etiket(etKulak, 0.2, HIZLI + 0.35, 5.18, 0, 0.12);                         // arka kapak: gürültü
  for (const z of [1.85, 3.0]) { const m = ekle(new THREE.PlaneGeometry(0.12, 0.12), etElektrik, SOL + 0.42, TABAN + 1.15, z, 0, Math.PI / 2, 0, panolar); m.castShadow = false; }

  // dişli kutusu yağ soğutucusu: sol duvarda yuvarlak fan ve ızgara (fan döner)
  const fan = new THREE.Group(); fan.name = 'sogutucu-fan';
  {
    const fx = SOL + 0.36, fy = TABAN + 1.25, fz = 0.55;
    ekle(kutu(0.42, 0.8, 0.8), M.dolap, fx - 0.12, fy, fz);                                         // soğutucu gövdesi
    ekle(new THREE.TorusGeometry(0.3, 0.035, 10, 40), M.galv, fx + 0.1, fy, fz, 0, Math.PI / 2, 0);     // fan bileziği
    for (let r = 0.08; r <= 0.27; r += 0.063) ekle(new THREE.TorusGeometry(r, 0.006, 6, 32), M.siyah, fx + 0.12, fy, fz, 0, Math.PI / 2, 0); // ızgara halkaları
    ekle(kutu(0.01, 0.6, 0.012), M.siyah, fx + 0.12, fy, fz); ekle(kutu(0.01, 0.012, 0.6), M.siyah, fx + 0.12, fy, fz);
    fan.position.set(fx + 0.07, fy, fz); g.add(fan);
    for (let i = 0; i < 5; i++) { const k = ekle(kutu(0.012, 0.24, 0.08), M.siyah, 0, 0, 0, 0.5, 0, 0, fan); k.position.set(0, Math.cos(i / 5 * Math.PI * 2) * 0.13, Math.sin(i / 5 * Math.PI * 2) * 0.13); k.rotation.set(i / 5 * Math.PI * 2, 0, 0.35); }
    ekle(silindirZ(0.05, 0.05, 0.06, 16), M.siyah, 0, 0, 0, 0, Math.PI / 2, 0, fan);
  }

  // saha düzeni: koridorda servis çantası, bez ve eldiven (bakım sürüyor)
  if (!hafif) {
    const kumas = new THREE.MeshStandardMaterial({ color: 0x4a2027, roughness: 0.95, metalness: 0 });
    const eldiven = new THREE.MeshStandardMaterial({ color: 0x3b6fb8, roughness: 0.8, metalness: 0 });
    envEkle(kumas, 0, 1.0); envEkle(eldiven, 0, 1.0);
    // koridora bırakılmış çelik örtü levhaları (sahadaki gibi: baklava saçın üstünde iki mat gri levha)
    const plaka = new THREE.MeshStandardMaterial({ color: 0x7c8084, roughness: 0.62, metalness: 0.55, roughnessMap: purus }); envEkle(plaka, 0.3, 1.0);
    for (const [px, pz, w, d, r] of [[-1.28, 4.35, 0.62, 0.95, 0.04], [-1.22, 2.95, 0.55, 0.7, -0.06]]) { const m = ekle(kutu(w, 0.008, d), plaka, px, TABAN + 0.004, pz, 0, r, 0); m.castShadow = false; }
    const cz = 1.0;
    ekle(kutu(0.42, 0.26, 0.26), M.siyah, -1.62, TABAN + 0.13, cz + 0.35, 0, 0.35, 0);                  // çanta
    ekle(new THREE.TorusGeometry(0.1, 0.014, 6, 16, Math.PI), M.lastik, -1.62, TABAN + 0.26, cz + 0.35, 0, 0.35, 0);
    ekle(kutu(0.05, 0.02, 0.16), M.sari, -1.5, TABAN + 0.28, cz + 0.4, 0, 0.9, 0.2);                    // çantadan taşan alet sapı
    const bez = (x, z, ry, sx, sz) => { const q = new THREE.PlaneGeometry(sx, sz, 8, 8); const ps = q.attributes.position;
      for (let i = 0; i < ps.count; i++) ps.setZ(i, Math.sin(ps.getX(i) * 17 + ps.getY(i) * 11) * 0.015 + Math.random() * 0.012); q.computeVertexNormals();
      const m = ekle(q, kumas, x, TABAN + 0.012, z, -Math.PI / 2, 0, ry); m.castShadow = false; };
    bez(-0.75, cz + 1.3, 0.6, 0.5, 0.32); bez(-0.95, cz + 0.6, -0.3, 0.36, 0.26); bez(-0.6, cz - 0.2, 1.2, 0.3, 0.22);
    for (const [x, z, r] of [[-0.82, cz + 0.85, 0.3], [-0.7, cz + 0.95, 1.4]]) ekle(kutu(0.09, 0.02, 0.2), eldiven, x, TABAN + 0.012, z, 0, r, 0);
  }

  // temas gölgeleri: makinelerin altında yumuşak kararma (gölge haritası olmayan hafif kipte de derinlik verir)
  {
    const tg = doku(64, 64, (x, w) => { const gr = x.createRadialGradient(w / 2, w / 2, 2, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, w); }, false);
    const tgm = new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: tg, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const golge = (x, z, sx, sz) => { const m = ekle(new THREE.PlaneGeometry(sx, sz), tgm, x, TABAN + 0.006, z, -Math.PI / 2, 0, 0); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 1; };
    golge(0, 3.4, 2.6, 3.4); golge(0, -0.6, 2.6, 2.2); golge(0, -3.6, 2.8, 5.0);
    golge(SAG - 0.3, 2.7, 0.9, 3.6); golge(SOL + 0.25, 2.8, 0.8, 2.4); golge(SOL + 0.28, 4.75, 0.8, 1.5);
    if (!hafif) golge(-1.62, 1.35, 0.7, 0.5);
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

  /* ---- sabit parçaları malzemeye göre birleştir: ~350 çizim çağrısı → ~45 ----
   * Dönen gruplar (ana mil, kaplin) ve cıvatalar ayrı kalır. Bileşen grupları kendi içinde birleşir;
   * böylece röntgen görünümünde her bileşen ayrı vurgulanır ve patlatma görünümünde yerinden kayar. */
  const parcaGrup = { anaYatak: onGrup, anaMil, disli, kaplin: kaplinPivot, jenerator: jen, konvertor: konv, panolar, ustKutu, kablolar, kabuk };
  if (!(typeof window !== 'undefined' && window.__deneyimBirlestirme === false)) birlestir(g, [anaMil, kaplinPivot, civ, fan], [onGrup, disli, jen, konv, panolar, ustKutu, kablolar, kabuk]);

  /* ---- anlatı durakları: HUD'un bağlandığı parça merkezleri (nasel yerel) ---- */
  const duraklar = {
    anaYatak:   new THREE.Vector3(0, AKS, -5.1),
    anaMil:     new THREE.Vector3(0, AKS, -3.55),
    disli:      new THREE.Vector3(0, AKS + 0.2, -1.4),
    kaplin:     new THREE.Vector3(0, HIZLI, 1.5),
    jenerator:  new THREE.Vector3(0, HIZLI, 3.3),
    konvertor:  new THREE.Vector3(SAG - 0.4, TABAN + 1.1, 2.7),
    ustKutu:    new THREE.Vector3(SOL + 0.4, TABAN + 1.0, 4.75),
    kablolar:   new THREE.Vector3(YM.x + 0.2, TABAN + 0.3, YM.y + 0.2),
    panolar:    new THREE.Vector3(SOL + 0.3, TABAN + 0.8, 2.8),
    kapak:      new THREE.Vector3(0, TAVAN, (KZ0 + KZ1) / 2),
  };

  /* Makine dairesinin kendi küp görüntüsü geldiğinde: bütün yüzeyler odanın gerçek ışığıyla aydınlanır.
   * env yoksa (null) stüdyo değerlerine döner. Kabuğun ışıma hilesi küçülür: ışığı artık sekme veriyor. */
  const ortamAyarla = (env) => {
    envMalzeme.forEach(([m, ilk, icD]) => { if (env) { m.envMap = env; m.envMapIntensity = icD; } else { m.envMap = opts.envMap; m.envMapIntensity = ilk; } });
    M.duvar.emissiveIntensity = M.tavan.emissiveIntensity = env ? 0.42 : 1;
  };

  return { grup: g, kabuk, lambalar, ortamAyarla, duraklar, anaMil, kaplinPivot, fan, parcaGrup, civatalar: civ, sinir: { TABAN, TAVAN, SOL, SAG, ON, ARKA, KZ0, KZ1, KX } };
}

function birlestir(kok, haric, gruplar = []) {
  kok.updateMatrixWorld(true);
  const tersler = new Map([[kok, new THREE.Matrix4().copy(kok.matrixWorld).invert()]]);
  gruplar.forEach(gr => tersler.set(gr, new THREE.Matrix4().copy(gr.matrixWorld).invert()));
  const disla = new Set();
  haric.forEach(h => h && h.traverse(o => disla.add(o)));
  const kovalar = new Map();
  const silinecek = [];
  kok.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || disla.has(o)) return;
    let a = o; while (a.parent && a.parent !== kok) a = a.parent;   // kökün altındaki üst grup
    const hedef = tersler.has(a) ? a : kok;
    const anahtar = hedef.uuid + '|' + o.material.uuid + (o.castShadow ? '|g' : '|-');
    if (!kovalar.has(anahtar)) kovalar.set(anahtar, { hedef, mat: o.material, golge: o.castShadow, parcalar: [] });
    const m = new THREE.Matrix4().multiplyMatrices(tersler.get(hedef), o.matrixWorld);
    let geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    geo.applyMatrix4(m);
    kovalar.get(anahtar).parcalar.push(geo);
    silinecek.push(o);
  });
  silinecek.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
  for (const { hedef, mat, golge, parcalar } of kovalar.values()) {
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
    hedef.add(mesh);
  }
}
