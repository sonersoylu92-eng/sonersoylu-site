#!/usr/bin/env python3
"""Saha vakası Short — "Ekran 103 °C, termometre 62 °C: arıza sensördeydi" · index.html + .srt üretici.
Plan: ajans/cikti/plan-saha-vakasi-2026-10-02.md (PANO #10, onaylı). MOTION.md kuralları.
Ses önce (K-006): sahne pencereleri ses/zaman.json, animasyon anları ses/kelime.json (zorunlu hizalanmış kelime
zamanları) üzerinden kurulur; ses değişirse yalnız bu betik yeniden çalıştırılır.
SVG: döndürülen/ölçeklenen her parça dayanağına translate edilmiş dış <g> + iç <g> (svgOrigin "0 0"), çubuk/sayaçta
attr tween ve sayaç (K-001, K-004). Diyagram etiketleri koyu haleli (K-012)."""
import json, math, os, re, sys
sys.path.insert(0, "/home/claude/video-edit/tools")
from hfkit import W, H, ICE, ELEC, AMBER, INK, MUTED, FAINT, LINE, SURF, turbine, words, fontface  # noqa

D = os.path.dirname(os.path.abspath(__file__))
Z = json.load(open(f"{D}/ses/zaman.json"))
K = json.load(open(f"{D}/ses/kelime.json"))
DUR = Z[-1]["sahne_son"]
S = {z["beat"]: (z["sahne_bas"], z["sahne_son"]) for z in Z}
BG = "#07090B"
HALO = 'stroke="#07090B" stroke-width="8" stroke-linejoin="round" paint-order="stroke"'


def _n(w):
    return re.sub(r"[^\w]", "", w).replace("İ", "i").replace("I", "ı").lower()


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
def irgun(x, y, s=1.0, ekran=""):
    """El tipi IR termometre (namlu solda). Dayanak: namlu ucu (0,0) → translate(x,y)."""
    return f'''<g transform="translate({x},{y}) scale({s})">
  <rect x="0" y="-22" width="44" height="44" rx="8" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <path d="M44,-50 L270,-50 Q296,-50 296,-24 L296,40 Q296,66 270,66 L44,66 Z" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <rect x="96" y="-30" width="150" height="58" rx="8" fill="{BG}" stroke="{ICE}" stroke-width="2"/>
  {ekran}
  <path d="M206,66 L262,66 L284,190 Q287,208 268,208 L236,208 Q220,208 218,192 Z" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <path d="M176,66 Q172,104 204,112" fill="none" stroke="{INK}" stroke-width="3"/>
  <g fill="{MUTED}" opacity=".55">
    <rect x="196" y="96" width="74" height="22" rx="11"/><rect x="200" y="122" width="76" height="22" rx="11"/>
    <rect x="204" y="148" width="78" height="22" rx="11"/><rect x="208" y="174" width="76" height="22" rx="11"/>
  </g>
</g>'''


def jenerator(x, y, w, h):
    fins = "".join(f'<line x1="{x+w*k/9:.0f}" y1="{y+16}" x2="{x+w*k/9:.0f}" y2="{y+h-16}" stroke="{LINE}" stroke-width="3"/>' for k in range(1, 9))
    return (f'<rect x="{x-46}" y="{y+h/2-16:.0f}" width="56" height="32" rx="6" fill="{MUTED}" opacity=".7"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="34" fill="{SURF}" stroke="{INK}" stroke-width="3"/>{fins}'
            f'<rect x="{x+w-10}" y="{y+22}" width="34" height="{h-44}" rx="12" fill="{SURF}" stroke="{INK}" stroke-width="3"/>')


def tik(cx, cy, col=ICE, rr=26):
    return (f'<circle cx="{cx}" cy="{cy}" r="{rr}" fill="{BG}" stroke="{col}" stroke-width="3"/>'
            f'<path d="M{cx-11},{cy+1} L{cx-3},{cy+10} L{cx+12},{cy-9}" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')


def carpi(cx, cy, col=AMBER, rr=26):
    return (f'<circle cx="{cx}" cy="{cy}" r="{rr}" fill="{BG}" stroke="{col}" stroke-width="3"/>'
            f'<path d="M{cx-9},{cy-9} L{cx+9},{cy+9} M{cx+9},{cy-9} L{cx-9},{cy+9}" stroke="{col}" stroke-width="5" stroke-linecap="round"/>')


def ucgen(cx, cy, col=ICE):
    return (f'<path d="M{cx},{cy-22} L{cx+24},{cy+18} L{cx-24},{cy+18} Z" fill="none" stroke="{col}" stroke-width="3" stroke-linejoin="round"/>'
            f'<line x1="{cx}" y1="{cy-8}" x2="{cx}" y2="{cy+5}" stroke="{col}" stroke-width="4" stroke-linecap="round"/><circle cx="{cx}" cy="{cy+11}" r="2.5" fill="{col}"/>')


def kilit(cx, cy, col=AMBER):
    return (f'<path d="M{cx-14},{cy-4} L{cx-14},{cy-16} A14,14 0 0 1 {cx+14},{cy-16} L{cx+14},{cy-4}" fill="none" stroke="{col}" stroke-width="5"/>'
            f'<rect x="{cx-22}" y="{cy-6}" width="44" height="34" rx="6" fill="{col}"/>'
            f'<path d="M{cx+30},{cy+2} L{cx+58},{cy+2} L{cx+66},{cy+14} L{cx+58},{cy+26} L{cx+30},{cy+26} Z" fill="none" stroke="{col}" stroke-width="3"/>'
            f'<circle cx="{cx+38}" cy="{cy+14}" r="3" fill="{col}"/>')


