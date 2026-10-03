# Plan · Short · "Rüzgâr esiyor, türbin duruyor. Arızalı mı?"

- **PANO:** #7 · **Durum:** onaylandı (Soner "Onay", 2026-10-03) · üretildi (bkz. §7 Üretim notu)
- **Biçim:** 9:16, 1080×1920, 30 fps, sesli (Piper fahrettin), müzik yok (MOTION B)
- **Kaynak:** `ajans/cikti/arastirma-2026-10-02.md` Konu 1 · site: `egitim/turbin-nasil-calisir/`, `n90/`, `ruzgar/`, `ariza/`, `egitim/guvenlik/`, `sozluk/`
- **Anlatım:** genel açıklayıcı ses. Birinci şahıs yok ("ölçtüm", "gördüm" yok), saha vakası değil. Üretici logosu yok, alarm kodu yok.
- **Ölçülen süre:** **60,43 sn** (ffprobe, `anlatim.wav`; onay sonrası B6'ya cümle eklendi, ilk plan 57,27 sn) · konuşma toplamı 57,88 sn · **9 beat** · hedef 45–75 sn
- **Ses dosyası (depoda değil):** `/home/claude/video-edit/videos/ruzgar-esiyor/anlatim.wav` (48 kHz stereo, −15,1 LUFS, tepe −4,5 dBFS)
- **Betikler (depoda):** `ajans/cikti/video/ruzgar-esiyor/`: `metin.py` (metin + telaffuz kararları), `anlatim.py` (aday üretimi, Whisper puanı, dizim), `aday.py` (çift dolgulu yazımla yeniden seçim, K-013), `ekle.py` (doğrulanmış beat sesine cümle ekleme, Whisper + CTC hakemli), `kelime.py` (CTC'ye zorunlu kelime hizalaması), `build.py` (index.html + .srt), `render.sh` (K-007 ayrık render), `normalize.sh`, `dogrula.py` (tam dosyada beat başına dolgulu geri yazım), `zaman.json` (ölçülmüş beat zamanları)

## 1 · Kanca

**Görüntü (0. kare, K-004):** tepede tek türbin, rotor duruyor; sağdan sola akan ince rüzgâr çizgileri kadrajı dolduruyor. Çelişki ilk karede görünür.
**Söz (0,13–3,99 sn):** "Rüzgâr esiyor, türbin duruyor. Arızalı mı? Çoğu zaman, hayır." "Arızalı mı?" 2,13 sn'de başlar, kanca 2,6 sn'de kurulmuş olur.

## 2 · Beat tablosu

Zamanlar sesten türetildi (K-006): sahne = konuşma + 0,25 sn boşluk, son sahne +0,5 sn. Sahne içi zamanlar kelime hizalamasından (`kelime.json`).
Altyazı her beatte karaoke (MOTION B, %62 yükseklik). Aşağıdaki "ekran yazısı" altyazıdan ayrı, panel üstündeki büyük yazıdır.
Renk: zemin #07090B, vurgu buz mavisi #6FDCEC, ikinci vurgu #7CC4FF, amber #F2B233 sahne başına en fazla 1 öğe (tabloda **[amber]**).

| # | Zaman (sn) | Ekranda görünen (görsel / animasyon) | Ekran yazısı | Anlatım |
|---|---|---|---|---|
| 1 | 0,00–4,12 | **İlk kare dolu:** sırt üstünde tek türbin silueti (logo yok), rotor durmuş. İnce rüzgâr çizgileri (#7CC4FF, %40) sağdan sola sürekli akar; ağaç/ot yok, yalnız çizgi. 2,1 sn'de soru işareti nasel hizasında belirir **[amber]**. 2,9 sn'de alt satır maskeyle açılır. | Rüzgâr esiyor, türbin duruyor. → 2,1 sn: *Arızalı* mı? → 2,9 sn: ÇOĞU ZAMAN: HAYIR | Rüzgâr esiyor, türbin duruyor. Arızalı mı? Çoğu zaman, hayır. |
| 2 | 4,12–9,60 | Güç eğrisi paneli (N90/2500 yayımlanmış eğrisi, `ruzgar/` tablosu). Eksen: rüzgâr m/s (0–25), güç kW (0–2.500). Eğri soldan çizilir. 7,5 sn'de 0–3 m/s bandı taranır, bant içinde küçük duran rotor ikonu; "3" etiketi **[amber]**. Panelin sağ altında küçük model künyesi (güvenli alan içinde: x ≤ 920 px, y ≤ 1536 px; ekranın sağ alt köşesi değil). | ÖRNEĞİN BU MODELDE · NORDEX N90/2500 · 3 m/s altında: üretim yok | Rüzgâr zayıfsa üretim olmaz. Örneğin bu modelde, saniyede üç metrenin altında türbin durur. |
| 3 | 9,60–15,84 | Aynı eğri; kamera sağ uca kayar (kesme, zoom yok). 11,8 sn'de 25 m/s'te dikey kesik çizgi **[amber]**, eğri orada sıfıra iner. 14,5 sn'de yan panel: kanat kesiti 0° → 90° döner (bayrak konumu, K-001: kendi dayanağında `<g>`). | 25 m/s üstünde: kanatlar bayrak konumuna · türbin durur · *değerler modele göre değişir* | Çok sert rüzgârda da durur. Saniyede yirmi beş metrenin üstünde, emniyet için kanatlar bayrak konumuna alınır. |
| 4 | 15,84–20,86 | Eğrinin tamamı soluk; iki uç (0–3 ve 25+) buz mavisi yanar. Üstte alıntı kartı (Fraunces 600), "bu eğrinin bir ucudur" italik + buz mavisi. Amber yok. | "kule dibinde “makine niye durdu” sorusunun cevabı çoğu zaman arıza değil, *bu eğrinin bir ucudur*." — Eğitim, Bölüm 03 | Kule dibinde makine niye durdu sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur. |
| 5 | 20,86–27,27 | Planlı bakım kartı. Üç adım sırayla yanar (23,3 / 23,7 / 24,3 sn): ŞALTER AÇILIR → KİLİTLENİR → ETİKETLENİR (asma kilit + etiket ikonu). 25,2 sn'de ayrı satır: rotor kilidi pimi ikonu + "gerekiyorsa" **[amber: "GEREKİYORSA" kelimesi]**. İnsan figürü yok; canlı panele uzanan el yok (MOTION C). | PLANLI BAKIM · LOTO: şalter açılır, kilitlenir, etiketlenir · GEREKİYORSA ROTOR KİLİDİ · "biri diğerinin yerini tutmaz" | Planlı bakımda da türbin durdurulur. Şalter açılır, kilitlenir ve etiketlenir. Gerekiyorsa rotor kilidi de takılır. |
| 6 | 27,27–37,55 | Sol: rüzgâr çizgileri akıyor + türbin hazır (yeşil değil, buz mavisi durum noktası). Sağ: şebeke hattı ikonu (direk + hat), 31,1 sn'de hat üzerinde "KISIT" kilidi **[amber]**; rotor yavaşlayıp durur. 33,1 sn'de alt satır; 34,7 sn'de "ALARM VARSA" satırı. | ALARM YOK AMA DURUYOR · Şebeke işletmecisinden gelen üretim kısıtı · *Bu bir arıza değildir.* · ALARM VARSA: ÖNCE ALARMI DOĞRU OKU | Bazen rüzgâr da makine de hazırdır, ama şebeke işletmecisinden üretim kısıtı gelir ve türbin durdurulur. Bu bir arıza değildir. Alarm varsa iş değişir: önce alarmı doğru okuyun. |
| 7 | 37,55–41,84 | Yön değişimi: rüzgâr çizgileri söner (rüzgâr yok). Üstten görünüş (plan) şeması: kule dairesi, üstünde nasel dikdörtgeni yavaşça döner (yaw); rotor kanatları sabit. 39,5 sn'de rotorun üstüne "✗ ROTOR" ve nasele "✓ NASEL" etiketi; dönüş oku **[amber]**. | Rüzgâr yok · dönen: NASEL (makine dairesi) · rotor değil | Tersi de olur: rüzgâr yok, ama rotor değil, tepedeki makine dairesi dönüyor. |
| 8 | 41,84–51,81 | Kule kesiti: nasel altından inen güç kabloları, nasel döndükçe sarmal biçimde burulur (çizgi sayısı artar). Köşede tur sayacı **göstergesi** (rakamsız, yalnız dolan bir yay) 46,9 sn'de dolar **[amber]**. 48,0 sn'de nasel ters yöne döner, kablolar açılır. | KABLO AÇMA · kontrol sistemi turları sayar · eşikte: ters yöne döner · rüzgâr olsun olmasın | Kule içindeki güç kabloları, makine dairesiyle birlikte döner ve burularak dolanır. Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın, kabloları açmak için ters yöne döner. |
| 9 | 51,81–60,43 | Canlı rüzgâr sayfasının sadeleştirilmiş çizimi (ekran görüntüsü değil): sayfadaki gibi rüzgâr hızı zaman grafiği + 3 ve 25 m/s kesik çizgileri, yanında "N90/2500 · – kW" kutusu (sayfada kesik çizgiler güç eğrisinde değil, rüzgâr zaman grafiğindedir; güç eğrisi sayfada tablo ve anlık kW olarak geçer). 54,1 sn'de adres satırı maskeyle açılır. 57,2 sn'de "The Turbine Tech" ve imza. Son söz CTA (MOTION B). Amber yok. | sonersoylu.com/ruzgar · The Turbine Tech · Soner Soylu — Rüzgâr Türbini Saha Servis Teknisyeni · *Sıradaki soru için takip et* | Güç eğrisini canlı rüzgârla görmek için, Soner Soylu nokta kom sitesinde rüzgâr sayfası. Dı Törbayn Tek. Sıradaki soru için. Takip et. |

Güvenli alan (MOTION B): üst 220 px'te önemli yazı yok, alt 384 px ve sağ 160 px boş; panel yazıları %20–55 bandında.
Geçişler kesme ya da 0,4 sn maske. Hareket power3/expo out 0,5–0,8 sn. Rotor ve nasel sakin döner. Doku: ızgara %4, gren %5.

### Beat başına ölçülmüş süreler (ffprobe toplamı 60,43 sn, onay sonrası)

| # | Sahne aralığı | Sahne süresi | Konuşma başı–sonu | Konuşma süresi | Whisper geri yazımı (son dosya, ±0,3 sn dolgulu, K-005/K-013) |
|---|---|---|---|---|---|
| 1 | 0,00–4,12 | 4,12 | 0,05–3,99 | 3,94 | Rüzgar esiyor, türbin duruyor. Arızalı mı? Çoğu zaman hayır. |
| 2 | 4,12–9,60 | 5,48 | 4,24–9,47 | 5,23 | Rüzgar zayıfsa üretim olmaz. Örneğin bu modelde saniyede 3 metrenin altında türbin durur. |
| 3 | 9,60–15,84 | 6,24 | 9,72–15,71 | 5,99 | Çok sert rüzgarda da durur. Saniyede 25 metrenin üstünde emniyet için kanatlar bayrak konumuna alınır. |
| 4 | 15,84–20,86 | 5,02 | 15,96–20,73 | 4,77 | Kule dibinde makine niye durdu sorusunun cevabı çoğu zaman arıza değil, bu erinin bir ucudur. |
| 5 | 20,86–27,27 | 6,41 | 20,98–27,14 | 6,16 | Planlı bakımda da türbin durdurulur. Şalter açılır, kilitlenir ve etiketlenir. Gerekiyorsa rotor kilidi de takılır |
| 6 | 27,27–37,55 | 10,28 | 27,39–37,43 | 10,04 | Bazen rüzgarda makinede hazırdır ama şebeke işletmecisinden üretim kısıtı gelir ve türbin durdurulur. Bu bir arıza değildir. Alarm varsa iş değişir. Önce alarmı doğru okuyun. |
| 7 | 37,55–41,84 | 4,29 | 37,68–41,72 | 4,04 | Tersi de olur. Rüzgar yok ama rotor değil tepedeki makine dairesi dönüyor. |
| 8 | 41,84–51,81 | 9,97 | 41,97–51,69 | 9,72 | Kule içindeki güç kabloları makine dairesiyle birlikte döner ve burularak dolanır. Belirli bir tur sayısından sonra türbin, rüzgar olsun olmasın kabloları açmak için ters yöne döner. |
| 9 | 51,81–60,43 | 8,62 | 51,94–59,93 | 7,99 | Güç eğrisini canlı rüzgarla görmek için sonersoylu.com sitesinde rüzgar sayfası The Turbine Tech. Sıradaki soru için takip et. |

Kalan farklar yalnız yazım: B4 "erinin" = "eğrinin" (ğ uzatması, iki tanıma modelinde de aynı; doğal okunuş), B6 "rüzgarda makinede" = "rüzgâr da makine de" (ses aynı), B9 site ve kanal adı.
Seçim: B3, B5, B9 `aday.py` ile iki ayrı dolguda (0,3 / 0,5 sn) kelime kelime eşleşen adaylardan; diğerleri `anlatim.py` (5 aday, Whisper puanı). Son karar tam dosyada `dogrula.py` ile verildi.

## 3 · Tam anlatım metni

> Rüzgâr esiyor, türbin duruyor. Arızalı mı? Çoğu zaman, hayır.
> Rüzgâr zayıfsa üretim olmaz. Örneğin bu modelde, saniyede üç metrenin altında türbin durur.
> Çok sert rüzgârda da durur. Saniyede yirmi beş metrenin üstünde, emniyet için kanatlar bayrak konumuna alınır.
> Kule dibinde makine niye durdu sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur.
> Planlı bakımda da türbin durdurulur. Şalter açılır, kilitlenir ve etiketlenir. Gerekiyorsa rotor kilidi de takılır.
> Bazen rüzgâr da makine de hazırdır, ama şebeke işletmecisinden üretim kısıtı gelir ve türbin durdurulur. Bu bir arıza değildir. Alarm varsa iş değişir: önce alarmı doğru okuyun.
> Tersi de olur: rüzgâr yok, ama rotor değil, tepedeki makine dairesi dönüyor.
> Kule içindeki güç kabloları, makine dairesiyle birlikte döner ve burularak dolanır. Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın, kabloları açmak için ters yöne döner.
> Güç eğrisini canlı rüzgârla görmek için, Soner Soylu nokta kom sitesinde rüzgâr sayfası. Dı Törbayn Tek. Sıradaki soru için. Takip et.

Telaffuz kararları (K-005, K-011; ayrıntı `metin.py` başında):
- **"nasel" → "makine dairesi"**: Piper "nasel"i 10/10 geçişte "naser" okudu (Whisper ve harf düzeyli CTC modeli ikisi de). Sözlükteki aynen karşılık: "Nasel ya da makine dairesi" (`sozluk/`). Ekranda NASEL yazar.
- **"burulur" → "burularak dolanır"**: tek başına "bululur/vurulur" duyuldu; "burularak dolanır" iki modelde de doğru.
- **"bayrağa alınır" → "bayrak konumuna alınır"**: "bayrağı" duyuldu (9/10). Aynı ifade `egitim/turbin-nasil-calisir/`: "kanadı bayrak konumuna (90°) alarak". B3 sonundaki "ve türbin durur" çıktı (sonda "tübin" duyuluyordu; ilk cümle zaten "durur" diyor).
- **B4 virgül**: "cevabı, çoğu zaman" virgülde "şov zaman" (5/5) duyuldu; sayfadaki hâli zaten virgülsüz.
- **CTA**: "için takip et" 5/5 "takip let" duyuldu → "için. Takip et." (seste kısa duraklama; ekranda ve altyazıda "Sıradaki soru için takip et").
- "Türbin" hiçbir cümlenin başında değil (K-011). "sonersoylu.com" → "Soner Soylu nokta kom", "The Turbine Tech" → "Dı Törbayn Tek". Sayılar yazıyla.

## 4 · Rakam ve ifade doğrulama listesi (K-031, K-032)

**Rakamlar (4 kalem; anlatımda 2: "üç", "yirmi beş")**

| Rakam (videoda) | Nerede | Kaynak (aynen) | Durum |
|---|---|---|---|
| 3 m/s (altında durur / devreye giriş 3,0 m/s) | B2 anlatım + ekran, B9 kesik çizgi | `n90/`: "3 m/s altında durur"; künye "Devreye giriş 3,0 m/s"; `n90/n90.js`: `['Devreye giriş rüzgârı', '3,0 m/s']`; araştırma: wind-turbine-models.com N90/2500 **3,0 m/s**; `egitim/turbin-nasil-calisir/`: "Kesme altı (v < 3 m/s): rotor dönmez, dönse bile kendi kayıplarını karşılayamaz." | uyuyor; "örneğin bu modelde" deniyor |
| 25 m/s (kesme) | B3 anlatım + ekran, B9 kesik çizgi | `n90/`: "25 m/s üstünde emniyet için kanatlar bayrağa alınır ve türbin durur."; künye "Kesme rüzgârı 25,0 m/s"; araştırma: **25,0 m/s** (aynı kaynak); `egitim/turbin-nasil-calisir/`: "Kesme üstü (v > 25 m/s): yükler tehlikeli seviyeye çıkar, türbin kendini durdurur." | uyuyor; ekranda "değerler modele göre değişir" |
| Nordex N90/2500 (model adı) | B2 yalnız ekran | `n90/`: "Nordex N90/2500 · 2,5 MW" | uyuyor; yalnız yazı, logo yok |
| Güç eğrisi verisi (0–2.500 kW; 3→0, 4→65, 5→175, 6→340, 7→570, 8→870, 9→1.230, 10→1.620, 11→2.000, 12→2.290, 13→2.450, 13,5…25→2.500 kW) | B2–B4 grafik (eksen etiketi yalnız 0, 3, 25 m/s ve 2.500 kW) | `ruzgar/` tablosu ve `ruzgar/index.html` `PC90` dizisi (13,5 m/s'te 2.500; çizim bu diziden), "N90 eğrisi üreticinin yayımladığı eğridir."; `n90/`: "13,5 m/s'te nominal güce ulaşır" | uyuyor; 25 m/s'ten sonra eğri sıfıra iner (kesme) |

Kullanılmayan rakamlar (bilerek dışarıda): Onedio'nun km/sa değerleri (kaynaksız, araştırma notu), 13,5 m/s nominal (anlatım yükü), kablo açma tur sayısı (**doğrulanmadı**, verilmedi), Türkiye'ye özel kısıt mekanizması/kurum adı (**doğrulanmadı**, verilmedi). K-030: güç-küp ilişkisi anlatılmıyor.

**İfadeler**

| Videodaki ifade | Beat | Kaynak (aynen) | Durum |
|---|---|---|---|
| "kule dibinde “makine niye durdu” sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur." | B4 anlatım + ekran alıntısı | `egitim/turbin-nasil-calisir/`: "Bu dört bölgeyi bilmek sahada işe yarar: kule dibinde “makine niye durdu” sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur." | aynen (ikinci yarı) |
| LOTO adımları: şalter açılır, kilitlenir, etiketlenir | B5 | `egitim/guvenlik/`: "LOTO (…) elektriksel enerjiyi kontrol eder: şalter açılır, fiziksel bir kilitle kilitlenir, üzerine kimin kilitlediğini gösteren etiket asılır." | üç adım da var ("şalter açılır" ilk taslakta eksikti, eklendi) |
| "Gerekiyorsa rotor kilidi de takılır." | B5 | `egitim/guvenlik/` kontrol listesi: "Gerekiyorsa rotor kilidi takıldı mı?"; "Göbeğe girmek ya da sürücü hattında çalışmak için ikisi de gerekir — biri diğerinin yerini tutmaz." | "gerekiyorsa" korunuyor; "rotor hep kilitlidir" genellemesi yok |
| Planlı bakımda durdurma | B5 | `ariza/` "Güç kısıtlaması veya planlı duruş" → "Planlı bakım penceresi" | uyuyor |
| "şebeke işletmecisinden üretim kısıtı" · "Bu bir arıza değildir." · "ALARM YOK AMA DURUYOR" | B6 | `ariza/`: "Hayır, alarm yok ama duruyor" → "Şebeke işletmecisinden gelen üretim kısıtı" … "Bu bir arıza değildir; duruş süresi raporunda ayrı kategoriye yazılmalıdır." | aynen; kurum adı ve rakam yok |
| "Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın, kabloları açmak için ters yöne döner." | B8 | `egitim/turbin-nasil-calisir/`: "kule içindeki güç kabloları naselle birlikte burulur. Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın kabloları açmak için ters yöne döner." | 2. cümle aynen; 1. cümle telaffuz için "makine dairesiyle birlikte döner ve burularak dolanır" |
| "kontrol sistemi turları sayar" | B8 yalnız ekran | araştırma: windmillstech.com "the controller counts the revolutions… rotate the nacelle to untwist the cables" | uyuyor; tur sayısı yok |
| "rotor değil, makine dairesi dönüyor" | B7 | `egitim/turbin-nasil-calisir/` sınav 04: "Türbin rüzgâr olmadığı hâlde ters yöne dönüyorsa en olası sebep" → "Kablo açma (untwist) çevrimi"; `sozluk/`: "Nasel ya da makine dairesi" | uyuyor |
| "emniyet için … bayrak konumuna alınır" | B3 | `n90/`: "emniyet için kanatlar bayrağa alınır"; `egitim/turbin-nasil-calisir/`: "kanadı bayrak konumuna (90°) alarak rotoru durdurmak" | anlam aynı, telaffuz için ikinci ifade |
| CTA hedefi `sonersoylu.com/ruzgar` | B9 | `ruzgar/`: "Şu anda sahada rüzgâr ne yapıyor"; N90 kutusu "Üreticinin yayımladığı güç eğrisi" ile anlık kW; rüzgâr grafiğinde "kırmızı kesik çizgiler … (3 ve 25 m/s)" | sayfa var; ekranda adres |

Üretici logosu yok; "Nordex N90/2500" yalnız düz yazı (saha vakasındaki "Vestas V126" ile aynı kural). Alarm kodu yok.

## 5 · Soner'e açık noktalar (karara bağlandı, 2026-10-03: 1 ekle · 2 model adı düz yazı kalır, logo yok · 3 anlatımda "makine dairesi", ekranda NASEL)

1. **Arıza olan durum:** Video "çoğu zaman arıza değil" diyor ama alarmlı duruşu hiç anmıyor. 6. beatin sonuna tek cümle ekleyelim mi: "Alarm varsa iş değişir: önce alarmı doğru okuyun." (İkinci yarısı `ariza/` sayfasındaki "Önce alarmı doğru okuyun" başlığı; "Alarm varsa iş değişir" yeni ifade. Süre tahmini ≈2,5 sn, ölçülmedi; toplam ≈60 sn olur. Evet denirse ses üretilip yeniden ölçülür.)
2. **Model adı:** 2. beatte ekranda "Nordex N90/2500" yazsın mı, yoksa yalnız "örneğin bu modelde" ve model adı yazısız mı kalsın?
3. **"Nasel" kelimesi:** Anlatımda "makine dairesi" diyoruz (Piper "nasel"i "naser" okuyor), ekranda NASEL yazıyor. Uygun mu? (Sözlükte de: "Sahada Türkçesi pek kullanılmaz, herkes 'nasel' der.")

## 6 · Onaydan sonra üretim notları

- Görüntü zamanları `zaman.json` + `kelime.json`'dan (K-006). Ses bitti; onayda değişiklik olursa yalnız ilgili beat `aday.py N` ile yeniden üretilir, sonra `anlatim.py` (önbellekten dizer) → `normalize.sh` → `dogrula.py`.
- K-001 (bayrak konumu kanat kesiti ve nasel dönüşü kendi dayanağında), K-012 `tasma_kontrol.mjs`, K-003 her beatten kare, K-008 `hyperframes@0.8.106`, K-007 ayrık render (57 sn, 2 dk altı olabilir; yine de ayrık başlatılır).
- Teslim: `ajans/cikti/video/ruzgar-esiyor/` altına build betiği + .srt; MP4 (H.264+AAC, 1080×1920) `/home/claude/video-edit/videos/ruzgar-esiyor/` altında, depoya girmez.

## 7 · Üretim notu (2026-10-03)

- **Teslim:** `/home/claude/video-edit/videos/ruzgar-esiyor/Ruzgar-Esiyor-Turbin-Duruyor-Short.mp4` (depoda değil) · .srt depoda: `ajans/cikti/video/ruzgar-esiyor/Ruzgar-Esiyor-Turbin-Duruyor-Short.srt` · kareler: `/home/claude/video-edit/videos/ruzgar-esiyor/kareler/`
- **B6 eki:** uzun B6'yı (≈10 sn) baştan üretmek 6 adayda da tam eşleşme vermedi (Whisper sonda tekrar uyduruyor, "Alan varsa", "tübin"). Doğrulanmış eski B6 klibi korunup 0,35 sn ara + yeni cümlenin seçilmiş adayı eklendi (`ekle.py`). Yeni cümle adaylarında Whisper 5/5 sona "Alarmı doğru okuyun" tekrarını uydurdu; harf düzeyli CTC ikinci hakem yapıldı, CTC'si birebir ("alarm varsa iş değişir önce alarmı doğru okuyun") aday seçildi.
- **Ses:** 60,43 sn, −15,1 LUFS, tepe −4,5 dBFS. Tam dosyada dolgulu geri yazım 9/9 beat (fark yalnız yazım: "erinin", "rüzgarda makinede", site/kanal adı). Kelime hizalaması 154/154 çapa.
- **Görüntü:** ekrandaki "13,5" ekseni Türkçe ondalıkla; B9 rüzgâr çizgisi "TEMSİLÎ ÇİZİM" etiketli (gerçek veri değil). Amber her sahnede tek öğe; B4 ve B9'da amber yok.
- **MP4:** 1080×1920, 30 fps, H.264 High + AAC LC 48 kHz stereo, 60,43 sn, 7,3 MB (K-009 sıkıştırma gerekmedi). Son MP4'ün sesinden beat bazında dolgulu Whisper dökümü: 9/9 beat metne uyuyor (aynı yazım farkları).
- **İkinci render:** ilk MP4'ün kanca karesinde zemin şeridi x≈1010 px'te keskin kenarla bitiyordu; şerit tam genişliğe uzatıldı, yeniden render alındı.
- **Kontroller:** K-012 `tasma_kontrol.mjs` 0,25–60,25 sn (121 an) → 0 bulgu (aracın varsayılan zaman listesi 52 sn'de bittiği için anlar elle verildi). K-003 her beatten kare tam boyutta incelendi; düzeltilenler: B2 etiketi eğriyi kesiyordu, B3 kanat kesiti kart dışına taşıyordu, B8 sayaç yayı yanlış merkezdeydi ve kablolar kartın altına giriyordu, B3 alt yazısı kart kenarına 17 px idi.

