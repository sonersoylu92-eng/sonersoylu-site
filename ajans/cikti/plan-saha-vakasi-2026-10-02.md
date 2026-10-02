# Plan · Short · Saha vakası: "Ekran 103 °C, termometre 62 °C: arıza sensördeydi"

- **PANO:** #10 · **Durum:** onay-bekliyor (K-040, render yok)
- **Biçim:** 9:16, 1080×1920, 30 fps, sesli (Piper fahrettin), müzik yok (MOTION B)
- **Kaynak:** `saha-notlari/jenerator-sicaklik/` (Vaka 04). Araştırma: `ajans/cikti/arastirma-2026-10-02.md` konu 4
- **Anlatım:** birinci şahıs (D-060, PANO #9: ölçümü Soner yaptı). Sayfada olmayan ayrıntı (saat, hava, yer, isim) yok.
- **Ölçülen süre:** **78,89 sn** (ffprobe, `anlatim.wav`) · konuşma 75,59 sn · 12 beat
- **Ses dosyası:** `/home/claude/video-edit/videos/saha-vakasi/ses/anlatim.wav` (48 kHz stereo, −15,0 LUFS, tepe −4,5 dBFS)
- **Ses betikleri:** aynı klasörde `metin.py` (metin), `anlatim.py` (aday üretimi + Whisper puanı), `normalize.sh`, `dogrula.py` (dolgulu geri yazım), `zaman.json`, `geri.json` (kelime zamanları)

## 1 · Beat tablosu

Zamanlar sesten türetildi (K-006): sahne = konuşma + 0,25 sn boşluk. Altyazı her beatte karaoke (MOTION B), aşağıdaki "ekran yazısı" altyazıdan ayrı, panel üstündeki büyük yazıdır.
Renk: zemin #07090B, vurgu buz mavisi #6FDCEC, amber #F2B233 sahne başına en fazla 1 öğe (tabloda **[amber]**).

| # | Zaman (sn) | Ekranda görünen (görsel / animasyon) | Ekran yazısı | Anlatım |
|---|---|---|---|---|
| 1 | 0,00–4,39 | **İlk kare dolu (K-004):** ekran ikiye bölünmüş. Üstte markasız, genel bir SCADA paneli; sağda "JENERATÖR SARGI SICAKLIĞI" satırında **103 °C [amber]**. Altta el + IR termometre çizimi, ekranında **≈62 °C** (buz mavisi). Sayılar sayaç değil, ilk karede sabit (çelişki 0. saniyede görünür). 3,74 sn'de iki sayı arasında "?" belirir. | EKRAN 103 °C · TERMOMETRE ≈62 °C → 3,7 sn: *Hangisine* inanırsın? | Ekran yüz üç derece diyor. Elimdeki termometre altmış iki. Hangisine inanırsın? |
| 2 | 4,39–11,69 | Uzak türbin silueti (logo yok) → nasel kesitine yakın plan, jeneratör vurgulu. SCADA çubuğu 0'dan 116'ya yükselir, 115'te ince eşik çizgisi; 116'ya değince türbin rotoru yavaşlayıp durur. Ekranda genel uyarı satırı. | SAHADAN · VESTAS V126 · "JENERATÖR SICAKLIĞI YÜKSEK" · 116 °C **[amber]** · eşik 115 °C | Sahadan bir vaka. Vestas, Ve yüz yirmi altı. Jeneratör sargı sıcaklığı yüz on altı dereceye çıkınca türbin alarmla duruyor. |
| 3 | 11,69–18,77 | Solda üç onay ikonu açılır (ses normal · titreşim yok · soğutma çalışıyor). Sağda mini trend grafiği: 3 nokta 110 → 112 → 116, çizgi soldan çizilir; son nokta **[amber]**. | SES NORMAL · TİTREŞİM YOK · SOĞUTMA ÇALIŞIYOR · son 3 gün: 110 → 112 → 116 °C | Ama ses normal, titreşim yok, soğutma çalışıyor. Son üç günün en yüksek değeri: yüz on, yüz on iki, yüz on altı. |
| 4 | 18,77–25,64 | İki şematik eğri (eksende sayı yok): "Gerçek ısınma" yük eğrisiyle birlikte iner-çıkar (düzensiz); "Sensör kayması" günden güne düz bir merdiven gibi tırmanır **[amber]**. Sonda "ölçüm zinciri" ikonu (sensör → kablo → SCADA) belirir. | Gerçek ısınma: yükle *birlikte* · Sensör kayması: her gün ≈2 °C, düzenli | Gerçek ısınma yükü ve havayı izler, her gün düzenli iki derece tırmanmaz. Bu, ölçüm zincirinin kaydığını düşündürür. |
| 5 | 25,64–32,97 | Durmuş rotor (dönmüyor), "DURDURULDU" etiketi. IR termometre jeneratör gövdesine tutulur, ışın noktası gövdede; termometre sayacı 0 → 62 (K-004, 30,0 sn'de 62'ye oturur). 32,2 sn'de yanında SCADA kutusu **103 °C [amber]**. | TÜRBİN DURDURULDU · IR ≈62 °C · aynı anda SCADA 103 °C | Önce türbini durdurdum, jeneratör gövdesini termometreyle ben ölçtüm. Yaklaşık altmış iki derece. Aynı anda ekranda yüz üç. |
| 6 | 32,97–37,69 | Dikey sıcaklık ölçeği: 62 ve 103 işaretli; aradaki boşluk süslü parantezle dolar, **41 °C [amber]** yazısı 33,4 sn'de açılır. Altta küçük not. | FARK 41 °C · "birkaç derecelik fark normaldir, 41 derece değildir" | Arada kırk bir derece fark var. Birkaç derece normaldir. Kırk bir derece değildir. |
| 7 | 37,69–45,80 | Güvenlik kartı, 4 adım sırayla yanar: DURDUR → DEVREYİ AYIR → GERİLİM YOKLUĞUNU ÖLÇ → LOTO (kilit + etiket ikonu) **[amber: kilit ikonu]**. Canlı terminal kutusuna el uzatan görüntü YOK (MOTION C). | UYARI · Jeneratör terminal kutusunda yüksek gerilim · ölçüm LOTO'dan sonra | Sensör ölçümü ve değişimi; türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme etiketleme uygulandıktan sonra yapılır. |
| 8 | 45,80–53,41 | Multimetre, sensörün iki ucuna (klemens) bağlı. Üstte küçük PT100 etiketi. İki kart yan yana: "BEKLENEN" ≈124 Ω (buz mavisi, 49,9 sn) ve "ÖLÇÜLEN" sayacı 0 → 140 Ω **[amber]** (51,9 sn'de oturur). | PT100 · 0 °C = 100 Ω · her derece ≈ +0,385 Ω · 62 °C için beklenen ≈124 Ω · ölçülen ≈140 Ω | Sensörün direncini ölçtüm. Altmış iki derecede beklenen değer yaklaşık yüz yirmi dört ohm. Sensör yaklaşık yüz kırk ohm gösterdi. |
| 9 | 53,41–60,30 | PT100 doğrusu (IEC 60751 tablosundan: 0 °C 100,0 Ω … 120 °C 146,1 Ω), soldan çizilir. 124 Ω ↔ 62 °C (buz mavisi) ve 140 Ω ↔ ≈103 °C **[amber]** kesik çizgileri. Aradaki dikey aralık "≈16 Ω fazla" ile etiketlenir. | 140 Ω ≈ 103 °C · fazla direnç ≈16 Ω → okuma ≈41 °C yukarı · SCADA doğru çeviriyordu | Bu, tabloda yaklaşık yüz üç dereceye karşılık gelir. Sistem direnci doğru çeviriyordu. Yanlış olan direncin kendisiydi. |
| 10 | 60,30–67,38 | Ölçüm zinciri diyagramı: SENSÖR (PT100) → KABLO / KLEMENS → SCADA. Klemens ✓ (60,5 sn), SCADA ✓, sensör kutusu **✗ [amber]** (62,2 sn). Son 2 sn: jeneratör ikonunun etrafında koruma kalkanı, "sağlıklı jeneratör durduruldu". | Bağlantılar sağlam · Kayma: *sensörün* kendisinde · Sistem işini yaptı | Bağlantılar sağlamdı. Kayma, sensörün kendisindeydi. Sistem işini yaptı: sağlıklı bir jeneratörü, korumak için durdurdu. |
| 11 | 67,38–72,56 | Kural kartı (Fraunces 600), arka planda soluk termometre + SCADA ikonları. "makineye" kelimesi italik + buz mavisi. Amber yok. | "Bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar *makineye* inan." — Soner Soylu | Bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan. |
| 12 | 72,56–78,89 | Uzak türbin silueti + ince ızgara. Adres satırı maskeyle açılır (73,7 sn), "The Turbine Tech" ve imza alt satırda. Son söz CTA (MOTION B). | sonersoylu.com/saha-notlari · The Turbine Tech · Soner Soylu — Rüzgâr Türbini Saha Servis Teknisyeni · *Sıradaki vaka için takip et* | Teşhisin tamamı, Soner Soylu nokta kom sitesinde. Dı Törbayn Tek. Sıradaki vaka için takip et. |

Güvenli alan (MOTION B): üst 220 px'te önemli yazı yok, alt 384 px ve sağ 160 px boş; altyazı ekran yüksekliğinin %62'sinde, panel yazıları %20–55 bandında.
Geçişler kesme ya da 0,4 sn maske. Üretici logosu, alarm kodu yok; uyarı satırı yalnız genel ifade ("Jeneratör sıcaklığı yüksek").

### Beat başına ölçülmüş süreler (ffprobe toplamı 78,89 sn)

| # | Sahne aralığı | Sahne süresi | Konuşma başı–sonu | Konuşma süresi | Whisper geri yazımı (±0,3 sn dolgulu, K-005/K-013) |
|---|---|---|---|---|---|
| 1 | 0,00–4,39 | 4,39 | 0,05–4,27 | 4,22 (atempo 1,08) | Ekran 103 derece diyor. Elimdeki termometre 62. Hangisine inanırsın? |
| 2 | 4,39–11,69 | 7,30 | 4,52–11,56 | 7,04 | Sahadan bir vaka. Vestas V126. Jeneratör sargı sıcaklığı 116 dereceye çıkınca türbin alarmla duruyor. |
| 3 | 11,69–18,77 | 7,08 | 11,81–18,65 | 6,84 | Ama ses normal, titreşim yok, soğutma çalışıyor. Son 3 günün en yüksek değeri 110, 112, 116. |
| 4 | 18,77–25,64 | 6,87 | 18,90–25,51 | 6,61 | Gerçek ısınma(n) yükü ve havayı izler, her gün düzenli 2 derece tırmanmaz. Bu ölçüm zincirinin kaydığını düşündürür. |
| 5 | 25,64–32,97 | 7,33 | 25,76–32,84 | 7,08 | Türbini durdurdum. Jeneratör gövdesini termometreyle ben ölçtüm. Yaklaşık 62 derece. Aynı anda ekranda 103. |
| 6 | 32,97–37,69 | 4,72 | 33,09–37,56 | 4,47 | Arada 41 derece fark var. Birkaç derece normaldir. 41 derece değildir. |
| 7 | 37,69–45,80 | 8,11 | 37,81–45,67 | 7,86 | Sensör ölçümü ve değişimi, türbin durdurulup devre ayrıldıktan, gerilim yoklu(ğu) ölçümle doğrulandıktan ve kilitleme etiketleme uygulandıktan sonra yapılır |
| 8 | 45,80–53,41 | 7,61 | 45,92–53,29 | 7,38 | Sensörün direncini ölçtüm. 62 derecede beklenen değer yaklaşık 124 ohm. Sensör yaklaşık 140 ohm gösterdi. |
| 9 | 53,41–60,30 | 6,89 | 53,54–60,18 | 6,63 | Bu tabloda yaklaşık 103 dereceye karşılık gelir. Sistem direnci doğru çeviriyordu. Yanlış olan direncin kendisiydi. |
| 10 | 60,30–67,38 | 7,08 | 60,43–67,25 | 6,82 | Bağlantılar sağlamdı. Kayma sensörün kendisindeydi. Sistem işini yaptı. Sağlıklı bir jeneratörü korumak için durdurdu. |
| 11 | 67,38–72,56 | 5,18 | 67,50–72,44 | 4,94 | Bir sayı ile makinenin davranışı birbirini tutmuyorsa sayıyı kanıtlayana kadar makineye inan. |
| 12 | 72,56–78,89 | 6,33 | 72,69–78,39 | 5,70 | Teşhisin tamamı sonersoylu.com sitesinde. The Turbine Tech. Sıradaki vaka için takip et. |

Kanca zamanlaması (kelime hizalaması, `geri.json`): "103" 0,46 sn · "diyor" 1,58 sn'de biter · "62" 2,46–3,24 sn. Görsel çelişki 0. karede, sözlü ilk cümle 1,6 sn'de tamam; "62" sözü 2 sn'yi 1,2 sn geçiyor (bkz. açık nokta 2).

**Üretim notu (2026-10-02, denetçi engeli):** B5 anlatımı CEO kararıyla "Önce türbini durdurdum, …" oldu (K-011: "türbini" cümle başından alındı; Whisper ve CTC'de "tübini" duyuluyordu). Yukarıdaki ölçülmüş süre tablosu ilk ses içindir; güncel zamanlar `ajans/cikti/video/saha-vakasi/ses/zaman.json`.

Ses kalitesi notları (üretimde K-011 ile yeniden seçilecek): B4 "ısınma" bir geçişte "ısınman", B7 "yokluğu" bir geçişte "yoklu" duyuldu. Diğer 10 beat kelimesi kelimesine eşleşti (B12 farkı yalnız yazım: "sonersoylu.com", "The Turbine Tech").

## 2 · Tam anlatım metni

> Ekran yüz üç derece diyor. Elimdeki termometre altmış iki. Hangisine inanırsın?
> Sahadan bir vaka. Vestas, Ve yüz yirmi altı. Jeneratör sargı sıcaklığı yüz on altı dereceye çıkınca türbin alarmla duruyor.
> Ama ses normal, titreşim yok, soğutma çalışıyor. Son üç günün en yüksek değeri: yüz on, yüz on iki, yüz on altı.
> Gerçek ısınma yükü ve havayı izler, her gün düzenli iki derece tırmanmaz. Bu, ölçüm zincirinin kaydığını düşündürür.
> Önce türbini durdurdum, jeneratör gövdesini termometreyle ben ölçtüm. Yaklaşık altmış iki derece. Aynı anda ekranda yüz üç.
> Arada kırk bir derece fark var. Birkaç derece normaldir. Kırk bir derece değildir.
> Sensör ölçümü ve değişimi; türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme etiketleme uygulandıktan sonra yapılır.
> Sensörün direncini ölçtüm. Altmış iki derecede beklenen değer yaklaşık yüz yirmi dört ohm. Sensör yaklaşık yüz kırk ohm gösterdi.
> Bu, tabloda yaklaşık yüz üç dereceye karşılık gelir. Sistem direnci doğru çeviriyordu. Yanlış olan direncin kendisiydi.
> Bağlantılar sağlamdı. Kayma, sensörün kendisindeydi. Sistem işini yaptı: sağlıklı bir jeneratörü, korumak için durdurdu.
> Bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan.
> Teşhisin tamamı, Soner Soylu nokta kom sitesinde. Dı Törbayn Tek. Sıradaki vaka için takip et.

Telaffuz kararları (K-005, K-011): sayılar yazıyla · "V126" → "Ve yüz yirmi altı" · "sonersoylu.com" → "Soner Soylu nokta kom sitesinde" (bitişik yazımda "sonar soylu" duyuldu) · "The Turbine Tech" → "Dı Törbayn Tek" · "LOTO" → "kilitleme etiketleme" · "SCADA" anlatımda yok ("ekran", "sistem"), yalnız ekran yazısında · "Klemensler" okunmadı ("Clemensler/Kremesler") → "Bağlantılar" (sayfadaki kelime). "Bir/İki" bölüm numarası yok.

## 3 · Rakam doğrulama listesi (K-031, K-032)

Kaynak: `saha-notlari/jenerator-sicaklik/index.html` (satır numaraları dosyadandır).

| Rakam (videoda) | Nerede | Sayfadaki karşılığı (aynen) | Durum |
|---|---|---|---|
| 103 °C | B1, B5, B9 (anlatım + ekran) | s.79: "aynı anda SCADA **103 °C** gösteriyordu" | uyuyor |
| ≈62 °C | B1, B5, B8 | s.79: "Durdurulan jeneratörün gövdesi yaklaşık **62 °C** ölçtü" | uyuyor; B1 anlatımında "yaklaşık" yok (açık nokta 2), ekranda "≈62" |
| Vestas V126 | B2 | s.61: "Vestas V126." | uyuyor (logo yok) |
| 116 °C | B2, B3 | s.61: "Jeneratör sargı sıcaklığı 116 °C'ye çıkınca türbin alarmla duruyor"; s.65: "116 °C (eşik 115 °C). Türbin duruyor." | uyuyor |
| eşik 115 °C | B2 (yalnız ekran) | s.65: "(eşik 115 °C)" | uyuyor |
| son 3 gün 110 → 112 → 116 °C | B3 | s.68: "Son üç günde okunan en yüksek değer 110 → 112 → 116 °C." | uyuyor |
| günde ≈2 °C, düzenli | B4 | s.68: "Günde yaklaşık 2 °C'lik düzenli bir tırmanış."; s.74: "Gerçek bir ısınma sorunu yükü ve havayı izler; her gün düzenli olarak 2 °C tırmanmaz." | uyuyor |
| ses normal / titreşim yok / soğutma çalışıyor | B3 | s.61: "ses normal, titreşim yok, soğutma çalışıyor" | uyuyor |
| 41 °C fark | B6, B9 | s.79: "Arada **41 °C** fark vardı. … birkaç derecelik fark normaldir, 41 derece değildir." | uyuyor |
| PT100: 0 °C = 100 Ω, ≈0,385 Ω/°C | B8 (yalnız ekran) | s.82: "PT100 sensör 0 °C'de 100 Ω'dur ve her derecede yaklaşık 0,385 Ω artar." | uyuyor |
| beklenen ≈124 Ω | B8 | s.82: "Jeneratörün ölçülen 62 °C'si için beklenen değer yaklaşık **124 Ω**." | uyuyor (100 + 62 × 0,385 = 123,9) |
| ölçülen ≈140 Ω | B8, B9 | s.82: "Sensör ise yaklaşık **140 Ω** ölçtü" | uyuyor |
| 140 Ω ≈ 103 °C | B9 | s.82: "bu, PT100 tablosunda yaklaşık 103 °C'ye karşılık gelir. Yani SCADA direnci doğru çeviriyordu; yanlış olan direncin kendisiydi." | uyuyor; not: doğrusal hesap 103,9 °C verir, sayfa "yaklaşık" diyor. Grafikte işaret 103'e konur, etiket "≈" ile |
| ≈16 Ω fazla → ≈41 °C yukarı | B9 (yalnız ekran) | s.92: "Eleman yaklaşık 16 Ω fazla direnç gösteriyordu; bu da okumayı yaklaşık 41 °C yukarı taşıyordu." | uyuyor (16 / 0,385 = 41,6) |
| PT100 grafiği 0…120 °C / 100,0…146,1 Ω | B9 (eksen) | s.117: tablo 0 °C 100,0 Ω · 20 °C 107,8 · 40 °C 115,5 · 60 °C 123,2 · 80 °C 130,9 · 100 °C 138,5 · 120 °C 146,1 Ω | uyuyor |
| bağlantılar sağlam, kayma sensörde | B10 | s.83: "Bağlantılar sağlamdı; sapma sensör elemanının kendisindeydi." | uyuyor |
| "sistem işini yaptı" | B10 | s.92: "kontrol sistemi de tasarlandığı işi yaptı: makineyi korumak için sağlıklı bir jeneratörü durdurdu." | anlam aynı, kısaltıldı (alıntı olarak sunulmuyor) |
| güvenlik koşulu | B7 | s.148: "Sensör ölçümü ve değişimi türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme-etiketleme (LOTO) uygulandıktan sonra yapılır." | 4 koşulun hepsi aynen anlatımda (K-031) |
| kural cümlesi | B11 | s.142: "bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan." | aynen |

Kullanılmayan sayfa rakamları (bilerek dışarıda): günde 2–3 alarm, 13–15 m/s, fan 3,2 A, sensörün ≈4 yıllık servis süresi, geçici SCADA düzeltmesi (anlatılmadığı için "yalnız yetkili onayıyla" uyarısı gerekmedi). Alarm kodu yok.

**Başlık uyarısı:** brifteki başlık "Alarm 103 °C" diyor; sayfaya göre alarm **116 °C**'de (eşik 115 °C), 103 °C ise durdurulmuş makinede IR ölçümüyle aynı anda SCADA'nın gösterdiği değer. Araştırma notu da "ikisini karıştırmayın" diyor. Önerilen başlık: **"Ekran 103 °C, termometre 62 °C: arıza sensördeydi"** (video içinde "alarm 103" denmiyor).

## 4 · Soner'e açık noktalar

1. **Başlık:** "Alarm 103 °C" yerine "Ekran 103 °C, termometre 62 °C: arıza sensördeydi" olsun mu? (Alarm 116 °C'de geldi, 103 °C ölçüm anındaki ekran değeri.)
2. **Kanca:** "Elimdeki termometre altmış iki" cümlesinde "yaklaşık" yok (ekranda "≈62 °C" yazıyor, 5. beatte "yaklaşık altmış iki" deniyor). Böyle kalsın mı, yoksa kancayı "Ekran yüz üç, termometre altmış iki" diye kısaltıp (≈2 sn) "yaklaşık"ı 5. beate mi bırakalım?

## 5 · Onaydan sonra üretim notları

- Süre 78,9 sn (hedef 60–80). Kısaltma gerekirse: B4'ün 2. cümlesi çıkar (≈2,5 sn) ya da tüm anlatıma atempo 1,05 (≈75 sn).
- K-011: B4 ve B7 için 5 aday daha, seçim tam dosya üzerinde dolgulu yazımla (`dogrula.py`).
- K-012 `tasma_kontrol.mjs` + K-003 her beatten kare. K-008 `hyperframes@0.8.106`. 79 sn render için K-007 ayrık başlatma.
- Teslim: `ajans/cikti/video/saha-vakasi/` altına MP4 (H.264+AAC, 1080×1920), .srt; MP4 depoya girmez.
