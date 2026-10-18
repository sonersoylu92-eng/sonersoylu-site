/* korfez.js — kapak dünyası (V18): Aliağa açığı, Çandarlı Körfezi'nin ağzında deniz üstü bir türbin.
 *
 * Gerçekçiliği gök ve su taşır; kara yalnız uzak, puslu siluettir:
 *   - Gök: Preetham analitik gökyüzü modeli (three.js Sky örneğiyle aynı fizik, MIT). Güneşin gerçek konumu
 *     gok.js'ten gelir; renk, parlaklık ve ufuk pusu bu modelden türetilir. Güneş battıktan sonra (Preetham kararır)
 *     ufukta sivil alacakaranlık ışıması ve karşı ufukta Venüs kuşağı eklenir.
 *   - Deniz: döşenebilir dalga normal haritası (Phillips tayfı, mip haritalı) üç ölçekte, gerçek rüzgâr yönünde akar;
 *     yansıyan gök aynı gök fonksiyonundan hesaplanır, güneş ışık yolu ve parıltılar kendiliğinden oluşur.
 *   - Siluetler: Midilli, Ayvalık, Dikili–Çandarlı, Madra, Aliağa ve Yunt Dağı, Foça, Karaburun. Profiller temsilîdir;
 *     yönleri ve uzaklıkları gerçek coğrafyaya göre, dünya eğriliğiyle birlikte hesaplanır. Ekimde güneş
 *     Karaburun'un burnunun hemen sağından açık denize batar.
 *   - Gece: kıyı yerleşimlerinin ışıkları, rafineri meşalesi, tepelerdeki türbinlerin kırmızı ikaz ışıkları; demirli gemiler.
 *   - Türbin: sarı geçiş parçası ve tek kazıklı temel üstünde; kule kapısı ızgaralı platformdan açılır.
 * Dünya eksenleri: kuzey = -z, doğu = +x, yukarı = +y. Türbin (0, 0); platform zemini 0,83 m, deniz SU_Y.
 */
import * as THREE from '/assets/vendor/three.module.min.js?v=3eb31ec4';

export const SU_Y = -16;
const DENIZ_R = 5600, YAKIN_R = 4500;   // 4,5 km'ye kadar deniz gerçek düzlem; 4,5–5,6 km halkası gerçek ufka (40+ km) kadar uzanır
const RAD = Math.PI / 180;
/* Ufuk eşlemesi (gölgelendiricilerde ortak): kamera yüksekliğine göre ufuk uzaklığı Dh = √(2R'h); uzak halkadaki her nokta
 * gerçekte D uzaklığındaki suyun görüneceği açıya konur (dünya eğriliği, standart kırılmayla R' = 7/6 R). Kara siluetleri
 * ve kıyı ışıkları da aynı eşlemeyle, gerçek uzaklıklarına karşılık gelen halka yarıçapına yerleşir: kıyı çizgisi suyla
 * tam ufukta buluşur, kamera yükselip alçaldıkça ufuk gerçekteki gibi açılır. */
const UFUK_GLSL = `
  const float YAKIN_R = ${YAKIN_R.toFixed(1)}, DENIZ_R = ${DENIZ_R.toFixed(1)}, IKI_R = 1.4866e7;
  float ufukUzak(float camH){ return max(sqrt(IKI_R * camH), DENIZ_R); }
  float halkaR(float D, float camH){   // gerçek uzaklık → halka yarıçapı
    if (D <= YAKIN_R) return D;
    return min(YAKIN_R + (D - YAKIN_R) / (ufukUzak(camH) - YAKIN_R) * (DENIZ_R - YAKIN_R), DENIZ_R * 0.995);
  }
  float gercekD(float r, float camH){   // halka yarıçapı → gerçek uzaklık
    if (r <= YAKIN_R) return r;
    return YAKIN_R + (r - YAKIN_R) / (DENIZ_R - YAKIN_R) * (ufukUzak(camH) - YAKIN_R);
  }`;

/* ---------------- Preetham gök modeli (Sky.js ile aynı sabitler) ---------------- */
const T_RAY = [5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5];
const MIE_C = [1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14];
const GOK_GLSL = `
  uniform vec3 uGunesYon, uBetaR, uBetaM;
  uniform float uSunE, uMieG, uParlak, uAlaca, uGeceT, uBulutK, uBulutT;
  uniform vec3 uBulutRenk, uBulutIsik;
  float gkHg(float c, float g){ float g2 = g*g; return 0.07957747154594767 * (1.0 - g2) / pow(1.0 - 2.0*g*c + g2, 1.5); }
  float gkH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gkN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(gkH(i), gkH(i+vec2(1,0)), f.x), mix(gkH(i+vec2(0,1)), gkH(i+vec2(1,1)), f.x), f.y); }
  vec3 gokIsigi(vec3 d, float disk){
    float zen = acos(max(0.0, d.y));
    float inv = 1.0 / (cos(zen) + 0.15 * pow(93.885 - zen * 57.29577951308232, -1.253));
    vec3 Fex = exp(-(uBetaR * (8.4E3 * inv) + uBetaM * (1.25E3 * inv)));
    float ct = dot(d, uGunesYon);
    vec3 bT = uBetaR * (0.05968310365946075 * (1.0 + pow(ct * 0.5 + 0.5, 2.0))) + uBetaM * gkHg(ct, uMieG);
    vec3 oran = bT / (uBetaR + uBetaM);
    vec3 Lin = pow(uSunE * oran * (1.0 - Fex), vec3(1.5));
    Lin *= mix(vec3(1.0), pow(uSunE * oran * Fex, vec3(0.5)), clamp(pow(1.0 - uGunesYon.y, 5.0), 0.0, 1.0));
    vec3 L0 = vec3(0.1) * Fex;
    L0 += uSunE * 19000.0 * Fex * smoothstep(0.999956676946448, 0.999976676946448, ct) * disk;
    vec3 c = pow((Lin + L0) * 0.04 + vec3(0.0, 0.0003, 0.00075), vec3(1.0 / 2.4));
    // alacakaranlık: güneş −10°…+3° arası; ufukta güneş yönünde turuncu-kızıl, karşıda Venüs kuşağı ve dünya gölgesi
    if (uAlaca > 0.0) {
      vec2 sh = normalize(uGunesYon.xz + vec2(1e-5)), dh = normalize(d.xz + vec2(1e-5));
      float yon = dot(dh, sh) * 0.5 + 0.5, y = max(d.y, 0.0);
      vec3 parilti = mix(vec3(0.20, 0.07, 0.16), vec3(1.0, 0.40, 0.12), pow(yon, 2.5)) * exp(-y * mix(5.0, 11.0, yon)) * (0.35 + 0.65 * pow(yon, 4.0));
      vec3 venus = vec3(0.30, 0.16, 0.24) * exp(-pow((y - 0.07) / 0.05, 2.0)) * pow(1.0 - yon, 2.0);
      vec3 golge = vec3(0.05, 0.07, 0.14) * exp(-y * 6.0) * pow(1.0 - yon, 2.0);
      vec3 ust = vec3(0.07, 0.10, 0.22) * smoothstep(0.0, 0.7, y);
      c += (parilti + venus + golge + ust) * uAlaca;
    }
    c += uGeceT * mix(vec3(0.012, 0.016, 0.034), vec3(0.003, 0.006, 0.017), smoothstep(0.0, 0.55, max(d.y, 0.0)));
    c *= uParlak;
    // bulut örtüsü (Aliağa hava kodundan): parçalıda yer yer, kapalıda tümüyle; güneşin olduğu yer bulutun ardından aydınlanır
    if (uBulutK > 0.0) {
      float y = max(d.y, 0.0);
      vec2 uv = d.xz / (y + 0.11) * 1.4 + vec2(uBulutT, uBulutT * 0.37);
      float n = gkN(uv) * 0.5 + gkN(uv * 2.03 + 7.1) * 0.27 + gkN(uv * 4.1 + 2.3) * 0.15 + gkN(uv * 8.3) * 0.08;
      float a = smoothstep(1.0 - uBulutK * 1.1, 1.25 - uBulutK, n) * smoothstep(-0.02, 0.05, d.y + 0.03 + uBulutK * uBulutK * 0.06);
      float g = max(dot(d, uGunesYon), 0.0);
      vec3 b = uBulutRenk * (0.62 + 0.55 * n) + uBulutIsik * (pow(g, 5.0) * 0.7 + pow(g, 40.0) * 0.6 + 0.12) * (1.25 - n);
      c = mix(c, b, a);
    }
    return c;
  }`;

