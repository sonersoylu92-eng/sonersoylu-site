# Ölçümler

Kaynak: D1 `soner-tani` (sorgular `sorgular.sql`). "Sorunlu oturum" = `birak`, `takilma` ya da `statik` (zayif-*).

## 2026-10-02 · tur 0 (başlangıç çizgisi) — telefon düzeltmesi 1d0dbee yayından hemen sonra
Son 7 gün, cihaz tipine göre:
| tip | oturum | sorunlu | oran | sahnede |
|---|---|---|---|---|
| iPhone | 114 | 27 | %24 | 67 |
| Android | 6 | 3 | %50 | 4 |
| Masaüstü | 62 | 35 | %56 | 29 |

Telefon, gün gün: 29 Eyl 0/5 · 30 Eyl 3/32 · **1 Eki 21/44** · 2 Eki 6/39 (düzeltme öncesi + sonrası karışık)
Not: Android 10 cihazında açılışta 2,2 sn ve 4,9 sn donma (`takilma p=0`), ardından `zayif-az-bellek`.
Not: masaüstündeki yüksek oranın bir kısmı WebGL'siz bot/test tarayıcıları olabilir (`statik webgl-yok`) → ayrıştırılmalı.
Not: telemetri sürüm etiketi `akici15` yapıldı; S4 sorgusu bundan sonra düzeltme öncesi/sonrası karşılaştırır.