def kart(x, y, w, h, stroke=LINE, extra=""):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="{SURF}" stroke="{stroke}" stroke-width="2" {extra}/>'


def svg(ic, h=600):
    return f'<svg viewBox="0 0 830 {h}" class="psvg" style="height:{h}px">{ic}</svg>'


# ---------------------------------------------------------------- PANELLER (830 × 600, sayfada y 440–1040)
def p1():
    ekr = "".join(f'<rect x="{84}" y="{78+k*34}" width="{[150, 110, 170, 90][k]}" height="12" rx="6" fill="{MUTED}" opacity=".45"/>'
                  f'<rect x="{262}" y="{78+k*34}" width="44" height="12" rx="6" fill="{ELEC}" opacity=".6"/>' for k in range(4))
    return svg(f'''
  <rect x="60" y="40" width="270" height="200" rx="14" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <rect x="78" y="58" width="234" height="164" rx="8" fill="{BG}"/>
  {ekr}
  <rect x="180" y="240" width="30" height="34" fill="{INK}" opacity=".8"/><rect x="130" y="272" width="130" height="12" rx="6" fill="{INK}" opacity=".8"/>
  {irgun(500, 120, 1.0, f'<rect x="118" y="-14" width="70" height="10" rx="5" fill="{ICE}" opacity=".7"/><rect x="118" y="4" width="104" height="10" rx="5" fill="{ICE}" opacity=".4"/>')}
  <g>{kart(0, 360, 390, 220)}
    <text x="28" y="408" class="mono" font-size="22" fill="{MUTED}">EKRAN · SCADA</text>
    <text x="28" y="530" class="disp" font-size="88" fill="{AMBER}">103 °C</text></g>
  <g>{kart(440, 360, 390, 220)}
    <text x="468" y="408" class="mono" font-size="22" fill="{MUTED}">TERMOMETRE · IR</text>
    <text x="468" y="530" class="disp" font-size="88" fill="{ICE}">≈62 °C</text></g>
  <g id="soru" opacity="0"><circle cx="415" cy="470" r="38" fill="{BG}" stroke="{ICE}" stroke-width="3"/>
    <text x="415" y="487" text-anchor="middle" class="disp" font-size="50" fill="{ICE}">?</text></g>''')


def Y2(v):
    return 540 - 470 * v / 130


def p2():
    return svg(f'''
  <line x1="0" y1="540" x2="400" y2="540" stroke="{LINE}" stroke-width="2"/>
  {turbine(190, 170, 150, 540, "r2", tw=(10, 22))}
  <text id="durdu2" x="190" y="586" text-anchor="middle" class="mono" font-size="22" fill="{MUTED}" opacity="0">TÜRBİN DURDU</text>
  <rect x="450" y="70" width="64" height="470" rx="10" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>
  <rect id="bar2" x="456" y="534" width="52" height="0" rx="6" fill="{ELEC}"/>
  <line x1="436" y1="{Y2(115):.1f}" x2="830" y2="{Y2(115):.1f}" stroke="{INK}" stroke-width="2" stroke-dasharray="8 8" opacity=".7"/>
  <text x="544" y="{Y2(115)-16:.1f}" class="mono" font-size="22" fill="{MUTED}" {HALO}>EŞİK 115 °C</text>
  <text x="544" y="250" class="mono" font-size="22" fill="{MUTED}">SARGI SICAKLIĞI</text>
  <text id="s2" x="544" y="340" class="disp" font-size="88" fill="{AMBER}">0 °C</text>
  <g id="uyari2" opacity="0">{kart(530, 400, 300, 140)}
    {ucgen(572, 446)}
    <text x="610" y="452" class="mono" font-size="20" fill="{ICE}">ALARM</text>
    <text x="554" y="492" class="mono" font-size="20" fill="{INK}">JENERATÖR</text>
    <text x="554" y="522" class="mono" font-size="20" fill="{INK}">SICAKLIĞI YÜKSEK</text></g>''')


def Y3(v):
    return 560 - 200 * (v - 106) / 12


def p3():
    rows = ""
    for k, (yy, txt) in enumerate([(40, "SES NORMAL"), (112, "TİTREŞİM YOK"), (184, "SOĞUTMA ÇALIŞIYOR")]):
        rows += f'<g id="ok3_{k}" opacity="0">{tik(30, yy, ICE, 24)}<text x="76" y="{yy+9}" class="mono" font-size="28" fill="{INK}">{txt}</text></g>'
    xs, vs = [210, 430, 650], [110, 112, 116]
    pts = " L".join(f"{x},{Y3(v):.1f}" for x, v in zip(xs, vs))
    grid = "".join(f'<line x1="120" y1="{Y3(v):.1f}" x2="760" y2="{Y3(v):.1f}" stroke="{LINE}" stroke-width="1"/>' for v in (108, 112, 116))
    nok = ""
    for k, (x, v) in enumerate(zip(xs, vs)):
        col = AMBER if k == 2 else ICE
        nok += (f'<g id="n3_{k}" opacity="0"><circle cx="{x}" cy="{Y3(v):.1f}" r="11" fill="{col}"/>'
                f'<text x="{x}" y="{Y3(v)-26:.1f}" text-anchor="middle" class="disp" font-size="36" fill="{col}" {HALO}>{v} °C</text></g>')
        nok += f'<text x="{x}" y="592" text-anchor="middle" class="mono" font-size="20" fill="{MUTED}">{k+1}. GÜN</text>'
    return svg(f'''{rows}
  {kart(0, 250, 830, 350)}
  <text x="28" y="292" class="mono" font-size="20" fill="{MUTED}">SON 3 GÜN · EN YÜKSEK OKUMA</text>
  {grid}
  <path id="cizgi3" d="M{pts}" fill="none" stroke="{ICE}" stroke-width="4" stroke-linejoin="round"/>
  {nok}''')


