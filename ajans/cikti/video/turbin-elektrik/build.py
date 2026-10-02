#!/usr/bin/env python3
"""Türbin nasıl elektrik üretir — index.html üretici (MOTION.md kurallarıyla)."""
import math

W, H, DUR = 1080, 1920, 52
ICE, ELEC, AMBER = "#6FDCEC", "#7CC4FF", "#F2B233"
INK, MUTED, FAINT, LINE = "#EEF2F5", "#A3ADB5", "#76818A", "rgba(238,242,245,.14)"
SURF = "#11161A"


def blade(L):
    return (f"M0,0 C-26,-18 -24,{-L*.32:.0f} -11,{-L*.6:.0f} L-3,{-L:.0f} L3,{-L:.0f} "
            f"L8,{-L*.55:.0f} C12,{-L*.28:.0f} 15,-14 0,0 Z")


def turbine(cx, hub_y, L, ground, rid, tw=(10, 22), op=1, color=INK):
    t0, t1 = tw
    tower = f'<path d="M{cx-t0},{hub_y+10} L{cx+t0},{hub_y+10} L{cx+t1},{ground} L{cx-t1},{ground} Z" fill="{color}" opacity="{0.85*op:.2f}"/>'
    nac = f'<rect x="{cx-16}" y="{hub_y-14}" width="44" height="26" rx="8" fill="{color}" opacity="{op:.2f}"/>'
    b = blade(L)
    rotor = (f'<g transform="translate({cx},{hub_y})"><g id="{rid}">'
             + "".join(f'<path d="{b}" transform="rotate({a})" fill="{color}" opacity="{op:.2f}"/>' for a in (0, 120, 240))
             + f'<circle r="{max(6, L*0.075):.0f}" fill="{ICE}" opacity="{op:.2f}"/></g></g>')
    return tower + nac + rotor


def gear(cx, cy, r, teeth, gid, fill):
    pts = []
    n = teeth * 4
    for i in range(n):
        a = 2 * math.pi * i / n
        rr = r + (9 if (i % 4) in (1, 2) else -3)
        pts.append(f"{cx + rr*math.cos(a):.1f},{cy + rr*math.sin(a):.1f}")
    return (f'<g id="{gid}"><polygon points="{" ".join(pts)}" fill="{fill}"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.38:.0f}" fill="#07090B"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.14:.0f}" fill="{fill}"/></g>')


def airfoil(cx, cy, chord, ang):
    # NACA 4412 benzeri profil
    m, p, t = .04, .4, .12
    up, lo = [], []
    for i in range(61):
        x = (1 - math.cos(math.pi * i / 60)) / 2
        yt = 5 * t * (.2969*math.sqrt(x) - .126*x - .3516*x**2 + .2843*x**3 - .1015*x**4)
        yc = m/p**2*(2*p*x - x**2) if x < p else m/(1-p)**2*((1-2*p) + 2*p*x - x**2)
        up.append((x, yc + yt)); lo.append((x, yc - yt))
    pts = up + lo[::-1]
    ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    out = []
    for x, y in pts:
        X, Y = (x - .4) * chord, -y * chord
        out.append(f"{cx + X*ca - Y*sa:.1f},{cy + X*sa + Y*ca:.1f}")
    return "M" + " L".join(out) + " Z"


def streamline(y0, cy, cx, k):
    pts = []
    for i in range(84):
        x = i * 10
        d = (x - cx) / 230
        bump = k * math.exp(-d*d)
        pts.append(f"{x},{y0 - bump:.1f}")
    return "M" + " L".join(pts)


def fmt_wind(v):
    return 3000 * min(1, (v/12)**3) if 3 <= v <= 25 else 0


