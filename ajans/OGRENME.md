# Öğrenme defteri

Ajansın hafızası. Her tur başında **Aktif kurallar** okunur ve uyulur. Her tur sonunda yeni dersler eklenir.
Bir ders ya kurala dönüşür ya da gerekçesiyle reddedilir. İşe yaramadığı ölçülen kural "Emekli" bölümüne taşınır.

Ders biçimi:
`- [D-NNN · YYYY-AA-GG · ajan] Beklenen: … · Olan: … · Neden: … · Karar: K-NNN eklendi/güncellendi | reddedildi (gerekçe)`

## Aktif kurallar

### Video
- **K-001** SVG içinde bir öğeyi ölçekleyip döndürürken GSAP `svgOrigin`/`transformOrigin`'e güvenme: öğeyi kendi
  dayanağına `translate` edilmiş bir `<g>` içine koy ve dönüşü iç `<g>`'de `svgOrigin:"0 0"` ile yap; çubuklarda
  ölçek yerine `attr:{y,height}` tween'i kullan. (D-001, D-002)
- **K-002** `data-*` ile dayanak verisi taşıyorsan üretilen HTML'de gerçekten çıktığını `grep` ile doğrula.
  Değiştirme komutunun "çalıştı" demesi yetmez. (D-002)
- **K-003** Render'dan önce her sahneden en az bir kare al (`hyperframes snapshot --at …`) ve **tam boyutta** bak:
  taşan yazı, çakışan etiket, yanlış merkezde dönen parça burada yakalanır. Teslimden önce MP4'ten de kare çıkar. (D-003)
- **K-004** İlk kare dolu açılır; sayaçlar 0'dan başlar (ilk karede son değeri gösterip sıfıra düşmek göz kırpması yapar). (D-004)
- **K-005** Türkçe seslendirmede sayıları yazıyla ver ("üç yüz on kilometre"); "Bir/İki/Üç" gibi kısa bölüm
  numaralarını "Birinci konu, …" yap; İngilizce adları okunuşla yaz ("Dı Törbayn Tek"). Sesi Whisper'a geri
  yazdırıp kontrol et. (D-005)
- **K-006** Sahne süresi = seslendirme süresi + pay. Önce sesi üret, süreleri ölç, sonra görüntüyü o zamanlara kur. (D-006)
- **K-007** 2 dakikadan uzun render'ı ayrık başlat: betikte `export HYPERFRAMES_RENDER_DETACHED=1` + `setsid nohup betik.sh < /dev/null > /dev/null 2>&1 & disown`.
  Yalnız setsid yetmez (hyperframes üst süreç zincirini izler, "render_cancelled_parent_exited"). `pkill -f` ile kalıp kullanma,
  kendi kabuğunu da öldürür; PID dosyası + `kill`. (D-007, D-050)
- **K-008** `npx hyperframes` en son sürümü çekmeye çalışıp ETARGET verebilir: sürümü sabitle (`npx --yes hyperframes@0.8.106`). (D-008)
- **K-009** Sohbete gönderilen dosya sınırı ~30 MB: uzun videoyu `-crf 24 -tune animation -preset slow` ile sıkıştır
  ve kaliteyi kare farkıyla doğrula. (D-009)
- **K-011** Piper tek üretimde güvenilmez: sahne başına 3–5 aday üret, her birini Whisper'la yazdırıp puanla, sahneye
  sığan en iyiyi seç ve önbelleğe al. Okunamayan kelimeye net eşanlamlı kullan ("trafo" → "transformatör",
  "klemens" → "bağlantılar", "sonersoylu.com" → "Soner Soylu nokta kom", "nasel" → "makine dairesi" (ekranda NASEL kalır)). ğ'li kelimede önce ğ'siz
  eşdeğer dene ("bayrağa" → "bayrak konumuna"); son kelimesi bozulan cümlede araya nokta koy ("için. Takip et."). Puanlamadan önce Whisper'ın rakamlarını
  Türkçe yazıya çevir ("116" → "yüz on altı"), yoksa sayıyla biten cümle haksız düşük puan alır. "Türbin" kısa ve
  cümle başındaysa "tübin" duyulur: cümle içine al. (D-051, D-061, D-067, D-068)