def p4():
    x0, x1 = 60, 800
    wave = "M" + " L".join(f"{x},{325 - 24*math.sin((x-x0)/740*4*2*math.pi):.1f}" for x in range(x0, x1 + 1, 6))
    yuk = "M" + " L".join(f"{x},{380 - 12*math.sin((x-x0)/740*4*2*math.pi):.1f}" for x in range(x0, x1 + 1, 6))
    st = "M60,250 L245,250 L245,190 L430,190 L430,130 L615,130 L615,70 L800,70"
    zin = ""
    for k, (x, lab) in enumerate([(0, "SENSÖR"), (300, "KABLO"), (600, "SCADA")]):
        zin += f'{kart(x, 500, 230, 84)}<text x="{x+115}" y="550" text-anchor="middle" class="mono" font-size="24" fill="{INK}">{lab}</text>'
        if k < 2:
            zin += f'<path d="M{x+242},542 L{x+288},542 M{x+276},532 L{x+288},542 L{x+276},552" stroke="{ICE}" stroke-width="3" fill="none"/>'
    return svg(f'''
  <line x1="60" y1="425" x2="800" y2="425" stroke="{LINE}" stroke-width="2"/><line x1="60" y1="20" x2="60" y2="425" stroke="{LINE}" stroke-width="2"/>
  <text x="70" y="30" class="mono" font-size="18" fill="{MUTED}">SICAKLIK ↑</text>
  <text x="800" y="455" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">GÜNLER →</text>
  <path id="yuk4" d="{yuk}" fill="none" stroke="{MUTED}" stroke-width="3" stroke-dasharray="10 8" opacity=".7"/>
  <text id="yukY4" x="70" y="414" class="mono" font-size="18" fill="{MUTED}" {HALO}>YÜK</text>
  <path id="gercek4" d="{wave}" fill="none" stroke="{ELEC}" stroke-width="5" stroke-linejoin="round"/>
  <text id="gercekY4" x="72" y="286" class="mono" font-size="20" fill="{ELEC}" {HALO}>GERÇEK ISINMA · YÜKLE İNER-ÇIKAR</text>
  <path id="kayma4" d="{st}" fill="none" stroke="{AMBER}" stroke-width="6" stroke-linejoin="round"/>
  <text id="kaymaY4" x="800" y="40" text-anchor="end" class="mono" font-size="20" fill="{INK}" {HALO}>SENSÖR KAYMASI · HER GÜN ≈2 °C</text>
  <g id="zincir4" opacity="0"><text x="0" y="486" class="mono" font-size="18" fill="{MUTED}">ÖLÇÜM ZİNCİRİ</text>{zin}</g>''')


def p5():
    return svg(f'''
  <g id="dur5"><rect x="0" y="6" width="320" height="50" rx="25" fill="none" stroke="{ICE}" stroke-width="2"/>
    <rect x="26" y="22" width="18" height="18" rx="3" fill="{ICE}"/>
    <text x="58" y="40" class="mono" font-size="20" fill="{ICE}">TÜRBİN DURDURULDU</text></g>
  {jenerator(70, 130, 380, 230)}
  <text x="70" y="112" class="mono" font-size="20" fill="{MUTED}">JENERATÖR GÖVDESİ</text>
  {irgun(560, 200, 0.82)}
  <g id="lazer5" opacity="0"><line x1="560" y1="200" x2="380" y2="236" stroke="{ICE}" stroke-width="3" stroke-dasharray="10 8"/>
    <circle cx="380" cy="236" r="12" fill="none" stroke="{ICE}" stroke-width="3"/><circle cx="380" cy="236" r="4" fill="{ICE}"/></g>
  <g>{kart(0, 400, 390, 196)}
    <text x="28" y="446" class="mono" font-size="20" fill="{MUTED}">IR TERMOMETRE</text>
    <text id="s5" x="28" y="550" class="disp" font-size="84" fill="{ICE}">0 °C</text></g>
  <g id="ekr5" opacity="0">{kart(440, 400, 390, 196)}
    <text x="468" y="446" class="mono" font-size="20" fill="{MUTED}">AYNI ANDA EKRAN</text>
    <text x="468" y="550" class="disp" font-size="84" fill="{AMBER}">103 °C</text></g>''')


def Y6(v):
    return 520 - 490 * (v - 40) / 80


