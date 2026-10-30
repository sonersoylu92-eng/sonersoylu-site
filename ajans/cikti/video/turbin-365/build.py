#!/usr/bin/env python3
"""Short — "365 metrelik türbin" · index.html + .srt üretici (TR ve EN aynı betik: DIL=tr|en).
Plan: ajans/cikti/plan-365-metre-2026-10-29.md (PANO #19, onaylı). MOTION.md kuralları; iskelet ruzgar-esiyor/build.py.
Ses önce (K-006): sahne pencereleri ses/zaman.json, animasyon anları ses/kelime.json üzerinden. Döndürülen parçalar
dayanağına translate edilmiş dış <g> + iç <g> (svgOrigin "0 0"), sayaç 0'dan başlar (K-001, K-004), etiketler koyu haleli (K-012).
Çizimler ölçeklidir ama temsilîdir; yazılan her rakam plandaki kaynaktan gelir. Üretici logosu yok.
Çalıştırma: DIL=tr python3 build.py  → $VIDEO/index.html, depoya .srt"""
import json, math, os, re, sys
sys.path.insert(0, "/home/claude/video-edit/tools")
from hfkit import W, H, ICE, ELEC, AMBER, INK, MUTED, FAINT, LINE, SURF, turbine, blade, words, fontface  # noqa

D = os.path.dirname(os.path.abspath(__file__))
DIL = os.environ.get("DIL", "tr")
TR = DIL == "tr"
V = os.environ.get("VIDEO", "/home/claude/video-edit/videos/turbin-365" + ("" if TR else "-en"))
Z = json.load(open(f"{V}/ses/zaman.json"))
K = json.load(open(f"{V}/ses/kelime.json"))
DUR = Z[-1]["sahne_son"]
S = {z["beat"]: (z["sahne_bas"], z["sahne_son"]) for z in Z}
BG = "#07090B"
HALO = 'stroke="#07090B" stroke-width="8" stroke-linejoin="round" paint-order="stroke"'
SRT_AD = "Turbin-365-Metre-Short.srt" if TR else "Tallest-Turbine-365m-Short-EN.srt"


def L(tr, en):
    return tr if TR else en


def _n(w):
    return re.sub(r"[^\w]", "", w).replace("İ", "i").replace("I", "ı").lower().replace("â", "a")


KB = {b: [w for w in K if w["beat"] == b] for b in S}


def t(b, kel, n=1, son=False):
    """b. beatte 'kel' kelimesinin n. geçişinin başı (son=True: sonu), saniye."""
    c = 0
    for w in KB[b]:
        if _n(w["w"]) == _n(kel):
            c += 1
            if c == n:
                return w["e"] if son else w["s"]
    raise KeyError((b, kel, n))


def r(x):
    return round(x, 3)


