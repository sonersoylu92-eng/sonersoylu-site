# Denetim · Plan · Short "Rüzgâr esiyor, türbin duruyor. Arızalı mı?" (PANO #7)

- **Tarih:** 2026-10-03 · **Denetçi:** denetci
- **Denetlenen:** `ajans/cikti/plan-ruzgar-esiyor-2026-10-03.md`, `ajans/cikti/video/ruzgar-esiyor/zaman.json`, `/home/claude/video-edit/videos/ruzgar-esiyor/anlatim.wav`, `.../ses/kelime.json`, `.../ses/dogrula.json`
- **Kapsam:** yalnız plan + ölçülmüş ses (render yok; kare kontrolü K-003/K-012 render aşamasında yapılacak)

## Sonuç: GEÇTİ

Anlatımdaki her rakam ve ifade kaynak sayfayla örtüşüyor. Güvenlik koşulu ("gerekiyorsa") korunmuş. Ses süresi, beat aralıkları ve geri yazım planla tutarlı. Planın kendisinde 4 kaynak/yerleşim hatası buldum, hepsi tartışmasız olduğu için planda düzelttim (aşağıda "düzeltildi"). Anlatım metnine dokunmadım. Ses yeniden üretilmesi gerekmiyor.

## 1 · Rakam ve alıntılar (K-031, K-032, K-030)

| Kalem | Plan | Kaynak (açıp kıyasladım) | Sonuç |
|---|---|---|---|
| 3 m/s | B2 "Örneğin bu modelde, saniyede üç metrenin altında türbin durur." | `n90/index.html:221` "3 m/s altında durur"; `n90/index.html:291` "Devreye giriş 3,0 m/s"; `n90/n90.js:858` `['Devreye giriş rüzgârı', '3,0 m/s']`; araştırma Konu 1 madde 1 "3,0 m/s" | uyuyor; "örneğin bu modelde" niteleyicisi var |
| 25 m/s | B3 "Saniyede yirmi beş metrenin üstünde, emniyet için kanatlar bayrak konumuna alınır." | `n90/index.html:221` "25 m/s üstünde emniyet için kanatlar bayrağa alınır ve türbin durur."; `n90/n90.js:858` "25,0 m/s" | uyuyor. Gözlem: B3 anlatımında model niteleyicisi tekrar edilmiyor; B2'deki "bu modelde" bağlamı ve B3 ekranındaki "değerler modele göre değişir" yeterli. Değişiklik gerekmez. |
| Güç eğrisi verisi | B2–B4 grafik | `ruzgar/index.html:406` `PC90` dizisi ve tablo (`ruzgar/index.html:333` civarı) | **düzeltildi:** plan "14…25→2.500" diyordu; kaynak dizide 13,5 m/s'te 2.500 kW (`n90/`: "13,5 m/s'te nominal güce ulaşır"). Çizim `PC90`'dan yapılmalı. |
| B4 alıntı | "kule dibinde “makine niye durdu” sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur." — Eğitim, Bölüm 03 | `egitim/turbin-nasil-calisir/index.html:179` aynı kelimeler; sayfa başlığı "03. Rüzgârdan şebekeye", "Bölüm 03 / 08" | aynen. Ekran kartında alıntı küçük harfle başladığı için başa "…" koymak önerilir (tasarım kararı, değiştirmedim). |
| "bayrak konumuna" | B3 | `egitim/turbin-nasil-calisir/index.html:179` "kanadı bayrak konumuna (90°) alarak rotoru durdurmak" | uyuyor |
| Kablo açma | B8 | `egitim/turbin-nasil-calisir/index.html:179` "kule içindeki güç kabloları naselle birlikte burulur. Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın kabloları açmak için ters yöne döner." | 2. cümle aynen; 1. cümle telaffuz gereği yeniden kurulmuş, anlam aynı. Tur sayısı yok (doğru, doğrulanmadı). |
| "kontrol sistemi turları sayar" | B8 ekran | araştırma Konu 1 madde 5 (windmillstech.com) | uyuyor |
| Nasel = makine dairesi | B7, B8 | `sozluk/index.html` "Nasel ya da makine dairesi." | uyuyor |
| K-030 | — | Anlatımda ve ekranda güç-rüzgâr ilişkisi (küp, oran) yok; yalnız yayımlanmış eğri çiziliyor | kural tetiklenmiyor |

## 2 · Güvenlik (K-031)

- LOTO (B5): `egitim/guvenlik/index.html` "şalter açılır, fiziksel bir kilitle kilitlenir, üzerine kimin kilitlediğini gösteren etiket asılır." Plandaki üç adım (açılır → kilitlenir → etiketlenir) eksiksiz.
- Rotor kilidi (B5): kaynak kontrol listesi "Gerekiyorsa rotor kilidi takıldı mı?" Anlatım "Gerekiyorsa rotor kilidi de takılır." Koşul düşmemiş; ekranda "GEREKİYORSA" amber vurguyla. "Rotor hep kilitlidir" genellemesi yok (araştırma madde 3 uyarısına uygun).
- Ekrandaki "biri diğerinin yerini tutmaz" kaynak cümlenin ikinci yarısı, kelimeler aynen. Düşen koşul yok.
- İnsan figürü / canlı panele uzanan el yok.