def p6():
    tk = ""
    for v in range(40, 121, 10):
        big = v % 20 == 0
        tk += f'<line x1="{200 - (16 if big else 9)}" y1="{Y6(v):.1f}" x2="200" y2="{Y6(v):.1f}" stroke="{MUTED}" stroke-width="2"/>'
        if big:
            tk += f'<text x="170" y="{Y6(v)+7:.1f}" text-anchor="end" class="mono" font-size="20" fill="{MUTED}">{v}</text>'
    br = (f"M560,{Y6(103):.1f} Q582,{Y6(103):.1f} 582,{Y6(103)+20:.1f} L582,{(Y6(103)+Y6(62))/2-14:.1f} "
          f"Q582,{(Y6(103)+Y6(62))/2:.1f} 600,{(Y6(103)+Y6(62))/2:.1f} Q582,{(Y6(103)+Y6(62))/2:.1f} 582,{(Y6(103)+Y6(62))/2+14:.1f} "
          f"L582,{Y6(62)-20:.1f} Q582,{Y6(62):.1f} 560,{Y6(62):.1f}")
    ym = (Y6(103) + Y6(62)) / 2
    return svg(f'''
  <text x="170" y="10" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">°C</text>
  <line x1="200" y1="{Y6(120):.1f}" x2="200" y2="{Y6(40):.1f}" stroke="{INK}" stroke-width="3"/>
  {tk}
  <rect id="bant6" x="200" y="{Y6(65):.1f}" width="34" height="{Y6(59)-Y6(65):.1f}" fill="{ICE}" opacity="0"/>
  <g id="m62"><circle cx="200" cy="{Y6(62):.1f}" r="12" fill="{ICE}"/>
    <line x1="214" y1="{Y6(62):.1f}" x2="540" y2="{Y6(62):.1f}" stroke="{ICE}" stroke-width="2" stroke-dasharray="6 6"/>
    <text x="250" y="{Y6(62)-16:.1f}" class="mono" font-size="22" fill="{ICE}" {HALO}>TERMOMETRE ≈62</text></g>
  <g id="m103"><circle cx="200" cy="{Y6(103):.1f}" r="12" fill="{INK}"/>
    <line x1="214" y1="{Y6(103):.1f}" x2="540" y2="{Y6(103):.1f}" stroke="{INK}" stroke-width="2" stroke-dasharray="6 6"/>
    <text x="250" y="{Y6(103)-16:.1f}" class="mono" font-size="22" fill="{INK}" {HALO}>EKRAN 103</text></g>
  <path id="parantez6" d="{br}" fill="none" stroke="{INK}" stroke-width="3"/>
  <g id="fark6" opacity="0"><text x="632" y="{ym+26:.1f}" class="disp" font-size="80" fill="{AMBER}">41 °C</text>
    <text x="636" y="{ym+66:.1f}" class="mono" font-size="20" fill="{MUTED}">FARK</text></g>
  <text id="not6" x="0" y="590" class="mono" font-size="20" fill="{MUTED}" opacity="0">BİRKAÇ DERECE NORMAL · 41 DERECE DEĞİL</text>''')


def p7():
    adim = ["TÜRBİNİ DURDUR", "DEVREYİ AYIR", "GERİLİM YOKLUĞUNU ÖLÇ", "KİLİTLE + ETİKETLE (LOTO)"]
    rows = ""
    for k, txt in enumerate(adim):
        y = 150 + k * 96
        ek = kilit(744, y + 34) if k == 3 else ""
        rows += (f'<g id="a7_{k}" opacity=".3"><rect id="ar7_{k}" x="0" y="{y}" width="830" height="80" rx="16" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>'
                 f'<text x="30" y="{y+50}" class="mono" font-size="22" fill="{ICE}">0{k+1}</text>'
                 f'<text x="96" y="{y+51}" class="mono" font-size="26" fill="{INK}">{txt}</text>{ek}</g>')
    return svg(f'''
  {kart(0, 0, 830, 118, ICE)}
  {ucgen(52, 58)}
  <text x="100" y="48" class="mono" font-size="22" fill="{ICE}">UYARI</text>
  <text x="100" y="88" class="mono" font-size="19" fill="{INK}">JENERATÖR TERMİNAL KUTUSUNDA YÜKSEK GERİLİM</text>
  {rows}
  <text id="son7" x="0" y="574" class="mono" font-size="22" fill="{ICE}" opacity="0">ANCAK BUNDAN SONRA: SENSÖR ÖLÇÜMÜ / DEĞİŞİMİ</text>''')


def p8():
    return svg(f'''
  <text x="20" y="96" class="mono" font-size="20" fill="{MUTED}">PT100 SENSÖR</text>
  <rect x="20" y="134" width="280" height="32" rx="16" fill="{FAINT}"/>
  <rect x="300" y="110" width="80" height="80" rx="10" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <circle cx="380" cy="130" r="7" fill="{INK}"/><circle cx="380" cy="170" r="7" fill="{INK}"/>
  <path id="kab8a" d="M386,130 C470,130 520,250 560,330" fill="none" stroke="{ICE}" stroke-width="4"/>
  <path id="kab8b" d="M386,170 C450,200 560,360 690,330" fill="none" stroke="{INK}" stroke-width="4"/>
  <text x="20" y="246" class="mono" font-size="22" fill="{INK}">0 °C = 100 Ω</text>
  <text x="20" y="286" class="mono" font-size="22" fill="{INK}">+0,385 Ω / °C</text>
  <rect x="490" y="10" width="300" height="360" rx="30" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
  <rect x="516" y="40" width="248" height="110" rx="10" fill="{BG}" stroke="{LINE}" stroke-width="2"/>
  <text id="mm8" x="740" y="120" text-anchor="end" class="disp" font-size="60" fill="{INK}">0 Ω</text>
  <g transform="translate(640,236)"><circle r="54" fill="none" stroke="{INK}" stroke-width="3"/>
    <line x1="0" y1="0" x2="-30" y2="-44" stroke="{ICE}" stroke-width="5" stroke-linecap="round"/><circle r="8" fill="{INK}"/></g>
  <text x="586" y="186" class="mono" font-size="20" fill="{ICE}">Ω</text>
  <circle cx="560" cy="330" r="12" fill="{BG}" stroke="{ICE}" stroke-width="3"/><circle cx="690" cy="330" r="12" fill="{BG}" stroke="{INK}" stroke-width="3"/>
  <g id="bek8" opacity="0">{kart(0, 400, 390, 196)}
    <text x="28" y="446" class="mono" font-size="20" fill="{MUTED}">BEKLENEN · 62 °C</text>
    <text x="28" y="550" class="disp" font-size="80" fill="{ICE}">≈124 Ω</text></g>
  <g>{kart(440, 400, 390, 196)}
    <text x="468" y="446" class="mono" font-size="20" fill="{MUTED}">ÖLÇÜLEN</text>
    <text id="s8" x="468" y="550" class="disp" font-size="80" fill="{AMBER}">0 Ω</text></g>''')


