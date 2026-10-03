# Yayın metni · 2026-10-02 · Saha vakası Short (PANO #10)

Teslim edilen dosya: `ajans/cikti/metin-saha-vakasi-2026-10-02.md`
Video: "Ekran 103 °C, termometre 62 °C: arıza sensördeydi". Short, 9:16, yaklaşık 79 sn, sesli, birinci ağızdan anlatım (D-060)
Kaynak: `saha-notlari/jenerator-sicaklik/index.html` (Vaka 04). Rakamlar sayfadan aynen alındı (K-031). Alarm kodu yok.
Hazırlayan: içerik yazarı · Durum: S1 düzeltildi (2026-10-03), betik kontrolü bekliyor

Kurallar: unvan "Rüzgâr Türbini Saha Servis Teknisyeni", ünlem yok, sayfada olmayan rakam ya da ayrıntı (saat, yer, isim) yok.
LinkedIn'de bağlantı gönderide değil, ilk yorumda. Güvenlik bloğu iki kanalda da bütün: tehlike cümlesi + dört koşul (sayfadaki sırayla) + sorumluluk reddi, aynı kelimelerle.

| Alan | Karakter | Sınır | Not |
|---|---|---|---|
| YT başlık | 57 | 100 | sabit başlık + " #Shorts" |
| YT açıklama | 1407 | 5000 | kanca + 5 madde + kural + bağlantı + güvenlik + imza + 3 hashtag |
| YT hashtag | 3 | — | brifte istendiği gibi açıklamanın sonunda |
| YT etiketler | 367 (tırnaklı 401) | 500 | 19 etiket |
| LinkedIn gönderi | 1256 | 900–1300 | 3 hashtag, sonda soru, güvenlik bloğu tam (S1 düzeltmesi) |

