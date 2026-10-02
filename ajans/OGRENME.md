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
- **K-007** 2 dakikadan uzun render'ı `setsid nohup betik.sh &` ile tamamen ayrık başlat; komut kapanınca iptal olur.
  `pkill -f` ile kalıp kullanma, kendi kabuğunu da öldürür. (D-007)
- **K-008** `npx hyperframes` en son sürümü çekmeye çalışıp ETARGET verebilir: sürümü sabitle (`npx --yes hyperframes@0.8.106`). (D-008)
- **K-009** Sohbete gönderilen dosya sınırı ~30 MB: uzun videoyu `-crf 24 -tune animation -preset slow` ile sıkıştır
  ve kaliteyi kare farkıyla doğrula. (D-009)
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

### Süreç
- **K-040** Plan önce, üretim sonra: saniye saniye plan (beat sheet) Soner'e tek mesajda gösterilir; onay gelince
  üretilir. Zamanlanmış turda Soner yoksa plan PANO'ya yazılır, üretim bekler. (D-040)
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

## Emekli kurallar
(yok)