TAB = [(0, 100.0), (20, 107.8), (40, 115.5), (60, 123.2), (80, 130.9), (100, 138.5), (120, 146.1)]  # IEC 60751 (sayfa s.117)


def X9(T):
    return 110 + 690 * T / 120


def Y9(R):
    return 470 - 430 * (R - 100) / 50


def T_of(R):
    for (t0, r0), (t1, r1) in zip(TAB, TAB[1:]):
        if r0 <= R <= r1:
            return t0 + (t1 - t0) * (R - r0) / (r1 - r0)


def p9():
    g = ""
    for T in range(0, 121, 20):
        g += f'<line x1="{X9(T):.1f}" y1="40" x2="{X9(T):.1f}" y2="470" stroke="{LINE}" stroke-width="1"/><text x="{X9(T):.1f}" y="500" text-anchor="middle" class="mono" font-size="18" fill="{MUTED}">{T}</text>'
    for R in range(100, 151, 10):
        g += f'<line x1="110" y1="{Y9(R):.1f}" x2="800" y2="{Y9(R):.1f}" stroke="{LINE}" stroke-width="1"/><text x="96" y="{Y9(R)+6:.1f}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">{R}</text>'
    egri = "M" + " L".join(f"{X9(T):.1f},{Y9(R):.1f}" for T, R in TAB)
    t124, t140 = T_of(124), T_of(140)
    return svg(f'''{g}
  <text x="110" y="22" class="mono" font-size="18" fill="{MUTED}">DİRENÇ (Ω)</text>
  <text x="800" y="532" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">SICAKLIK (°C) · IEC 60751</text>
  <path id="egri9" d="{egri}" fill="none" stroke="{ICE}" stroke-width="5" stroke-linejoin="round"/>
  <g id="k124"><path d="M{X9(t124):.1f},470 L{X9(t124):.1f},{Y9(124):.1f} L110,{Y9(124):.1f}" fill="none" stroke="{ICE}" stroke-width="2" stroke-dasharray="6 6"/>
    <circle cx="{X9(t124):.1f}" cy="{Y9(124):.1f}" r="9" fill="{ICE}"/>
    <text x="{X9(t124)+18:.1f}" y="{Y9(124)+34:.1f}" class="mono" font-size="20" fill="{ICE}" {HALO}>62 °C → ≈124 Ω</text></g>
  <g id="k140" opacity="0"><path d="M110,{Y9(140):.1f} L{X9(t140):.1f},{Y9(140):.1f} L{X9(t140):.1f},470" fill="none" stroke="{AMBER}" stroke-width="3" stroke-dasharray="8 6"/>
    <circle cx="{X9(t140):.1f}" cy="{Y9(140):.1f}" r="10" fill="{AMBER}"/>
    <text x="{X9(t140)-18:.1f}" y="{Y9(140)-20:.1f}" text-anchor="end" class="mono" font-size="22" fill="{AMBER}" {HALO}>140 Ω ≈ 103 °C</text></g>
  <g id="fazla9" opacity="0"><path d="M150,{Y9(140):.1f} L162,{Y9(140):.1f} L162,{Y9(124):.1f} L150,{Y9(124):.1f}" fill="none" stroke="{INK}" stroke-width="3"/>
    <text x="178" y="{(Y9(140)+Y9(124))/2 - 4:.1f}" class="mono" font-size="20" fill="{INK}" {HALO}>≈16 Ω FAZLA</text>
    <text x="178" y="{(Y9(140)+Y9(124))/2 + 24:.1f}" class="mono" font-size="18" fill="{MUTED}" {HALO}>OKUMA ≈41 °C YUKARI</text></g>
  <text id="dogru9" x="0" y="584" class="mono" font-size="22" fill="{ICE}" opacity="0">ÇEVİRİ: DOĞRU</text>
  <text id="yanlis9" x="400" y="584" class="mono" font-size="22" fill="{INK}" opacity="0">DİRENÇ: YANLIŞ</text>''')


def p10():
    kut = ""
    for k, (x, a, b) in enumerate([(0, "SENSÖR", "PT100"), (300, "KABLO", "KLEMENS"), (600, "SCADA", "ÇEVİRİ")]):
        kut += (f'<g id="kt10_{k}">{kart(x, 30, 230, 150)}'
                f'<text x="{x+115}" y="96" text-anchor="middle" class="mono" font-size="26" fill="{INK}">{a}</text>'
                f'<text x="{x+115}" y="136" text-anchor="middle" class="mono" font-size="20" fill="{MUTED}">{b}</text></g>')
        if k < 2:
            kut += f'<path d="M{x+242},105 L{x+288},105 M{x+276},95 L{x+288},105 L{x+276},115" stroke="{ICE}" stroke-width="3" fill="none"/>'
    rozet = (f'<g id="z10_1" opacity="0">{tik(415, 236)}<text x="415" y="306" text-anchor="middle" class="mono" font-size="20" fill="{ICE}">SAĞLAM</text></g>'
             f'<g id="z10_0" opacity="0">{carpi(115, 236)}<text x="115" y="306" text-anchor="middle" class="mono" font-size="20" fill="{AMBER}">KAYMA</text></g>'
             f'<g id="z10_2" opacity="0">{tik(715, 236)}<text x="715" y="306" text-anchor="middle" class="mono" font-size="20" fill="{ICE}">DOĞRU</text></g>')
    kalkan = "M170,370 L270,404 L270,480 Q270,548 170,590 Q70,548 70,480 L70,404 Z"
    return svg(f'''{kut}{rozet}
  <g id="koru10" opacity="0">
    <path d="{kalkan}" fill="none" stroke="{ICE}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="112" y="450" width="116" height="74" rx="18" fill="{SURF}" stroke="{INK}" stroke-width="3"/>
    <rect x="92" y="478" width="22" height="18" rx="4" fill="{MUTED}"/>
    {"".join(f'<line x1="{126+k*18}" y1="460" x2="{126+k*18}" y2="514" stroke="{LINE}" stroke-width="3"/>' for k in range(5))}
    <text x="330" y="450" class="mono" font-size="24" fill="{ICE}">SİSTEM İŞİNİ YAPTI</text>
    <text x="330" y="494" class="mono" font-size="20" fill="{INK}">SAĞLIKLI JENERATÖR</text>
    <text x="330" y="526" class="mono" font-size="20" fill="{INK}">KORUMAK İÇİN DURDURULDU</text></g>''')