**Sayım notu (K-032):** Bu oturumda komut çalıştırma aracı yoktu. Sayımları satır satır elle yaptım, betikle yapamadım.
Doğrulama için betiği yazdım: `python3 ajans/araclar/metin_say.py ajans/cikti/metin-saha-vakasi-2026-10-02.md`.
Denetçi bu betiği çalıştırıp tablodaki sayıları ve aşağıdaki rakam listesini kontrol etmeli. Elle sayımda ±birkaç karakterlik
sapma olabilir. Yine de hepsi sınırın altında. (S1 düzeltmesinden sonra LinkedIn'de üst sınıra 44 karakter pay var.)
**Denetim (2026-10-03):** betik çalıştırıldı; tablodaki beş sayı da betikle birebir aynı (57 · 1407 · 367/401 · 1286; ilk yorum 145).
**S1 düzeltmesi (2026-10-03, içerik yazarı):** LinkedIn güvenlik paragrafı kaynaktaki (s.148) blokla tamamlandı: tehlike cümlesi + dört koşul + sorumluluk reddi, aynen.
Yer açmak için üç cümle çıkarıldı: "İpucu trenddeydi." (−18), "Birkaç derecelik fark normaldir, 41 derece değildir." (−53), "Yani SCADA direnci doğru çeviriyordu; yanlış olan direncin kendisiydi." (−71). Eklenen: "Jeneratör terminal kutusunda yüksek gerilim bulunur. " (+53), " Bu not saha deneyimidir, servis dokümanının yerine geçmez." (+59).
Yeni LinkedIn sayısı **1256** = betiğin doğruladığı 1286 − 142 + 112. Bu oturumda da komut çalıştırma aracı yoktu, betiği çalıştıramadım; sayı betiğin `len()` kuralına göre fark hesabıyla bulundu. **Betik denetçi ya da CEO tarafından bir kez çalıştırılmalı** (beklenen: Gönderi karakter 1256, satır 21, hashtag 3). Diğer bloklara dokunulmadı, onların sayıları değişmez.

---

## 1) YouTube

**Başlık** (57 karakter)

```
Ekran 103 °C, termometre 62 °C: arıza sensördeydi #Shorts
```

**Açıklama** (1407 karakter, 3 hashtag dahil)

```
Ekran 103 °C diyordu, elimdeki IR termometre yaklaşık 62 °C. Arıza jeneratörde değil, sensördeydi.

Sahadan bir vaka, Vestas V126:
• Jeneratör sargı sıcaklığı 116 °C'ye çıkınca (eşik 115 °C) türbin alarmla duruyordu. Oysa ses normal, titreşim yok, soğutma çalışıyordu.
• Son üç günün en yüksek değeri 110 → 112 → 116 °C: günde yaklaşık 2 °C'lik düzenli bir tırmanış. Gerçek ısınma yükü ve havayı izler; her gün düzenli 2 °C tırmanmaz.
• Türbini durdurup jeneratör gövdesini ölçtüm: yaklaşık 62 °C. Aynı anda SCADA 103 °C gösteriyordu. Arada 41 °C fark vardı.
• Sensörün direncini ölçtüm: 62 °C için beklenen yaklaşık 124 Ω, ölçülen yaklaşık 140 Ω. Bu, PT100 tablosunda yaklaşık 103 °C'ye karşılık gelir.
• Bağlantılar sağlamdı; sapma sensör elemanının kendisindeydi.

Bu vakadan çıkardığım kural: bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan.

Teşhisin tamamı, PT100 tablosu ve kontrol listesi: https://sonersoylu.com/saha-notlari/jenerator-sicaklik/

Güvenlik: Jeneratör terminal kutusunda yüksek gerilim bulunur. Sensör ölçümü ve değişimi türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme-etiketleme (LOTO) uygulandıktan sonra yapılır. Bu not saha deneyimidir, servis dokümanının yerine geçmez.

Soner Soylu · Rüzgâr Türbini Saha Servis Teknisyeni · The Turbine Tech
sonersoylu.com

#Shorts #RüzgârTürbini #SahaServis
```

**Etiketler** (367/500 karakter, YouTube'un tırnaklı sayımıyla yaklaşık 401. Studio > Etiketler alanına)

```
jeneratör sıcaklık alarmı, jeneratör sargı sıcaklığı, PT100, PT100 direnç tablosu, RTD sensör, sensör kalibrasyon kayması, IR termometre, SCADA, arıza teşhisi, rüzgâr türbini, rüzgar türbini arıza, Vestas V126, saha servis teknisyeni, The Turbine Tech, Soner Soylu, wind turbine generator temperature, sıcaklık sensörü arızası, jeneratör arızası, yenilenebilir enerji
```

---

## 2) LinkedIn

**Gönderi** (1256 karakter, 3 hashtag)

```
Ekran 103 °C diyordu. Elimdeki IR termometre yaklaşık 62 °C.

Vestas V126. Jeneratör sargı sıcaklığı 116 °C'ye çıkınca (eşik 115 °C) türbin alarmla duruyordu. Oysa ses normal, titreşim yok, soğutma çalışıyordu.

Son üç günün en yüksek değeri 110 → 112 → 116 °C; günde yaklaşık 2 °C'lik düzenli bir tırmanış. Gerçek ısınma yükü ve havayı izler; her gün düzenli 2 °C tırmanmaz.

Türbini durdurup jeneratör gövdesini ölçtüm: yaklaşık 62 °C. Aynı anda SCADA 103 °C gösteriyordu. Arada 41 °C fark vardı.

Sensörün direncini ölçtüm. PT100 için 62 °C'de beklenen yaklaşık 124 Ω; sensör yaklaşık 140 Ω ölçtü. Bu, tabloda yaklaşık 103 °C'ye karşılık gelir.

Bağlantılar sağlamdı; sapma sensör elemanının kendisindeydi.

Çıkardığım kural: bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan.

Güvenlik: Jeneratör terminal kutusunda yüksek gerilim bulunur. Sensör ölçümü ve değişimi türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme-etiketleme (LOTO) uygulandıktan sonra yapılır. Bu not saha deneyimidir, servis dokümanının yerine geçmez.

Video ve teşhisin tamamı ilk yorumda.

Siz bir sıcaklık alarmında ilk neye bakarsınız: ekrana mı, makineye mi?

#RüzgârEnerjisi #SahaServis #Bakım
```

**İlk yorum** (gönderiden hemen sonra. Video yayınlanınca köşeli parantezin yerine Short bağlantısı konacak)

```
Kısa video: [YouTube Short bağlantısı]
Teşhisin tamamı, PT100 tablosu ve kontrol listesi: https://sonersoylu.com/saha-notlari/jenerator-sicaklik/
```

<!-- SAYIM -->

---

## 3) Rakam listesi ve sayfa karşılıkları (K-031, K-032)

Metinlerde geçen rakamlar sırasıyla (elle çıkarıldı; 2026-10-03 denetimde `metin_say.py` ile doğrulandı):

- **Başlık:** 103, 62
- **Açıklama:** 103, 62, 126 (V126), 116, 115, 110, 112, 116, 2, 2, 62, 103, 41, 62, 124, 140, 100 (PT100), 103, 100 (PT100)
- **Etiketler:** 100 (PT100), 100 (PT100), 126 (V126)
- **LinkedIn:** 103, 62, 126 (V126), 116, 115, 110, 112, 116, 2, 2, 62, 103, 41, 100 (PT100), 62, 124, 140, 103 (S1 düzeltmesinden sonra; ikinci 41 "41 derece değildir" cümlesiyle çıktı. Eklenen güvenlik cümlelerinde rakam yok)
- **İlk yorum:** 100 (PT100, "PT100 tablosu" ifadesinde; bağlantıda rakam yok)

Satır numaraları `saha-notlari/jenerator-sicaklik/index.html` dosyasına göre.

| Rakam | Nerede | Sayfadaki karşılığı (aynen) | Durum |
|---|---|---|---|
| 103 °C | Başlık, açıklama, LinkedIn | s.79: "aynı anda SCADA <strong>103 °C</strong> gösteriyordu" | uyuyor. Ölçüm anındaki ekran değeri, alarm değeri olarak geçmiyor |
| 62 °C | Başlık, açıklama, LinkedIn | s.79: "Durdurulan jeneratörün gövdesi yaklaşık <strong>62 °C</strong> ölçtü" | uyuyor. Metinlerde "yaklaşık" var, yalnız sabit başlıkta yok (bkz. not 1) |
| Vestas V126 | Açıklama, etiket, LinkedIn | s.61: "Vestas V126." | uyuyor |
| 116 °C | Açıklama, LinkedIn | s.61: "Jeneratör sargı sıcaklığı 116 °C'ye çıkınca türbin alarmla duruyor"; s.65: "116 °C (eşik 115 °C). Türbin duruyor." | uyuyor |
| eşik 115 °C | Açıklama, LinkedIn | s.65: "(eşik 115 °C)" | uyuyor |
| 110 → 112 → 116 °C | Açıklama, LinkedIn | s.68: "Son üç günde okunan en yüksek değer 110 → 112 → 116 °C." | uyuyor |
| günde yaklaşık 2 °C | Açıklama, LinkedIn | s.68: "Günde yaklaşık 2 °C'lik düzenli bir tırmanış." | aynen |
| her gün 2 °C tırmanmaz | Açıklama, LinkedIn | s.74: "Gerçek bir ısınma sorunu yükü ve havayı izler; her gün düzenli olarak 2 °C tırmanmaz." | anlam aynı, kısaltıldı (alıntı olarak sunulmuyor) |
| 41 °C fark | Açıklama, LinkedIn | s.79: "Arada <strong>41 °C</strong> fark vardı." | aynen |
| PT100 | Açıklama, etiket, LinkedIn | s.82: "PT100 sensör 0 °C'de 100 Ω'dur"; s.92: "Sargı sıcaklık sensöründe (PT100) kayma." | uyuyor (rakam, sensör tipinin adı) |
| beklenen ≈124 Ω | Açıklama, LinkedIn | s.82: "Jeneratörün ölçülen 62 °C'si için beklenen değer yaklaşık <strong>124 Ω</strong>." | uyuyor |
| ölçülen ≈140 Ω | Açıklama, LinkedIn | s.82: "Sensör ise yaklaşık <strong>140 Ω</strong> ölçtü" | uyuyor |
| 140 Ω ≈ 103 °C | Açıklama, LinkedIn | s.82: "bu, PT100 tablosunda yaklaşık 103 °C'ye karşılık gelir." | aynen ("yaklaşık" korundu). "Yani SCADA direnci doğru çeviriyordu…" cümlesi S1 düzeltmesinde LinkedIn'den çıkarıldı |

Rakamsız ama sayfadan alınan cümleler:

| İfade | Nerede | Sayfadaki karşılığı |
|---|---|---|
| ses normal, titreşim yok, soğutma çalışıyor(du) | Açıklama, LinkedIn | s.61: "ses normal, titreşim yok, soğutma çalışıyor" (yalnız kip geçmiş zamana çevrildi) |
| Bağlantılar sağlamdı; sapma sensör elemanının kendisindeydi. | Açıklama, LinkedIn | s.83: aynen |
| Kural cümlesi | Açıklama, LinkedIn | s.142: "bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan." (aynen) |
| Güvenlik bloğu | Açıklama (tam), LinkedIn (tam: tehlike + dört koşul + sorumluluk reddi; S1 düzeltmesi) | s.148: "Jeneratör terminal kutusunda yüksek gerilim bulunur. Sensör ölçümü ve değişimi türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme-etiketleme (LOTO) uygulandıktan sonra yapılır." ve "Bu not saha deneyimidir, servis dokümanının yerine geçmez." (aynen, dört koşulun hepsi var) |

Bilerek dışarıda bırakılanlar: günde 2–3 alarm, 13–15 m/s, fan 3,2 A, yaklaşık dört yıllık servis süresi, ≈16 Ω fazla direnç, 0,385 Ω/°C, alarm kodu.
Geçici SCADA düzeltmesi anlatılmadığı için "yalnızca yetkili onayıyla" uyarısına gerek kalmadı.

## 4) Notlar

1. **Başlık ile "yaklaşık":** Sabit başlıkta "termometre 62 °C" yazıyor, sayfada "yaklaşık 62 °C". Açıklamanın ilk satırında ve LinkedIn'de "yaklaşık" var. Başlık brifte sabit verildiği için dokunmadım.
2. **Hashtag sayısı:** Genel teslim biçimi YouTube için 8–10 hashtag diyor. Bu brif açıklamada 3 istedi, ben de 3 kullandım. YouTube başlığın üstünde zaten ilk üç hashtag'i gösteriyor.
3. **LinkedIn gözlemi:** Gönderideki bütün saha gözlemleri sayfadaki vakadan geliyor, uydurma bir anı eklemedim. Birinci ağızdan anlatımın onayı D-060'ta var (ölçümü Soner yaptı).
