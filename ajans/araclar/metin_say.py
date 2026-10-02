#!/usr/bin/env python3
"""K-032: metin teslim dosyasındaki her kod bloğu için karakter sayısı ve rakam listesi.

Kullanım:
    python3 ajans/araclar/metin_say.py ajans/cikti/metin-....md

- Her ``` bloğu ayrı sayılır; blok adı, bloktan önceki son **kalın** etiket ya da # başlığıdır.
- Sayım Python len() ile yapılır (boşluk ve satır sonları dahil, sondaki satır sonu hariç).
- "<!-- SAYIM -->" işaretinden sonrası (sayım/denetim bölümü) atlanır.
- Etiket bloğunda YouTube'un tırnaklı sayımı da verilir (boşluklu her etikete +2).
"""
import re
import sys


def bloklar(metin):
    etiket, icinde, tampon, sonuc = "", False, [], []
    for satir in metin.split("\n"):
        if satir.startswith("```"):
            if icinde:
                sonuc.append((etiket, "\n".join(tampon)))
                tampon = []
            icinde = not icinde
            continue
        if icinde:
            tampon.append(satir)
        elif satir.startswith("#") or satir.startswith("**"):
            etiket = satir.strip("#* ").split("**")[0].strip()
    return sonuc


def main():
    if len(sys.argv) != 2:
        sys.exit("kullanım: metin_say.py <dosya.md>")
    metin = open(sys.argv[1], encoding="utf-8").read().split("<!-- SAYIM -->")[0]
    for etiket, govde in bloklar(metin):
        rakamlar = re.findall(r"\d+(?:[.,]\d+)?", govde)
        hashtag = re.findall(r"#\w+", govde)
        print(f"== {etiket}")
        print(f"   karakter: {len(govde)}  satır: {govde.count(chr(10)) + 1}  hashtag: {len(hashtag)}")
        if etiket.lower().startswith("etiket"):
            parca = [p.strip() for p in govde.split(",") if p.strip()]
            tirnakli = len(govde) + 2 * sum(1 for p in parca if " " in p)
            print(f"   etiket adedi: {len(parca)}  tırnaklı sayım (YouTube): {tirnakli}")
        print(f"   rakamlar: {', '.join(rakamlar) if rakamlar else '(yok)'}")


if __name__ == "__main__":
    main()