# ---------------------------------------------------------------- çizim yardımcıları
def kart(x, y, w, h, stroke=LINE, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{SURF}" stroke="{stroke}" stroke-width="2" {extra}/>'


def svg(ic, h=600):
    return f'<svg viewBox="0 0 830 {h}" class="psvg" style="height:{h}px">{ic}</svg>'


def mono(x, y, s, txt, col=MUTED, anchor="start", extra=""):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" class="mono" font-size="{s}" fill="{col}" {HALO} {extra}>{txt}</text>'


def kafes(cx, y_top, y_bot, w_top, w_bot, col=INK, op=.85, sid="", panel=10):
    """Kafes kule: iki ayak + çapraz bağlar. sid verilirse çizim animasyonu için tek path."""
    xs = lambda y, s: cx + s * (w_top + (w_bot - w_top) * (y - y_top) / (y_bot - y_top)) / 2
    d = f"M{xs(y_bot,-1):.1f},{y_bot} L{xs(y_top,-1):.1f},{y_top} L{xs(y_top,1):.1f},{y_top} L{xs(y_bot,1):.1f},{y_bot}"
    for k in range(panel):
        a = y_top + (y_bot - y_top) * k / panel; b = y_top + (y_bot - y_top) * (k + 1) / panel
        d += f" M{xs(a,-1):.1f},{a:.1f} L{xs(b,1):.1f},{b:.1f} M{xs(a,1):.1f},{a:.1f} L{xs(b,-1):.1f},{b:.1f}"
    i = f'id="{sid}"' if sid else ""
    return f'<path {i} d="{d}" fill="none" stroke="{col}" stroke-width="2.5" opacity="{op}" stroke-linejoin="round"/>'


def rotor(cx, cy, Lp, rid, col=INK, op=1):
    b = blade(Lp)
    return (f'<g transform="translate({cx},{cy})"><g id="{rid}">'
            + "".join(f'<path d="{b}" transform="rotate({a})" fill="{col}" opacity="{op}"/>' for a in (0, 120, 240))
            + f'<circle r="{max(6, Lp*.075):.0f}" fill="{ICE}" opacity="{op}"/></g></g>')


def nasel(cx, cy, col=INK, s=1.0, fill=SURF):
    return f'<rect x="{cx-22*s:.1f}" y="{cy-14*s:.1f}" width="{58*s:.1f}" height="{28*s:.1f}" rx="{8*s:.1f}" fill="{fill}" stroke="{col}" stroke-width="2.5"/>'


def siluet(cx, cy, col=INK):
    return (f'<circle cx="{cx}" cy="{cy-58}" r="16" fill="{col}"/>'
            f'<path d="M{cx-22},{cy+30} L{cx-22},{cy-22} Q{cx},{cy-40} {cx+22},{cy-22} L{cx+22},{cy+30} Z" fill="{col}"/>')


def vinc(x0, y0, bom_uc, col=MUTED, gid=""):
    """Paletli vinç silueti: gövde x0,y0 (zemin); bom ucu (x,y)."""
    bx, by = bom_uc
    i = f'id="{gid}"' if gid else ""
    return (f'<g {i}><rect x="{x0-46}" y="{y0-34}" width="92" height="34" rx="6" fill="{col}" opacity=".85"/>'
            f'<rect x="{x0-30}" y="{y0-62}" width="44" height="30" rx="4" fill="{col}" opacity=".85"/>'
            f'<line x1="{x0}" y1="{y0-50}" x2="{bx}" y2="{by}" stroke="{col}" stroke-width="7" stroke-linecap="round"/>'
            f'<line x1="{bx}" y1="{by}" x2="{bx}" y2="{by+46}" stroke="{col}" stroke-width="2"/>'
            f'<path d="M{bx-7},{by+46} L{bx+7},{by+46} L{bx},{by+58} Z" fill="{col}"/></g>')


def eyfel(cx, base, h, col=MUTED, op=.7):
    w = h * .37
    d = (f"M{cx-w/2:.1f},{base} Q{cx-w*.22:.1f},{base-h*.25:.1f} {cx-w*.12:.1f},{base-h*.33:.1f} L{cx-w*.04:.1f},{base-h*.75:.1f} "
         f"L{cx-1.5:.1f},{base-h:.1f} L{cx+1.5:.1f},{base-h:.1f} L{cx+w*.04:.1f},{base-h*.75:.1f} L{cx+w*.12:.1f},{base-h*.33:.1f} "
         f"Q{cx+w*.22:.1f},{base-h*.25:.1f} {cx+w/2:.1f},{base} L{cx+w*.2:.1f},{base} Q{cx},{base-h*.16:.1f} {cx-w*.2:.1f},{base} Z")
    return (f'<path d="{d}" fill="{col}" opacity="{op}"/>'
            f'<line x1="{cx-w*.16:.1f}" y1="{base-h*.33:.1f}" x2="{cx+w*.16:.1f}" y2="{base-h*.33:.1f}" stroke="{BG}" stroke-width="3"/>'
            f'<line x1="{cx-w*.07:.1f}" y1="{base-h*.6:.1f}" x2="{cx+w*.07:.1f}" y2="{base-h*.6:.1f}" stroke="{BG}" stroke-width="2"/>')


def anahtar(cx, cy, col=ICE):
    return (f'<g transform="translate({cx},{cy}) rotate(-45)"><rect x="-4" y="-2" width="8" height="40" rx="3" fill="{col}"/>'
            f'<path d="M-14,-10 A16,16 0 1 1 14,-10 L6,-10 L6,-22 L-6,-22 L-6,-10 Z" fill="{col}"/></g>')


# ---------------------------------------------------------------- PANELLER (830 × 600, sayfada y 440–1040)
G0 = 580            # zemin (panel y)
PX = 1.5            # px / metre (B1–B2)


def Y(m, px=PX, g=G0):
    return g - m * px


def p1():
    cx, hub, tip = 300, Y(300), Y(365)
    return svg(f'''
  <line x1="0" y1="{G0}" x2="830" y2="{G0}" stroke="{MUTED}" stroke-width="2"/>
  {kafes(cx, hub + 14, G0, 16, 70)}
  {nasel(cx, hub)}
  {rotor(cx, hub, 63 * PX, "r1")}
  <g id="olc1"><line x1="560" y1="{G0}" x2="560" y2="{tip:.1f}" stroke="{LINE}" stroke-width="2"/>
    <line x1="{cx+60}" y1="{hub:.1f}" x2="600" y2="{hub:.1f}" stroke="{ICE}" stroke-width="2" stroke-dasharray="8 6"/>
    {mono(612, hub + 8, 22, L("GÖBEK 300 m", "HUB 300 m"), ICE)}
    <line x1="{cx}" y1="{tip:.1f}" x2="600" y2="{tip:.1f}" stroke="{MUTED}" stroke-width="2" stroke-dasharray="4 6"/></g>
  <text id="say1" x="612" y="{tip + 14:.1f}" class="disp" font-size="56" fill="{INK}" {HALO}>0 m</text>
  <g id="jen1" opacity="0"><rect x="{cx-18}" y="{hub-11:.1f}" width="34" height="22" rx="4" fill="{AMBER}"/>
    <path d="M{cx-120},{hub+20:.1f} L{cx-120},{hub+150:.1f} M{cx-134},{hub+132:.1f} L{cx-120},{hub+152:.1f} L{cx-106},{hub+132:.1f}" fill="none" stroke="{AMBER}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="{cx-120}" y="{hub+10:.1f}" text-anchor="middle" class="disp" font-size="48" fill="{AMBER}" {HALO}>?</text></g>''')


def p2():
    cx, hub, tip = 520, Y(300), Y(365)
    return svg(f'''
  <line x1="0" y1="{G0}" x2="830" y2="{G0}" stroke="{MUTED}" stroke-width="2"/>
  <g id="eyf2" opacity="0">{eyfel(200, G0, 330 * PX)}{mono(200, G0 - 330 * PX - 22, 20, L("EYFEL KULESİ", "EIFFEL TOWER"), MUTED, "middle")}</g>
  {kafes(cx, hub + 14, G0, 16, 70)}
  {nasel(cx, hub)}
  {rotor(cx, hub, 63 * PX, "r2")}
  <g id="pin2"><circle cx="{cx}" cy="{G0}" r="9" fill="{ICE}"/>
    {mono(cx, G0 + 34, 20, L("SCHIPKAU · ALMANYA", "SCHIPKAU · GERMANY"), ICE, "middle")}</g>
  <g id="hub2" opacity="0">{mono(cx + 120, hub + 8, 22, L("GÖBEK 300 m", "HUB 300 m"), INK)}
    <line x1="{cx+40}" y1="{hub:.1f}" x2="{cx+110}" y2="{hub:.1f}" stroke="{INK}" stroke-width="2" stroke-dasharray="6 6"/></g>
  <g id="tip2" opacity="0">{mono(cx + 120, tip + 8, 22, L("KANAT UCU 365 m", "TIP 365 m"), ICE)}
    <line x1="{cx+10}" y1="{tip:.1f}" x2="{cx+110}" y2="{tip:.1f}" stroke="{ICE}" stroke-width="2" stroke-dasharray="6 6"/></g>''')


P3 = 1.42  # px / metre (B3)


def p3():
    g = 560
    a, b = 230, 640
    ha, hb = g - 300 * P3, g - 166 * P3
    R = 63 * P3
    band = (f'<g id="band3" opacity="0"><line x1="{b+80}" y1="{g-87*P3:.1f}" x2="{b+80}" y2="{g-166*P3:.1f}" stroke="{ELEC}" stroke-width="4"/>'
            f'<line x1="{b+70}" y1="{g-87*P3:.1f}" x2="{b+90}" y2="{g-87*P3:.1f}" stroke="{ELEC}" stroke-width="4"/>'
            f'<line x1="{b+70}" y1="{g-166*P3:.1f}" x2="{b+90}" y2="{g-166*P3:.1f}" stroke="{ELEC}" stroke-width="4"/>'
            f'{mono(b+100, g-166*P3+8, 20, "166 m", ELEC)}{mono(b+100, g-87*P3+8, 20, "87 m", ELEC)}</g>')
    cap = lambda x, y, tid: (f'<g id="{tid}" opacity="0"><line x1="{x-R:.1f}" y1="{y:.1f}" x2="{x+R:.1f}" y2="{y:.1f}" stroke="{ICE}" stroke-width="3"/>'
                             f'<line x1="{x-R:.1f}" y1="{y-10:.1f}" x2="{x-R:.1f}" y2="{y+10:.1f}" stroke="{ICE}" stroke-width="3"/>'
                             f'<line x1="{x+R:.1f}" y1="{y-10:.1f}" x2="{x+R:.1f}" y2="{y+10:.1f}" stroke="{ICE}" stroke-width="3"/>'
                             f'{mono(x, y - 14, 22, "126 m", ICE, "middle")}</g>')
    return svg(f'''
  <line x1="0" y1="{g}" x2="830" y2="{g}" stroke="{MUTED}" stroke-width="2"/>
  {kafes(a, ha + 14, g, 16, 64)}{nasel(a, ha)}{rotor(a, ha, R, "r3a")}
  <path d="M{b-6},{hb+12:.1f} L{b+6},{hb+12:.1f} L{b+13},{g} L{b-13},{g} Z" fill="{INK}" opacity=".85"/>{nasel(b, hb)}{rotor(b, hb, R, "r3b")}
  {cap(a, ha - R - 26, "cap3a")}{cap(b, hb - R - 26, "cap3b")}
  <g id="esit3" opacity="0"><rect x="{(a+b)/2-34:.0f}" y="{(ha+hb)/2-18:.1f}" width="68" height="11" rx="5" fill="{AMBER}"/>
    <rect x="{(a+b)/2-34:.0f}" y="{(ha+hb)/2+7:.1f}" width="68" height="11" rx="5" fill="{AMBER}"/></g>
  {band}
  {mono(a, g + 34, 20, "VENSYS 126 · 3,8 MW" if TR else "VENSYS 126 · 3.8 MW", MUTED, "middle")}
  {mono(b, g + 34, 20, "VESTAS V126", MUTED, "middle")}''')


def p4():
    oklar = ""
    for k, (y, ln) in enumerate([(500, 90), (400, 160), (300, 230), (200, 290), (100, 340)]):
        oklar += (f'<g class="ok4" opacity="0"><line x1="160" y1="{y}" x2="{160+ln}" y2="{y}" stroke="{ELEC}" stroke-width="5" stroke-linecap="round"/>'
                  f'<path d="M{150+ln},{y-10} L{164+ln},{y} L{150+ln},{y+10}" fill="none" stroke="{ELEC}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>')
    return svg(f'''
  <line x1="120" y1="560" x2="120" y2="40" stroke="{MUTED}" stroke-width="2"/>
  <path d="M110,56 L120,36 L130,56" fill="none" stroke="{MUTED}" stroke-width="2"/>
  {mono(140, 34, 20, L("YÜKSEKLİK ↑", "HEIGHT ↑"), MUTED)}
  {mono(140, 590, 18, L("RÜZGÂR · TEMSİLÎ ÇİZİM", "WIND · ILLUSTRATIVE"), MUTED)}
  {oklar}
  <g id="iki4" opacity="0">{kart(530, 170, 300, 250)}
    <text x="680" y="300" text-anchor="middle" class="disp" font-size="96" fill="{AMBER}">≈2×</text>
    {mono(680, 346, 20, L("ENERJİ", "ENERGY"), INK, "middle")}
    {mono(680, 380, 15, L("AYNI ROTOR ÇAPINA GÖRE", "VS. SAME ROTOR SIZE"), MUTED, "middle")}</g>
  <g id="tah4" opacity="0"><rect x="530" y="436" width="300" height="76" rx="12" fill="none" stroke="{INK}" stroke-width="2"/>
    {mono(680, 467, 18, L("FİRMA TAHMİNİ", "DEVELOPER ESTIMATE"), INK, "middle")}
    {mono(680, 497, 16, L("HENÜZ KANITLANMADI", "NOT YET PROVEN"), MUTED, "middle")}</g>''')


def p5():
    g, hub = 560, 560 - 300 * 1.5 + 20   # 300 m çizgisi
    return svg(f'''
  <line x1="0" y1="{g}" x2="830" y2="{g}" stroke="{MUTED}" stroke-width="2"/>
  <line x1="0" y1="{hub}" x2="830" y2="{hub}" stroke="{ICE}" stroke-width="2" stroke-dasharray="8 6"/>
  {mono(0, hub - 16, 22, L("300 m · MAKİNE DAİRESİ", "300 m · NACELLE"), ICE)}
  {kafes(600, hub + 14, g, 16, 64, op=.45)}{nasel(600, hub, ICE)}
  <g id="vinc5">{vinc(240, g, (470, 300))}</g>
  <g id="bos5" opacity="0"><line x1="470" y1="290" x2="470" y2="{hub+8}" stroke="{AMBER}" stroke-width="4" stroke-dasharray="10 8"/>
    {mono(490, 230, 24, L("YETİŞMİYOR", "CAN'T REACH"), AMBER)}</g>
  <g id="yok5" opacity="0">{kart(0, 0, 620, 70)}{mono(24, 46, 24, L("BU YÜKSEKLİKTE VİNÇ: YOK", "CRANE FOR THIS HEIGHT: NONE"), INK)}</g>''')


def p6():
    g = 560
    dis_top, ic_hi, ic_lo = 180, 70, 330      # dış kafes tepesi; iç kulenin üst/alt nasel konumu
    ic = (f'<g id="ic6"><rect x="590" y="{ic_hi+14}" width="20" height="{g-ic_hi-14}" fill="{INK}" opacity=".9"/>'
          f'{nasel(600, ic_hi, ICE)}</g>')
    return svg(f'''
  <line x1="0" y1="{g}" x2="830" y2="{g}" stroke="{MUTED}" stroke-width="2"/>
  <clipPath id="cl6"><rect x="0" y="0" width="830" height="{g}"/></clipPath>
  <g clip-path="url(#cl6)">{ic}</g>
  {kafes(600, dis_top, g, 70, 120, MUTED, .9)}
  {mono(690, dis_top - 14, 18, L("DIŞ KAFES · SABİT", "OUTER LATTICE · FIXED"), MUTED)}
  {mono(640, ic_hi + 8, 18, L("İÇ KULE", "INNER TOWER"), ICE, extra='id="icy6"')}
  <g id="vinc6" opacity="0">{vinc(300, g, (560, ic_lo - 60))}</g>
  <g id="is6" opacity="0">{anahtar(700, ic_lo + 70)}</g>
  <g id="ok6"><path d="M780,140 L780,300 M766,284 L780,302 L794,284" fill="none" stroke="{ICE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".0"/></g>
  {mono(0, 40, 20, L("TELESKOPİK KULE", "TELESCOPING TOWER"), MUTED)}''')


def p7():
    return svg(f'''
  <path d="M250,40 L350,40 L380,560 L220,560 Z" fill="none" stroke="{MUTED}" stroke-width="3"/>
  <line x1="300" y1="40" x2="300" y2="560" stroke="{LINE}" stroke-width="2" stroke-dasharray="10 10"/>
  <g id="a7">{siluet(270, 470)}</g>
  <g id="b7" opacity="0">{siluet(330, 470, ICE)}</g>
  <text id="iki7" x="520" y="360" class="disp" font-size="220" fill="{AMBER}" opacity="0" {HALO}>2</text>
  {mono(520, 420, 22, L("EN AZ İKİ KİŞİ", "AT LEAST TWO"), INK)}''', h=600)


def p8():
    return svg(f'''
  {kart(0, 0, 830, 220)}
  {mono(28, 50, 20, "VESTAS V126 · " + L("SAHADAN", "FROM THE FIELD"), MUTED)}
  {mono(28, 112, 30, L("ROTOR ÇAPI", "ROTOR") + " · 126 m", INK)}
  {mono(28, 170, 30, L("GÖBEK", "HUB") + " · 87–166 m", INK)}
  <foreignObject x="0" y="270" width="830" height="330"><div xmlns="http://www.w3.org/1999/xhtml" class="son8">
    <div class="adres"><span id="adr8">{L("sonersoylu.com/turbinler", "sonersoylu.com/en")}</span></div>
    <div class="kim">The Turbine Tech · Soner Soylu — {L("Rüzgâr Türbini Saha Servis Teknisyeni", "Wind Turbine Field Service Technician")}</div>
    <div class="cta8"><span class="pill">{L("Sıradaki soru için takip et", "Follow for the next question")}</span></div></div></foreignObject>''')


PANELS = [p1, p2, p3, p4, p5, p6, p7, p8]
BASLIK = [
    (L("DÜNYA REKORU · 365 m", "WORLD RECORD · 365 m"), L("Dünyanın en <i>yüksek</i> türbini.", "The world's <i>tallest</i> turbine.")),
    (L("SCHIPKAU · ALMANYA", "SCHIPKAU · GERMANY"), L("Eyfel Kulesi'nden <i>yüksek</i>.", "Taller than the <i>Eiffel</i> Tower.")),
    (L("AYNI ROTOR · 126 m", "SAME ROTOR · 126 m"), L("Rotor aynı, <i>kule</i> farklı.", "Same rotor, different <i>tower</i>.")),
    (L("NEDEN BU KADAR YÜKSEK", "WHY SO TALL"), L("Yukarıda rüzgâr <i>daha düzenli</i>.", "Higher up, wind is <i>steadier</i>.")),
    (L("TEKNİSYENİN SORUSU", "A TECHNICIAN'S QUESTION"), L("Peki <i>bakım</i>?", "What about <i>maintenance</i>?")),
    (L("ÇÖZÜM", "THE FIX"), L("Kule <i>kendini</i> indirir.", "The tower <i>lowers</i> itself.")),
    (L("KURAL DEĞİŞMEZ", "THE RULE STAYS"), L("Kuleye asla <i>tek başına</i> çıkılmaz.", "Never climb <i>alone</i>.")),
    ("THE TURBINE TECH", ""),
]

# ---------------------------------------------------------------- ANİMASYON (mutlak saniye)
J = []
A = {  # dil başına kelime çapaları (konuşulan biçim, kelime.json)
    "tr": dict(b1="indirirdin", b2h="Göbek", b2t="kanat", b2e="Eyfel", b3a="rotoru", b3b="öyle", b3c="seksen", b4o="Yükseklerde",
               b4i="iki", b4t="tahmin", b5v="vinç", b6d="indirilir", b6v="Vinç", b6y="yükseltilir", b7k="kuleye", b7i="iki",
               b8a="Soner", b8k="Dı", b8c="Sıradaki"),
    "en": dict(b1="down", b2h="Hub", b2t="tip", b2e="Eiffel", b3a="rotor", b3b="Same", b3c="eighty-seven", b4o="Winds",
               b4i="twice", b4t="projection", b5v="crane", b6d="down", b6v="crane", b6y="up", b7k="never", b7i="two",
               b8a="Soner", b8k="The", b8c="Follow"),
}[DIL]


def op(sel, at, d=.45):
    J.append(f'tl.fromTo("{sel}",{{opacity:0}},{{opacity:1,duration:{d},ease:E}},{r(at)});')


def ciz(sel, at, d, ease="power1.inOut"):
    J.append(f'(()=>{{const el=document.querySelector("{sel}");const L=el.getTotalLength();'
             f'tl.fromTo(el,{{strokeDasharray:L,strokeDashoffset:L}},{{strokeDashoffset:0,duration:{d},ease:"{ease}"}},{r(at)});}})();')


def don(sel, at, d, deg, ease="none"):
    J.append(f'tl.to("{sel}",{{rotation:"+={deg}",duration:{d},ease:"{ease}",svgOrigin:"0 0"}},{r(at)});')


# rotorlar sakin döner (MOTION B)
for b, ids in {1: ["#r1"], 2: ["#r2"], 3: ["#r3a", "#r3b"]}.items():
    s, e = S[b]
    for i in ids:
        don(i, s, e - s, round(40 * (e - s)))
# B1 — kule alttan çizilir, sayaç 0 → 365 (K-004), "indirirdin"de jeneratör + aşağı ok
J.append(f'(()=>{{const o={{v:0}};const el=document.querySelector("#say1");'
         f'tl.fromTo(o,{{v:0}},{{v:365,duration:1.8,ease:"power2.out",onUpdate:()=>{{el.textContent=Math.round(o.v)+" m";}}}},0.05);}})();')
op("#jen1", t(1, A["b1"]), .35)
# B2 — Eyfel silueti, göbek ve uç etiketleri sözle
op("#hub2", t(2, A["b2h"]), .35)
op("#tip2", t(2, A["b2t"]), .35)
op("#eyf2", t(2, A["b2e"]), .5)
# B3 — iki rotor ölçüsü, "=" ve V126 göbek bandı
op("#cap3a", t(3, A["b3a"]), .35)
op("#cap3b", t(3, A["b3b"]), .35)
op("#esit3", t(3, A["b3b"]), .35)
op("#band3", t(3, A["b3c"]), .4)
# B4 — rüzgâr okları yükseldikçe uzar; ≈2× ve tahmin damgası
J.append(f'tl.fromTo("#p4 .ok4",{{opacity:0,x:-30}},{{opacity:1,x:0,duration:.45,ease:E,stagger:.18}},{r(t(4, A["b4o"]))});')
op("#iki4", t(4, A["b4i"]), .4)
op("#tah4", t(4, A["b4t"]), .35)
# B5 — vinç bomu kalkar ama yetişmez
J.append(f'tl.fromTo("#vinc5",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.6,ease:E}},{r(S[5][0] + .2)});')
op("#bos5", t(5, A["b5v"]), .35)
op("#yok5", t(5, A["b5v"]) + .4, .35)
# B6 — iç kule iner → vinç yetişir → iş → kule yükselir
dy = 330 - 70
J.append(f'tl.to(["#ic6","#icy6"],{{y:{dy},duration:1.4,ease:"power2.inOut"}},{r(t(6, A["b6d"]) - .2)});')
op("#vinc6", t(6, A["b6v"], 1 if TR else 1), .4)
op("#is6", t(6, A["b6v"]) + .5, .3)
J.append(f'tl.to("#is6",{{opacity:0,duration:.3}},{r(t(6, A["b6y"]) - .3)});')
J.append(f'tl.to(["#ic6","#icy6"],{{y:0,duration:1.2,ease:"power2.inOut"}},{r(t(6, A["b6y"]) - .3)});')
J.append(f'tl.to("#vinc6",{{opacity:.35,duration:.4}},{r(t(6, A["b6y"]) - .3)});')
# B7 — ikinci kişi + "2"
op("#b7", t(7, A["b7k"]), .4)
op("#iki7", t(7, A["b7i"]), .4)
# B8 — adres maskeyle, kanal + CTA
J.append(f'tl.fromTo("#adr8",{{clipPath:"inset(0 100% 0 0)"}},{{clipPath:"inset(0 0% 0 0)",duration:.6,ease:E}},{r(t(8, A["b8a"]))});')
J.append(f'tl.fromTo("#p8 .kim",{{opacity:0}},{{opacity:1,duration:.45}},{r(t(8, A["b8k"]))});')
J.append(f'tl.fromTo("#p8 .cta8",{{opacity:0,y:20}},{{opacity:1,y:0,duration:.5,ease:E}},{r(t(8, A["b8c"]))});')

# ---------------------------------------------------------------- ALTYAZI (karaoke) + SRT
BIR = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
ON = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]


