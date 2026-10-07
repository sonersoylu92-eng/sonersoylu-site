# Pano

Durum: `bekliyor` · `yapiliyor` · `onay-bekliyor` (Soner'e soruldu) · `bitti` · `iptal`
Öncelik: P0 kırık/acil · P1 hedefe doğrudan · P2 iyi olur

| # | İş | Ajan | Öncelik | Durum | Bitti tanımı | Not |
|---|---|---|---|---|---|---|
| 1 | Telefon düzeltmesinin (1d0dbee + akici16) etkisini ölç | site-bakimci | P0 | bitti (2026-10-07: akici16 telefonda açılış ≥1 sn donma 7/17, akici14 1/46 — kötüleşti; Soner'in akici18 düzeltmesi geldi → #14). Tur 2: telefonda ciddi 1 Eki 14/44 → 2 Eki 0/41; akici16'da yalnız 3 gerçek oturum | S6 + S4b ile `akici16` kohortu `akici14` ile karşılaştırıldı (telefonda "ciddi" oran), OLCUMLER'e yazıldı | Tur 1: arka plan süresi takılma sayılıyordu, düzeltildi (K-025) |
| 2 | "Türbin nasıl elektrik üretir" Short'unu sesli yap | video-yapimci | P1 | bitti (tur 1, denetçi: 1. turda KALDI, düzeltildi) | Sesli MP4 + YouTube paketi, denetçi onaylı | Sessiz sürüm hazır (turbin-elektrik.mp4) |
| 3 | Sonraki 4 video konusunu araştır | arastirmaci | P1 | bitti (tur 1) → `cikti/arastirma-2026-10-02.md` | Her konu için arama talebi kanıtı, rakip boşluğu, sitedeki kaynak sayfa | |
| 4 | 3 video için LinkedIn gönderisi + YouTube paketleri | icerik-yazari | P1 | bitti (tur 1) → `cikti/metin-2026-10-02.md` | `ajans/cikti/` altında kopyala-yapıştır hazır metinler, denetçi onaylı | |
| 5 | Sitede kırık bağlantı / konsol hatası taraması | site-bakimci | P1 | bitti (tur 1: 90 sayfa × 2 cihaz, 0 hata) | Tüm sitemap sayfaları tarandı, bulunanlar onarıldı ya da PANO'ya yazıldı | |
| 6 | 2. uzun video planı: "Rüzgâr türbini teknisyeni nasıl olunur" | video-yapimci | P1 | onay-bekliyor (2026-10-07: 28 beat, ~5:29, 23 rakam kaynaklı; denetçi GEÇTİ + 5 düzeltme → `cikti/plan-uzun-teknisyen-2026-10-07.md`; Soner'e 2 soru) | Beat sheet + anlatım süresi PANO'da, Soner onayı bekliyor (K-040) | Araştırma konu 2; maaş rakamı yok |
| 7 | Short planı: "Rüzgâr esiyor, türbin duruyor. Arızalı mı?" | video-yapimci | P1 | bitti (2026-10-03: Soner "Onay" → üretildi, 60,43 sn, 7,3 MB, taşma 0, Whisper 9/9; CEO kare denetimi; Soner'e gönderildi) | Beat sheet Soner'e sunuldu | Araştırma konu 1. Soner'e 3 soru: alarm cümlesi eklensin mi · ekranda "Nordex N90/2500" · anlatımda "makine dairesi". Onay gelince render (ses hazır, değişiklik varsa yalnız ilgili beat) |
| 8 | transcribe.py: VAD parçalarına ±0,3 sn dolgu | video-yapimci | P2 | bekliyor | Kelime hizalamasında cümle sonu kesilmiyor (K-013 emekliye) | |
| 9 | Konu 4 (saha vakası) için Soner'e teyit: ölçümü kendisi mi yaptı? | CEO | P2 | bitti (2026-10-02: "Evet" — ölçümü Soner yaptı) | Cevap alındı | Birinci şahıs anlatım uygun |
| 10 | Short planı: "Ekran 103 °C, termometre 62 °C: arıza sensördeydi" (saha vakası, birinci ağız) | video-yapimci | P1 | üretildi (2026-10-02 akşam, commit 2a0a1d5; MP4 o oturumda kaldı, depoda yok) · metin paketi denetimi 2026-10-03: 1. tur KALDI (LinkedIn'de güvenlik bloğu eksik) → düzeltildi → GEÇTİ | Beat sheet + ölçülmüş anlatım süresi, Soner onayına sunuldu | Kaynak: saha-notlari/jenerator-sicaklik/ — rakamlar sayfadan AYNEN (K-031), 17 rakam doğrulandı; alarm kodu yok. Açık: (a) zaman.json/son_mp4_whisper.json hâlâ eski B5 "Türbini durdurdum" — yeni B5 sesi render'a girdi mi doğrulanmadı; (b) kaynak sayfada 110→112→116 ile "günde ≈2 °C" tutmuyor (Soner'e soruldu) |

| 11 | `ruzgar/` s.308: 3 m/s de "kesme rüzgârı" deniyor; doğru terim "devreye giriş" (cut-in) | site-bakimci | P2 | bitti (2026-10-07, 09570e1: sözlük adları devreye girme/devreden çıkma, "kırmızı" kaldırıldı, durum metni + özet etiketi; denetçi GEÇTİ, canlıda doğrulandı) | Metin düzeltildi, yerel test + denetçi + K-023, push | Denetçi bulgusu, 2026-10-03 |
| 12 | Saha vakası MP4'ünü yeni B5 sesiyle doğrula (gerekirse yeniden render) | video-yapimci | P1 | bekliyor | Son MP4'ün Whisper dökümünde B5 "Önce türbini durdurdum"; Soner'e gönderildi | MP4 önceki oturumda kaldı; build.py + ses betikleri depoda |
| 13 | Saha vakası kaynak sayfası: 110→112→116 °C ile "günde yaklaşık 2 °C düzenli" tutarsız | CEO → Soner | P1 | onay-bekliyor | Soner doğru değeri söyledi; sayfa + video metni ona göre | H4 (doğruluk). Sayfaya Soner'in cevabı gelmeden dokunulmaz |
| 14 | akici18 (iPhone güvenli yükleme) etkisini ölç | CEO | P0 | bekliyor (5 oturumda açılış donması 0) | S8'de ≥15 gerçek akici18 telefon oturumu; açılış ≥1 sn oranı akici14 (%2) düzeyinde | |
| 15 | rehber + n90 (+n90.js) "devreye giriş / kesme rüzgârı" → sözlük adları; ruzgar s.422 "fırtına kesmesi" | site-bakimci | P2 | bekliyor | Terimler sözlükle aynı, yerel test + denetçi | #11 yan bulgusu |
| 16 | rehber:282 "Rotor kilidi takılır" koşulsuz; diğer sayfalar "gerekiyorsa" | site-bakimci → Soner | P1 | onay-bekliyor | Soner hangi ifadenin doğru olduğunu söyledi; sayfa ona göre | H4, K-031. Güvenlik metni Soner onayı olmadan değişmez |
| 17 | nasil-olunur:384 "teknik İngilizce öğrenilemez" ↔ :523 "iki ayda öğrenilir" çelişkisi | site-bakimci | P2 | bekliyor | Soner'e tek cümlelik soru + düzeltme | Video planında bu çerçeve kullanılmadı |
| 18 | MOTION.md'ye 16:9 bölümü (güvenli alan, altyazı boyu, bitiş ekranı) | video-yapimci | P2 | bekliyor | #6 üretiminden önce | |

## Hazır ürünler (Soner'e teslim edildi)
- 2026-10-02 · Short · Türbin nasıl elektrik üretir (sessiz, 52 sn) — sitede "Son paylaşım"
- 2026-10-02 · Short · Kanat ucunun hikâyesi (sesli, 80 sn)
- 2026-10-02 · Uzun · Türbinin içine yolculuk (4:25, sesli, kapak + .srt)
- 2026-10-02 · Short · Türbin nasıl elektrik üretir — SESLİ (turbin-elektrik-sesli.mp4, tur 1)
- 2026-10-02 · Metin paketi · 3 video için YouTube + LinkedIn (cikti/metin-2026-10-02.md)
- 2026-10-03 · Metin paketi · Saha vakası YouTube + LinkedIn (cikti/metin-saha-vakasi-2026-10-02.md, denetçi GEÇTİ, LinkedIn 1256 karakter)
- 2026-10-03 · Short · Rüzgâr esiyor, türbin duruyor (sesli, 60 sn; MP4 depoda değil, build.py + .srt depoda)
- 2026-10-03 · Short · Wind blowing, turbine stopped — İNGİLİZCE (63 sn, mph'li; MP4 depoda değil)