def p11():
    ikon = (f'<svg viewBox="0 0 830 600" class="psvg" style="position:absolute;left:0;top:0;height:600px;opacity:.13">'
            f'<rect x="560" y="420" width="230" height="130" rx="14" fill="none" stroke="{INK}" stroke-width="4"/>'
            f'<rect x="655" y="550" width="40" height="28" fill="{INK}"/><rect x="620" y="576" width="110" height="10" rx="5" fill="{INK}"/>'
            f'<rect x="440" y="420" width="34" height="120" rx="17" fill="none" stroke="{INK}" stroke-width="4"/>'
            f'<circle cx="457" cy="556" r="30" fill="none" stroke="{INK}" stroke-width="4"/></svg>')
    return (ikon + '<div class="soz"><p>Bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar '
            '<i>makineye</i> inan.</p><div class="imza">— SONER SOYLU</div></div>')


def p12():
    tr = ""
    for i, (cx, hy, L, op) in enumerate([(150, 170, 95, .45), (420, 140, 125, 1), (690, 185, 85, .4)]):
        tr += turbine(cx, hy, L, 290, f"r12_{i}", tw=(8, 18), op=op)
    return ('<div class="son12"><div class="adres"><span id="adr12">sonersoylu.com/saha-notlari</span></div>'
            '<div class="kim">Soner Soylu — Rüzgâr Türbini Saha Servis Teknisyeni</div>'
            '<div class="cta12"><span class="pill">Sıradaki vaka için takip et</span></div></div>'
            f'<svg viewBox="0 0 830 300" class="psvg" style="position:absolute;left:0;top:300px;height:300px">'
            f'<line x1="0" y1="290" x2="830" y2="290" stroke="{LINE}" stroke-width="2"/>{tr}</svg>')


PANELS = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12]
BASLIK = [
    ("SAHA VAKASI · JENERATÖR", "Ekran mı, <i>termometre</i> mi?"),
    ("SAHADAN · VESTAS V126", "Alarmda türbin <i>durur</i>."),
    ("BELİRTİLER", "Ama makine <i>sakin</i>."),
    ("İPUCU", "Gerçek ısınma <i>yükü</i> izler."),
    ("ÖLÇÜM", "Gövdeyi <i>ben</i> ölçtüm."),
    ("FARK", "41 derece <i>normal</i> değil."),
    ("UYARI · GÜVENLİK", "Önce <i>güvenlik</i>."),
    ("DİRENÇ ÖLÇÜMÜ · PT100", "Sensörün <i>direncini</i> ölçtüm."),
    ("PT100 TABLOSU", "Çeviri doğru, <i>direnç</i> yanlış."),
    ("KÖK NEDEN", "Kayma <i>sensörün</i> kendisinde."),
    ("SAHADAN KURAL", ""),
    ("THE TURBINE TECH", "Teşhisin <i>tamamı</i> sitede."),
]

# ---------------------------------------------------------------- ANİMASYON (mutlak saniye)
J = []


def op(sel, at, d=.45):
    J.append(f'tl.fromTo("{sel}",{{opacity:0}},{{opacity:1,duration:{d},ease:E}},{r(at)});')


def ciz(sel, at, d, ease="power1.inOut"):
    J.append(f'(()=>{{const el=document.querySelector("{sel}");const L=el.getTotalLength();'
             f'tl.fromTo(el,{{strokeDasharray:L,strokeDashoffset:L}},{{strokeDashoffset:0,duration:{d},ease:"{ease}"}},{r(at)});}})();')


def sayac(id_, v1, at, d, fmt, ease="power2.out"):
    J.append(f'(()=>{{const o={{v:0}};const el=document.getElementById("{id_}");'
             f'tl.to(o,{{v:{v1},duration:{d},ease:"{ease}",onUpdate:()=>{{const v=o.v;el.textContent={fmt};}}}},{r(at)});}})();')


def don(sel, at, d, deg, ease="none"):
    J.append(f'tl.to("{sel}",{{rotation:"+={deg}",duration:{d},ease:"{ease}",svgOrigin:"0 0"}},{r(at)});')


