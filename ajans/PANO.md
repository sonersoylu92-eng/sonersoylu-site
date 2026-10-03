# Pano

Durum: `bekliyor` · `yapiliyor` · `onay-bekliyor` (Soner'e soruldu) · `bitti` · `iptal`
Öncelik: P0 kırık/acil · P1 hedefe doğrudan · P2 iyi olur

| # | İş | Ajan | Öncelik | Durum | Bitti tanımı | Not |
|---|---|---|---|---|---|---|
| 1 | Telefon düzeltmesinin (1d0dbee + akici16) etkisini ölç | site-bakimci | P0 | bekliyor (veri birikiyor; en erken 2026-10-05). Tur 2: telefonda ciddi 1 Eki 14/44 → 2 Eki 0/41; akici16'da yalnız 3 gerçek oturum | S6 + S4b ile `akici16` kohortu `akici14` ile karşılaştırıldı (telefonda "ciddi" oran), OLCUMLER'e yazıldı | Tur 1: arka plan süresi takılma sayılıyordu, düzeltildi (K-025) |
| 2 | "Türbin nasıl elektrik üretir" Short'unu sesli yap | video-yapimci | P1 | bitti (tur 1, denetçi: 1. turda KALDI, düzeltildi) | Sesli MP4 + YouTube paketi, denetçi onaylı | Sessiz sürüm hazır (turbin-elektrik.mp4) |
| 3 | Sonraki 4 video konusunu araştır | arastirmaci | P1 | bitti (tur 1) → `cikti/arastirma-2026-10-02.md` | Her konu için arama talebi kanıtı, rakip boşluğu, sitedeki kaynak sayfa | |
| 4 | 3 video için LinkedIn gönderisi + YouTube paketleri | icerik-yazari | P1 | bitti (tur 1) → `cikti/metin-2026-10-02.md` | `ajans/cikti/` altında kopyala-yapıştır hazır metinler, denetçi onaylı | |
| 5 | Sitede kırık bağlantı / konsol hatası taraması | site-bakimci | P1 | bitti (tur 1: 90 sayfa × 2 cihaz, 0 hata) | Tüm sitemap sayfaları tarandı, bulunanlar onarıldı ya da PANO'ya yazıldı | |
| 6 | 2. uzun video planı: "Rüzgâr türbini teknisyeni nasıl olunur" | video-yapimci | P1 | bekliyor | Beat sheet + anlatım süresi PANO'da, Soner onayı bekliyor (K-040) | Araştırma konu 2; maaş rakamı yok |
| 7 | Short planı: "Rüzgâr esiyor, türbin duruyor. Arızalı mı?" | video-yapimci | P1 | onay-bekliyor (2026-10-03: plan → `cikti/plan-ruzgar-esiyor-2026-10-03.md`, 9 beat, 57,27 sn ölçülü ses; denetçi GEÇTİ) | Beat sheet Soner'e sunuldu | Araştırma konu 1. Soner'e 3 soru: alarm cümlesi eklensin mi · ekranda "Nordex N90/2500" · anlatımda "makine dairesi". Onay gelince render (ses hazır, değişiklik varsa yalnız ilgili beat) |
| 8 | transcribe.py: VAD parçalarına ±0,3 sn dolgu | video-yapimci | P2 | bekliyor | Kelime hizalamasında cümle sonu kesilmiyor (K-013 emekliye) | |
| 9 | Konu 4 (saha vakası) için Soner'e teyit: ölçümü kendisi mi yaptı? | CEO | P2 | bitti (2026-10-02: "Evet" — ölçümü Soner yaptı) | Cevap alındı | Birinci şahıs anlatım uygun |
| 10 | Short planı: "Ekran 103 °C, termometre 62 °C: arıza sensördeydi" (saha vakası, birinci ağız) | video-yapimci | P1 | üretildi (2026-10-02 akşam, commit 2a0a1d5; MP4 o oturumda kaldı, depoda yok) · metin paketi denetimi 2026-10-03: 1. tur KALDI (LinkedIn'de güvenlik bloğu eksik) → düzeltildi → GEÇTİ | Beat sheet + ölçülmüş anlatım süresi, Soner onayına sunuldu | Kaynak: saha-notlari/jenerator-sicaklik/ — rakamlar sayfadan AYNEN (K-031), 17 rakam doğrulandı; alarm kodu yok. Açık: (a) zaman.json/son_mp4_whisper.json hâlâ eski B5 "Türbini durdurdum" — yeni B5 sesi render'a girdi mi doğrulanmadı; (b) kaynak sayfada 110→112→116 ile "günde ≈2 °C" tutmuyor (Soner'e soruldu) |

| 11 | `ruzgar/` s.308: 3 m/s de "kesme rüzgârı" deniyor; doğru terim "devreye giriş" (cut-in) | site-bakimci | P2 | bekliyor | Metin düzeltildi, yerel test + denetçi + K-023, push | Denetçi bulgusu, 2026-10-03 |
| 12 | Saha vakası MP4'ünü yeni B5 sesiyle doğrula (gerekirse yeniden render) | video-yapimci | P1 | bekliyor | Son MP4'ün Whisper dökümünde B5 "Önce türbini durdurdum"; Soner'e gönderildi | MP4 önceki oturumda kaldı; build.py + ses betikleri depoda |
| 13 | Saha vakası kaynak sayfası: 110→112→116 °C ile "günde yaklaşık 2 °C düzenli" tutarsız | CEO → Soner | P1 | onay-bekliyor | Soner doğru değeri söyledi; sayfa + video metni ona göre | H4 (doğruluk). Sayfaya Soner'in cevabı gelmeden dokunulmaz |

## Hazır ürünler (Soner'e teslim edildi)
- 2026-10-02 · Short · Türbin nasıl elektrik üretir (sessiz, 52 sn) — sitede "Son paylaşım"
- 2026-10-02 · Short · Kanat ucunun hikâyesi (sesli, 80 sn)
- 2026-10-02 · Uzun · Türbinin içine yolculuk (4:25, sesli, kapak + .srt)
- 2026-10-02 · Short · Türbin nasıl elektrik üretir — SESLİ (turbin-elektrik-sesli.mp4, tur 1)
- 2026-10-02 · Metin paketi · 3 video için YouTube + LinkedIn (cikti/metin-2026-10-02.md)
- 2026-10-03 · Metin paketi · Saha vakası YouTube + LinkedIn (cikti/metin-saha-vakasi-2026-10-02.md, denetçi GEÇTİ, LinkedIn 1256 karakter)
