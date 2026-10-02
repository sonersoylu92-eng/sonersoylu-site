# Araştırma — Sonraki 4 video konusu (PANO #3)

Tarih: 2026-10-02 · Ajan: arastirmaci · Kanal: The Turbine Tech (Türkçe)

Tekrar edilmeyenler: "Türbin nasıl elektrik üretir" (Short), "Kanat ucunun hikâyesi" (Short), "Türbinin içine yolculuk: 15 durak" (uzun).
Kurallar: üretici alarm kodu ve logosu yok; doğrulanmamış rakam yayına gitmez (H4).

## Yöntem ve sınırlar (önce okuyun)
- Talep kanıtı Türkçe web aramasıyla toplandı: haber siteleri ve SEO blogları bir soruya ayrı yazı açıyorsa, soru aranıyor demektir; forumlarda sorulan sorular da doğrudan talep kanıtıdır.
- **YouTube video sayfaları okunamadı:** `youtube.com/watch` sayfalarına yapılan dört WebFetch isteğinin hepsi HTTP 429 (hız sınırı) ile döndü. Bu yüzden rakip videoların **izlenme sayısı ve yükleme tarihi doğrulanmadı**. Rakip listesi, arama motorunun `site:youtube.com` dizininden çıkarıldı. Bu, YouTube'un kendi aramasıyla aynı şey değildir. Rakip boşluğu iddiaları bu yüzden "dizinde görünmüyor" düzeyindedir.
- Arama hacmi (aylık arama sayısı) ölçülmedi; elimizde anahtar kelime aracı yok. "Talep" = sorunun Türkçe web'de tekrar tekrar sorulup yazılmış olması.

---

## Konu 1 — "Rüzgâr esiyor, türbin duruyor. Arızalı mı?"

- **Biçim:** Short, 60–75 sn
- **Güven:** yüksek
- **Kanca:** Rüzgâr esiyor ama türbin duruyor; rüzgâr yok ama nasel dönüyor. İkisi de çoğu zaman arıza değil, makinenin kendi kararı.

**Talep kanıtı**
- Onedio "Bazı Rüzgar Türbinleri Dururken Bazıları Neden Dönmeye Devam Eder?" (29 Ocak 2025), yaşam editörünün genel derlemesi, saha anlatımı değil: https://onedio.com/haber/bazi-ruzgar-turbinleri-dururken-bazilari-neden-donmeye-devam-eder-1272682
- DonanımHaber forumu "Rüzgar olmadığı halde bu rüzgar türbinleri nasıl dönüyor?" (6 Kasım 2020). Konu açan, cevapsız kalınca türbinlerin **jet motoruyla döndürüldüğü** komplo teorisine kayıyor. Doğru sebep (kablo açma, yaw) kimse tarafından açıklanmamış: https://forum.donanimhaber.com/ruzgar-olmadigi-halde-bu-ruzgar-turbinleri-nasil-donuyor--146339135
- KontrolKalemi forumu "Rüzgar türbini kurduk lâkin dönmüyor": https://www.kontrolkalemi.com/forum/konu/r%C3%BCzgar-t%C3%BCrbini-kurduk-l%C3%A2kin-d%C3%B6nm%C3%BCyor.110223/ (küçük türbin bağlamında; yine de "neden dönmüyor" sorgusunun var olduğunu gösteriyor)

