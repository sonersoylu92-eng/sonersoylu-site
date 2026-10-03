# "Rüzgâr esiyor, türbin duruyor. Arızalı mı?" Short — anlatım metni (beat başına).
# Genel açıklayıcı ses (birinci şahıs YOK). Sayılar yazıyla (K-005). Kaynaklar: plan-ruzgar-esiyor-2026-10-03.md §3.
# "Türbin" cümle başında değil (K-011). "nasel" Piper'da "naser" duyuldu → sözlükteki karşılığı "makine dairesi";
# "burulur" "bululur/vurulur" duyuldu → "burularak dolanır"; "cevabı, çoğu" virgülde "şov zaman" → virgülsüz (sayfadaki hâli);
# CTA "takip et" 5/5 "takip let" duyuldu → "için. Takip et." (noktalı kısa duraklama, 3/3 doğru);
# "bayrağa alınır" 9/10 geçişte "bayrağı" duyuldu → "bayrak konumuna alınır" (egitim/turbin-nasil-calisir ifadesi);
# B5: LOTO'nun ilk adımı "şalter açılır" metinde kalır (egitim/guvenlik, K-031).
# (ad, [metin varyantları; puan her varyantın kendi metnine göre], atempo)
BEAT = [
 ("kanca",   ["Rüzgâr esiyor, türbin duruyor. Arızalı mı? Çoğu zaman, hayır."], 1.0),
 ("az",      ["Rüzgâr zayıfsa üretim olmaz. Örneğin bu modelde, saniyede üç metrenin altında türbin durur.",
              "Rüzgâr zayıfsa üretim olmaz. Örneğin bu modelde türbin, saniyede üç metrenin altında durur."], 1.0),
 ("cok",     ["Çok sert rüzgârda da durur. Saniyede yirmi beş metrenin üstünde, kanatlar emniyet için bayrak konumuna alınır.",
              "Çok sert rüzgârda da durur. Saniyede yirmi beş metrenin üstünde, emniyet için kanatlar bayrak konumuna alınır."], 1.0),
 ("egri",    ["Kule dibinde makine niye durdu sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur."], 1.0),
 ("bakim",   ["Planlı bakımda da türbin durdurulur. Şalter açılır, kilitlenir ve etiketlenir. Gerekiyorsa rotor kilidi de takılır.",
              "Planlı bakımda da türbin durdurulur. Şalter açılıp kilitlenir ve etiketlenir, gerekiyorsa rotor kilidi de takılır."], 1.0),
 ("kisit",   ["Bazen rüzgâr da makine de hazırdır, ama şebeke işletmecisinden üretim kısıtı gelir ve türbin durdurulur. Bu bir arıza değildir."], 1.0),
 ("ters",    ["Tersi de olur: rüzgâr yok, ama rotor değil, tepedeki makine dairesi dönüyor.",
              "Tersi de olur: rüzgâr yok, ama tepedeki makine dairesi dönüyor. Dönen, rotor değil."], 1.0),
 ("kablo",   ["Kule içindeki güç kabloları, makine dairesiyle birlikte döner ve burularak dolanır. Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın, kabloları açmak için ters yöne döner."], 1.0),
 ("cta",     ["Güç eğrisini canlı rüzgârla görmek için, Soner Soylu nokta kom sitesinde rüzgâr sayfası. Dı Törbayn Tek. Sıradaki soru için. Takip et."], 1.0),
]