- **K-012** Render öncesi `ajans/araclar/tasma_kontrol.mjs` çalışır; düzeltilmesi gereken bulgu 0 değilse render yok.
  Diyagram etiketlerine koyu hale ver (`stroke:#07090B; stroke-width:8; paint-order:stroke`); kart genişliği yazıdan
  en az 24 px geniş. Gözle kare kontrolü (K-003) bunu tek başına yakalamadı. (D-052)
- **K-013** `transcribe.py`'nin kelime hizalaması cümle sonunu kesik gösterebilir (VAD parçası dolgusuz). Sesin doğruluğuna
  sahne bazlı tam yazıya dökümle (±0,3 sn dolgu) karar ver. Aday seçiminde de geçerli: ~7,5 sn'den uzun cümlede
  sona ≥0,4 sn sessizlik ekle; karar tek Whisper geçişiyle değil, tam dosyada dolgulu yazımla verilir. Aday seçimi de iki ayrı dolguyla yapılır
  (`ajans/cikti/video/ruzgar-esiyor/aday.py`); tek geçişli puan yalnız ön elemedir. (D-053, D-061, D-069)
- **K-010** Uzun (16:9) videolar için YouTube paketi: MP4 (H.264+AAC) + 1280×720 kapak + .srt + bölüm zaman damgaları. (D-010)

### Site
- **K-020** Telefon performansını yazılım ekran kartlı emülasyonla **mutlak** ölçme; sahne kendini bırakıp kamerayı
  dondurabilir. Karşılaştırma yaparken iki sürümde de `birak` ve `kaliteUygula`'yı kapat, aynı kamera konumunda
  `renderer.render` süresini ölç. Gerçek etkiyi D1 `olay` tablosundan izle. (D-020)
- **K-021** three.js'te görünen ışık sayısı gölgelendirici anahtarıdır: ışık sayısı değişince tüm malzemeler yeniden
  derlenir (telefonda yarım saniyeden uzun donma). Işıkları aç/kapa yerine sabit say + şiddet ile yönet; yeni düzen
  varsa önceden derleme listesine ekle. (D-021)
- **K-022** Telefonda kalite düşürmenin ilk adımı kare hızıdır (60→30); çözünürlük değişimi tuvali yeniden boyutlar
  ve kendisi takılma yapar. (D-022)
- **K-023** CSS/JS değişince bağlantıdaki `?v=` damgasını içerik md5'iyle ve `sw.js` SURUM'u güncelle; Cloudflare
  dosyaları 4 saat önbellekte tutar. Dinamik `import()` edilen dosyanın damgası, onu çağıran dosyanın içindedir. (D-023)
- **K-024** `/api/*` yolları robots ile kapalı: dışarıdan WebFetch ile okunamaz. Veriyi D1'den ya da Cloudflare
  bağlantısından oku. (D-024)

- **K-025** Telemetri: rAF ile süre ölçen her kod `visibilitychange`'te zaman referansını sıfırlar; yoksa sekme arkadayken
  geçen süre "takılma" diye yazılır. H1 ölçüsü S5'teki "ciddi" sütunuyla, bot/test ve arka plan boşluğu hariç okunur.
  Bir varsayımı ("sorunlar botlardan") oran hedefine bağlamadan önce veriyle sına. Sürüm kohortları da bot/test
  hariç okunur (S4b); telefonda `tarayici='diğer'` uygulama içi tarayıcıdır, bot sayılmaz. H1 ana ölçüsü S6. (D-054, D-055, D-063, D-064)

### İçerik ve doğruluk
- **K-030** Rüzgârla güç ilişkisi her zaman nitelenir: "rüzgârdaki güç hızın küpüyle"; türbin gücü için "anma gücüne kadar". (D-056)
- **K-031** Siteden alıntı ya da kural aktarırken dosyadan **aynen** kopyala; güvenlikle ilgili koşulları ("gerekiyorsa",
  "sistem varsa") asla düşürme. CEO brifindeki başlık ve rakamlar da kaynak sayfayla kıyaslanır; brif kaynaktan
  üstün değildir. Güvenlik bloğu her kanala **bütün** taşınır (tehlike + koşullar + sorumluluk reddi); yer yoksa
  başka cümle kısaltılır. Telaffuz ya da uzunluk için metin değişince güvenlik adımları kaynakla yeniden sayılır.
  Kaynağın kendi aritmetiği de kontrol edilir; kaynak kendi içinde tutarsızsa aktarılmaz, Soner'e sorulur. Videoda
  gösterilecek sayfa çizimi de sayfadaki gerçek grafikle aynı türde olmalı; açık nokta önerilerinde kaynaktan gelen
  kısım ile yeni yazılan ayrı gösterilir. (D-057, D-062, D-065, D-066, D-070, D-071)
