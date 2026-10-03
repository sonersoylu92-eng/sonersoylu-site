# Denetim · Metin paketi · Saha vakası Short (PANO #10) · 2026-10-03

Denetlenen dosya: `ajans/cikti/metin-saha-vakasi-2026-10-02.md`
Kaynak: `saha-notlari/jenerator-sicaklik/index.html` · Video anlatımı: `ajans/cikti/plan-saha-vakasi-2026-10-02.md` bölüm 2 + `ajans/cikti/video/saha-vakasi/ses/zaman.json`
Denetçi: denetçi · Uygulanan kurallar: K-030, K-031, K-032 (+ unvan, ünlem, alarm kodu)

## KARAR: KALDI

Tek engelleyici sorun var (S1, LinkedIn güvenlik paragrafı). Sayımlar, rakamlar, unvan, ünlem ve alarm kodu tarafı temiz.
S1 düzeltilince yeniden denetime gerek yok, yalnızca betik tekrar çalıştırılıp LinkedIn sayısı 900–1300 içinde mi diye bakılır.

---

## 1) Betik çıktısı (K-032)

`python3 ajans/araclar/metin_say.py ajans/cikti/metin-saha-vakasi-2026-10-02.md`

```
== Başlık
   karakter: 57  satır: 1  hashtag: 1
   rakamlar: 103, 62
== Açıklama
   karakter: 1407  satır: 19  hashtag: 3
   rakamlar: 103, 62, 126, 116, 115, 110, 112, 116, 2, 2, 62, 103, 41, 62, 124, 140, 100, 103, 100
== Etiketler
   karakter: 367  satır: 1  hashtag: 0
   etiket adedi: 19  tırnaklı sayım (YouTube): 401
   rakamlar: 100, 100, 126
== Gönderi
   karakter: 1286  satır: 21  hashtag: 3
   rakamlar: 103, 62, 126, 116, 115, 110, 112, 116, 2, 2, 62, 103, 41, 41, 100, 62, 124, 140, 103
== İlk yorum
   karakter: 145  satır: 2  hashtag: 0
   rakamlar: 100
```