**Rakip boşluğu**
- `site:youtube.com` dizininde bu soruya ayrılmış Türkçe bir video görünmedi. Çıkan sonuçlar genel "nasıl çalışır" videoları (ör. https://www.youtube.com/watch?v=2BrD-JwhHo4, https://www.youtube.com/watch?v=Gk6R-1A5WFk). İzlenme ve tarih doğrulanmadı (429).
- Türkçe metin kaynaklarının hiçbiri kule dibinden anlatmıyor. Forumda boşluğu yanlış bilgi doldurmuş. "Sahadan gelen güvenilir kaynak" misyonuna birebir uyuyor.

**İçerik iskeleti ve rakamlar**
1. Rüzgâr az: devreye girme hızının altında rotor üretim yapmaz. Nordex N90/2500 için **3,0 m/s**: https://en.wind-turbine-models.com/turbines/734-nordex-n90-2500 (sitedeki `n90/n90.js` ile aynı değer)
2. Rüzgâr çok: kesme hızının üstünde kanatlar bayrağa alınır. N90/2500 için **25,0 m/s** (aynı kaynak). Değerler modele göre değişir; videoda "örneğin bu modelde" diye verilmeli. Onedio'nun km/sa değerleri (8 ve 88 km/sa) kaynaksız, kullanılmamalı.
3. Planlı bakım: türbin bakım için durdurulur; yapılacak işe göre gerektiğinde rotor kilitlenir (sitedeki eğitim, güvenlik bölümü: "LOTO ve rotor kilidinin neden ayrı iki şey olduğunu bilmek"). "Teknisyen kuledeyken rotor hep kilitlidir" diye genelleme yapılmamalı.
4. Şebeke ve dağıtım kısıtı: üretilen elektrik alınamadığında türbin durdurulabilir (Onedio yazısında da geçiyor; Türkiye'ye özel kısıt mekanizması **doğrulanmadı**, rakam ve kurum adı vermeden anlatılmalı).
5. "Rüzgâr yok ama dönüyor" = kablo açma: nasel tek yönde çok dönünce kule içindeki güç kabloları burulur; kontrolcü tur sayar, eşik aşılınca türbini durdurup naseli ters çevirir. Kaynak: https://windmillstech.com/wind-turbine-yaw-controls-part-1/ ("the controller counts the revolutions… rotate the nacelle to untwist the cables"). Kaç turda açıldığı **doğrulanmadı**; tur sayısı verilmemeli. Dönen şey rotor değil **nasel**, bunu net söylemek gerekiyor.
- Kapanış (sitedeki `egitim/turbin-nasil-calisir/` metninden birebir): "Bu dört bölgeyi bilmek sahada işe yarar: kule dibinde “makine niye durdu” sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur."

**Sitedeki kaynak sayfalar**
- `egitim/turbin-nasil-calisir/`: güç eğrisinin dört bölgesi, kesme altı/üstü, kablo açma sınav sorusu
- `ruzgar/` (canlı rüzgâr): güç eğrisi gerçek tahminle; videonun sonuna yönlendirme
- `ariza/`: "durma" dalı
- `n90/`: 3 / 13,5 / 25 m/s teknik veri

---

## Konu 2 — "Rüzgâr türbini teknisyeni nasıl olunur? Haber sitelerinin yazmadığı kısım"

- **Biçim:** uzun, 5–6 dk (bölümlü, K-010 paketine uygun)
- **Güven:** yüksek
- **Kanca:** Bu soruyu Google'a yazınca çıkan yazıların hiçbirini kuleye çıkmış biri yazmamış. 2013'ten beri sahada olan biri baştan anlatıyor.

**Talep kanıtı** (aynı soruya ayrı yazı açan çok sayıda Türkçe site, talebin en güçlü göstergesi)
- Sabah (13 Aralık 2022). Genel derleme, saha anlatımı değil; **GWO'dan hiç bahsetmiyor**, kaynak göstermiyor: https://www.sabah.com.tr/yasam/ruzgar-turbini-servis-teknisyeni-nasil-olunur-ruzgar-turbini-bakim-teknisyeni-ne-is-yapar-ve-hangi-bolumden-mezun-olmak-gerekir-k1-6275911
- Son Havadis: https://www.sonhavadis.com/ruzgar-turbini-teknisyeni-nasil-olunur-maas-ve-calisma-saatleri-nasil/13222
- CT Haber: https://www.cthaber.com/haber/15795893/ruzgar-turbini-servis-teknisyeni-nasil-olunur
- Erişim Haber: https://erisimhaber.com/ruzgar-turbini-servis-teknisyeni-nasil-olunur/
- iyisimi.com.tr ("2023"): https://www.iyisimi.com.tr/ruzgar-turbini-servis-teknisyeni-nasil-olunur/
- cikmissorular.org ("2024 maaşları"): https://cikmissorular.org/ruzgar-turbini-servis-teknisyeni-nasil-olunur-maaslari-ne-kadar/
- ErkeklerSoruyor sorusu: 8 cevap, cevaplayanların hiçbiri sahada çalışan biri değil ("arkadaşımın sevgilisi bu işi yapıyor" düzeyinde): https://www.erkeklersoruyor.com/is-kariyer/ruzgar-turbini-teknisyeni-nasil-olunur-q16519985
- Maaş tarafında da talep var, ama kaynaksız rakamlarla dolu: Hürriyet galeri ("maaşları dudak uçuklatıyor"): https://www.hurriyet.com.tr/galeri-10-yilda-en-hizli-buyuyecek-meslekler-aciklandi-talep-yuzde-105-artti-maaslari-dudak-ucuklatiyor-41837106

**Rakip boşluğu**
- `site:youtube.com` dizininde Türkçe videolar haber/röportaj ("Dünyanın en zor mesleklerinden biri", https://www.youtube.com/watch?v=fFefumTZ8c0), program bölümü ("Helal Kazancın Peşinde 5. Bölüm", https://www.youtube.com/watch?v=aqdKrStBa88) ve kurumsal röportaj (GE, https://www.youtube.com/watch?v=e0AU9hT-p_Y) türünde. **Adım adım "nasıl olunur" anlatan bir teknisyen videosu dizinde görünmedi.** İzlenme ve tarih doğrulanmadı (429).
- Metin rakiplerin ortak eksikleri: GWO yok, sıra yok (önce ne, sonra ne), mülakat yok, maaşta kaynaksız rakam var.

**Önerilen bölümler** (sitedeki `nasil-olunur/` başlıklarından)
1. Bu iş kime uygun, kime değil
2. Hangi okul, lisans şart mı
3. Gereken belgeler: GWO BST, İSG eğitimi, sağlık raporu (GWO ile 6331 İSG birbirinin yerine geçmez, `gwo/` sayfasından)
4. Sıfırdan başlayana 12 aylık yol haritası
5. Özgeçmiş ve mülakat: sorulanlar ve sizin sormanız gerekenler
6. İlk yıl neye benzer, ikinci yılda mekanik mi elektrik mi
7. Maaş: "neden rakam vermiyorum" + teklifi belirleyen kaldıraçlar (`maas/` sayfası). **Maaş rakamı verilmeyecek.** Haber sitelerindeki rakamların kaynağı yok.

**Sitedeki kaynak sayfalar:** `nasil-olunur/`, `gwo/`, `maas/`, `egitim/bu-is-ne-is/`, `egitim/kariyer/`, `rehber/`

---

## Konu 3 — "GWO sertifikası 60 saniyede: sertifikasız kule kapısı açılmaz"

- **Biçim:** Short, 60–70 sn
- **Güven:** orta (talep orta düzeyde ve çoğunlukla ticari; rakamlar doğrulandı)
- **Kanca:** Kuleye çıkmak için diplomadan önce sorulan bir belge var, bir gün bile geç kalırsan baştan alıyorsun.

**Talep kanıtı**
- Türkçe aramada ilk sayfayı eğitim satan firmalar dolduruyor: Lerus https://www.lerus.com/tr/offshore-courses/gwo.html, Locus Enerji https://www.locusenerji.com.tr/2021/10/18/gwo-certificates/, Mira https://www.mira-ra.com/gwo-bst-temel-guvenlik-egitimi_28.html, OWLAQ https://owlaq.com/egitimlerimiz/gwo-temel-guvenlik-egitimleri/. Bilgilendirici tek kaynak Rüzgar Enerjisi Dergisi: https://www.ruzgarenerjisi.com.tr/gwo-egitimi-nedir-neden-onemlidir/
- "GWO sertifikası nedir nasıl alınır" aramasında ilk sonuç alakasız ("Great Place to Work"). Türkçe kaynak zayıf.

**Rakip boşluğu**
- `site:youtube.com` dizininde Türkçe olarak yalnız bir ders serisinin parçaları görünüyor ("Ders 14 - GWO Eğitimi ve KKD", https://www.youtube.com/watch?v=vT2hM_x3dOY; "Ders 24", https://www.youtube.com/watch?v=qd4Q7by7njc). Geri kalanı İngilizce ve eğitim merkezi tanıtımı. Satıcı olmayan, sahadan anlatan Türkçe Short görünmedi.
- Sitenin farkı: "sertifika satan bir siteden değil" ve "eğitimi kim öder" gerçeği.

**Rakamlar ve kaynakları** (videoda yalnız bunlar)
- BST sertifikası **2 yıl (24 ay)** geçerli: https://en.wikipedia.org/wiki/Global_Wind_Organisation, https://southwestmaritimeacademy.com/gwo-training/basic-safety-training-package/
- Süre bir gün bile geçerse tazeleme (Refresher) alınamaz, tam BST baştan alınır: https://southwestmaritimeacademy.com/gwo-training/refresher-package/
- Kara için 4 modül (yüksekte çalışma, ilk yardım, yangın farkındalığı, manuel taşıma), deniz için + Sea Survival: Wikipedia (yukarıda)
- İlk yardım modülü **1 gün** (V15, 2022'den beri; eski 2 günlük V14, 1 Nisan 2023'te kalktı): https://www.globalwindsafety.org/news/two-day-gwo-first-aid-module-to-remain-valid-until-april-1-2023
- Uyarı: bazı sağlayıcı sayfaları hâlâ ilk yardımı "2 gün" yazıyor (ör. OffTEC: https://www.offtec.de/en/trainingskatalog/safetytrainings/gwo-basic-safety-training). Sitedeki `gwo/` sayfasındaki "ilk yardım 1 gün" GWO duyurusuyla tutarlı, düzeltme gerekmiyor.
- Fiyat **verilmeyecek** (site de vermiyor; merkeze ve kura göre değişiyor).

**Sitedeki kaynak sayfalar:** `gwo/` (SSS, WINDA, BTT, kim öder), `egitim/guvenlik/`, `nasil-olunur/` (Gereken belgeler)

---

## Konu 4 — "Alarm 116 °C diyor, makine sağlıklı: arıza sensördeydi" (Sahadan vaka)

- **Biçim:** Short, 70–80 sn
- **Güven:** orta. Rakip boşluğu çok yüksek, geniş kitle talebi düşük. Bu konu izlenmeden çok **kanalın kimliği** (teşhis yapan teknisyen, bilirkişi hedefi) ve sektör içi izleyici için.
- **Kanca:** Ekran 103 °C diyor, elimdeki termometre 62 °C. Hangisine inanırsın? Jeneratörü sökmeden önce bunu bilmen gerekir.
  (Rakamlar saha notundaki eş zamanlı ölçümden: durdurulmuş jeneratörde IR 62 °C, SCADA 103 °C. 116 °C alarm anındaki değerdir; ikisini karıştırmayın.)
- **Soner'e teyit sorusu:** "Bu vakayı Short'ta birinci şahıs ağzından ('elimdeki termometre 62 °C') anlatmamız uygun mu, yani ölçümü sen mi yaptın?"

**Talep kanıtı**
- Sanayide aynı soru soruluyor ("PT100 sorunu", KontrolKalemi): https://www.kontrolkalemi.com/forum/konu/pt100-sorunu.37846/. Türkçe aramada "sensör mü, makine mi" sorusunu açıklayan kaynakların çoğu otomotiv; rüzgâr türbini bağlamında Türkçe bir şey çıkmadı.
- Rüzgâr türbini arızasını teknisyen gözünden anlatan Türkçe video dizinde yok: çıkanlar iple erişim haberi (https://www.youtube.com/watch?v=aYcFaUhXh0s), kurumsal bakım röportajı (https://www.youtube.com/watch?v=e0AU9hT-p_Y) ve genel "bakım ve onarım" (https://www.youtube.com/watch?v=iX9txjeH1IY). İzlenme ve tarih doğrulanmadı (429).

**Rakip boşluğu:** Türkçe'de "sahadan arıza vakası" formatında rakip görünmüyor. Bu bir seri başlangıcı olabilir (sitede 7 vaka hazır: `saha-notlari/`).

**Rakamlar ve kaynakları**
- Vaka değerleri (116 °C alarm eşiği aşımı; durdurulmuş makinede IR 62 °C ve SCADA 103 °C, yani 41 °C fark; beklenen yaklaşık 124 Ω yerine yaklaşık 140 Ω; günde yaklaşık 2 °C tırmanış) Soner'in kendi saha notundan: `saha-notlari/jenerator-sicaklik/`. Bunlar dış kaynakla doğrulanamaz; videoda "sahadan bir vaka" diye çerçevelenmeli. Yayından önce Soner'e tek cümleyle teyit sorulabilir.
- PT100: 0 °C'de 100 Ω, derece başına yaklaşık 0,385 Ω (IEC 60751, α = 0,00385): https://www.ics-schneider.de/pt100-kennlinie-nach-iec-60751-%CE%B1-000385-und-abweichende-kennlinien-nicht-verwechseln/?lang=en
- **Alarm kodu gösterilmeyecek.** Ekrana yalnız genel ifade ("jeneratör sıcaklığı yüksek") yazılır. Model adı (V126) söylenebilir ama logo kullanılmaz.
- Güvenlik notu videoda kalmalı: ölçüm, durdurma + LOTO + gerilim yokluğu doğrulamasından sonra yapılır; SCADA düzeltmesi yalnız yetkili onayıyla.

**Sitedeki kaynak sayfalar:** `saha-notlari/jenerator-sicaklik/`, `sistemler/jenerator/`, `ariza/` (sıcaklık dalı), `egitim/arizaya-yaklasim/`

---

## Yedek konular (bu tura alınmadı)
- **Periyodik bakımda ne yapılır?** Talep var (firma blogları, Rüzgar Enerjisi Dergisi "Bölüm 7: Türbin Bakımı" https://www.ruzgarenerjisi.com.tr/bolum-7-turbin-bakimi/), YouTube'da yalnız kurumsal röportaj var. Kaynak: `egitim/periyodik-bakim/`. Uzun video adayı.
- **Maaş teklifini okumak** (ayrı Short): talep çok yüksek ama izleyici rakam bekler; site rakam vermiyor. Başlık dürüst kurulmazsa hayal kırıklığı riski var. Şimdilik Konu 2'nin bir bölümü olarak kalsın.

## CEO'ya 3 satır
1. Önerilen sıra: Konu 1 (Short, yüksek) → Konu 3 (Short, orta) → Konu 4 (Short, orta, seri açılışı) → Konu 2 (uzun, yüksek; PANO #6 "2. uzun video" için aday).
2. Talep en güçlü Konu 1 ve 2'de: Türkçe kaynaklar ya kaynaksız derleme ya da forumda yanlış bilgi (jet motoru teorisi); sahadan anlatan rakip dizinde yok.
3. YouTube sayfaları 429 verdi; rakip video izlenme ve tarihleri doğrulanmadı. Tüm teknik rakamlar ya kaynaklı ya "doğrulanmadı" işaretli.