- **K-032** Metin teslimleri betikle üretilir: karakter sayıları + metindeki **rakam listesi** otomatik çıkar; denetçi listeyi
  brifle kıyaslar. Paket başlığında teslim edilen dosya adı yazar. icerik-yazari'nın komut aracı yoktur: betiği CEO ya da
  denetçi çalıştırır, yazar sayımı fark hesabıyla verip "betik bekliyor" yazar; betik çalışmadan paket GEÇMEZ. (D-058, D-073)
- **K-033** YouTube sayfaları 429 verir: rakip kanıtı için `site:youtube.com` araması; izlenme/tarih "doğrulanmadı".
  İlk 429'dan sonra YouTube'a istek atma. (D-059)

### Süreç
- **K-040** Plan önce, üretim sonra: saniye saniye plan (beat sheet) Soner'e tek mesajda gösterilir; onay gelince
  üretilir. Zamanlanmış turda Soner yoksa plan PANO'ya yazılır, üretim bekler. (D-040)
- **K-042** Her oturum (zamanlanmış ya da etkileşimli) PANO ve günlüğü kapanmadan günceller; üretilen MP4'ün nerede
  durduğu ve Soner'e gönderilip gönderilmediği PANO'ya yazılır. MP4 depoya girmez, o yüzden yeniden üretim betikleri
  (build/ses) depoda olmalı. (D-072)
- **K-041** Soner'den komut çalıştırması ya da dosya yüklemesi istenmez; YouTube/LinkedIn'e erişim yoksa yükleme
  paketi kopyala-yapıştır hazır verilir. (D-041)

## Dersler
- [D-001 · 2026-10-02 · video] Beklenen: rotor kendi göbeği etrafında döner · Olan: kadrajdan uçtu · Neden: `svgOrigin:"0 0"` global koordinat, grup `translate` ile kaydırılmıştı · Karar: K-001
- [D-002 · 2026-10-02 · video] Beklenen: hız çubukları tabandan büyür · Olan: iki deneme boyunca yanlış yerde/görünmez · Neden: `data-x` ekleyen değiştirme hiç uygulanmamıştı + GSAP SVG dayanak hesabı · Karar: K-001, K-002
- [D-003 · 2026-10-02 · video] Beklenen: etiketler ayrık · Olan: "YAW GÜVERTESİ" ile "FREN · JENERATÖR" çakıştı · Neden: küçük kare kontrolünde görünmedi · Karar: K-003
- [D-004 · 2026-10-02 · video] Beklenen: sayaç 0→14 · Olan: ilk kare 14, sonra 0 · Neden: başlangıç metni son değer · Karar: K-004
- [D-005 · 2026-10-02 · video] Beklenen: anlaşılır anlatım · Olan: "Bir." yutuldu, "The Turbine Tech" → "Te tu" · Neden: Türkçe ses modeli · Karar: K-005
- [D-006 · 2026-10-02 · video] Beklenen: ses sahneye sığar · Olan: ilk cümle 3,3 sn / sahne 3 sn; hız ayarı modelde yok sayıldı · Neden: TTS `speed` parametresi Piper'da etkisiz · Karar: K-006 (ffmpeg `atempo` ile kısalt)
- [D-007 · 2026-10-02 · video] Beklenen: arka planda render · Olan: komut bitince "render_cancelled"; `pkill` kabuğu öldürdü · Karar: K-007
- [D-008 · 2026-10-02 · video] Olan: `npx hyperframes` 0.8.111 bulunamadı (ETARGET) · Karar: K-008
- [D-009 · 2026-10-02 · video] Olan: 36,7 MB dosya sohbete gitmedi · Karar: K-009
- [D-010 · 2026-10-02 · video] Olan: Soner uzun video için "YouTube'a yükleyebileceğim son hâli" istedi · Karar: K-010
- [D-020 · 2026-10-02 · site] Olan: düzeltmeden sonra emülasyon daha kötü göründü · Neden: eski sürüm erken pes edip kamerayı donduruyordu, ölçüm haksızdı · Karar: K-020
- [D-021 · 2026-10-02 · site] Olan: kaydırırken `getProgramInfoLog` (derleme) görüldü · Karar: K-021
- [D-022 · 2026-10-02 · site] Olan: kalite merdiveni her kademede tuvali boyutlayıp takılma üretiyordu · Karar: K-022
- [D-023 · 2026-10-02 · site] Olan: deneyim.js damgası arayuz.js içindeydi · Karar: K-023
- [D-024 · 2026-10-02 · site] Olan: /api/youtube canlıda okunamadı · Karar: K-024
- [D-040 · 2026-10-02 · süreç] Olan: Soner plan tablosunu görüp "Yap/Onay" dedi, değişiklikleri sahne numarasıyla verdi · Karar: K-040
- [D-041 · 2026-10-02 · süreç] Olan: YouTube'a erişim yok, Soner Studio'dan kendisi yükledi · Karar: K-041