# ---------- PANELLER ----------
def panel_1():
    houses = ""
    for i in range(5):
        x = 480 + i*70
        y = 600 - (i % 2)*28
        houses += (f'<g class="ev"><path d="M{x},{y} L{x+28},{y-26} L{x+56},{y} L{x+56},{690} L{x},{690} Z" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>'
                   f'<rect class="pencere" x="{x+12}" y="{y+18}" width="12" height="14" fill="{ICE}" opacity="0"/>'
                   f'<rect class="pencere" x="{x+32}" y="{y+18}" width="12" height="14" fill="{ICE}" opacity="0"/>'
                   f'<rect class="pencere" x="{x+12}" y="{y+46}" width="12" height="14" fill="{ICE}" opacity="0"/>'
                   f'<rect class="pencere" x="{x+32}" y="{y+46}" width="12" height="14" fill="{ICE}" opacity="0"/></g>')
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  <line x1="0" y1="690" x2="830" y2="690" stroke="{LINE}" stroke-width="2"/>
  {turbine(270, 250, 225, 690, "rotor1", tw=(12, 26))}
  <g id="kablo1" opacity="0"><path d="M296,688 C380,700 420,700 470,690" stroke="{ICE}" stroke-width="3" fill="none" stroke-dasharray="10 10"/></g>
  {houses}
  <g id="sayac1">
    <rect x="560" y="60" width="250" height="190" rx="18" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>
    <text x="585" y="105" class="mono" font-size="22" fill="{MUTED}">ROTOR DEVRİ</text>
    <text id="sayi1" x="585" y="205" class="disp" font-size="96" fill="{AMBER}">0</text>
    <text x="700" y="205" class="mono" font-size="26" fill="{MUTED}">d/dk</text>
  </g>
</svg>'''


def panel_2():
    cx, cy = 415, 380
    lines = ""
    for i, y0 in enumerate([150, 215, 280, 330, 440, 500, 570, 635]):
        above = y0 < cy
        k = (120 - abs(y0 - cy) * .35) if above else (30 - abs(y0 - cy)*.05)
        lines += f'<path class="akis" d="{streamline(y0, cy, cx, k)}" stroke="{ELEC if above else MUTED}" stroke-opacity="{.75 if above else .45}" stroke-width="3" fill="none" stroke-dasharray="26 22"/>'
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  <defs><radialGradient id="dusuk"><stop offset="0" stop-color="{ICE}" stop-opacity=".55"/><stop offset="1" stop-color="{ICE}" stop-opacity="0"/></radialGradient></defs>
  <ellipse id="basinc" cx="{cx-20}" cy="{cy-110}" rx="260" ry="95" fill="url(#dusuk)" opacity="0"/>
  {lines}
  <path d="{airfoil(cx, cy, 520, -8)}" fill="{INK}"/>
  <g id="kaldirma" transform="translate({cx-30},{cy-40})">
    <g id="kaldirmaOk"><line x1="0" y1="0" x2="0" y2="-215" stroke="{ICE}" stroke-width="8"/><path d="M-20,-205 L0,-245 L20,-205 Z" fill="{ICE}"/></g>
  </g>
  <text x="20" y="60" class="mono" font-size="22" fill="{MUTED}">RÜZGÂR →</text>
  <text id="kaldirmaYazi" x="{cx+10}" y="{cy-250}" class="mono" font-size="22" fill="{ICE}" stroke="#07090B" stroke-width="8" stroke-linejoin="round" paint-order="stroke" opacity="0">KALDIRMA KUVVETİ</text>
  <text id="dusukYazi" x="{cx-200}" y="{cy-215}" class="mono" font-size="22" fill="{ICE}" stroke="#07090B" stroke-width="8" stroke-linejoin="round" paint-order="stroke" opacity="0">DÜŞÜK BASINÇ</text>
  <text id="yuksekYazi" x="{cx-170}" y="{cy+120}" class="mono" font-size="22" fill="{MUTED}" stroke="#07090B" stroke-width="8" stroke-linejoin="round" paint-order="stroke" opacity="0">YÜKSEK BASINÇ</text>
  <g id="donus" opacity="0">
    <path d="M690,600 A120,120 0 0 0 790,470" stroke="{AMBER}" stroke-width="7" fill="none"/>
    <path d="M770,462 L798,440 L808,478 Z" fill="{AMBER}"/>
    <text x="640" y="660" class="mono" font-size="22" fill="{AMBER}">DÖNÜŞ</text>
  </g>
</svg>'''