def sayi(n):
    n = int(n); y, o, b = n // 100, n // 10 % 10, n % 10
    return " ".join(w for w in [("" if y < 2 else BIR[y]) + (" yüz" if y else ""), ON[o], BIR[b]] if w.strip()).strip() or "sıfır"


# konuşulan metin (metin.py varyantı) → ekranda/SRT'de görünen biçim
GOSTER = {
 "tr": {
  "Dünyanın en yüksek türbini üç yüz altmış beş metre. Sen olsan, üç yüz metrede arızalanan jeneratörü nasıl indirirdin?":
  "Dünyanın en yüksek türbini 365 metre. Sen olsan, 300 metrede arızalanan jeneratörü nasıl indirirdin?",
  "Almanya, Şipkau. Göbek üç yüz metrede, kanat ucu üç yüz altmış beşte. Eyfel Kulesinden yüksek.":
  "Almanya, Schipkau. Göbek 300 metrede, kanat ucu 365'te. Eyfel Kulesi'nden yüksek.",
  "Almanya, Şipkau. Göbek üç yüz metrede, kanat ucu üç yüz altmış beş metrede. Eyfel Kulesinden yüksek.":
  "Almanya, Schipkau. Göbek 300 metrede, kanat ucu 365 metrede. Eyfel Kulesi'nden yüksek.",
  "Bana ilginç gelen şu: rotoru yüz yirmi altı metre. Bakımını yaptığım Vestas Vi yüz yirmi altı modelinin rotoru da öyle. Ama onun göbeği, sürümüne göre seksen yedi ile yüz altmış altı metre arasında.":
  "Bana ilginç gelen şu: rotoru 126 metre. Bakımını yaptığım Vestas V126 modelinin rotoru da öyle. Ama onun göbeği, sürümüne göre 87 ile 166 metre arasında.",
  "Kule boyu değişir, kural değişmez: kuleye asla tek başınıza çıkmazsınız. En az iki kişi.":
  "Kule boyu değişir, kural değişmez: kuleye asla tek başınıza çıkmazsınız. En az iki kişi.",
  "Vi yüz yirmi altı modelinin tüm verisi, Soner Soylu nokta kom sitesinde. Dı Törbayn Tek. Sıradaki soru için. Takip et.":
  "V126 modelinin tüm verisi, sonersoylu.com sitesinde. The Turbine Tech. Sıradaki soru için takip et.",
 },
 "en": {},
}[DIL]
OZEL = {"sonersoylu.com": 4, "sonersoylu.com/en.": 4}