## 3 · Logo, alarm kodu, uydurma, kesin ifadeler

- Üretici logosu yok; alarm kodu yok. "Nordex N90/2500" yalnız düz yazı ve **§5 açık nokta 2** olarak Soner'e soruluyor. Not: "hayır" denirse B2 künyesi ve B9'daki "N90/2500" kutusu birlikte kalkmalı.
- Uydurma vaka/rakam yok; birinci şahıs anlatım yok.
- "Bu bir arıza değildir." (B6): `ariza/index.html` "Güç kısıtlaması veya planlı duruş" düğümünde "Bu bir arıza değildir; duruş süresi raporunda ayrı kategoriye yazılmalıdır." Kısıt ile planlı bakım bu düğümde birlikte; kaynağa dayanıyor. "Şebeke işletmecisinden gelen üretim kısıtı" ve "Hayır, alarm yok ama duruyor" aynen.
- "Çoğu zaman, hayır." (B1): B4 alıntısındaki "çoğu zaman arıza değil"e dayanıyor; aşırı genelleme değil.

## 4 · Ölçülen süreler ve ses (K-005, K-006, K-013)

- `ffprobe anlatim.wav`: **57,270 sn**, pcm_s16le, 48 kHz, 2 kanal. Plan: 57,27 sn. Uyuyor. `video-edit/.../anlatim.wav` ile `ses/anlatim.wav` bayt bayt aynı; depodaki `zaman.json` ile `ses/zaman.json` aynı.
- Yükseklik: I = −15,1 LUFS, tepe −4,5 dBFS (ebur128). Plan ile aynı.
- Konuşma toplamı Σ(ses_son − ses_bas) = 54,72 sn. Plan ile aynı. Beat aralıkları plan tablosuyla birebir; her sahne konuşmanın 0,12 sn önünde başlıyor ve 0,13 sn arkasında bitiyor (son sahnede 0,50 sn).
- Sessizlik tespiti (−40 dB, 0,18 sn) beat sınırlarıyla örtüşüyor (ör. 3,87–4,26 / 9,29–9,75 / 48,39–48,80); son konuşma 56,72 sn'de bitiyor.
- **Bağımsız geri yazım:** sherpa-onnx Whisper turbo ile, `dogrula.py`'den farklı olarak **sahne sınırlarından** kesip (0,3/0,5 sn dolgu) yazdırdım. 9 beatin 9'u metinle aynı. Fark yalnız yazım: B4 "erinin" (= eğrinin), B6 "rüzgarda makinede", B9 "sonersoylu.com / The Turbine Tech". Sahne sınırından komşu beate ses taşması yok.
- Plan içi senkron noktaları `kelime.json` ile tutarlı: "Arızalı" 2,13; "3" 7,53; "25" 11,82; "bayrak" 14,55; "açılır" 23,27 / "kilitlenir" 23,67 / "etiketlenir" 24,27; "Gereki…" 25,17; "kısıtı" 31,06; "Bu bir" 33,10; "tur" 43,67; "sonersoylu" 50,98; "The" 54,06.
- Öneri (zorunlu değil): B7'de "✓ NASEL" etiketi "makine dairesi" sözüne (37,5 sn) bağlanabilir, plan 36,4 sn'de veriyor ("rotor" 36,35). B8'de nasel 44,9 sn'de ("türbin,") ters dönmeye başlıyor; "ters yöne" sözü 47,53 sn'de. İkisi de kabul edilebilir.

## 5 · Bulgular ve yapılanlar