def panel_3():
    blades = "".join(f'<rect x="-9" y="-88" width="18" height="70" rx="8" fill="{INK}" transform="rotate({a})"/>' for a in (0, 120, 240))
    gen_lines = "".join(f'<line x1="0" y1="-62" x2="0" y2="62" stroke="{ELEC}" stroke-width="5" transform="rotate({a})"/>' for a in (0, 60, 120))
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  <rect x="40" y="150" width="770" height="300" rx="40" fill="none" stroke="{LINE}" stroke-width="2" stroke-dasharray="8 8"/>
  <g transform="translate(95,300)"><g id="gobek">{blades}<circle r="38" fill="{SURF}" stroke="{INK}" stroke-width="5"/><circle r="10" fill="{ICE}"/></g></g>
  <rect x="135" y="288" width="150" height="24" rx="6" fill="{MUTED}"/>
  <rect x="285" y="180" width="235" height="240" rx="18" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>
  {gear(372, 300, 78, 24, "disliB", INK)}
  {gear(474, 300, 30, 9, "disliK", ICE)}
  <rect x="520" y="292" width="70" height="16" rx="5" fill="{MUTED}"/>
  <rect x="590" y="200" width="200" height="200" rx="18" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>
  <g transform="translate(690,300)"><circle r="72" fill="none" stroke="{ELEC}" stroke-width="3" opacity=".6"/><g id="jenRotor">{gen_lines}</g><circle r="12" fill="{ICE}"/></g>
  <text x="60" y="135" class="mono" font-size="20" fill="{MUTED}">GÖBEK</text>
  <text x="300" y="135" class="mono" font-size="20" fill="{MUTED}">DİŞLİ KUTUSU</text>
  <text x="610" y="135" class="mono" font-size="20" fill="{MUTED}">JENERATÖR</text>
  <text x="190" y="345" class="mono" font-size="18" fill="{FAINT}">ANA MİL</text>
  <g>
    <rect x="40" y="510" width="360" height="170" rx="18" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>
    <text x="70" y="555" class="mono" font-size="22" fill="{MUTED}">ROTOR</text>
    <text x="70" y="645" class="disp" font-size="78" fill="{INK}">14</text>
    <text x="175" y="645" class="mono" font-size="24" fill="{MUTED}">d/dk</text>
    <rect x="430" y="510" width="380" height="170" rx="18" fill="{SURF}" stroke="{ICE}" stroke-width="2"/>
    <text x="460" y="555" class="mono" font-size="22" fill="{ICE}">JENERATÖR</text>
    <text id="sayi3" x="460" y="645" class="disp" font-size="78" fill="{ICE}">~14</text>
    <text x="717" y="645" class="mono" font-size="24" fill="{MUTED}">d/dk</text>
  </g>