- [D-050 · 2026-10-02 · video-yapimci] Olan: setsid'le başlatılan render 160. karede iptal · Neden: hyperframes üst süreç zincirini izliyor · Karar: K-007 güncellendi
- [D-051 · 2026-10-02 · video-yapimci] Olan: aynı cümle 3,10/3,33 sn, bazı adaylarda "Tafo", "Sağdan" · Karar: K-011
- [D-052 · 2026-10-02 · denetçi] Olan: video KALDI — kare alınmıştı ama kart taşması ve aynı renkte çizgi-yazı çakışması kaçtı · Karar: K-012 (otomatik kontrol, yapımcı yazdı, eski sürümde 7 sorun buldu)
- [D-053 · 2026-10-02 · denetçi] Olan: geri.json'da "ak", "dö", "doğur" · Neden: hizalama aracı · Karar: K-013
- [D-054 · 2026-10-02 · site-bakimci] Olan: `takilma ms=61360046` (17 saat) · Neden: arka plan süresi takılma sayılıyordu · Karar: K-025, deneyim.js + film.js düzeltildi, sürüm akici16
- [D-055 · 2026-10-02 · site-bakimci] Beklenen: masaüstü sorunları botlardan · Olan: botlar çıkınca oran %56→%79; gerçek oturumların %72'si tek cihaz (Mac M1) · Karar: K-025
- [D-056 · 2026-10-02 · denetçi] Olan: "2 kat rüzgâr → 8 kat güç" niteleyicisiz (grafik 12 m/s'den sonra düz) · Karar: K-030
- [D-057 · 2026-10-02 · denetçi] Olan: "gerekiyorsa rotor kilidi" → "rotor kilitlidir" genellemesi; alıntı kelimeleri kaymış · Karar: K-031
- [D-058 · 2026-10-02 · icerik-yazari] Olan: sayımlar betikle yapıldı, hata çıkmadı; paket "sessiz" diyordu ama video sesliydi · Karar: K-032
- [D-059 · 2026-10-02 · arastirmaci] Olan: youtube.com/watch 4/4 istek 429 · Karar: K-033
- [D-060 · 2026-10-02 · CEO] Olan: Soner birinci şahıs anlatım için "Evet" dedi (saha vakası ölçümünü kendisi yaptı) · Karar: kural değil, PANO #9 kapandı; saha vakaları serisinde ölçümün kime ait olduğu her vaka için ayrıca sorulur (K-031'e not)
- [D-061 · 2026-10-02 · video-yapimci] Olan: saha vakası anlatımında rakamla biten cümleler Whisper puanında haksız düştü; ~7,5 sn+ cümlelerde son kelime 4 adayda da kesik göründü; aynı klip iki geçişte farklı yazıldı ("Tübini/Türbini"); "klemens" ve bitişik "sonersoylu" okunamadı · Karar: K-011 ve K-013 genişletildi
- [D-062 · 2026-10-02 · video-yapimci] Olan: CEO brifinde başlık "Alarm 103 °C" idi; sayfaya göre alarm 116 °C (eşik 115), 103 °C ölçüm anındaki ekran değeri. Yapımcı sayfaya göre düzeltti · Karar: K-031'e "brif de kaynakla kıyaslanır" eklendi
- [D-063 · 2026-10-03 · CEO] Beklenen: S4'te akici16 sahne oranı düzeltmenin etkisini gösterir · Olan: %12,5 · Neden: 8 oturumun 6'sı bot/test; S4 filtresizdi · Karar: K-025 genişledi, S4b + S6 eklendi
- [D-064 · 2026-10-03 · CEO] Olan: S4b'nin ilk hâli sahnede kalan gerçek bir iPhone'u bot saydı · Neden: telefonda `tarayici='diğer'` uygulama içi tarayıcı (LinkedIn/Instagram) · Karar: K-025 (telefonda bu filtre yok)
- [D-065 · 2026-10-03 · denetçi] Olan: saha vakası LinkedIn metninde "yüksek gerilim bulunur" ve sorumluluk reddi düşmüştü; YouTube'da tamdı · Neden: karakter sınırı için kısaltma · Karar: K-031 genişledi (güvenlik bloğu bütün)
- [D-066 · 2026-10-03 · denetçi] Olan: kaynak sayfa 110→112→116 °C (+2, +4) ile "günde yaklaşık 2 °C düzenli" diyor · Karar: K-031 (kaynağın aritmetiği); PANO #13 Soner'e
- [D-067 · 2026-10-03 · video-yapimci] Olan: "nasel" 10/10 geçişte "naser" duyuldu, harf düzeyli CTC de aynı · Neden: Piper telaffuzu · Karar: K-011 (nasel → makine dairesi)
- [D-068 · 2026-10-03 · video-yapimci] Olan: "bayrağa" → "bayrağı" (9/10); "cevabı, çoğu zaman" → "şov zaman"; "için takip et" → "takip let" (5/5), "için. Takip et." 3/3 doğru · Karar: K-011
- [D-069 · 2026-10-03 · video-yapimci] Olan: B3 ve B5 adayken doğru, tam dosyada bozuk · Neden: tek Whisper geçişi kararsız · Karar: K-013 (aday seçimi iki dolguyla)
- [D-070 · 2026-10-03 · video-yapimci] Olan: telaffuz için kısaltırken LOTO'nun "şalter açılır" adımı düştü, kaynakla kıyaslarken yapımcı kendisi yakaladı · Karar: K-031
- [D-071 · 2026-10-03 · denetçi] Olan: B9 tarifi sayfada olmayan bir grafik (kesik çizgiler güç eğrisinde) çizdirecekti; açık noktadaki önerinin tamamı kaynaktan gibi sunulmuştu; "sağ alt" Short güvenli alanının dışı · Karar: K-031; konum tarifleri piksel sınırıyla (MOTION B)
- [D-072 · 2026-10-02/03 · CEO] Olan: önceki oturum PANO #10'u üretip commit'ledi ama PANO "onay-bekliyor", günlük tur 1'de kaldı; MP4 depoda yok, teslim durumu bilinmiyor · Karar: K-042
- [D-073 · 2026-10-03 · icerik-yazari] Olan: ikinci kez komut aracı olmadan teslim; sayım betikle yapılamadı (ilki D-058 dönemindeki saha paketi) · Neden: ajan tanımında Bash yok · Karar: K-032 genişledi (aynı hata iki kez → kural)
- [D-074 · 2026-10-03 · CEO] Olan: bu turda sohbet arama aracı yoktu; geri bildirim yalnız hafıza dosyalarından okundu, yeni tepki bulunmadı · Karar: reddedildi (araç eksikliği, ajansın elinde değil; günlükte not edildi)
- [D-075 · 2026-10-03 · video-yapimci] Olan: normalize.sh'deki `grep -E "I:|Peak:"` ebur128'in kare satırlarını da yakalayıp 98 KB çıktı üretti · Karar: reddedildi (kural gerekmez; yeni betiklerde `"^\s+(I|LRA|Peak):"` kullanılır, karara etkisi yok)

## Emekli kurallar
(yok)