| # | Ciddiyet | Yer | Bulgu | Kaynak | Öneri / durum |
|---|---|---|---|---|---|
| 1 | orta | plan §2 B9 görsel (satır 32) ve §4 CTA satırı (satır 100) | B9 "güç eğrisi + 3 ve 25 m/s kesik çizgileri" diyordu. Canlı sayfada kesik çizgiler güç eğrisinde değil, rüzgâr hızı zaman grafiğinde; güç eğrisi tablo ve anlık kW kutusu olarak geçiyor. Sadeleştirilmiş çizim sayfayı yanlış temsil ederdi. | `ruzgar/index.html:308` "Çizgi göbek yüksekliğindeki rüzgâr hızı … kırmızı kesik çizgiler kesme rüzgârlarını (3 ve 25 m/s) gösterir." | **düzeltildi:** görsel "rüzgâr hızı zaman grafiği + 3/25 kesik çizgi + N90 kW kutusu" oldu. Anlatım ("güç eğrisini canlı rüzgârla görmek için") doğru kalıyor: sayfa yayımlanmış eğriyi canlı rüzgâra uyguluyor. |
| 2 | orta (K-031) | plan §5 açık nokta 1 (satır 106) | Önerilen cümle "Alarm varsa iş değişir: önce alarmı doğru okuyun." tümüyle "`ariza/` sayfasındaki ifade" diye sunuluyordu. Sayfada yalnız "Önce alarmı doğru okuyun" başlığı var (o da "Emin değilim" dalında); ilk yarı yeni. Süre ≈2,5 sn ölçülmemişti. | `ariza/index.html` "Emin değilim → Önce alarmı doğru okuyun" | **düzeltildi:** kaynak payı ve yeni ifade ayrıldı; süre "tahmini, ölçülmedi" diye işaretlendi. |
| 3 | düşük (güvenli alan) | plan §2 B2 (satır 25) | "Sağ altta küçük model künyesi" ifadesi, Short'ta boş kalması gereken alt %20 / sağ 160 px bölgesine okunabiliyordu. | denetçi tanımı, plan satır 34 | **düzeltildi:** "panelin sağ altı, x ≤ 920, y ≤ 1536 px" |
| 4 | düşük | plan §4 güç eğrisi satırı (satır 83) | "14…25→2.500 kW" yazıyordu; kaynak dizide 13,5 m/s'te 2.500. | `ruzgar/index.html:406`, `n90/index.html:221` | **düzeltildi:** "13,5…25→2.500", çizim kaynağı `PC90` |
| 5 | düşük (yalnız rapor) | plan §3 "Tam anlatım metni" son satır (satır 64) | §3 "Sıradaki soru için takip et." diyor; sese giden metin (`zaman.json`, `metin.py:22`, plan §2 B9) "Sıradaki soru için. Takip et." Telaffuz notunda (satır 71) gerekçesi var ama "tam anlatım metni" sesle aynı olmalı. | `zaman.json` beat 9 `metin` | Anlatım metnine dokunmadım. Yapımcı §3'ü sese giden metinle aynı yapsın; ekran/altyazı biçimi zaten satır 71'de yazılı. Ses değişmez. |
| 6 | bilgi | plan §5 açık nokta 3 | Soner'in kararına yardımcı bağlam eksikti. | `sozluk/`: "Sahada Türkçesi pek kullanılmaz, herkes 'nasel' der." | **eklendi** (tek parantez) |
| 7 | bilgi (site, bu planın dışı) | `ruzgar/index.html:308` | Sayfa 3 m/s'yi de "kesme rüzgârı" diye adlandırıyor; `n90/` ise "devreye giriş". Videoyu etkilemiyor (video "kesme" kelimesini 3 m/s için kullanmıyor). | — | site-bakimci'ye not: "devreye giriş (3) ve kesme (25) rüzgârlarını" |

## 6 · K-040 uygunluğu

- Plan dosyası 114 satır, 4 tablo: çalışma belgesi olarak doğru, ama Soner'e **tek mesaj** olarak tamamı gitmemeli. Öneri: Soner'e giden mesaj = başlık + süre (57 sn) + §2 beat tablosunun "Zaman / Ekranda / Anlatım" sütunları (9 satır) + §5'teki 3 soru. Doğrulama listesi (§4) ve telaffuz notları dosyada kalır, bağlantıyla verilir.
- Üç açık nokta tek cümleyle cevaplanabilir: 1) "Ekle / ekleme", 2) "Model adı yazsın / yazmasın", 3) "Uygun / değil". Soner'den komut ya da dosya istenmiyor (K-041). Uygun.
- PANO #7 durumu "bekliyor · Beat sheet Soner'e sunuldu" ile plan başlığındaki "onay-bekliyor" tutarlı.

## Ders adayları

1. **Hedef sayfanın görseli de kaynakla kıyaslanır.** CTA'da hedef sayfayı "sadeleştirilmiş çizim" olarak göstermek, sayfada olmayan bir grafik (kesik çizgili güç eğrisi) uydurabilir. Öneri: K-031'e "videoda gösterilen sayfa çizimi, sayfadaki gerçek grafikle aynı türde olmalı (eksenler, çizgiler)" eki.
2. **Açık noktadaki öneri cümleleri de K-031'e tabidir.** Soner'e sorulan "şunu ekleyelim mi" cümlesi kaynaktan geliyormuş gibi sunulursa onay yanlış bilgiyle verilir. Öneri: açık noktada kaynaktan gelen ve yeni yazılan kısım ayrı gösterilir; ölçülmemiş süre "tahmini" diye yazılır.
3. **Konum tarifinde "sağ alt" yasak kelime.** Short'ta "sağ alt" tam olarak güvenli alan dışı. Planlarda konum, ekran köşesine göre değil piksel sınırıyla ya da "panelin içinde" diye yazılsın.