</svg>'''


def panel_4():
    coils = ""
    for i in range(6):
        a = i * 60
        coils += f'<g transform="rotate({a})"><rect x="-26" y="-205" width="52" height="58" rx="10" fill="{ELEC}" opacity=".85"/>' \
                 + "".join(f'<line x1="-26" y1="{-196 + j*12}" x2="26" y2="{-196 + j*12}" stroke="#07090B" stroke-width="3"/>' for j in range(4)) + "</g>"
    sine = "M" + " L".join(f"{470 + i*3.6:.1f},{330 - 120*math.sin(i*3.6/120*2*math.pi):.1f}" for i in range(101))
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  <g transform="translate(230,330)">
    <circle r="225" fill="none" stroke="{LINE}" stroke-width="2"/>
    <circle r="182" fill="none" stroke="{MUTED}" stroke-width="18" opacity=".35"/>
    {coils}
    <g id="miknatis">
      <path d="M-120,0 A120,120 0 0 1 120,0 Z" fill="{ICE}"/>
      <path d="M-120,0 A120,120 0 0 0 120,0 Z" fill="{MUTED}"/>
      <text x="0" y="-45" text-anchor="middle" class="disp" font-size="56" fill="#07090B">N</text>
      <text x="0" y="85" text-anchor="middle" class="disp" font-size="56" fill="#07090B">S</text>
    </g>
  </g>
  <line x1="470" y1="330" x2="830" y2="330" stroke="{LINE}" stroke-width="2"/>
  <path id="sinus" d="{sine}" stroke="{ICE}" stroke-width="6" fill="none" stroke-linecap="round"/>
  <text x="470" y="160" class="mono" font-size="22" fill="{ICE}">AKIM · ~50 Hz</text>
  <text x="70" y="640" class="mono" font-size="20" fill="{MUTED}">STATOR SARGILARI</text>
  <text x="70" y="680" class="mono" font-size="20" fill="{FAINT}">DÖNEN MANYETİK ALAN</text>
</svg>'''


def panel_5():
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  <line x1="0" y1="660" x2="830" y2="660" stroke="{LINE}" stroke-width="2"/>
  <path d="M170,80 L230,80 L250,660 L150,660 Z" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <rect x="140" y="30" width="150" height="52" rx="12" fill="{INK}"/>
  <circle cx="130" cy="56" r="16" fill="{ICE}"/>
  <path d="M200,82 L200,600 L430,600" stroke="{FAINT}" stroke-width="6" fill="none"/>
  <path id="enerji" d="M200,82 L200,600 L430,600" stroke="{ICE}" stroke-width="6" fill="none" stroke-dasharray="40 60"/>
  <rect x="430" y="520" width="190" height="140" rx="14" fill="{SURF}" stroke="{ELEC}" stroke-width="3"/>
  <text x="525" y="580" text-anchor="middle" class="mono" font-size="24" fill="{ELEC}">TRAFO</text>
  <path d="M525,600 m-30,0 a15,15 0 1 0 30,0 a15,15 0 1 0 30,0" stroke="{ELEC}" stroke-width="4" fill="none"/>
  <path d="M620,590 L830,590" stroke="{FAINT}" stroke-width="6"/>
  <path id="enerji2" d="M620,590 L830,590" stroke="{AMBER}" stroke-width="6" stroke-dasharray="40 40"/>
  <g id="v660"><rect x="320" y="70" width="270" height="110" rx="16" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>
    <text x="345" y="110" class="mono" font-size="20" fill="{MUTED}">JENERATÖR ÇIKIŞI</text>
    <text x="345" y="162" class="disp" font-size="50" fill="{INK}">660 V</text></g>
  <g id="v34" opacity="0"><rect x="455" y="290" width="370" height="130" rx="16" fill="{SURF}" stroke="{AMBER}" stroke-width="2"/>
    <text x="480" y="332" class="mono" font-size="20" fill="{AMBER}">ŞEBEKEYE · ORTA GERİLİM</text>
    <text x="480" y="395" class="disp" font-size="58" fill="{AMBER}">34.500 V</text></g>
  <text x="700" y="640" class="mono" font-size="20" fill="{MUTED}">ŞEBEKE →</text>
  <text x="270" y="400" class="mono" font-size="18" fill="{FAINT}">KULE İÇİ KABLO</text>