// aynı fonksiyonun JS kopyası: sis rengi, ortam ışığı ve güneş ışığı rengi için (disk ve gece hariç)
function gokJS(U, d, out) {
  const s = U.uGunesYon.value, bR = U.uBetaR.value, bM = U.uBetaM.value, sunE = U.uSunE.value, g = U.uMieG.value;
  const zen = Math.acos(Math.max(0, d.y)), inv = 1 / (Math.cos(zen) + 0.15 * Math.pow(93.885 - zen / RAD, -1.253));
  const ct = d.x * s.x + d.y * s.y + d.z * s.z, rP = 0.05968310365946075 * (1 + Math.pow(ct * 0.5 + 0.5, 2));
  const g2 = g * g, mP = 0.07957747154594767 * (1 - g2) / Math.pow(1 - 2 * g * ct + g2, 1.5);
  const k = Math.min(1, Math.max(0, Math.pow(1 - s.y, 5)));
  const c = ['x', 'y', 'z'].map(e => {
    const br = bR[e], bm = bM[e], Fex = Math.exp(-(br * 8.4E3 * inv + bm * 1.25E3 * inv));
    const oran = (br * rP + bm * mP) / (br + bm);
    let Lin = Math.pow(sunE * oran * (1 - Fex), 1.5);
    Lin *= 1 + (Math.pow(sunE * oran * Fex, 0.5) - 1) * k;
    return Math.pow((Lin + 0.1 * Fex) * 0.04 + (e === 'y' ? 0.0003 : e === 'z' ? 0.00075 : 0), 1 / 2.4) * U.uParlak.value;
  });
  return out.setRGB(c[0], c[1], c[2], THREE.LinearSRGBColorSpace);
}