# B1 — ilk kare dolu (K-004): sayı kartları sabit, "?" soruyla gelir
op("#soru", t(1, "Hangisine"), .35)
# B2 — çubuk 0→116 "yüz on altı" sözüyle, alarmda rotor yavaşlayıp durur
s2 = S[2][0]
a2, b2 = t(2, "Jeneratör"), t(2, "altı", 2, son=True)
J.append(f'tl.fromTo("#bar2",{{attr:{{y:534,height:0}}}},{{attr:{{y:{Y2(116):.1f},height:{534-Y2(116):.1f}}},duration:{r(b2-a2)},ease:"power1.in"}},{r(a2)});')
sayac("s2", 116, a2, b2 - a2, 'Math.round(v)+" °C"', "power1.in")  # çubukla aynı eğri
al = t(2, "alarmla")
don("#r2", s2, al - s2, round(60 * (al - s2)))
don("#r2", al, 1.8, 50, "power2.out")
op("#uyari2", al); op("#durdu2", al + 1.0)
# B3 — onaylar sözle, trend noktaları değerlerle
for k, w in enumerate(["ses", "titreşim", "soğutma"]):
    op(f"#ok3_{k}", t(3, w), .35)
for k in range(3):
    op(f"#n3_{k}", t(3, "yüz", k + 1), .3)
ciz("#cizgi3", t(3, "yüz", 1), t(3, "yüz", 3) - t(3, "yüz", 1))
# B4 — yük + gerçek ısınma birlikte, sonra düzenli merdiven, sonra ölçüm zinciri
s4 = S[4][0]
ciz("#yuk4", s4 + .3, 2.2); ciz("#gercek4", s4 + .5, 2.2)
op("#yukY4", s4 + .3); op("#gercekY4", s4 + .8)
ciz("#kayma4", t(4, "her"), t(4, "tırmanmaz", son=True) - t(4, "her"), "none")
op("#kaymaY4", t(4, "düzenli"))
op("#zincir4", t(4, "ölçüm"))
# B5 — IR ölçümü: lazer, sayaç 0→62 "altmış iki"de oturur, sonra ekran 103
op("#lazer5", t(5, "jeneratör"), .35)
a5, b5 = t(5, "termometreyle"), t(5, "iki", son=True)
sayac("s5", 62, a5, b5 - a5, '(v>=61.99?"≈":"")+Math.round(v)+" °C"')
op("#ekr5", t(5, "Aynı"))
# B6 — fark 41 °C
s6 = S[6][0]
ciz("#parantez6", t(6, "kırk", 1) - .35, .5)
op("#fark6", t(6, "kırk", 1), .35)
J.append(f'tl.to("#bant6",{{opacity:.28,duration:.4}},{r(t(6, "Birkaç"))});')
op("#not6", t(6, "Birkaç"))
J.append(f'tl.set("#parantez6",{{opacity:0}},0);tl.set("#parantez6",{{opacity:1}},{r(t(6, "kırk", 1) - .35)});')
# B7 — dört adım sözle yanar
for k, w in enumerate(["türbin", "devre", "gerilim", "kilitleme"]):
    J.append(f'tl.to("#a7_{k}",{{opacity:1,duration:.35,ease:E}},{r(t(7, w))});'
             f'tl.to("#ar7_{k}",{{attr:{{stroke:"{ICE}"}},duration:.35}},{r(t(7, w))});')
op("#son7", t(7, "sonra"))
# B8 — kablolar bağlanır, beklenen 124, ölçülen 0→140
s8 = S[8][0]
ciz("#kab8a", s8 + .3, .9); ciz("#kab8b", s8 + .45, .9)
op("#bek8", t(8, "beklenen"))
a8, b8 = t(8, "Sensör"), t(8, "kırk", son=True)
sayac("s8", 140, a8, b8 - a8, '(v>=139.99?"≈":"")+Math.round(v)+" Ω"')
sayac("mm8", 140, a8, b8 - a8, 'Math.round(v)+" Ω"')
# B9 — tablo eğrisi, 140 Ω ≈ 103 °C, 16 Ω fazla, çeviri doğru / direnç yanlış
s9 = S[9][0]
ciz("#egri9", s9 + .2, 1.4)
op("#k124", s9 + .5)
op("#k140", t(9, "yüz"))
op("#fazla9", t(9, "karşılık"))
op("#dogru9", t(9, "Sistem")); op("#yanlis9", t(9, "Yanlış"))
# B10 — klemens ✓, sensör ✗, SCADA ✓ + koruma
op("#z10_1", t(10, "Bağlantılar"), .35)
op("#z10_0", t(10, "Kayma"), .35)
op("#z10_2", t(10, "Sistem"), .35)
op("#koru10", t(10, "sağlıklı"))
# B11 — kural kartı satır satır
J.append(f'tl.fromTo("#p11 .soz p",{{opacity:0,y:24}},{{opacity:1,y:0,duration:.6,ease:E}},{r(S[11][0] + .1)});')
op("#p11 .imza", t(11, "inan"))
# B12 — adres maskeyle, CTA son sözle; rotorlar sakin
s12 = S[12][0]
J.append(f'tl.fromTo("#adr12",{{clipPath:"inset(0 100% 0 0)"}},{{clipPath:"inset(0 0% 0 0)",duration:.6,ease:E}},{r(t(12, "Soner"))});')
J.append(f'tl.fromTo("#p12 .kim",{{opacity:0}},{{opacity:1,duration:.45}},{r(t(12, "Dı"))});')
J.append(f'tl.fromTo("#p12 .cta12",{{opacity:0,y:20}},{{opacity:1,y:0,duration:.5,ease:E}},{r(t(12, "Sıradaki"))});')
for i, sp in enumerate((48, 60, 44)):
    don(f"#r12_{i}", s12, S[12][1] - s12, round(sp * (S[12][1] - s12)))

# ---------------------------------------------------------------- ALTYAZI (karaoke) + SRT
BIR = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
ON = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]


def sayi(n):
    n = int(n); y, o, b = n // 100, n // 10 % 10, n % 10
    return " ".join(w for w in [("" if y < 2 else BIR[y]) + (" yüz" if y else ""), ON[o], BIR[b]] if w.strip()).strip() or "sıfır"


