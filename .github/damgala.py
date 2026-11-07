#!/usr/bin/env python3
"""Önbellek damgalarını yeniler: sayfa ve betiklerdeki /yol/dosya.uzanti?v=XXXXXXXX (8 onaltılık) damgasını
dosyanın gerçek içeriğinin md5'inin ilk 8 hanesiyle değiştirir. Cloudflare statik dosyaları 4 saat önbellekte
tuttuğu için damga değişmezse yeni CSS/JS ziyaretçiye geç ulaşıyordu. Betikler birbirini damgalı adresle
çağırdığı için (deneyim.js → gok.js, arayuz.js → deneyim.js) değişiklik kalmayana kadar tekrarlanır.
Yalnız 8 haneli onaltılık damgalara dokunur; elle verilmiş adlar (ör. ?v=weather2) olduğu gibi kalır."""
import hashlib, os, re, sys

KOK = sys.argv[1] if len(sys.argv) > 1 else '.'
UZ = ('.html', '.js', '.css', '.json', '.webmanifest')
ATLA = {'.git', 'node_modules', '.github'}
DESEN = re.compile(r'(?<![A-Za-z0-9_.:/-])(/[A-Za-z0-9_./-]+\.(?:js|css|json|webp|png|jpg|jpeg|svg|woff2|mp3|mp4))\?v=([0-9a-f]{8})(?![0-9a-z])')

def dosyalar():
    for d, alt, ad in os.walk(KOK):
        alt[:] = [a for a in alt if a not in ATLA]
        for f in ad:
            if f.endswith(UZ): yield os.path.join(d, f)

def md5(yol):
    with open(yol, 'rb') as f: return hashlib.md5(f.read()).hexdigest()[:8]

toplam = set()
for tur in range(10):
    degisen = 0
    for yol in dosyalar():
        try: s = open(yol, encoding='utf-8').read()
        except UnicodeDecodeError: continue
        def yeni(m):
            hedef = os.path.join(KOK, m.group(1).lstrip('/'))
            return m.group(1) + '?v=' + md5(hedef) if os.path.isfile(hedef) else m.group(0)
        t = DESEN.sub(yeni, s)
        if t != s:
            open(yol, 'w', encoding='utf-8').write(t); degisen += 1; toplam.add(os.path.relpath(yol, KOK))
    if not degisen: break
# V5: servis çalışanı sürümü damgalarla birlikte otomatik artar. Sürüm, sitedeki tüm damgalı varlık
# adreslerinin özetidir: bir CSS/JS/JSON değişince SURUM değişir ve ziyaretçinin eski önbelleği silinir.
imza = set()
for yol in dosyalar():
    try: s = open(yol, encoding='utf-8').read()
    except UnicodeDecodeError: continue
    for m in DESEN.finditer(s):
        if m.group(1) != '/sw.js': imza.add(m.group(1) + '?v=' + m.group(2))
sw = os.path.join(KOK, 'sw.js')
if imza and os.path.isfile(sw):
    s = open(sw, encoding='utf-8').read()
    surum = 'kule-oto-' + hashlib.md5('\n'.join(sorted(imza)).encode()).hexdigest()[:8]
    t = re.sub(r"const SURUM = '[^']*';", "const SURUM = '" + surum + "';", s, count=1)
    if t != s:
        open(sw, 'w', encoding='utf-8').write(t); toplam.add('sw.js')
    print('servis çalışanı sürümü:', surum)
print('damga yenilenen dosya:', len(toplam))
for f in sorted(toplam): print(' ', f)