/* ---------------- dalga normal haritası ---------------- */
const DENIZ_VS = `${UFUK_GLSL}
  uniform float uSuY; varying vec3 vW; varying float vD;
  void main(){
    vec4 w = modelMatrix * vec4(position, 1.0);
    float r = length(w.xz - cameraPosition.xz), camH = max(cameraPosition.y - uSuY, 0.5);
    float D = gercekD(r, camH);
    if (r > YAKIN_R) w.y = cameraPosition.y - r * (camH + D * D / IKI_R) / D;
    vW = w.xyz; vD = D;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const denizFS = lite => `
  ${GOK_GLSL}
  uniform sampler2D uNormal; uniform float uZaman, uDalga, uKopuk, uKapali;
  uniform vec2 uRz; uniform vec3 uSuRenk, uOrtam, uGunesRenk, uPus;
  varying vec3 vW; varying float vD;
  float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float gr(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hs(i), hs(i+vec2(1,0)), f.x), mix(hs(i+vec2(0,1)), hs(i+vec2(1,1)), f.x), f.y); }
  vec2 egim(vec2 uv){ vec3 n = texture2D(uNormal, uv).xyz * 2.0 - 1.0; return n.xy / max(n.z, 0.4); }
  void main(){
    vec3 V = normalize(vW - cameraPosition); float uz = vD;
    // rüzgâr eksenine çevir: harita +x yönünde akar
    vec2 p = vec2(dot(vW.xz, uRz), dot(vW.xz, vec2(-uRz.y, uRz.x)));
    float t = uZaman;
    vec2 g = egim(p / 43.0 + vec2(t * 0.021, 0.0)) * 0.55
           + egim(p / 241.0 + vec2(t * 0.0047, 0.013)) * 0.5
           ${lite ? '' : '+ egim(vec2(p.x * 0.8 - p.y * 0.6, p.x * 0.6 + p.y * 0.8) / 12.3 + vec2(t * 0.046, t * 0.017) + 0.37) * 0.3'};
    g = vec2(g.x * uRz.x - g.y * uRz.y, g.x * uRz.y + g.y * uRz.x) * uDalga;
    vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
    vec3 R = reflect(V, N); R.y = abs(R.y);
    float cosI = clamp(dot(-V, N), 0.0, 1.0);
    float F = 0.02 + 0.98 * pow(1.0 - cosI, 5.0);
    float yakin = 1.0 - smoothstep(500.0, 2200.0, uz);
    vec3 yans = gokIsigi(R, yakin);
    // çözülemeyen uzak dalgalar için genişleyen güneş lobu (ışık yolu ufka kadar sürer)
    float pz = mix(0.035, 0.11, smoothstep(120.0, 4200.0, uz)) * (0.7 + 0.3 * uDalga);
    float rl = max(dot(R, uGunesYon), 0.0);
    vec3 parla = uGunesRenk * exp(-(1.0 - rl) / (pz * pz)) * (0.9 / (pz * 40.0));
    // su gövdesi: derin Ege mavisi, gökten aydınlanır; dalga sırtında güneşe karşı hafif yeşil ışıma
    vec3 su = uSuRenk * uOrtam + uSuRenk * uGunesRenk * 0.6 * pow(max(dot(V, uGunesYon), 0.0), 4.0) * max(g.x * uRz.x + g.y * uRz.y, 0.0);
    vec3 col = mix(su, yans, F) + parla * (1.0 - uKapali);
    // köpük: kazık çevresi ve rüzgâr arttıkça beyaz köpüklü dalga başları
    float r0 = length(vW.xz);
    float kazik = exp(-pow((r0 - 3.3) / 1.6, 2.0)) * (0.55 + 0.45 * gr(vW.xz * 1.3 + t * 0.7));
    float bas = smoothstep(0.80, 0.93, gr(p / 7.0 + vec2(t * 0.12, 0.0)) * 0.6 + gr(p / 2.3 - t * 0.2) * 0.4) * uKopuk * (1.0 - smoothstep(300.0, 1600.0, uz));
    col = mix(col, uOrtam * 0.9 + uGunesRenk * 0.25, clamp(kazik * 0.75 + bas * 0.8, 0.0, 1.0));
    col = mix(col, uPus, uKapali * 0.55);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

/* ---------------- kara siluetleri: [azimut°, yükseklik m, uzaklık km] (temsilî profil, gerçek yön ve uzaklık) ---------------- */
const KARA = [
  { ad: 'Madra', dok: 0.9, p: [[5, 0, 50], [10, 500, 48], [18, 900, 47], [26, 1250, 50], [32, 1150, 52], [40, 900, 50], [48, 700, 45], [56, 500, 40], [62, 0, 38]] },
  { ad: 'Kozak', dok: 0.7, p: [[28, 0, 30], [34, 350, 28], [42, 520, 27], [52, 600, 26], [62, 520, 24], [70, 0, 22]] },
  { ad: 'Yunt', dok: 0.8, p: [[72, 0, 30], [80, 500, 30], [92, 850, 28], [104, 1050, 27], [116, 980, 27], [128, 800, 28], [140, 600, 30], [152, 0, 30]] },
  { ad: 'Midilli', dok: 1, p: [[287, 0, 46], [288.5, 120, 45], [291, 260, 44], [294, 380, 44], [297, 520, 46], [300, 820, 48], [302, 960, 48.6], [304, 760, 47], [307, 520, 45], [310, 430, 44], [313, 380, 43], [316, 480, 42], [318, 560, 43], [321, 700, 50], [324, 880, 60], [327, 760, 62], [331, 520, 60], [335, 360, 58], [338, 120, 57], [339.5, 0, 57]] },
  { ad: 'Ayvalik', dok: 0.7, p: [[337, 0, 60], [339, 140, 58], [343, 260, 55], [347, 300, 52], [351, 180, 50], [353, 0, 49]] },
  { ad: 'Urla', dok: 0.6, p: [[210, 0, 60], [213, 250, 58], [217, 400, 55], [221, 0, 52]] },
  { ad: 'Karaburun', dok: 1.1, p: [[219, 0, 46], [221, 300, 44], [224, 700, 41], [228, 1050, 39], [231, 1218, 38], [234, 1050, 38], [238, 820, 37.5], [242, 640, 37], [246, 520, 37], [250, 420, 37], [253, 300, 37.5], [255.5, 160, 38], [257, 0, 38]] },
  { ad: 'Dikili', dok: 0.8, p: [[345, 0, 30], [347, 60, 29], [352, 160, 28], [358, 260, 27], [4, 340, 26], [10, 300, 24], [15, 240, 20], [19, 120, 16], [21, 0, 14]] },
  { ad: 'Foca', dok: 0.9, p: [[168, 0, 9], [172, 90, 9], [180, 220, 9.5], [188, 320, 10], [196, 380, 11], [202, 300, 12], [207, 420, 15], [212, 480, 18], [217, 380, 20], [221, 200, 21], [224, 0, 21]] },
  { ad: 'Aliaga', dok: 1, p: [[52, 0, 12], [55, 80, 11], [62, 180, 10], [70, 260, 9.5], [78, 320, 9], [86, 380, 8.5], [94, 420, 8], [102, 360, 7.5], [110, 260, 7], [118, 200, 7], [126, 250, 7.5], [134, 300, 8], [142, 260, 8.5], [150, 180, 9], [158, 120, 9.5], [166, 60, 10], [172, 0, 10]] },
  { ad: 'Candarli', dok: 0.6, p: [[16, 0, 14], [18.5, 70, 13], [21.5, 110, 12.5], [24.5, 80, 12], [27, 0, 12]] },
];
// kıyı ışıkları: [azimut, uzaklık km, adet, yayılma°, tür] — tür 0 yerleşim, 1 sanayi, 2 meşale
const ISIK = [[100, 7.5, 70, 6, 0], [118, 7.4, 46, 3.5, 1], [125, 8, 30, 3, 1], [113, 6.5, 22, 2.5, 1], [119.5, 7.3, 1, 0, 2], [198, 9.5, 30, 2.5, 0],
  [211, 19.5, 40, 2, 0], [21, 13, 25, 2, 0], [2, 28, 35, 3, 0], [352, 30, 10, 1.5, 0], [342, 57, 30, 3, 0], [317, 42, 60, 2.5, 0], [293, 43, 15, 1.5, 0],
  [229, 41, 12, 1.5, 0], [235, 38, 12, 1.5, 0], [180, 9.5, 14, 4, 0], [60, 10, 18, 4, 0]];
// tepelerdeki rüzgâr santrallerinin kırmızı ikaz ışıkları: [azimut başı, sonu, uzaklık km, adet]
const RES = [[84, 108, 8.6, 14], [36, 52, 27, 10], [186, 196, 10.5, 6]];

function h1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function g1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return h1(i) * (1 - u) + h1(i + 1) * u; }
function profil(p, az) {   // kontrol noktaları arasında yumuşak geçiş
  let i = 0; while (i < p.length - 2 && az > p[i + 1][0]) i++;
  const a = p[i], b = p[i + 1], t = THREE.MathUtils.clamp((az - a[0]) / (b[0] - a[0]), 0, 1), u = t * t * (3 - 2 * t);
  return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
}
const acSarma = (a0, a1) => (a1 < a0 ? a1 + 360 : a1);
const azYon = az => [Math.sin(az * RAD), -Math.cos(az * RAD)];
const KARA_P = KARA.map(k => { const a0 = k.p[0][0]; return { a0, a1: acSarma(a0, k.p[k.p.length - 1][0]), p: k.p.map(([az, h, d]) => [az < a0 ? az + 360 : az, h, d]) }; });
// verilen azimutta, yaklaşık d km uzaklıktaki kara parçasının sırt yüksekliği (ayrıntısız)
function sirtYuk(az, d) {
  for (const k of KARA_P) { const z = az < k.a0 ? az + 360 : az; if (z < k.a0 || z > k.a1) continue; const [h, dd] = profil(k.p, z); if (Math.abs(dd - d) < 4) return h; }
  return 250;
}
// kameradan bakınca o azimuttaki karanın ufuk üstü açısı (derece): batan güneş ve doğan ay dağın ardına geçer
export function ufukAci(az, camH) {
  let en = -90;
  for (const k of KARA_P) {
    const z = az < k.a0 ? az + 360 : az; if (z < k.a0 || z > k.a1) continue;
    const [h, d] = profil(k.p, z), D = d * 1000;
    en = Math.max(en, Math.atan((h * 1.05 - D * D / 1.4866e7 - camH) / D) / RAD);
  }
  return en;
}

