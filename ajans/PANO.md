# Pano

Durum: `bekliyor` · `yapiliyor` · `onay-bekliyor` (Soner'e soruldu) · `bitti` · `iptal`
Öncelik: P0 kırık/acil · P1 hedefe doğrudan · P2 iyi olur

| # | İş | Ajan | Öncelik | Durum | Bitti tanımı | Not |
|---|---|---|---|---|---|---|
| 1 | Telefon düzeltmesinin (1d0dbee + akici16) etkisini ölç | site-bakimci | P0 | bekliyor (veri birikiyor; en erken 2026-10-05) | S4/S5 ile `akici16` kohortu `akici14` ile karşılaştırıldı (telefonda "ciddi" oran), OLCUMLER'e yazıldı | Tur 1: arka plan süresi takılma sayılıyordu, düzeltildi (K-025) |
| 2 | "Türbin nasıl elektrik üretir" Short'unu sesli yap | video-yapimci | P1 | bitti (tur 1, denetçi: 1. turda KALDI, düzeltildi) | Sesli MP4 + YouTube paketi, denetçi onaylı | Sessiz sürüm hazır (turbin-elektrik.mp4) |
| 3 | Sonraki 4 video konusunu araştır | arastirmaci | P1 | bitti (tur 1) → `cikti/arastirma-2026-10-02.md` | Her konu için arama talebi kanıtı, rakip boşluğu, sitedeki kaynak sayfa | |
| 4 | 3 video için LinkedIn gönderisi + YouTube paketleri | icerik-yazari | P1 | bitti (tur 1) → `cikti/metin-2026-10-02.md` | `ajans/cikti/` altında kopyala-yapıştır hazır metinler, denetçi onaylı | |
| 5 | Sitede kırık bağlantı / konsol hatası taraması | site-bakimci | P1 | bitti (tur 1: 90 sayfa × 2 cihaz, 0 hata) | Tüm sitemap sayfaları tarandı, bulunanlar onarıldı ya da PANO'ya yazıldı | |
| 6 | 2. uzun video planı: "Rüzgâr türbini teknisyeni nasıl olunur" | video-yapimci | P1 | bekliyor | Beat sheet + anlatım süresi PANO'da, Soner onayı bekliyor (K-040) | Araştırma konu 2; maaş rakamı yok |
| 7 | Short planı: "Rüzgâr esiyor, türbin duruyor. Arızalı mı?" | video-yapimci | P1 | bekliyor | Beat sheet Soner'e sunuldu | Araştırma konu 1 (güven yüksek) |
| 8 | transcribe.py: VAD parçalarına ±0,3 sn dolgu | video-yapimci | P2 | bekliyor | Kelime hizalamasında cümle sonu kesilmiyor (K-013 emekliye) | |
| 9 | Konu 4 (saha vakası) için Soner'e teyit: ölçümü kendisi mi yaptı? | CEO | P2 | bitti (2026-10-02: "Evet" — ölçümü Soner yaptı) | Cevap alındı | Birinci şahıs anlatım uygun |
| 10 | Short planı: "Ekran 103 °C, termometre 62 °C: arıza sensördeydi" (saha vakası, birinci ağız) | video-yapimci | P1 | onay-bekliyor (2026-10-02: plan → `cikti/plan-saha-vakasi-2026-10-02.md`, 12 beat, 78,9 sn ölçülü ses) | Beat sheet + ölçülmüş anlatım süresi, Soner onayına sunuldu | Kaynak: saha-notlari/jenerator-sicaklik/ — rakamlar sayfadan AYNEN (K-031), 17 rakam doğrulandı; alarm kodu yok. Onay gelince: B4/B7 için yeni ses adayı, sonra render |

## Hazır ürünler (Soner'e teslim edildi)
- 2026-10-02 · Short · Türbin nasıl elektrik üretir (sessiz, 52 sn) — sitede "Son paylaşım"
- 2026-10-02 · Short · Kanat ucunun hikâyesi (sesli, 80 sn)
- 2026-10-02 · Uzun · Türbinin içine yolculuk (4:25, sesli, kapak + .srt)
- 2026-10-02 · Short · Türbin nasıl elektrik üretir — SESLİ (turbin-elektrik-sesli.mp4, tur 1)
- 2026-10-02 · Metin paketi · 3 video için YouTube + LinkedIn (cikti/metin-2026-10-02.md)