Betikten bağımsız ikinci sayım (kendi regex'imle kod blokları + `len()`): 57 · 1407 · 367 · 1286 · 145, aynı. UTF-8 bayt olarak açıklama 1564, etiketler 398. Bayt sayımı da her sınırın altında.

| Alan | Paketteki (elle) | Betik | Sınır | Durum |
|---|---|---|---|---|
| YT başlık | 57 | 57 | ≤100 | uyuyor |
| YT açıklama | 1407 | 1407 | ≤5000 | uyuyor |
| YT etiketler | 367 (tırnaklı 401), 19 etiket | 367 / 401, 19 | ≤500 | uyuyor |
| LinkedIn gönderi | 1286 | 1286 | 900–1300 | uyuyor (pay 14) |
| İlk yorum | (yok) | 145 | — | — |

Rakam listesi (paket s.110–114) betikle birebir aynı. **Tek fark:** ilk yorumda paket "rakam yok" diyordu, betik `100` buldu ("PT100 tablosu"). **Düzelttim** (aşağıda).

## 2) Rakamlar ve kaynak (K-031)

Satır numaraları kaynak sayfaya göre. Paketteki eşleme tablosundaki satır atıfları (61, 65, 68, 74, 79, 82, 83, 92, 142, 148) dosyayla tek tek kontrol edildi, hepsi doğru.

| Rakam | Paket | Kaynak | Sonuç |
|---|---|---|---|
| 103 °C (ekran) | s.32, 38, 43, 72, 78 | s.79 "aynı anda SCADA 103 °C" | uyuyor; "alarm 103" denmiyor (D-062 ile uyumlu) |
| ≈62 °C | s.32, 38, 43, 72, 78 | s.79 "yaklaşık 62 °C" | uyuyor; başlıkta (s.32) "yaklaşık" yok (bkz. N1) |
| V126 | s.40, 62, 74 | s.61 | uyuyor |
| 116 °C / eşik 115 °C | s.41, 74 | s.61, s.65 | uyuyor |
| 110 → 112 → 116 °C | s.42, 76 | s.68 | uyuyor (aynen); bkz. N2 |
| günde ≈2 °C, her gün 2 °C tırmanmaz | s.42, 76 | s.68, s.74 | uyuyor; s.74'ten kısaltma ("bir ısınma sorunu" → "ısınma", "düzenli olarak" → "düzenli"), alıntı olarak sunulmuyor, anlam aynı |
| 41 °C / "41 derece değildir" | s.43, 78 | s.79 | aynen |
| 124 Ω / 140 Ω / ≈103 °C | s.44, 80 | s.82 | aynen; fizik kontrolü: 100 + 62 × 0,385 = 123,9 Ω; (140 − 100) / 0,385 = 103,9 °C, "yaklaşık" korunmuş |
| PT100 | s.44, 62, 80, ilk yorum | s.82, s.92 | sensör tipi adı |

Uydurma rakam yok. Sayfada olmayan ayrıntı (saat, yer, isim) yok. Kural cümlesi (s.47, s.84) s.142 ile aynen.
K-030: rüzgâr ile güç ilişkisi pakette geçmiyor, uygulanmaz.

## 3) Güvenlik, unvan, alarm kodu, ünlem

- **Dört adım (YT açıklama s.51):** "türbin durdurulup → devre ayrıldıktan → gerilim yokluğu ölçümle doğrulandıktan → kilitleme-etiketleme (LOTO) uygulandıktan". Sıra ve kelimeler s.148 ile aynen. Önündeki yüksek gerilim cümlesi ve "servis dokümanının yerine geçmez" de var. **Uyuyor.**
- **Dört adım (LinkedIn s.86):** dört adım aynen ve sırayla var. Ancak yüksek gerilim cümlesi düşmüş. **S1.**
- **Alarm kodu:** yok. Kaynakta da sayısal kod yok, yalnızca "Generator temperature high" metni var ve pakete alınmamış. Üretici logosu metinde söz konusu değil. "Vestas V126" model adı kabul.
- **Ünlem:** kod bloklarında 0 adet "!" (betik dışı sayım).
- **Unvan:** s.53 "Rüzgâr Türbini Saha Servis Teknisyeni", doğru (kaynak s.144 ile aynı). LinkedIn gövdesinde unvan yok, profil zaten gösteriyor. Sorun değil.
- **Geçici SCADA düzeltmesi:** pakette anlatılmıyor. Bu yüzden "yalnızca yetkili onayıyla" cümlesinin dışarıda kalması doğru.

## 4) Video anlatımıyla tutarlılık

Plan bölüm 2 ve `zaman.json` (12 beat, sahne sonu 78,72 sn, yani "yaklaşık 79 sn" doğru) satır satır karşılaştırıldı. Çelişki yok.
- Videoda "SCADA" söylenmiyor ("ekran", "sistem" deniyor), pakette "SCADA" yazıyor. Yazılı metinde bu kabul edilebilir, çelişki sayılmaz.
- Videoda "Kayma", pakette sayfadaki kelimeyle "sapma" geçiyor. İkisi de doğru.
- B5 hangi hâliyle kalırsa kalsın ("Türbini durdurdum" / "Önce türbini durdurdum"), paketteki "Türbini durdurup … ölçtüm" ikisiyle de uyumlu.
- Video CTA'sı "sonersoylu.com/saha-notlari", paket bağlantısı vaka sayfasının kendisi. Daha isabetli, çelişki değil.

**Kapsam dışı gözlem (video tarafı, CEO'ya):** Plan s.53'teki üretim notu B5'in "Önce türbini durdurdum, …" olduğunu söylüyor. Ama `ajans/cikti/video/saha-vakasi/ses/zaman.json` beat 5 ve `son_mp4_whisper.json` hâlâ eski cümleyi gösteriyor: "Türbini durdurdum" / Whisper: "Tübini durdurdum". `metin.py` s.10'da ilk aday da eski cümle. Ya plan güncel değil ya da yeni B5 sesi işlenip render edilmedi. Bu, metin paketini etkilemiyor. Video denetiminde K-005 ve K-011 açısından kontrol edilmeli.

## 5) Bağlantı

`https://sonersoylu.com/saha-notlari/jenerator-sicaklik/` adresi bu ortamdan canlı açılamadı (vekil sunucu 403, `CONNECT tunnel failed`). Sayfa depoda var ve `origin/main` içinde (commit 6572198). `sitemap.xml` de vaka yolunu içeriyor. **Canlı 200 doğrulaması yapılamadı.** Yayından önce bir tarayıcıda bir kez açılmalı.

---

## Sorunlar

### S1 · ENGELLEYİCİ · LinkedIn güvenlik paragrafında yüksek gerilim uyarısı düşmüş
- **Yer:** paket s.86
- **Pakette:** "Güvenlik: sensör ölçümü ve değişimi türbin durdurulup … uygulandıktan sonra yapılır."
- **Kaynak (s.148):** "Jeneratör terminal kutusunda yüksek gerilim bulunur. Sensör ölçümü ve değişimi … sonra yapılır. … Bu not saha deneyimidir, servis dokümanının yerine geçmez."
- **Neden engelleyici:** LinkedIn gönderisi videodan ve YouTube açıklamasından bağımsız okunuyor. Gönderide "sensörün direncini ölçtüm" anlatılıyor ama tehlikenin kendisi (yüksek gerilim) söylenmiyor. Dört koşul var, gerekçesi yok. K-031 güvenlik içeriğinin düşürülmemesini istiyor, D-057'de de aynı türden bir kırpma KALDI almıştı. Ayrıca "servis dokümanının yerine geçmez" cümlesi de yok.
- **Önerilen düzeltme (içerik değişikliği, yazara bırakıldı):** s.86'yı kaynaktaki gibi "Güvenlik: Jeneratör terminal kutusunda yüksek gerilim bulunur. Sensör ölçümü ve değişimi …" yap. Yer açmak için s.76'daki "İpucu trenddeydi. " ve s.78'deki " Birkaç derecelik fark normaldir, 41 derece değildir." çıkarılabilir. Hesapladım: sonuç **1268** karakter, sınır içinde. Sorumluluk reddi de eklenirse en az 1327 olur, sınırı aşar. O durumda başka bir cümleden ~30 karakter daha kısmak gerekir (yazarın kararı). En azından yüksek gerilim cümlesi şart.

### S2 · Düzeltildi · Rakam listesinde ilk yorum yanlış
- **Yer:** paket s.114 (eski s.113)
- **Eskisi:** "İlk yorum: yok (bağlantıda rakam yok)". Betik `100` buluyor ("PT100 tablosu").
- **Yapılan:** "100 (PT100, "PT100 tablosu" ifadesinde; bağlantıda rakam yok)" olarak düzeltildi. s.108'deki "doğrulanacak" ibaresi "doğrulandı" yapıldı. s.23'e betik doğrulama satırı eklendi. Karakter sayımlarına etkisi yok (bu bölüm `<!-- SAYIM -->` işaretinden sonra).

## Notlar (engelleyici değil)

- **N1 · Başlıkta "yaklaşık" yok (s.32).** Kaynakta "yaklaşık 62 °C" yazıyor. Yazar bunu kendisi işaretlemiş (paket not 1), plan da Soner'e sormuş (açık nokta 2). Videoda ekranda "≈62 °C" var, açıklamanın ilk satırında "yaklaşık" var. Başlık sınırı bol, "termometre ≈62 °C" de sığar (59 karakter). Karar Soner/CEO'da.
- **N2 · Kaynak sayfanın kendi içinde rakam tutarsızlığı (paketin hatası değil, CEO'ya).** s.68: "110 → 112 → 116 °C. Günde yaklaşık 2 °C'lik düzenli bir tırmanış." Artışlar +2 ve +4 °C, ortalama 3 °C/gün. "Düzenli 2 °C" iddiası verilen üç sayıyla tutmuyor. Paket (s.42, s.76) ve video (B3–B4) K-031 gereği bunu aynen aktarıyor, dikkatli bir LinkedIn okuru yorumda yakalayabilir. Ölçüm Soner'in (D-060). Doğru değer ondan sorulmalı. Sayfa düzeltilirse paket ve video da düzeltilir. Bu sorulmadan yayın, bilinen bir zayıflıkla yayın demek.
- **N3 · Kısaltılmış aktarım (s.42, s.76).** "Gerçek ısınma yükü ve havayı izler" kaynakta "Gerçek bir ısınma sorunu yükü ve havayı izler". Anlam korunuyor, tırnakla sunulmuyor. Kabul. Kaynağa yaklaştırmak bedava olur ("Gerçek bir ısınma sorunu …", +12 karakter), LinkedIn'de S1 düzeltmesinden sonra pay var.

## Ders adayı

- **DA-1 · Kaynak rakamlarının kendi içinde tutarlılığı.** K-031 "aynen kopyala" diyor. Kaynak kendisiyle çelişirse (110 → 112 → 116 ile "düzenli 2 °C/gün"), aynen kopyalama hatayı üç kanala çoğaltır. Öneri: rakam doğrulama tablolarına "kaynağın kendi aritmetiği tutuyor mu" sütunu eklensin. Tutmuyorsa üretim değil, kaynak düzeltmesi açılsın (sahibine sorulur).
- **DA-2 · Kanal başına bağımsız güvenlik bloğu.** Güvenlik metni kısaltılırken "koşullar" korunuyor, "tehlike cümlesi" ve "doküman yerine geçmez" cümlesi düşüyor. Öneri: K-031'e "güvenlik bloğu kanal başına bütün olarak taşınır (tehlike + koşullar + sorumluluk reddi); yer yoksa başka cümle kısalır" eklensin.

## 2. tur (CEO doğrulaması, 2026-10-03)
- S1 düzeltildi (içerik yazarı): LinkedIn güvenlik bloğu artık tehlike + dört koşul + sorumluluk reddi, kaynak s.148 ile aynen (grep ile kıyaslandı).
- `metin_say.py` CEO tarafından çalıştırıldı: başlık 57 · açıklama 1407 · etiketler 367 (tırnaklı 401) · LinkedIn **1256** · ilk yorum 145. Hepsi sınır içinde.
- Karar: **GEÇTİ**. Açık kalan: N1 (başlıkta "yaklaşık") ve N2 (kaynakta 110→112→116 ile "günde ≈2 °C" tutarsızlığı) Soner'e soruldu.