const KARA_VS = `${UFUK_GLSL}
  attribute float aYuk; attribute float aUzak; uniform float uSuY;
  varying vec3 vYon; varying float vUzak; varying float vYuk;
  void main(){
    float camH = max(cameraPosition.y - uSuY, 0.5);
    float rc = halkaR(aUzak, camH) * 0.985;                       // aynı uzaklıktaki suyun biraz önünde
    vec4 w = vec4(cameraPosition.x + position.x * rc, 0.0, cameraPosition.z + position.z * rc, 1.0);
    w.y = cameraPosition.y + rc * (aYuk - aUzak * aUzak / IKI_R - camH) / aUzak;
    vYon = w.xyz - cameraPosition; vUzak = aUzak; vYuk = aYuk;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const KARA_FS = `
  ${GOK_GLSL}
  uniform vec3 uKara, uOrtam, uGunesRenk; uniform float uGorus, uKapali; uniform vec3 uPus;
  varying vec3 vYon; varying float vUzak; varying float vYuk;
  void main(){
    vec3 d = normalize(vYon);
    vec3 sac = gokIsigi(normalize(vec3(d.x, max(d.y, 0.0) + 0.01, d.z)), 0.0);
    vec2 sh = normalize(uGunesYon.xz + vec2(1e-5)), lh = normalize(d.xz);
    float on = clamp(0.5 - 0.5 * dot(lh, sh), 0.0, 1.0);
    vec3 c = uKara * (uOrtam + uGunesRenk * on * clamp(uGunesYon.y * 3.0, 0.0, 1.0) * 0.9);
    float t = 1.0 - exp(-vUzak / uGorus);
    t = t + (1.0 - t) * 0.22 * exp(-max(vYuk, 0.0) / 160.0);        // deniz üstü pus katmanı: etekler daha soluk
    c = mix(c, sac, clamp(t, 0.0, 1.0));
    c = mix(c, uPus, uKapali * 0.7);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;
const ISIK_VS = `${UFUK_GLSL}
  attribute float aYuk; attribute float aUzak; attribute float aTur; attribute float aFaz;
  uniform float uSuY, uZaman, uOlcek; varying float vTur; varying float vAl;
  void main(){
    float camH = max(cameraPosition.y - uSuY, 0.5);
    float rc = halkaR(aUzak, camH) * 0.98;
    vec4 w = vec4(cameraPosition.x + position.x * rc, 0.0, cameraPosition.z + position.z * rc, 1.0);
    w.y = cameraPosition.y + rc * (aYuk - aUzak * aUzak / IKI_R - camH) / aUzak;
    vTur = aTur;
    float yanip = aTur > 2.5 ? step(0.62, fract(uZaman / 1.5 + aFaz * 0.02)) : 1.0;   // ikaz: senkron, dakikada 40
    float titre = aTur > 1.5 && aTur < 2.5 ? 0.75 + 0.25 * sin(uZaman * 9.0 + aFaz) * sin(uZaman * 3.7) : 0.85 + 0.15 * sin(uZaman * 1.3 + aFaz * 7.0);
    vAl = yanip * titre * exp(-aUzak / 60000.0);
    gl_Position = projectionMatrix * viewMatrix * w;
    gl_PointSize = (aTur > 1.5 && aTur < 2.5 ? 4.5 : aTur > 2.5 ? 2.6 : 1.7 + aFaz * 0.012) * uOlcek;
  }`;
const ISIK_FS = `
  uniform float uGor; varying float vTur; varying float vAl;
  void main(){
    float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d);
    vec3 c = vTur < 0.5 ? vec3(1.0, 0.78, 0.45) : vTur < 1.5 ? vec3(1.0, 0.9, 0.75) : vTur < 2.5 ? vec3(1.0, 0.55, 0.15) : vec3(1.0, 0.08, 0.04);
    gl_FragColor = vec4(c * 1.6, a * vAl * uGor);
  }`;

const GOK_VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w; }`;
const GOK_FS = `${GOK_GLSL}
  varying vec3 vW;
  void main(){ vec3 d = normalize(vW - cameraPosition); gl_FragColor = vec4(gokIsigi(d, 1.0), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function renkli(parcalar, geo, m, hex) {
  const g = geo.index ? geo.toNonIndexed() : geo; g.applyMatrix4(m); g.computeVertexNormals();
  const c = new THREE.Color(hex), n = g.attributes.position.count, r = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { r[i * 3] = c.r; r[i * 3 + 1] = c.g; r[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(r, 3));
  parcalar.push(g);
}
function birlestir(parcalar) {
  const say = parcalar.reduce((t, g) => t + g.attributes.position.count, 0), out = new THREE.BufferGeometry();
  [['position', 3], ['normal', 3], ['color', 3]].forEach(([n, k]) => {
    const dizi = new Float32Array(say * k); let o = 0;
    parcalar.forEach(g => { dizi.set(g.attributes[n].array, o * k); o += g.attributes.position.count; });
    out.setAttribute(n, new THREE.BufferAttribute(dizi, k));
  });
  parcalar.forEach(g => g.dispose()); out.computeBoundingSphere();
  return out;
}

/* ACES (three.js'teki uyarlamayla aynı) + sRGB: doğrudan ekrana çizimde sis rengi gökle eşleşsin */
function acesSrgb(c, poz, out) {
  const v = [c.r, c.g, c.b].map(x => x * poz / 0.6);
  const m1 = [[0.59719, 0.07600, 0.02840], [0.35458, 0.90834, 0.13383], [0.04823, 0.01566, 0.83777]];
  const m2 = [[1.60475, -0.10208, -0.00327], [-0.53108, 1.10813, -0.07276], [-0.07367, -0.00605, 1.07602]];
  const mul = (m, x) => [0, 1, 2].map(i => m[0][i] * x[0] + m[1][i] * x[1] + m[2][i] * x[2]);
  const a = mul(m1, v).map(x => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.4329510) + 0.238081));
  const b = mul(m2, a).map(x => { x = Math.min(1, Math.max(0, x)); return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; });
  return out.setRGB(b[0], b[1], b[2], THREE.LinearSRGBColorSpace);   // ham değer: sis ton eşlemeden sonra eklenir
}

export function korfezKur(S, { lite = false } = {}) {
  const { scene, parts, renderer } = S;
  const grup = new THREE.Group(); grup.name = 'korfez';

  // n117'nin kara sahnesi çıkar: Ege arazisi, saha yolu, çakıl platform, eski gök kubbesi; uzak kara türbinleri gizlenir
  const cikar = [];
  scene.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const pr = o.geometry.parameters || {};
    if ((o.geometry.type === 'PlaneGeometry' && (pr.width === 2600 || (pr.width === 11 && pr.height === 300))) ||
        (o.geometry.type === 'CircleGeometry' && pr.radius === 48)) cikar.push(o);
  });
  cikar.forEach(o => { o.parent.remove(o); o.geometry.dispose(); });
  if (S.sky && S.sky.parent) S.sky.parent.remove(S.sky);
  if (parts.farm) parts.farm.visible = false;
  if (parts.person) parts.person.position.set(7.6, 0.83, 6.4);

  /* ---- gök ---- */
  const gokU = {
    uGunesYon: { value: new THREE.Vector3(0, 1, 0) }, uBetaR: { value: new THREE.Vector3() }, uBetaM: { value: new THREE.Vector3() },
    uSunE: { value: 0 }, uMieG: { value: 0.78 }, uParlak: { value: 0.62 }, uAlaca: { value: 0 }, uGeceT: { value: 0 },
    uBulutK: { value: 0 }, uBulutT: { value: 0 }, uBulutRenk: { value: new THREE.Color() }, uBulutIsik: { value: new THREE.Color() },
  };
  const gok = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.ShaderMaterial({ uniforms: gokU, vertexShader: GOK_VS, fragmentShader: GOK_FS, side: THREE.BackSide, depthWrite: false, fog: false }));
  gok.scale.setScalar(200); gok.frustumCulled = false; gok.renderOrder = -10; gok.name = 'korfez-gok';
  grup.add(gok);

  /* ---- deniz ---- */
  const doku = new THREE.TextureLoader().load('/assets/deneyim/deniz-normal.webp?v=76cf09a7');
  doku.wrapS = doku.wrapT = THREE.RepeatWrapping; doku.colorSpace = THREE.NoColorSpace;
  doku.anisotropy = Math.min(lite ? 4 : 8, renderer.capabilities.getMaxAnisotropy());
  const denizU = Object.assign({}, gokU, {
    uNormal: { value: doku }, uZaman: { value: 0 }, uDalga: { value: 1 }, uKopuk: { value: 0 }, uKapali: { value: 0 },
    uRz: { value: new THREE.Vector2(1, 0) }, uSuRenk: { value: new THREE.Color('#0b3a50') }, uOrtam: { value: new THREE.Color() },
    uGunesRenk: { value: new THREE.Color() }, uPus: { value: new THREE.Color() },
  });
  const deniz = new THREE.Mesh(new THREE.CircleGeometry(DENIZ_R, lite ? 64 : 128),
    new THREE.ShaderMaterial({ uniforms: denizU, vertexShader: DENIZ_VS, fragmentShader: denizFS(lite), fog: false }));
  deniz.rotation.x = -Math.PI / 2; deniz.position.y = SU_Y; deniz.frustumCulled = false; deniz.renderOrder = -5; deniz.name = 'korfez-deniz';
  grup.add(deniz);

  /* ---- kara siluetleri: her kara parçası kendi yarıçapında (yakın olan önde çizilir) ---- */
  const karaU = Object.assign({}, gokU, {
    uSuY: { value: SU_Y }, uKara: { value: new THREE.Color('#3b3d33') }, uOrtam: { value: new THREE.Color() }, uGunesRenk: { value: new THREE.Color() },
    uGorus: { value: 26000 }, uKapali: { value: 0 }, uPus: { value: new THREE.Color() },
  });
  {
    const poz = [], yuk = [], uzak = [], idx = [];
    const adim = lite ? 0.5 : 0.2;
    KARA.forEach((k, ki) => {
      const a0 = k.p[0][0], a1 = acSarma(a0, k.p[k.p.length - 1][0]);
      const p = k.p.map(([az, h, d]) => [az < a0 ? az + 360 : az, h, d]);
      const n = Math.ceil((a1 - a0) / adim), b0 = poz.length / 3;
      for (let i = 0; i <= n; i++) {
        const az = a0 + (a1 - a0) * i / n;
        let [h, d] = profil(p, az);
        // sırt ayrıntısı: yüksekliğe orantılı kırık profil (uzakta daha yumuşak)
        const det = (g1(az * 1.9 + ki * 13) - 0.5) * 0.22 + (g1(az * 6.3 + ki * 7) - 0.5) * 0.11 * k.dok + (g1(az * 21 + ki) - 0.5) * 0.05 * k.dok;
        h = Math.max(0, h * (1 + det) + (h > 20 ? (g1(az * 37 + ki * 3) - 0.5) * 18 : 0));
        const [x, z] = azYon(az);
        poz.push(x, 0, z, x, 0, z);   // birim yön; yarıçap gölgelendiricide gerçek uzaklıktan
        yuk.push(-4000, h); uzak.push(d * 1000, d * 1000);
        if (i < n) { const b = b0 + i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
    g.setAttribute('aYuk', new THREE.Float32BufferAttribute(yuk, 1));
    g.setAttribute('aUzak', new THREE.Float32BufferAttribute(uzak, 1));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: karaU, vertexShader: KARA_VS, fragmentShader: KARA_FS, side: THREE.DoubleSide, fog: false }));
    m.frustumCulled = false; m.renderOrder = -4; m.name = 'korfez-kara';
    grup.add(m);
    var kara = m;
  }

  /* ---- gece ışıkları ---- */
  const isikU = { uSuY: { value: SU_Y }, uZaman: { value: 0 }, uOlcek: { value: Math.min(2, window.devicePixelRatio || 1) }, uGor: { value: 0 } };
  let isiklar;
  {
    const poz = [], yuk = [], uzak = [], tur = [], faz = [];
    const ekle = (az, d, h, t, f) => { const [x, z] = azYon(az); poz.push(x, 0, z); yuk.push(h); uzak.push(d * 1000); tur.push(t); faz.push(f); };
    let s = 0;
    ISIK.forEach(([az, d, n, yay, t]) => {
      for (let i = 0; i < n; i++, s++) {
        const u = (h1(s * 1.37) - 0.5) * 2, v = h1(s * 2.71);
        ekle(az + u * yay, d * (1 + (v - 0.5) * 0.12), t === 2 ? 95 : 4 + Math.pow(h1(s * 5.3), 2) * (t === 1 ? 60 : 90) * (1 - Math.abs(u) * 0.6), t, h1(s * 9.1) * 100);
      }
    });
    RES.forEach(([a0, a1, d, n], r) => {
      for (let i = 0; i < n; i++) {
        const az = a0 + (a1 - a0) * (i + 0.5) / n + (h1(i * 3.3 + r) - 0.5) * 0.6;
        ekle(az, d, sirtYuk(az, d) * 0.9 + 125, 3, 0);   // göbek yüksekliği ~ sırt + 125 m
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3));
    g.setAttribute('aYuk', new THREE.Float32BufferAttribute(yuk, 1));
    g.setAttribute('aUzak', new THREE.Float32BufferAttribute(uzak, 1));
    g.setAttribute('aTur', new THREE.Float32BufferAttribute(tur, 1));
    g.setAttribute('aFaz', new THREE.Float32BufferAttribute(faz, 1));
    isiklar = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: isikU, vertexShader: ISIK_VS, fragmentShader: ISIK_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    isiklar.frustumCulled = false; isiklar.renderOrder = 6; isiklar.name = 'korfez-isik';
    grup.add(isiklar);
  }

  /* ---- deniz üstü temel: sarı geçiş parçası (TP), ızgaralı platform, korkuluk, tekne yanaşma merdiveni, kazık ---- */
  {
    const sari = new THREE.MeshStandardMaterial({ color: 0xe2b21f, roughness: 0.52, metalness: 0.08 });
    const izgara = new THREE.MeshStandardMaterial({ color: 0x5d6266, roughness: 0.72, metalness: 0.35 });
    const galv = new THREE.MeshStandardMaterial({ color: 0xa9adb0, roughness: 0.45, metalness: 0.6 });
    const kazikM = new THREE.MeshStandardMaterial({ color: 0x3f4447, roughness: 0.8, metalness: 0.25 });
    const yosun = new THREE.MeshStandardMaterial({ color: 0x2c3326, roughness: 1, metalness: 0 });
    // kara temelinin parçaları: tümsek ve beton plaka yok; kaide ve yaka sarı TP'nin üst ucu olur
    if (parts.foundation) parts.foundation.children.slice().forEach(o => {
      const pr = o.geometry && o.geometry.parameters || {};
      if (o.geometry && o.geometry.type === 'CylinderGeometry' && (pr.radiusTop === 10.4 || pr.radiusTop === 8.2 || pr.radiusTop === 3.15)) { o.parent.remove(o); return; }
      if (o.geometry && o.geometry.type === 'CylinderGeometry' && pr.radiusTop === 3.05) o.material = sari;
    });
    const T = new THREE.Group(); T.name = 'korfez-temel';
    const ekle = (geo, mat, y, x = 0, z = 0, golge = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = golge && !lite; m.receiveShadow = !lite; T.add(m); return m; };
    ekle(new THREE.CylinderGeometry(3.05, 3.05, 2.0, lite ? 32 : 56), sari, 1.8);                        // platformun üstündeki TP boyu
    ekle(new THREE.CylinderGeometry(3.05, 3.15, 0.83 - SU_Y + 1.2, lite ? 32 : 56), sari, (0.83 + SU_Y - 1.2) / 2);   // TP gövdesi
    ekle(new THREE.CylinderGeometry(3.18, 3.18, 2.2, lite ? 32 : 56), yosun, SU_Y + 0.2, 0, 0, false);    // gelgit bandı: deniz yosunu
    ekle(new THREE.CylinderGeometry(2.95, 2.95, 30, lite ? 24 : 40), kazikM, SU_Y - 16, 0, 0, false);     // tek kazık (su altında)
    // platform: halka ızgara, altında konsollar
    const plat = new THREE.RingGeometry(3.05, 12.4, lite ? 48 : 96, 1); plat.rotateX(-Math.PI / 2);
    ekle(plat, izgara, 0.83, 0, 0, false).material.side = THREE.DoubleSide;
    ekle(new THREE.CylinderGeometry(12.4, 12.4, 0.32, lite ? 48 : 96, 1, true), izgara, 0.67, 0, 0, false);
    const kGeo = new THREE.BoxGeometry(9.3, 0.5, 0.35); kGeo.translate(4.65 + 3.05, 0, 0);
    for (let i = 0; i < 8; i++) { const m = ekle(kGeo, izgara, 0.4); m.rotation.y = i * Math.PI / 4; }
    const dGeo = new THREE.CylinderGeometry(0.16, 0.16, 7.2, 8);
    for (let i = 0; i < 8; i++) {   // çapraz destek boruları
      const a = (i + 0.5) * Math.PI / 4, m = ekle(dGeo, galv, -2.6, Math.cos(a) * 7.2, Math.sin(a) * 7.2);
      m.lookAt(Math.cos(a) * 3.0, -6.0, Math.sin(a) * 3.0); m.rotateX(Math.PI / 2);
    }
    // korkuluk: dikmeler + iki kat boru
    const nD = lite ? 28 : 44, dikme = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 6);
    for (let i = 0; i < nD; i++) { const a = i / nD * Math.PI * 2; ekle(dikme, sari, 0.83 + 0.55, Math.cos(a) * 12.25, Math.sin(a) * 12.25, false); }
    [0.55, 1.1].forEach(y => { const r = new THREE.TorusGeometry(12.25, 0.035, 6, lite ? 64 : 128); r.rotateX(Math.PI / 2); ekle(r, sari, 0.83 + y, 0, 0, false); });
    // tekne yanaşma (boat landing): iki dikey boru ve merdiven, güneybatı yüzünde
    const bl = new THREE.Group(); bl.rotation.y = -2.2; T.add(bl);
    [-0.9, 0.9].forEach(x => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.83 - SU_Y + 2, 10), sari); m.position.set(x, (0.83 + SU_Y - 2) / 2, 4.1); m.castShadow = !lite; bl.add(m); });
    for (let y = SU_Y + 0.5; y < 0.6; y += 0.6) { const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.05), galv); m.position.set(0, y, 3.7); bl.add(m); }
    // J-borular (kablo çıkışları) ve küçük vinç (davit)
    [0.4, 0.9, 1.4].forEach(a => { ekle(new THREE.CylinderGeometry(0.13, 0.13, 0.83 - SU_Y + 1, 8), galv, (0.83 + SU_Y - 1) / 2, Math.cos(a) * 3.35, Math.sin(a) * 3.35, false); });
    const dv = new THREE.Group(); dv.position.set(Math.cos(-2.2) * 10.6, 0.83, Math.sin(-2.2) * 10.6); T.add(dv);
    { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 4.2, 10), sari); m.position.y = 2.1; m.castShadow = !lite; dv.add(m);
      const k = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 3.0), sari); k.position.set(0, 4.1, 1.3); k.rotation.x = -0.25; k.castShadow = !lite; dv.add(k); dv.rotation.y = 2.2 + Math.PI / 2; }
    scene.add(T);
    var temel = T;
  }

  /* ---- demirli gemiler (Aliağa demir yeri): gövde, köprü üstü, baca; gece güverte ve seyir fenerleri ---- */
  const gemiIsik = [];
  {
    const parcalar = [];
    const GEMI = [[168, 2900, 212, 32, 0.6, 'tanker'], [137, 3700, 189, 30, -0.9, 'dokme'], [44, 4300, 160, 27, 1.2, 'genel']];
    GEMI.forEach(([az, d, L, B, don, tip]) => {
      const [dx, dz] = azYon(az), cx = dx * d, cz = dz * d, Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), don);
      const M = (x, y, z, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z).applyQuaternion(Q).add(new THREE.Vector3(cx, 0, cz)), Q, new THREE.Vector3(sx, sy, sz));
      renkli(parcalar, new THREE.BoxGeometry(L, 14, B), M(0, SU_Y + 5, 0), tip === 'tanker' ? '#5a2b26' : tip === 'dokme' ? '#2f3a44' : '#3b4a3a');
      renkli(parcalar, new THREE.BoxGeometry(L * 0.98, 1.2, B * 0.96), M(0, SU_Y + 12.6, 0), '#7a7368');
      renkli(parcalar, new THREE.ConeGeometry(B / 2.1, L * 0.12, 4), M(L * 0.52, SU_Y + 7.5, 0).multiply(new THREE.Matrix4().makeRotationZ(-Math.PI / 2)), tip === 'tanker' ? '#5a2b26' : '#2f3a44');
      renkli(parcalar, new THREE.BoxGeometry(B * 0.62, 15, B * 0.9), M(-L * 0.38, SU_Y + 20, 0), '#e9e6de');
      renkli(parcalar, new THREE.BoxGeometry(B * 0.25, 7, B * 0.25), M(-L * 0.43, SU_Y + 30, 0), '#b8402e');
      if (tip !== 'tanker') for (let i = 0; i < 4; i++) renkli(parcalar, new THREE.BoxGeometry(1.6, 18, 1.6), M(-L * 0.18 + i * L * 0.16, SU_Y + 21, B * 0.25), '#c9b23a');
      [[L * 0.5, 20, 0, 0], [-L * 0.45, 34, 0, 0], [-L * 0.38, 26, B * 0.46, 1], [-L * 0.38, 26, -B * 0.46, 2], [0, 15, 0, 0], [L * 0.25, 15, 0, 0]].forEach(([x, y, z, tur]) => {
        const p = new THREE.Vector3(x, SU_Y + y, z).applyQuaternion(Q).add(new THREE.Vector3(cx, 0, cz));
        gemiIsik.push([p, tur]);
      });
    });
    const m = new THREE.Mesh(birlestir(parcalar), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.1, flatShading: true }));
    m.name = 'korfez-gemi'; grup.add(m);
    const g = new THREE.BufferGeometry(), poz = [], renk = [];
    gemiIsik.forEach(([p, t]) => { poz.push(p.x, p.y, p.z); const c = t === 1 ? [0.2, 1, 0.3] : t === 2 ? [1, 0.15, 0.1] : [1, 0.92, 0.75]; renk.push(...c); });
    g.setAttribute('position', new THREE.Float32BufferAttribute(poz, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(renk, 3));
    var gemiNokta = new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2 * Math.min(2, window.devicePixelRatio || 1), sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    gemiNokta.frustumCulled = false; gemiNokta.renderOrder = 6; grup.add(gemiNokta);
  }
  scene.add(grup);

  /* ---- her kare: gök modeli, ışık, sis ve deniz ---- */
  const _c = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color(), _v = new THREE.Vector3(), _ufuk = new THREE.Vector3();
  const _pus = new THREE.Color(), _pusTaban = new THREE.Color(0x8d969e), _ayRenk = new THREE.Color('#a9bde8');
  const cikti = { gunesRenk: new THREE.Color(), gunesG: 0, hemiRenk: new THREE.Color(), hemiZemin: new THREE.Color(), hemiG: 0, dolguG: 0,
    poz: 1, sis: new THREE.Color(), sisYakin: 900, sisUzak: 9000, ayGor: 1 };
  const _sis = new THREE.Color(), _ortam = new THREE.Color(), _zemin = new THREE.Color('#33515f');   // denizden yansıyan ışık
  const yum = { kapali: 0, dag: 1, ilk: true };
  let sonYaw = null;
  /* d = { kamera, gunesYon (gerçek), ayYon, ayH, ayKesir, kapali 0–1, yawY, zamanSn, hareket, ruzgar (m/sn), dogrudan (efekt zinciri yok) }
   * döner: ışık değerleri (deneyim.js güneşe, ortam ışığına, pozlamaya ve sise uygular) */
  function adim(d) {
    const k = d.kamera, camH = Math.max(0.5, k.position.y - SU_Y);
    gok.position.copy(k.position);
    deniz.position.x = k.position.x; deniz.position.z = k.position.z;
    const a = d.ilk || yum.ilk ? 1 : 0.03;
    yum.kapali += (d.kapali - yum.kapali) * a;
    const kp = yum.kapali;
    // Preetham parametreleri: hafif kıyı pusu; kapalı havada bulanıklık artar
    const s = d.gunesYon, h = Math.asin(THREE.MathUtils.clamp(s.y, -1, 1)) / RAD;
    // atmosferik kırılma (Saemundsson): ufukta güneş ~0,5° yukarıda görünür; disk denize gerçek gün batımı dakikasında değer
    const kir = THREE.MathUtils.clamp(h > -1.9 ? 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * RAD) / 60 : 0.62, 0, 0.62);
    const gy = Math.sin((h + kir) * RAD), gx = Math.hypot(s.x, s.z) || 1;
    gokU.uGunesYon.value.set(s.x / gx * Math.cos((h + kir) * RAD), gy, s.z / gx * Math.cos((h + kir) * RAD));
    const kpA = THREE.MathUtils.smoothstep(kp, 0.4, 1);   // ağır örtü (kapalı, yağmur): parçalı bulutta pus ve renk değişmez
    const turb = 3.2 + kpA * 6, ray = 1.35 - kpA * 0.5, mie = 0.0045 + kpA * 0.004;
    gokU.uSunE.value = 1000 * Math.max(0, 1 - Math.exp(-((1.6110731556870734 - Math.acos(THREE.MathUtils.clamp(s.y, -1, 1))) / 1.5)));
    gokU.uBetaR.value.set(T_RAY[0] * ray, T_RAY[1] * ray, T_RAY[2] * ray);
    const cm = 0.434 * (0.2 * turb * 1e-17) * mie;
    gokU.uBetaM.value.set(MIE_C[0] * cm, MIE_C[1] * cm, MIE_C[2] * cm);
    gokU.uAlaca.value = THREE.MathUtils.smoothstep(h, -11, -1.5) * (1 - THREE.MathUtils.smoothstep(h, -1.5, 3.5)) * (1 - kp * 0.7);
    gokU.uGeceT.value = 1 - THREE.MathUtils.smoothstep(h, -12, -2);
    // dağın ardındaki güneş: doğrudan ışık ve parıltı söner (gök ışıması sürer)
    const sunAz = (Math.atan2(s.x, -s.z) / RAD + 360) % 360;
    const dagHedef = THREE.MathUtils.smoothstep(h - ufukAci(sunAz, camH), -0.35, 0.35);
    yum.dag += (dagHedef - yum.dag) * (d.ilk || yum.ilk ? 1 : 0.08);
    yum.ilk = false;
    // güneş ışığı: güneş yönündeki atmosfer geçirgenliği (kızarma); ufkun altında söner; gece ay ışığı
    const zen = Math.acos(Math.max(0.0001, s.y)), inv = 1 / (Math.cos(zen) + 0.15 * Math.pow(93.885 - zen / RAD, -1.253));
    const bR = gokU.uBetaR.value, bM = gokU.uBetaM.value;
    const tr = [bR.x * 8.4E3 * inv + bM.x * 1.25E3 * inv, bR.y * 8.4E3 * inv + bM.y * 1.25E3 * inv, bR.z * 8.4E3 * inv + bM.z * 1.25E3 * inv].map(x => Math.exp(-x));
    const tm = Math.max(tr[0], tr[1], tr[2], 1e-4);
    cikti.gunesRenk.setRGB(tr[0] / tm, tr[1] / tm, tr[2] / tm, THREE.LinearSRGBColorSpace);
    cikti.gunesG = 3.1 * THREE.MathUtils.smoothstep(h, -1.2, 5) * Math.pow(Math.min(1, tm * 1.15), 0.35) * (1 - kp * 0.75) * yum.dag;
    const ayAz = (Math.atan2(d.ayYon.x, -d.ayYon.z) / RAD + 360) % 360;
    cikti.ayGor = THREE.MathUtils.smoothstep(d.ayH / RAD - ufukAci(ayAz, camH), -0.3, 0.6);
    if (h < -6) {   // ay ışığı (deneyim.js ışığı aya yöneltir)
      cikti.gunesRenk.copy(_ayRenk);
      cikti.gunesG = 0.32 * cikti.ayGor * (0.15 + 0.85 * d.ayKesir) * (1 - kp);
    }
    // ortam (gökten): başucu ve ufuk karışımı; sis: kameranın baktığı yöndeki ufuk rengi (güneşe bakınca sıcak)
    _v.set(0, 1, 0); gokJS(gokU, _v, _c);
    k.getWorldDirection(_ufuk); _ufuk.y = 0.02; _ufuk.normalize(); gokJS(gokU, _ufuk, _c2);
    const gecT = gokU.uGeceT.value;
    _ortam.copy(_c).lerp(_c2, 0.35);
    _ortam.r += 0.012 * gecT; _ortam.g += 0.016 * gecT; _ortam.b += 0.034 * gecT;
    _sis.copy(_c2); _sis.r += 0.006 * gecT; _sis.g += 0.008 * gecT; _sis.b += 0.018 * gecT;
    _pus.copy(_pusTaban).multiplyScalar(0.06 + 0.94 * THREE.MathUtils.smoothstep(h, -8, 20));
    gokU.uBulutK.value = kp;
    gokU.uBulutRenk.value.copy(_ortam).multiplyScalar(1.2).lerp(_c3.copy(_pus).multiplyScalar(0.5), kpA);   // aydınlık bulut → koyu yağmur tabanı
    gokU.uBulutIsik.value.copy(cikti.gunesRenk).multiplyScalar(0.6 * THREE.MathUtils.smoothstep(h, -2, 6) * (h < -6 ? 0 : 1) * (1 - 0.85 * kpA));
    if (d.hareket) gokU.uBulutT.value = d.zamanSn * 0.004 * (1 + (d.ruzgar || 6) / 10);
    if (kpA > 0) { _sis.lerp(_pus, kpA); _ortam.lerp(_pus, kpA * 0.5); }
    // deniz ve kara
    denizU.uOrtam.value.copy(_ortam).multiplyScalar(1.6);
    denizU.uGunesRenk.value.copy(cikti.gunesRenk).multiplyScalar(cikti.gunesG * 0.45);
    denizU.uPus.value.copy(_sis); denizU.uKapali.value = kpA;
    karaU.uOrtam.value.copy(_ortam).multiplyScalar(2.2); karaU.uGunesRenk.value.copy(cikti.gunesRenk).multiplyScalar(cikti.gunesG * 0.32);
    karaU.uPus.value.copy(_sis); karaU.uKapali.value = kpA; karaU.uGorus.value = 26000 - kpA * 18000;
    const rz = THREE.MathUtils.clamp(d.ruzgar == null ? 6 : d.ruzgar, 0, 25);
    denizU.uDalga.value = 0.55 + Math.min(1, rz / 14) * 0.75; denizU.uKopuk.value = THREE.MathUtils.smoothstep(rz, 8, 16);
    if (d.hareket) { denizU.uZaman.value = d.zamanSn * (0.7 + rz / 20); isikU.uZaman.value = d.zamanSn; }
    if (sonYaw !== d.yawY) { sonYaw = d.yawY; denizU.uRz.value.set(Math.sin(d.yawY), Math.cos(d.yawY)); }   // dalgalar rüzgâr altına
    // gece ışıkları ve gemi fenerleri
    const isikGor = (1 - THREE.MathUtils.smoothstep(h, -5, 2)) * (1 - kp * 0.6);
    isikU.uGor.value = isikGor; isiklar.visible = isikGor > 0.01;
    gemiNokta.material.opacity = isikGor; gemiNokta.visible = isikGor > 0.01;
    // standart malzemeler (türbin, temel, gemiler) için ışık
    const gunduz = THREE.MathUtils.smoothstep(h, -6, 18);
    cikti.hemiRenk.copy(_c).lerp(_c2, 0.3); const hm = Math.max(cikti.hemiRenk.r, cikti.hemiRenk.g, cikti.hemiRenk.b, 1e-4); cikti.hemiRenk.multiplyScalar(1 / hm);
    cikti.hemiZemin.copy(_zemin).multiplyScalar(0.6 + 0.4 * gunduz);
    cikti.hemiG = 0.06 + 0.95 * gunduz * (1 - kp * 0.3) + 0.2 * kp;
    cikti.dolguG = 0.05 + 0.2 * gunduz;
    cikti.poz = 0.92 + 0.12 * (1 - gunduz);
    if (d.dogrudan) acesSrgb(_sis, cikti.poz, cikti.sis); else cikti.sis.copy(_sis);
    cikti.sisYakin = 900 - kp * 600; cikti.sisUzak = 9000 - kp * 6500;
    return cikti;
  }
  const yerY = (x, z) => (Math.hypot(x, z) < 12.3 ? 0.83 : SU_Y + 1.2);
  return { grup, temel, adim, yerY, SU_Y };
}
