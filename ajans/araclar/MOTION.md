# MOTION.md — Soner Soylu / The Turbine Tech marka dosyası

Kaynak: sonersoylu.com V4 (koyu sinematik, buz mavisi + elektrik mavisi, az amber).
Tasarım, üretim veya animasyondan önce bu dosya baştan sona okunur.

## A · Ortak kurallar
- **Zemin:** #07090B (derin gece). İkincil yüzey #11161A, yükseltilmiş kart #171E24
- **Ana metin:** #EEF2F5 · ikincil metin #A3ADB5 · sönük #76818A · çizgi rgba(238,242,245,.14)
- **Vurgu rengi:** buz mavisi #6FDCEC (ana vurgu) · elektrik mavisi #7CC4FF (ikinci vurgu, grafik ve çizgi)
- **Uyarı / sıcak nokta:** amber #F2B233 — sahne başına en fazla 1 öğe (ör. tek bir sayı, ikaz lambası)
- **Kart yüzeyi:** #11161A, 1px çizgi, 18px köşe, hafif iç ışık yok; cam efekti yok
- **Font:** başlık Fraunces (serif, 600; vurgulu kelime italik) · gövde Geist 500 · teknik veri/etiket Geist Mono 500, büyük harf, harf aralığı .12em
- Fontlar yerel: `shared/font/*.woff2` (CDN kullanılmaz)
- **Vurgu:** cümlede en fazla 1 renkli (buz mavisi), 1 italik kelime
- **Kanca tonu:** sahadan, birinci ağızdan, net rakamla. Örnek: "120 metrede rüzgâr, yerdekinden iki kat sert eser."
- **Doku:** çok hafif film greni (opaklık %4–6) ve ince teknik ızgara (opaklık %4)
- **Ses dili:** sakin, bilen, abartısız. Ünlem yok.

## B · Video kuralları
- **Format:** 9:16, 1080×1920, 30 fps
- **Güvenli alan:** alt %20 (384 px) ve sağdan 160 px boş; üst 220 px'te önemli metin yok
- **İlk kare:** tam görüntüyle açılır (zemin + ana görsel + başlık görünür); öğeler sonra gelir, boş/siyah kare yok
- **Kanca:** ilk 2 saniyede
- **Görsel panel:** her sahnede zorunlu (diyagram, türbin çizimi, grafik, sayı kartı). Yazı tek başına sahne taşımaz
- **Altyazı:** 64 px Geist 700, ekranın %62 yüksekliğinde, en fazla 2 satır / 6 kelime, karaoke: evet (konuşulan kelime buz mavisi)
- **Konuşan kişi:** omuzlarıyla, bulanıklık yok (konuşma videolarında)
- **Arka plan:** ince teknik ızgara + uzak türbin silueti, opaklık %10–25
- **Hareket:** yumuşak (power3/expo out, 0.5–0.8 sn); zıplama, elastik ve glitch yok. Rotorlar gerçekçi ve sakin döner
- **Geçiş:** kesme veya kısa (0.4 sn) maske/kaydırma; dönme/zoom geçişi yok
- **Son sahne:** CTA + "The Turbine Tech" / sonersoylu.com, son söz CTA
- **Müzik:** videoya gömülmez, Instagram'da eklenir

## C · Asla yapma
- Boş kareyle açmak
- Palet dışı renk (özellikle limon yeşili, mor, kırmızı-turuncu gradyan)
- Başkasının logosu, üretici logosu veya üretici alarm kodları
- Unvanı "Mühendis / Field Engineer" yazmak — doğrusu "Rüzgâr Türbini Saha Servis Teknisyeni"
- Doğrulanmamış teknik rakam; tahmin/hesap varsa "yaklaşık" de
- Güvenlik kuralını hafife alan görüntü (kemersiz yüksekte çalışma, LOTO'suz müdahale)

## D · Karusel kuralları
- 4:5, 1080×1350; aynı palet ve fontlar; kapakta kanca + tek görsel; son slayt CTA
