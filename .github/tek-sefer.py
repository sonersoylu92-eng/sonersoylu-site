#!/usr/bin/env python3
"""Tek seferlik (V47): eski menülü sayfalara hazırlık paketi, mentorluk ve sponsorluk bağlantıları; saha notları
menü açıklaması "temsili"; içerik sayfalarına eksik AdSense kodu. Her adım yoksa ekler (iki kez çalışsa da zarar vermez).
İş akışı bu dosyayı çalıştırdıktan sonra depodan siler."""
import os, sys
KOK = sys.argv[1] if len(sys.argv) > 1 else '.'
ADS = ('<script async fetchpriority="low" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2186651222559424"\n'
       '     crossorigin="anonymous"></script>\n')
REKLAMSIZ = {'index.html', 'deneyim/index.html', 'google99f19f0eb8f50d03.html', 'mentorluk/index.html', 'hazirlik-paketi/index.html',
             'sponsorluk/index.html', 'egitim/belge/index.html', 'evrim/index.html', '404.html', 'cevrimdisi.html'}
EKLE = [
 ('<a href="/egitim/">Eğitim<span>Ücretsiz 8 bölüm, katılım belgesi</span></a>', 'href="/hazirlik-paketi/">Hazırlık paketi<span',
  '<a href="/hazirlik-paketi/">Hazırlık paketi<span>Plan, şablon, 40 mülakat sorusu · PDF</span></a><a href="/mentorluk/">Mentorluk<span>Teknisyen adaylarına ücretsiz birebir sohbet</span></a>'),
 ('<a href="/egitim/">Eğitim</a><p class="mgrup">Site</p>', '<a href="/hazirlik-paketi/">Hazırlık paketi</a><a href="/mentorluk/">',
  '<a href="/hazirlik-paketi/">Hazırlık paketi</a><a href="/mentorluk/">Mentorluk</a>'),
 ('<li><a href="/rehber/">Sahadan rehber</a></li>', '<li><a href="/hazirlik-paketi/">Hazırlık paketi</a></li>',
  '<li><a href="/hazirlik-paketi/">Hazırlık paketi</a></li><li><a href="/mentorluk/">Mentorluk</a></li>'),
 ('<a href="/gelir/">Reklam ve gelir politikası</a>', 'href="/sponsorluk/">Sponsorluk</a>', '<a href="/sponsorluk/">Sponsorluk</a>'),
]
n = {'menu': 0, 'metin': 0, 'reklam': 0}
for d, alt, ad in os.walk(KOK):
    alt[:] = [a for a in alt if a not in ('.git', '.github', 'node_modules')]
    for f in ad:
        if not f.endswith('.html'): continue
        yol = os.path.join(d, f); rel = os.path.relpath(yol, KOK).replace(os.sep, '/')
        s = open(yol, encoding='utf-8').read(); o = s
        for capa, varsa, ek in EKLE:
            if capa in s and varsa not in s:
                if capa.endswith('<p class="mgrup">Site</p>'): s = s.replace(capa, capa.replace('<p class="mgrup">Site</p>', ek + '<p class="mgrup">Site</p>'), 1)
                else: s = s.replace(capa, capa + ek, 1)
        if s != o: n['menu'] += 1
        t = s.replace('Gerçek arıza vakaları, adım adım', 'Temsili arıza vakaları, adım adım')
        if t != s: n['metin'] += 1; s = t
        if rel not in REKLAMSIZ and 'adsbygoogle' not in s and 'noindex' not in s and '</head>' in s:
            s = s.replace('</head>', ADS + '</head>', 1); n['reklam'] += 1
        if s != o: open(yol, 'w', encoding='utf-8').write(s)
print('tek sefer:', n)