</svg>'''


def panel_6():
    x0, x1, y0, y1 = 100, 790, 560, 80
    X = lambda v: x0 + (x1 - x0) * v / 25
    Y = lambda p: y0 - (y0 - y1) * p / 3000
    pts = []
    v = 0.0
    while v <= 25.001:
        pts.append(f"{X(v):.1f},{Y(fmt_wind(v)):.1f}")
        v += 0.1
    pts.append(f"{X(25):.1f},{Y(0):.1f}")
    curve = "M" + " L".join(pts)
    grid = ""
    for v in range(0, 26, 5):
        grid += f'<line x1="{X(v)}" y1="{y0}" x2="{X(v)}" y2="{y1}" stroke="{LINE}" stroke-width="1"/><text x="{X(v)}" y="{y0+38}" text-anchor="middle" class="mono" font-size="20" fill="{MUTED}">{v}</text>'
    for p in range(0, 3001, 1000):
        grid += f'<line x1="{x0}" y1="{Y(p)}" x2="{x1}" y2="{Y(p)}" stroke="{LINE}" stroke-width="1"/><text x="{x0-14}" y="{Y(p)+7}" text-anchor="end" class="mono" font-size="20" fill="{MUTED}">{p//1000 if p else 0}{" MW" if p == 3000 else ""}</text>'
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  {grid}
  <path id="egri" d="{curve}" stroke="{ICE}" stroke-width="6" fill="none" stroke-linejoin="round"/>
  <g id="m5" opacity="0"><line x1="{X(5)}" y1="{y0}" x2="{X(5)}" y2="{Y(fmt_wind(5))}" stroke="{ELEC}" stroke-width="3" stroke-dasharray="6 6"/><circle cx="{X(5)}" cy="{Y(fmt_wind(5))}" r="11" fill="{ELEC}"/></g>
  <g id="m10" opacity="0"><line x1="{X(10)}" y1="{y0}" x2="{X(10)}" y2="{Y(fmt_wind(10))}" stroke="{ELEC}" stroke-width="3" stroke-dasharray="6 6"/><circle cx="{X(10)}" cy="{Y(fmt_wind(10))}" r="11" fill="{ELEC}"/></g>
  <g id="kat8" opacity="0"><rect x="{X(10)-266}" y="{Y(fmt_wind(10))-154}" width="266" height="110" rx="16" fill="{SURF}" stroke="{AMBER}" stroke-width="2"/>
    <text x="{X(10)-133}" y="{Y(fmt_wind(10))-96}" text-anchor="middle" class="disp" font-size="52" fill="{AMBER}">×8</text>
    <text x="{X(10)-133}" y="{Y(fmt_wind(10))-62}" text-anchor="middle" class="mono" font-size="18" fill="{MUTED}">anma gücüne kadar</text></g>
  <text x="{x0+12}" y="{Y(820)}" class="mono" font-size="18" fill="{MUTED}">3 m/s'de başlar</text>
  <text x="{X(12)}" y="{y1-20}" class="mono" font-size="18" fill="{MUTED}">~12 m/s tam güç</text>
  <text x="{X(25)-10}" y="{Y(1500)}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">25 m/s durur</text>
  <text x="{(x0+x1)/2}" y="{y0+80}" text-anchor="middle" class="mono" font-size="20" fill="{FAINT}">RÜZGÂR HIZI (m/s) · temsili 3 MW eğrisi</text>
</svg>'''


def panel_7():
    t = ""
    for i, (cx, hy, L, op) in enumerate([(170, 330, 150, .55), (430, 250, 210, 1), (690, 360, 130, .4)]):
        t += turbine(cx, hy, L, 640, f"rotor7_{i}", tw=(8, 18), op=op)
    return f'''
<svg viewBox="0 0 830 720" class="psvg">
  <line x1="0" y1="640" x2="830" y2="640" stroke="{LINE}" stroke-width="2"/>
  {t}
</svg>'''


PANELS = [(0, 7, panel_1), (7, 19, panel_2), (19, 26, panel_3), (26, 32, panel_4),
          (32, 38.5, panel_5), (38.5, 45, panel_6), (45, 52, panel_7)]