def kac(tok):
    c = tok.rstrip(".,;:?!")
    if c in OZEL:
        return OZEL[c]
    if c in EN_OZEL:
        return EN_OZEL[c]
    rak = re.findall(r"\d+", c)
    if not rak:
        return 1
    ek = re.sub(r"[\d\W_]", "", c) and not re.match(r"^\d+'", c)   # "365'te" → ek son kelimeye yapışık
    return sum(len(sayi(d).split()) for d in rak) + (1 if ek else 0)


EN_OZEL = {}
if not TR:
    sys.path.insert(0, os.path.join(os.path.dirname(D), "turbin-365-en"))
    from metin import GOSTER_EN, EN_OZEL as _EO   # noqa: E402  (turbin-365-en/metin.py)
    GOSTER.update(GOSTER_EN); EN_OZEL.update(_EO)

TOK = []  # (beat, gösterim, s, e)
for b in sorted(S):
    ks, i = KB[b], 0
    sp = next(z["metin"] for z in Z if z["beat"] == b)
    for tok in GOSTER.get(sp, sp).split():
        n = kac(tok)
        TOK.append((b, tok, ks[i]["s"], ks[i + n - 1]["e"])); i += n
    assert i == len(ks), (b, i, len(ks))

cumle, cur = [], []
for x in TOK:
    cur.append(x)
    if re.search(r"[.?!:;]$", x[1]):
        cumle.append(cur); cur = []