## 2026-10-02 · tur 1 — site-bakımcı (S1–S5)
Yeni veri yok: son olay iPhone 11:14 UTC, masaüstü 08:40 UTC; `akici15` etiketli oturum **0** (S4'te en yeni `akici14`).
Bu yüzden S1/S2 tur 0 ile birebir aynı: iPhone 114/27 (%24) · Android 6/3 · Masaüstü 62/35 (%56).
Telefon gün gün (S2): 29 Eyl 0/5 · 30 Eyl 3/32 · 1 Eki 21/44 · 2 Eki 6/39. Düzeltmenin etkisi bir sonraki turda `akici15` ile okunur.

**Masaüstü ayrıştırma (S5, son 7 gün):**
| sınıf | oturum | sorunlu | ciddi (≥1 sn / bırak / zayıf) | arka plan (≥10 sn) |
|---|---|---|---|---|
| gerçek · Mac M1 (Chrome 154, TR, 1337×674/618) | 28 | 22 | 11 | 6 |
| gerçek · diğer (Windows Intel/AMD, TR) | 11 | 9 | 8 | 3 |
| bot/test (webgl-yok 11, SwiftShader 2, Linux+sahte "Iris" 2) | 14 | 2 | 2 | 0 |
| kısa (<3 sn) | 9 | 2 | 0 | 0 |

- Masaüstünün **%23'ü bot/test** (14/62), ama bunlar sorunluya neredeyse girmiyor (2/35): `webgl-yok` oturumları
  `statik webgl-yok` yazar, "sorunlu" tanımına (zayif-*) girmez. Tur 0'daki "yüksek oran botlardan" varsayımı **tutmadı**.
- Bot/test + kısa oturumlar çıkınca masaüstü sorunlu oranı %56 → **%79** (31/39): sorun gerçek kullanıcıda.
- Masaüstü gerçek oturumların **%72'si (28/39) tek bir cihaz imzası** (Mac M1, Chrome 154, TR, aynı ekran). Muhtemelen
  site sahibi/geliştirme oturumları — doğrulanamaz; masaüstü oranını okurken bu ağırlık hesaba katılmalı.
- **Ölçüm hatası bulundu:** `takilma` olayı arka planda geçen süreyi takılma diye yazıyor (ör. `ms=61360046` = 17 saat,
  `is=3`; telefonda `ms=21671–25646`, `is=3–7`). Neden: `deneyim.js` sekme gizlenince bekleyen rAF'i iptal etmiyor,
  dönüşte eski `sonRaf` ile fark ölçülüyor; `film.js`'te `visibilitychange` gizlenirken de `istT` kuruyor.
  Etkisi: masaüstünde 9 oturumda arka plan kaydı var, bunların 2'si yalnızca bu yüzden sorunlu; telefonda 2 oturum.
  `birak` kararı etkilenmiyor (arayuz.js `is>1000` şartı arıyor). Yama önerisi PANO'ya (kod değiştirilmedi; `akici15` kohortu bozulmasın diye).
- Telefon (120 oturum): sorunlu 30 → arka plan hariç 28 → ciddi (≥1 sn / bırak / zayıf) **16**.

## 2026-10-03 · tur 2 — CEO (S1, S2, S4, S5 + telefon "ciddi" ayrıştırması)
Son olay: 2026-10-03 02:57 UTC (tablo 595 satır). 3 Ekim'de henüz gerçek telefon oturumu yok.

**H1 (K-025'e göre, telefon, bot/webglsiz hariç, "ciddi" = bırak · zayıf · 1–9,9 sn takılma):**
| gün | gerçek oturum | ciddi | sahnede | sürümler |
|---|---|---|---|---|
| 30 Eyl | 32 | 2 (%6) | 22 (%69) | akici5–8 |
| 1 Eki | 44 | **14 (%32)** | 15 (%34) | akici8–14, film1 |
| 2 Eki | 41 | **0 (%0)** | 33 (%80) | akici14, akici16 |
→ 1d0dbee (akici14) sonrası telefonda ciddi sorun 14 → 0, sahnede oranı %34 → %80. Tek günlük veri; #1 kararı 5 Ekim'de.
S2'deki ham "sorunlu" (2 Eki 8/42) 1 sn altı açılış takılmalarını da sayıyor; H1 için ciddi sütunu okunur.

**S1 (7 gün):** iPhone 108 oturum (bırak 4, takılma 18 oturum, statik 9) · Android 5 · Masaüstü ~51 özet.
**S4:** akici14 63 oturum, sahnede %61,9. **akici16 8 oturum, sahnede %12,5 — YANILTICI:** 8'in 6'sı bot/test
(webgl-yok 3, SwiftShader 2, Linux+sahte Iris 1). Gerçek akici16 = 2 iPhone: ikisinde de ciddi yok; 1'i sahnede, 1'i özet göndermeden çıktı.
Ortak desen: ikisinde de açılışta p=0'da ~770–790 ms tek takılma (`geo+145 tex+5`) + ~240–460 ms ikinci (`prog+2 geo+74`). 1 sn altı, "ciddi" değil; izlenecek.
**S5 masaüstü:** gerçek·Mac M1 28/22 sorunlu (ciddi 11, arka plan 6) · gerçek·diğer 11/9 (ciddi 8) · bot/test **19** (14'ten ↑) /5 · kısa 9/2.
Tur 1 ile neredeyse aynı (yeni gerçek masaüstü oturumu yok denecek kadar az); artış botlarda.
S4b (bot hariç, telefonda uygulama içi tarayıcı korunarak): akici14 60 oturum %65 sahnede · akici16 3 oturum %33 (örneklem çok küçük).
Sorgu değişikliği: S4 bot/test hariç tutacak şekilde S4b olarak eklendi, telefon ciddi ayrıştırması S6 olarak eklendi (`sorgular.sql`).

## 2026-10-07 · tur 3 — CEO (S1, S2, S4, S5, S6 + yeni S8)
Trafik 2 Eki'den sonra düştü: telefonda gerçek oturum 3 Eki 3 · 4 Eki 2 · 5 Eki 3 · 6 Eki 20 · 7 Eki 2.
**H1 (S6, telefon, gerçek, akis1 hariç):** 3–5 Eki ciddi **5/8**, 6 Eki **4/20 (%20)**, 7 Eki 0/2. 2 Eki 0/41'e göre kötüleşme, ama örneklem küçük.
**Neden (S8, açılışta p=0 takılma ≥1 sn, oturum):** akici14 **1/46** · akici16 **7/17 (%41)** · akici17 1/8 · akici18 **0/5**.
akici16 iPhone'larında açılış donması 1,0–1,7 sn (`geo+145 tex+5`) — tur 2'de 0,8 sn görülen desen büyüdü, "ciddi"ye girdi.
Soner'in 6–7 Eki oturumundaki 873f8b0 (akici18, iPhone güvenli yükleme) bunu hedefliyor; 5 oturumda 0. Karar ≥15 gerçek akici18 telefon oturumunda.
Android 10 · K: açılışta 1,1 / 2,0 sn (geo+0) — ayrı, düşük donanım.
**S4/S4b:** akici16 48 oturum %27,1 sahnede (bot dahil); akici17 9 · %55,6; akici18 7 · %14,3 (çok erken).
**S5 masaüstü (7 gün):** bot/test 33 (11 ciddi — botlar artık "ciddi"ye giriyor) · Mac M1 29/23 (ciddi 12) · diğer 17/14 (ciddi 12) · kısa 10/2.
**Ölçüm hatası:** yeni `akis1` kaydırma ölçümü `olay='takilma'` + ayrı oturum kimliği yazıyor → S1/S2 sorunlu ve oturum sayılarını şişiriyordu (6 Eki 21/7 → akis1 hariç 19/5). S2/S6'dan çıkarıldı, S7 (akis okuma) ve S8 eklendi (D-084).
S7 ilk veri: 2 iPhone, 122 ve 215 kare; biri `makine` bölümünde 1 kare >50 ms (en 73 ms). Kaydırma takılması yok denecek kadar az.