BEATS = [
    (0, 2.5, "N117 · 3 MW TÜRBİN", "Bu kanatlar dakikada sadece <b>14 tur</b> atıyor."),
    (2.5, 7, "PEKİ", "Ama arkasında bir mahalleye yetecek elektrik var. <i>Nasıl?</i>"),
    (7, 13, "01 · RÜZGÂR", "Rüzgâr kanada çarpmaz, etrafından <b>akar</b>."),
    (13, 19, "01 · RÜZGÂR", "Uçak kanadı gibi: üstte basınç düşer, kanat <b>döner</b>."),
    (19, 26, "02 · DİŞLİ KUTUSU", "Rotor yavaş, jeneratör hızlı ister. Dişliler devri <b>~100 kat</b> artırır."),
    (26, 32, "03 · JENERATÖR", "Dönen manyetik alan, bakır sargılarda <b>akım</b> doğurur."),
    (32, 38.5, "04 · TRAFO", "Kuleden inen enerji <b>660 V'tan 34.500 V'a</b> çıkar."),
    (38.5, 45, "HIZIN KÜPÜ", "Rüzgâr 2 kat artarsa güç <b>8 kat</b> artar."),
    (45, 52, "SAHADAN ANLATAN", "Soner Soylu · <i>The Turbine Tech</i>"),
]


def words(html):
    # kelimeleri sarmala; <b>/<i> etiketlerini koru
    import re
    out = []
    for tag, inner, plain in re.findall(r"<(b|i)>(.*?)</\1>|([^<]+)", html):
        if tag:
            out.append(f'<span class="w" style="white-space:nowrap"><{tag}>{inner}</{tag}></span>')
        else:
            out += [f'<span class="w">{w}</span>' for w in plain.split()]
    res = []
    for o in out:
        if res and o in ('<span class="w">.</span>', '<span class="w">,</span>'):
            res[-1] = res[-1][:-7] + o[16:-7] + "</span>"
        else:
            res.append(o)
    return " ".join(res)


fontface = ""
for fam, files, wt, fmt in [("Fraunces", ("fraunces-latin", "fraunces-latinext"), "100 900", "woff2-variations"),
                            ("Geist", ("geist-latin", "geist-latinext"), "100 900", "woff2-variations"),
                            ("Geist Mono", ("mono-latin-500", "mono-latinext-500"), "500", "woff2")]:
    for f, rng in zip(files, ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212",
                              "U+0100-0130,U+0132-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02FF,U+1E00-1EFF,U+20A0-20AB,U+20AD-20C0")):
        fontface += f'@font-face{{font-family:"{fam}";font-weight:{wt};src:url(font/{f}.woff2) format("{fmt}");unicode-range:{rng}}}\n'

panels_html = ""
for i, (s, e, fn) in enumerate(PANELS, 1):
    panels_html += f'<div id="p{i}" class="clip panel" data-start="{s}" data-duration="{e-s}" data-track-index="2"><div class="pin">{fn()}</div></div>\n'

beats_html = ""
for i, (s, e, lab, txt) in enumerate(BEATS, 1):
    extra = ""
    if i == 9:
        extra = '<div class="cta"><span class="pill">Devamı için takip et</span><span class="url">sonersoylu.com</span></div>'
    beats_html += (f'<div id="b{i}" class="clip beat" data-start="{s}" data-duration="{e-s}" data-track-index="3"><div class="bin">'
                   f'<div class="lab">{lab}</div><h1 class="hl{" son" if i == 9 else ""}">{words(txt)}</h1>{extra}</div></div>\n')