GOSTER = {  # ekranda/SRT'de görünen biçim (rakamla); her belirteç konuşulan kelime(ler)e eşlenir
    1: "Ekran 103 derece diyor. Elimdeki termometre 62. Hangisine inanırsın?",
    2: "Sahadan bir vaka. Vestas V126. Jeneratör sargı sıcaklığı 116 dereceye çıkınca türbin alarmla duruyor.",
    3: "Ama ses normal, titreşim yok, soğutma çalışıyor. Son 3 günün en yüksek değeri: 110, 112, 116.",
    4: "Gerçek ısınma yükü ve havayı izler, her gün düzenli 2 derece tırmanmaz. Bu, ölçüm zincirinin kaydığını düşündürür.",
    5: "Türbini durdurdum, jeneratör gövdesini termometreyle ben ölçtüm. Yaklaşık 62 derece. Aynı anda ekranda 103.",
    6: "Arada 41 derece fark var. Birkaç derece normaldir. 41 derece değildir.",
    7: "Sensör ölçümü ve değişimi; türbin durdurulup devre ayrıldıktan, gerilim yokluğu ölçümle doğrulandıktan ve kilitleme etiketleme uygulandıktan sonra yapılır.",
    8: "Sensörün direncini ölçtüm. 62 derecede beklenen değer yaklaşık 124 ohm. Sensör yaklaşık 140 ohm gösterdi.",
    9: "Bu, tabloda yaklaşık 103 dereceye karşılık gelir. Sistem direnci doğru çeviriyordu. Yanlış olan direncin kendisiydi.",
    10: "Bağlantılar sağlamdı. Kayma, sensörün kendisindeydi. Sistem işini yaptı: sağlıklı bir jeneratörü, korumak için durdurdu.",
    11: "Bir sayı ile makinenin davranışı birbirini tutmuyorsa, sayıyı kanıtlayana kadar makineye inan.",
    12: "Teşhisin tamamı, sonersoylu.com sitesinde. The Turbine Tech. Sıradaki vaka için takip et.",
}
OZEL = {"sonersoylu.com": 4}


def kac(tok):
    c = tok.rstrip(".,;:?!")
    if c in OZEL:
        return OZEL[c]
    rak = re.findall(r"\d+", c)
    if not rak:
        return 1
    return sum(len(sayi(d).split()) for d in rak) + (1 if re.sub(r"[\d\W_]", "", c) else 0)


TOK = []  # (beat, gösterim, s, e)
for b in sorted(S):
    ks, i = KB[b], 0
    for tok in GOSTER[b].split():
        n = kac(tok)
        TOK.append((b, tok, ks[i]["s"], ks[i + n - 1]["e"])); i += n
    assert i == len(ks), (b, i, len(ks))

# cümleler → en çok 6 kelime / ~34 karakterlik parçalar (MOTION B: 2 satır / 6 kelime)
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
cap_html = ""
wid = 0
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


ipucu = []  # cümle; 84 karakteri aşarsa virgül/noktalı virgülden bölünür
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
os.makedirs(f"{D}/out", exist_ok=True)
open(f"{D}/out/Ekran-103-Termometre-62-Short.srt", "w", encoding="utf-8").write("\n".join(srt))

# ---------------------------------------------------------------- SAYFA
uzak = "".join(turbine(cx, hy, L, 1920, f"bgt{i}", tw=(7, 16), op=1, color=INK)
               for i, (cx, hy, L) in enumerate([(170, 1540, 120), (560, 1470, 170), (930, 1590, 100)]))
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
for i in range(2, 13):
    s = S[i][0]
    giris += f'tl.fromTo("#b{i} .lab",{{opacity:0,y:14}},{{opacity:1,y:0,duration:.4,ease:E}},{r(s)});'
    if BASLIK[i - 1][1]:
        giris += f'tl.fromTo("#b{i} .w",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.5,ease:E,stagger:.04}},{r(s + .06)});'
    giris += f'tl.fromTo("#p{i} .pin",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.5,ease:E}},{r(s)});'

html = f'''<!doctype html>
<html lang="tr" data-resolution="portrait">
<head><meta charset="UTF-8"/><meta name="viewport" content="width={W}, height={H}"/>
<title>Ekran 103 °C, termometre 62 °C</title>
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
.soz{{position:absolute;left:0;top:40px;width:830px}}
.soz p{{font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:56px;line-height:1.16;letter-spacing:-.01em}}
.soz i{{font-style:italic;color:{ICE}}}
.imza{{margin-top:34px;font-family:"Geist Mono",monospace;font-weight:500;font-size:24px;letter-spacing:.12em;color:{MUTED}}}
.son12{{position:absolute;left:0;top:0;width:830px}}
.adres{{font-family:"Geist Mono",monospace;font-weight:500;font-size:40px;letter-spacing:.02em;color:{ICE}}}
#adr12{{display:inline-block}}
.kim{{margin-top:22px;font-size:28px;font-weight:500;color:{MUTED}}}
.cta12{{margin-top:34px}}
.pill{{display:inline-block;font-weight:600;font-size:34px;padding:18px 34px;border-radius:999px;border:2px solid {ICE};color:{ICE}}}
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
open(f"{D}/index.html", "w", encoding="utf-8").write(html)
amber = {i + 1: fn().count(AMBER) for i, fn in enumerate(PANELS)}
print(f"index.html yazıldı · süre {DUR} sn · {len(PARCA)} altyazı parçası · {len(srt)} SRT ipucu · amber geçişi/panel {amber}")