if cur:
    cumle.append(cur)
PARCA = []
for c in cumle:
    n = max(math.ceil(len(c) / 6), 1)
    while True:
        boy = [len(c) // n + (1 if k < len(c) % n else 0) for k in range(n)]
        ps, j = [], 0
        for bb in boy:
            ps.append(c[j:j + bb]); j += bb
        if all(len(" ".join(x[1] for x in p)) <= 34 for p in ps):
            break
        n += 1
    PARCA += ps
cap_html, wid = "", 0
for k, p in enumerate(PARCA):
    st = 0.0 if k == 0 else p[0][2]
    son = PARCA[k + 1][0][2] if k + 1 < len(PARCA) and PARCA[k + 1][0][2] - p[-1][3] < 0.8 else p[-1][3] + 0.35
    son = min(son, DUR)
    sp = ""
    for j, x in enumerate(p):
        sp += f'<span class="cw" id="w{wid}">{x[1]}</span> '
        nxt = p[j + 1][2] if j + 1 < len(p) else x[3] + 0.12
        J.append(f'tl.set("#w{wid}",{{color:"{ICE}"}},{r(x[2])});tl.set("#w{wid}",{{color:"{INK}"}},{r(min(nxt, son - 0.01))});')
        wid += 1
    cap_html += f'<div class="clip cap" data-start="{r(st)}" data-duration="{r(son - st)}" data-track-index="4"><div class="ct">{sp.strip()}</div></div>\n'


def srt_zaman(x):
    ms = int(round(x * 1000)); return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"


def satirla(s, n=42):
    if len(s) <= n:
        return s
    w = s.split(); best = None
    for k in range(1, len(w)):
        a, b = " ".join(w[:k]), " ".join(w[k:])
        sc = max(len(a), len(b))
        if best is None or sc < best[0]:
            best = (sc, a + "\n" + b)
    return best[1]


ipucu = []
for c in cumle:
    if len(" ".join(x[1] for x in c)) <= 84:
        ipucu.append(c); continue
    cur = []
    for x in c:
        cur.append(x)
        if re.search(r"[,;]$", x[1]) and len(" ".join(y[1] for y in cur)) >= 30:
            ipucu.append(cur); cur = []
    if cur:
        ipucu.append(cur)
srt = []
for k, c in enumerate(ipucu):
    a = c[0][2]; b = c[-1][3] + 0.25
    if k + 1 < len(ipucu):
        b = min(b, ipucu[k + 1][0][2] - 0.02)
    srt.append(f"{k+1}\n{srt_zaman(a)} --> {srt_zaman(b)}\n{satirla(' '.join(x[1] for x in c))}\n")
SRT_DIZIN = D if TR else os.path.join(os.path.dirname(D), "turbin-365-en")
open(f"{SRT_DIZIN}/{SRT_AD}", "w", encoding="utf-8").write("\n".join(srt))

# ---------------------------------------------------------------- SAYFA
uzak = "".join(turbine(cx, hy, Lp, 1920, f"bgt{i}", tw=(7, 16), op=1, color=INK)
               for i, (cx, hy, Lp) in enumerate([(170, 1540, 120), (560, 1470, 170), (930, 1590, 100)]))
panels_html = ""
for i, fn in enumerate(PANELS, 1):
    s, e = S[i]
    panels_html += f'<div id="p{i}" class="clip panel" data-start="{r(s)}" data-duration="{r(e-s)}" data-track-index="2"><div class="pin">{fn()}</div></div>\n'
beats_html = ""
for i, (lab, txt) in enumerate(BASLIK, 1):
    s, e = S[i]
    h1 = f'<h1 class="hl">{words(txt)}</h1>' if txt else ""
    beats_html += f'<div id="b{i}" class="clip beat" data-start="{r(s)}" data-duration="{r(e-s)}" data-track-index="3"><div class="bin"><div class="lab">{lab}</div>{h1}</div></div>\n'

giris = ""
for i in range(2, len(PANELS) + 1):
    s = S[i][0]
    giris += f'tl.fromTo("#b{i} .lab",{{opacity:0,y:14}},{{opacity:1,y:0,duration:.4,ease:E}},{r(s)});'
    if BASLIK[i - 1][1]:
        giris += f'tl.fromTo("#b{i} .w",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.5,ease:E,stagger:.04}},{r(s + .06)});'
    giris += f'tl.fromTo("#p{i} .pin",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.5,ease:E}},{r(s)});'

html = f'''<!doctype html>
<html lang="{DIL}" data-resolution="portrait">
<head><meta charset="UTF-8"/><meta name="viewport" content="width={W}, height={H}"/>
<title>{L("365 metrelik türbin", "Tallest turbine 365 m")}</title>
<script src="gsap.min.js"></script>
<style>
{fontface}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:{BG}}}
#root{{width:100%;height:100%;position:relative;overflow:hidden;font-family:"Geist",system-ui,sans-serif;color:{INK}}}
#bg{{position:absolute;inset:0;
 background:radial-gradient(900px 700px at 12% 8%,rgba(111,220,236,.10),transparent 60%),
  radial-gradient(800px 800px at 95% 70%,rgba(124,196,255,.06),transparent 60%),
  linear-gradient(rgba(233,237,240,.04) 1px,transparent 1px) 0 0/60px 60px,
  linear-gradient(90deg,rgba(233,237,240,.04) 1px,transparent 1px) 0 0/60px 60px,{BG}}}
#uzak{{position:absolute;left:0;top:0;width:{W}px;height:{H}px;opacity:.12}}
#grain{{position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay}}
.beat,.panel,.cap{{position:absolute;inset:0}}
.bin{{position:absolute;left:90px;top:250px;width:830px}}
.lab{{font-family:"Geist Mono",monospace;font-weight:500;font-size:26px;letter-spacing:.12em;color:{ICE};margin-bottom:20px}}
.hl{{font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:58px;line-height:1.08;letter-spacing:-.015em}}
.hl i{{font-style:italic;color:{ICE};padding-right:.07em}}
.w{{display:inline-block}}
.pin{{position:absolute;left:90px;top:440px;width:830px;height:600px}}
.psvg{{width:830px;display:block;overflow:visible}}
.mono{{font-family:"Geist Mono",monospace;font-weight:500;letter-spacing:.08em}}
.disp{{font-family:"Fraunces",Georgia,serif;font-weight:600}}
.ct{{position:absolute;left:90px;width:830px;top:1190px;transform:translateY(-50%);text-align:center;
  font-family:"Geist",sans-serif;font-weight:700;font-size:64px;line-height:1.14;color:{INK}}}
.cw{{display:inline}}
.son8{{width:830px}}
.adres{{font-family:"Geist Mono",monospace;font-weight:500;font-size:40px;letter-spacing:.02em;color:{ICE}}}
#adr8{{display:inline-block}}
.kim{{margin-top:16px;font-size:24px;font-weight:500;color:{MUTED}}}
.cta8{{margin-top:26px}}
.pill{{display:inline-block;font-weight:600;font-size:34px;padding:16px 32px;border-radius:999px;border:2px solid {ICE};color:{ICE}}}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
 <div id="bg" class="clip" data-start="0" data-duration="{DUR}" data-track-index="0"></div>
 <svg id="uzak" class="clip" data-start="0" data-duration="{DUR}" data-track-index="5" viewBox="0 0 {W} {H}">{uzak}</svg>
 <svg id="grain" class="clip" data-start="0" data-duration="{DUR}" data-track-index="1" width="{W}" height="{H}">
  <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="100%" height="100%" filter="url(#gr)"/></svg>
{panels_html}{beats_html}{cap_html}<audio id="anlatim" src="anlatim.wav" data-start="0" data-duration="{DUR}" data-track-index="10" data-volume="1"></audio>
</div>
<script>
const tl = gsap.timeline({{paused:true}});
const E = "power3.out";
{giris}
{chr(10).join(J)}
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body></html>'''
assert 'id="anlatim"' in html
open(f"{V}/index.html", "w", encoding="utf-8").write(html)
amber = {i + 1: fn().count(AMBER) for i, fn in enumerate(PANELS)}
print(f"index.html yazıldı · {DIL} · süre {DUR} sn · {len(PARCA)} altyazı parçası · {len(srt)} SRT ipucu · amber geçişi/panel {amber}")
