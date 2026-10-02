# Ajans — nasıl çalışır

Bu klasör The Turbine Tech ajansının çalışma alanıdır. Depoda durur, **yayınlanmaz** (`_worker.js` `/ajans` ve
`/.claude` yollarını 404 yapar).

- `CEO.md` — misyon, hedefler, döngü, yetki sınırları. Her tur buradan başlar.
- `OGRENME.md` — öğrenme defteri: aktif kurallar + dersler. Ajanların "hafızası".
- `PANO.md` — iş listesi ve durumları.
- `OLCUMLER.md` — tur tur ölçüm geçmişi (D1 ziyaretçi verisi).
- `sorgular.sql` — ölçüm sorguları (Cloudflare D1 · soner-tani).
- `gunluk/` — her turun kaydı.
- `cikti/` — araştırma notları, metin paketleri, video build betikleri (MP4'ler depoya girmez).
- `araclar/` + `kurulum.sh` — video ortamını yeni oturumda yeniden kurar.
- `../.claude/agents/` — ajan tanımları: arastirmaci, video-yapimci, site-bakimci, icerik-yazari, denetci.

## Kendi kendine öğrenme nasıl oluyor
Model yeniden eğitilmiyor; öğrenme **yazılı** ve **ölçülü**:
1. Her tur önce aktif kurallar okunur ve uygulanır.
2. Tur içinde olan her hata, Soner'in her tepkisi ve her ölçüm sonucu bir "ders"e dönüşür.
3. Ders kurala çevrilir (ya da gerekçesiyle reddedilir); işe yaramadığı ölçülen kural emekliye ayrılır.
4. Site değişiklikleri gerçek ziyaretçi verisiyle (D1) önce/sonra karşılaştırılır.