html = f'''<!doctype html>
<html lang="tr" data-resolution="portrait">
<head><meta charset="UTF-8"/><meta name="viewport" content="width={W}, height={H}"/>
<script src="gsap.min.js"></script>
<style>
{fontface}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:#07090B}}
#root{{width:100%;height:100%;position:relative;overflow:hidden;font-family:"Geist",system-ui,sans-serif;color:{INK}}}
#bg{{position:absolute;inset:0;
 background:radial-gradient(900px 700px at 12% 8%,rgba(111,220,236,.10),transparent 60%),
  radial-gradient(800px 800px at 95% 70%,rgba(124,196,255,.06),transparent 60%),
  linear-gradient(rgba(233,237,240,.045) 1px,transparent 1px) 0 0/60px 60px,
  linear-gradient(90deg,rgba(233,237,240,.045) 1px,transparent 1px) 0 0/60px 60px,#07090B}}
#grain{{position:absolute;inset:0;opacity:.06;mix-blend-mode:overlay}}
.beat,.panel{{position:absolute;inset:0}}
.bin{{position:absolute;left:90px;top:250px;width:830px}}
.lab{{font-family:"Geist Mono",monospace;font-weight:500;font-size:26px;letter-spacing:.14em;color:{ICE};margin-bottom:26px}}
.hl{{font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:74px;line-height:1.08;letter-spacing:-.015em}}
.hl.son{{font-size:84px}}
.hl b{{color:{ICE};font-weight:600}}
.hl i{{font-style:italic;color:{ICE}}}
.w{{display:inline-block}}
.pin{{position:absolute;left:90px;top:740px;width:830px;height:720px}}
.psvg{{width:830px;height:720px;display:block;overflow:visible}}
.mono{{font-family:"Geist Mono",monospace;font-weight:500;letter-spacing:.08em}}
.disp{{font-family:"Fraunces",Georgia,serif;font-weight:600}}
.cta{{margin-top:44px;display:flex;align-items:center;gap:28px}}
.pill{{display:block;font-weight:600;font-size:34px;padding:20px 34px;border-radius:999px;border:2px solid {ICE};color:{ICE}}}
.url{{display:block;font-family:"Geist Mono",monospace;font-size:28px;color:{MUTED};letter-spacing:.06em}}
</style></head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{DUR}" data-width="{W}" data-height="{H}">
 <div id="bg" class="clip" data-start="0" data-duration="{DUR}" data-track-index="0"></div>
 <svg id="grain" class="clip" data-start="0" data-duration="{DUR}" data-track-index="1" width="{W}" height="{H}">
  <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix type="saturate" values="0"/></filter>
  <rect width="100%" height="100%" filter="url(#gr)"/></svg>
{panels_html}{beats_html}</div>
<script>
const tl = gsap.timeline({{paused:true}});
const E = "power3.out";
// başlık girişleri (ilk sahne hariç: ilk kare dolu açılır)
{"".join(f'tl.fromTo("#b{i} .lab",{{opacity:0,y:16}},{{opacity:1,y:0,duration:.45,ease:E}},{s});tl.fromTo("#b{i} .w",{{opacity:0,y:38}},{{opacity:1,y:0,duration:.6,ease:E,stagger:.05}},{s+0.08});' for i,(s,e,l,t) in enumerate(BEATS,1) if i>1)}
// panel girişleri
{"".join(f'tl.fromTo("#p{i} .pin",{{opacity:0,y:40}},{{opacity:1,y:0,duration:.7,ease:E}},{s});' for i,(s,e,f) in enumerate(PANELS,1) if i>1)}
// P1: 14 d/dk -> 84°/sn
tl.to("#rotor1",{{rotation:"+=588",duration:7,ease:"none",svgOrigin:"0 0"}},0);
const c1={{v:0}}; tl.to(c1,{{v:14,duration:1.6,ease:"power2.out",onUpdate:()=>{{document.getElementById("sayi1").textContent=Math.round(c1.v)}}}},0.1);
tl.to("#kablo1",{{opacity:1,duration:.4}},2.7);
tl.to("#kablo1 path",{{strokeDashoffset:-120,duration:4.3,ease:"none"}},2.7);
tl.to("#p1 .pencere",{{opacity:1,duration:.25,stagger:.1,ease:"none"}},3.0);
// P2: akış
tl.to("#p2 .akis",{{strokeDashoffset:-576,duration:12,ease:"none"}},7);
tl.fromTo("#kaldirmaOk",{{scaleY:0}},{{scaleY:1,duration:.8,ease:E,svgOrigin:"0 0"}},9.2);
tl.to("#kaldirmaYazi",{{opacity:1,duration:.4}},9.6);
tl.to("#basinc",{{opacity:1,duration:.8}},13.3);
tl.to("#dusukYazi",{{opacity:1,duration:.4}},13.7);
tl.to("#yuksekYazi",{{opacity:1,duration:.4}},14.0);
tl.to("#basinc",{{scale:1.08,duration:1.2,yoyo:true,repeat:3,ease:"sine.inOut",svgOrigin:"395 270"}},14.2);
tl.to("#donus",{{opacity:1,duration:.5}},15.6);
// P3: dişliler
tl.to("#gobek",{{rotation:"+=588",duration:7,ease:"none",svgOrigin:"0 0"}},19);
tl.to("#disliB",{{rotation:"+=150",duration:7,ease:"none",svgOrigin:"372 300"}},19);
tl.to("#disliK",{{rotation:"-=390",duration:7,ease:"none",svgOrigin:"474 300"}},19);
tl.fromTo("#jenRotor",{{rotation:0}},{{rotation:3600,duration:7,ease:"power1.in",svgOrigin:"0 0"}},19);
const c3={{v:14}}; tl.to(c3,{{v:1400,duration:3.2,ease:"power2.inOut",onUpdate:()=>{{document.getElementById("sayi3").textContent="~"+Math.round(c3.v).toLocaleString("tr-TR")}}}},20.4);
// P4: jeneratör
tl.to("#miknatis",{{rotation:"+=1080",duration:6,ease:"none",svgOrigin:"0 0"}},26);
const sl=document.getElementById("sinus").getTotalLength();
tl.fromTo("#sinus",{{strokeDasharray:sl,strokeDashoffset:sl}},{{strokeDashoffset:0,duration:4.2,ease:"none"}},26.6);
// P5: kule ve trafo
tl.to("#enerji",{{strokeDashoffset:-600,duration:6.5,ease:"none"}},32);
tl.fromTo("#enerji2",{{opacity:0}},{{opacity:1,duration:.3}},35.2);
tl.to("#enerji2",{{strokeDashoffset:-240,duration:3.3,ease:"none"}},35.2);
tl.to("#v34",{{opacity:1,duration:.5}},35.4);
tl.fromTo("#v34",{{y:20}},{{y:0,duration:.6,ease:E}},35.4);
// P6: güç eğrisi
const el=document.getElementById("egri").getTotalLength();
tl.fromTo("#egri",{{strokeDasharray:el,strokeDashoffset:el}},{{strokeDashoffset:0,duration:2.6,ease:"power1.inOut"}},38.9);
tl.to("#m5",{{opacity:1,duration:.4}},41.7);
tl.to("#m10",{{opacity:1,duration:.4}},42.5);
tl.to("#kat8",{{opacity:1,duration:.5}},43.0);
tl.fromTo("#kat8",{{y:16}},{{y:0,duration:.6,ease:E}},43.0);
// P7: kapanış
tl.to("#rotor7_0",{{rotation:"+=500",duration:7,ease:"none",svgOrigin:"0 0"}},45);
tl.to("#rotor7_1",{{rotation:"+=588",duration:7,ease:"none",svgOrigin:"0 0"}},45);
tl.to("#rotor7_2",{{rotation:"+=460",duration:7,ease:"none",svgOrigin:"0 0"}},45);
tl.fromTo("#b9 .cta",{{opacity:0,y:24}},{{opacity:1,y:0,duration:.6,ease:E}},46.4);
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body></html>'''

# Seslendirme (ses/anlatim.py → ses/normalize.sh → anlatim.wav, -15 LUFS) — şablon: kanat-ucu/build.py
html = html.replace('</div>\n<script>', f'<audio id="anlatim" src="anlatim.wav" data-start="0" data-duration="{DUR}" data-track-index="10" data-volume="1"></audio>\n</div>\n<script>', 1)
assert 'id="anlatim"' in html
open("index.html", "w", encoding="utf-8").write(html)
print("index.html yazıldı")
