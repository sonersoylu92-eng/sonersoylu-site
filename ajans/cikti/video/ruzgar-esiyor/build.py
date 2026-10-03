#!/usr/bin/env python3
"""Short — "Rüzgâr esiyor, türbin duruyor. Arızalı mı?" · index.html + .srt üretici.
Plan: ajans/cikti/plan-ruzgar-esiyor-2026-10-03.md (PANO #7, onaylı). MOTION.md kuralları.
Ses önce (K-006): sahne pencereleri ses/zaman.json, animasyon anları ses/kelime.json (CTC'ye zorunlu hizalanmış
kelime zamanları) üzerinden kurulur; ses değişirse yalnız kelime.py + bu betik yeniden çalıştırılır.
SVG: döndürülen her parça dayanağına translate edilmiş dış <g> + iç <g> (svgOrigin "0 0"), sayaç yok (K-001, K-004).
Diyagram etiketleri koyu haleli (K-012). Güç eğrisi ruzgar/index.html PC90 dizisinden (yayımlanmış N90/2500 eğrisi).
Çalıştırma: python3 build.py  → $VIDEO/index.html, depoya .srt"""
import json, math, os, re, sys
sys.path.insert(0, "/home/claude/video-edit/tools")
from hfkit import W, H, ICE, ELEC, AMBER, INK, MUTED, FAINT, LINE, SURF, turbine, words, fontface, airfoil  # noqa

D = os.path.dirname(os.path.abspath(__file__))
V = os.environ.get("VIDEO", "/home/claude/video-edit/videos/ruzgar-esiyor")
Z = json.load(open(f"{V}/ses/zaman.json"))
K = json.load(open(f"{V}/ses/kelime.json"))
DUR = Z[-1]["sahne_son"]
S = {z["beat"]: (z["sahne_bas"], z["sahne_son"]) for z in Z}
BG = "#07090B"
HALO = 'stroke="#07090B" stroke-width="8" stroke-linejoin="round" paint-order="stroke"'
SRT_AD = "Ruzgar-Esiyor-Turbin-Duruyor-Short.srt"


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


def tik(cx, cy, col=ICE, rr=24):
    return (f'<circle cx="{cx}" cy="{cy}" r="{rr}" fill="{BG}" stroke="{col}" stroke-width="3"/>'
            f'<path d="M{cx-10},{cy+1} L{cx-3},{cy+9} L{cx+11},{cy-8}" fill="none" stroke="{col}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>')


def carpi(cx, cy, col=MUTED, rr=24):
    return (f'<circle cx="{cx}" cy="{cy}" r="{rr}" fill="{BG}" stroke="{col}" stroke-width="3"/>'
            f'<path d="M{cx-8},{cy-8} L{cx+8},{cy+8} M{cx+8},{cy-8} L{cx-8},{cy+8}" stroke="{col}" stroke-width="5" stroke-linecap="round"/>')


def asma_kilit(cx, cy, col=ICE):
    return (f'<path d="M{cx-12},{cy-2} L{cx-12},{cy-14} A12,12 0 0 1 {cx+12},{cy-14} L{cx+12},{cy-2}" fill="none" stroke="{col}" stroke-width="5"/>'
            f'<rect x="{cx-19}" y="{cy-4}" width="38" height="30" rx="6" fill="{col}"/>')


def etiket(cx, cy, col=ICE):
    return (f'<path d="M{cx-26},{cy-14} L{cx+12},{cy-14} L{cx+26},{cy} L{cx+12},{cy+14} L{cx-26},{cy+14} Z" fill="none" stroke="{col}" stroke-width="3"/>'
            f'<circle cx="{cx+10}" cy="{cy}" r="3.5" fill="{col}"/>')


def salter(cx, cy, col=ICE):
    return (f'<circle cx="{cx-22}" cy="{cy+8}" r="5" fill="{col}"/><circle cx="{cx+22}" cy="{cy+8}" r="5" fill="{col}"/>'
            f'<line x1="{cx-22}" y1="{cy+8}" x2="{cx+16}" y2="{cy-14}" stroke="{col}" stroke-width="4" stroke-linecap="round"/>')


def pim(cx, cy, col=ICE):
    return (f'<circle cx="{cx}" cy="{cy}" r="22" fill="none" stroke="{col}" stroke-width="3"/>'
            f'<rect x="{cx-34}" y="{cy-5}" width="68" height="10" rx="5" fill="{col}"/>')


def ruzgar_cizgileri(idp, x0, x1, ys, col=ELEC, op=.45):
    """Sağdan sola akan ince rüzgâr çizgileri; akış dashoffset tween'iyle (zamana bağlı, seek güvenli)."""
    out = ""
    for k, y in enumerate(ys):
        d = "M" + " L".join(f"{x},{y + 7*math.sin(x/70 + k):.1f}" for x in range(x1, x0 - 1, -10))
        out += (f'<path class="{idp}" d="{d}" fill="none" stroke="{col}" stroke-width="3" stroke-linecap="round" '
                f'stroke-dasharray="70 150" stroke-dashoffset="{k*55}" opacity="{op}"/>')
    return out


# ---------------------------------------------------------------- GÜÇ EĞRİSİ (ruzgar/index.html PC90)
PC90 = [[0, 0], [3, 0], [4, 65], [5, 175], [6, 340], [7, 570], [8, 870], [9, 1230], [10, 1620], [11, 2000],
        [12, 2290], [13, 2450], [13.5, 2500], [25, 2500], [25.01, 0], [28, 0]]
GX0, GX1, GY0, GY1, VMAX = 96, 800, 40, 330, 28


def GX(v):
    return GX0 + (GX1 - GX0) * v / VMAX


def GY(p):
    return GY1 - (GY1 - GY0) * p / 2500


def grafik(idp, eksen_etiket=True):
    g = f'<line x1="{GX0}" y1="{GY1}" x2="{GX1}" y2="{GY1}" stroke="{MUTED}" stroke-width="2"/><line x1="{GX0}" y1="{GY0-10}" x2="{GX0}" y2="{GY1}" stroke="{MUTED}" stroke-width="2"/>'
    g += f'<line x1="{GX0}" y1="{GY(2500):.1f}" x2="{GX1}" y2="{GY(2500):.1f}" stroke="{LINE}" stroke-width="1"/>'
    if eksen_etiket:
        g += f'<text x="{GX0-14}" y="{GY(2500)+7:.1f}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">2.500</text>'
        g += f'<text x="{GX0-14}" y="{GY1+7}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">0</text>'
        g += f'<text x="{GX0}" y="{GY0-24}" class="mono" font-size="18" fill="{MUTED}">GÜÇ (kW)</text>'
        g += f'<text x="{GX1}" y="{GY1+64}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">RÜZGÂR (m/s)</text>'
    d = "M" + " L".join(f"{GX(v):.1f},{GY(p):.1f}" for v, p in PC90)
    g += f'<path id="{idp}" d="{d}" fill="none" stroke="{ICE}" stroke-width="5" stroke-linejoin="round"/>'
    return g


def xetiket(v, col=MUTED, idx=""):
    yaz = str(v).replace(".", ",")   # Türkçe ondalık
    return f'<text {idx} x="{GX(v):.1f}" y="{GY1+34}" text-anchor="middle" class="mono" font-size="20" fill="{col}">{yaz}</text>'


# ---------------------------------------------------------------- PANELLER (830 × 600, sayfada y 440–1040)
def p1():
    return svg(f'''
  {ruzgar_cizgileri("akis1", 0, 830, [60, 130, 210, 300, 390])}
  <path d="M-100,566 Q300,522 415,530 Q560,538 1000,566 L1000,620 L-100,620 Z" fill="{SURF}" opacity=".9"/>
  {turbine(415, 150, 150, 535, "r1", tw=(9, 20))}
  <g id="soru1" opacity="0"><circle cx="560" cy="120" r="40" fill="{BG}" stroke="{AMBER}" stroke-width="3"/>
    <text x="560" y="138" text-anchor="middle" class="disp" font-size="54" fill="{AMBER}">?</text></g>
  <text id="ariza1" x="0" y="478" class="disp" font-size="60" fill="{INK}" opacity="0" {HALO}>Arızalı mı?</text>''')


def p2():
    bant = f'<rect id="bant2" x="{GX(0):.1f}" y="{GY0}" width="{GX(3)-GX(0):.1f}" height="{GY1-GY0}" fill="{ICE}" opacity="0"/>'
    return svg(f'''{bant}{grafik("egri2")}
  {xetiket(0)}{xetiket(13.5)}{xetiket(25)}
  <g id="uc2" opacity="0"><line x1="{GX(3):.1f}" y1="{GY0}" x2="{GX(3):.1f}" y2="{GY1}" stroke="{AMBER}" stroke-width="3" stroke-dasharray="8 6"/>
    <text x="{GX(3):.1f}" y="{GY1+34}" text-anchor="middle" class="mono" font-size="22" fill="{AMBER}" {HALO}>3</text>
    <text x="{GX(14.5):.1f}" y="{GY0+150}" class="mono" font-size="22" fill="{INK}" {HALO}>3 m/s ALTINDA</text><text x="{GX(14.5):.1f}" y="{GY0+184}" class="mono" font-size="22" fill="{INK}" {HALO}>ÜRETİM YOK</text></g>
  <g>{kart(0, 430, 830, 150)}
    <text x="28" y="478" class="mono" font-size="20" fill="{MUTED}">ÖRNEĞİN BU MODELDE</text>
    <text x="28" y="530" class="mono" font-size="30" fill="{INK}">NORDEX N90/2500</text>
    <text x="28" y="562" class="mono" font-size="18" fill="{MUTED}">YAYIMLANMIŞ GÜÇ EĞRİSİ</text></g>''')


def p3():
    af = airfoil(0, 0, 150, 0)
    return svg(f'''{grafik("egri3")}
  {xetiket(0)}{xetiket(13.5)}
  <g id="kes3" opacity="0"><line x1="{GX(25):.1f}" y1="{GY0-10}" x2="{GX(25):.1f}" y2="{GY1}" stroke="{AMBER}" stroke-width="3" stroke-dasharray="8 6"/>
    <text x="{GX(25):.1f}" y="{GY1+34}" text-anchor="middle" class="mono" font-size="22" fill="{AMBER}" {HALO}>25</text>
    <text x="{GX(25)-16:.1f}" y="{GY0+60}" text-anchor="end" class="mono" font-size="22" fill="{INK}" {HALO}>25 m/s ÜSTÜ: DURUR</text></g>
  {kart(0, 410, 830, 190)}
  <text x="28" y="452" class="mono" font-size="20" fill="{MUTED}">KANAT KESİTİ</text>
  <text x="28" y="488" class="mono" font-size="18" fill="{MUTED}">RÜZGÂR →</text>
  <g transform="translate(300,490)"><g id="af3"><path d="{af}" fill="{INK}" opacity=".9"/></g></g>
  <text id="bayrak3" x="440" y="500" class="mono" font-size="24" fill="{ICE}" opacity="0">BAYRAK KONUMU</text>
  <text x="440" y="566" class="mono" font-size="18" fill="{MUTED}">DEĞERLER MODELE GÖRE DEĞİŞİR</text>''')


def p4():
    uc = (f'<rect id="uc4a" x="{GX(0):.1f}" y="{GY0}" width="{GX(3)-GX(0):.1f}" height="{GY1-GY0}" fill="{ICE}" opacity="0"/>'
          f'<rect id="uc4b" x="{GX(25):.1f}" y="{GY0}" width="{GX(28)-GX(25):.1f}" height="{GY1-GY0}" fill="{ICE}" opacity="0"/>')
    return f'<div class="soz4"><p>…kule dibinde “makine niye durdu” sorusunun cevabı çoğu zaman arıza değil, <i>bu eğrinin bir ucudur</i>.</p>' \
           f'<div class="imza">EĞİTİM · BÖLÜM 03</div></div>' \
           f'<svg viewBox="0 0 830 400" class="psvg" style="position:absolute;left:0;top:250px;height:400px">' \
           f'<g transform="translate(0,0)">{uc}<g opacity=".45">{grafik("egri4", False)}</g>{xetiket(3)}{xetiket(25)}</g></svg>'


def p5():
    adim = [("ŞALTER AÇILIR", salter), ("KİLİTLENİR", asma_kilit), ("ETİKETLENİR", etiket)]
    rows = ""
    for k, (txt, ikon) in enumerate(adim):
        y = 70 + k * 96
        rows += (f'<g id="a5_{k}" opacity=".3"><rect id="ar5_{k}" x="0" y="{y}" width="830" height="80" rx="16" fill="{SURF}" stroke="{LINE}" stroke-width="2"/>'
                 f'<text x="30" y="{y+50}" class="mono" font-size="22" fill="{ICE}">0{k+1}</text>'
                 f'<text x="96" y="{y+51}" class="mono" font-size="28" fill="{INK}">{txt}</text>{ikon(740, y + 40)}</g>')
    return svg(f'''
  <text x="0" y="40" class="mono" font-size="22" fill="{MUTED}">LOTO · KİLİTLE-ETİKETLE</text>
  {rows}
  <g id="rk5" opacity="0"><rect x="0" y="380" width="830" height="110" rx="16" fill="{SURF}" stroke="{ICE}" stroke-width="2"/>
    <text x="30" y="428" class="mono" font-size="24" fill="{AMBER}">GEREKİYORSA</text>
    <text x="30" y="468" class="mono" font-size="28" fill="{INK}">ROTOR KİLİDİ</text>{pim(740, 435)}</g>
  <text id="not5" x="0" y="560" class="mono" font-size="20" fill="{MUTED}" opacity="0">“BİRİ DİĞERİNİN YERİNİ TUTMAZ”</text>''')


def p6():
    direk = (f'<g stroke="{INK}" stroke-width="3" fill="none" opacity=".85">'
             f'<path d="M620,330 L660,90 L700,330 M640,210 L680,210 M630,270 L690,270 M600,120 L720,120 M650,150 L670,150"/></g>'
             f'<path d="M600,120 Q520,170 400,150" fill="none" stroke="{ELEC}" stroke-width="3"/>'
             f'<path d="M720,120 Q780,150 830,140" fill="none" stroke="{ELEC}" stroke-width="3"/>')
    return svg(f'''
  {ruzgar_cizgileri("akis6", 0, 400, [70, 150, 240], op=.4)}
  {turbine(200, 130, 105, 340, "r6", tw=(7, 15))}
  <circle cx="200" cy="370" r="9" fill="{ICE}"/><text x="220" y="377" class="mono" font-size="18" fill="{MUTED}">HAZIR</text>
  {direk}
  <text x="560" y="377" class="mono" font-size="18" fill="{MUTED}">ŞEBEKE</text>
  <g id="kisit6" opacity="0">{asma_kilit(500, 160, AMBER)}
    <text x="460" y="230" class="mono" font-size="22" fill="{AMBER}" {HALO}>KISIT</text></g>
  {kart(0, 410, 830, 190)}
  <text x="28" y="452" class="mono" font-size="19" fill="{MUTED}">ŞEBEKE İŞLETMECİSİNDEN GELEN ÜRETİM KISITI</text>
  <text id="degil6" x="28" y="510" class="disp" font-size="44" fill="{INK}" opacity="0">Bu bir <tspan font-style="italic" fill="{ICE}">arıza değildir.</tspan></text>
  <text id="alarm6" x="28" y="566" class="mono" font-size="21" fill="{ICE}" opacity="0">ALARM VARSA: ÖNCE ALARMI DOĞRU OKU</text>''')


def p7():
    nas = (f'<g transform="translate(415,250)"><g id="nas7">'
           f'<rect x="-50" y="-34" width="190" height="68" rx="16" fill="{SURF}" stroke="{ICE}" stroke-width="4"/>'
           f'<rect x="-82" y="-16" width="32" height="32" rx="10" fill="{ICE}"/>'
           f'<rect x="-92" y="-200" width="14" height="400" rx="7" fill="{INK}" opacity=".85"/></g></g>')
    ok = f'<path d="M560,110 A190,190 0 0 1 600,330" fill="none" stroke="{AMBER}" stroke-width="5" stroke-linecap="round"/><path d="M584,316 L601,334 L614,310" fill="none" stroke="{AMBER}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
    return svg(f'''
  <text x="0" y="30" class="mono" font-size="20" fill="{MUTED}">ÜSTTEN GÖRÜNÜŞ</text>
  <circle cx="415" cy="250" r="44" fill="none" stroke="{MUTED}" stroke-width="3" stroke-dasharray="6 6"/>
  {nas}
  <g id="ok7" opacity="0">{ok}</g>
  <text x="0" y="96" class="mono" font-size="20" fill="{MUTED}">RÜZGÂR: YOK</text>
  {kart(0, 450, 830, 150)}
  <g id="dog7" opacity="0">{tik(52, 492)}<text x="92" y="500" class="mono" font-size="24" fill="{ICE}">DÖNEN: NASEL (MAKİNE DAİRESİ)</text></g>
  <g id="rot7" opacity="0">{carpi(52, 556)}<text x="92" y="564" class="mono" font-size="24" fill="{INK}">ROTOR DEĞİL</text></g>''')


def kablo_d(burgu, faz):
    """Kule içinde aşağı inen kablo; burgu = sarmal sayısı (≈0 düz). Nokta sayısı sabit (attr d tween'i için)."""
    pts = []
    for i in range(41):
        y = 110 + 270 * i / 40
        x = 290 + faz * 14 + 28 * min(1, burgu) * math.sin(2 * math.pi * burgu * i / 40 + faz * 2.1)
        pts.append(f"{x:.1f},{y:.1f}")
    return "M" + " L".join(pts)


def p8():
    kab = "".join(f'<path id="kb8_{f}" d="{kablo_d(0.001, f)}" fill="none" stroke="{[ICE, ELEC, INK][f]}" stroke-width="5" stroke-linecap="round"/>' for f in range(3))
    yay = f'<path id="yay8" d="M640,190 A70,70 0 0 1 640,330 A70,70 0 0 1 640,190" fill="none" stroke="{AMBER}" stroke-width="10" stroke-linecap="round"/>'
    return svg(f'''
  <path d="M256,96 L356,96 L374,392 L238,392 Z" fill="none" stroke="{MUTED}" stroke-width="3"/>
  <g transform="translate(306,64)"><g id="nas8"><rect x="-70" y="-26" width="140" height="52" rx="12" fill="{SURF}" stroke="{ICE}" stroke-width="3"/></g></g>
  <path id="okr8" d="M226,22 L386,22 M372,10 L388,22 L372,34" fill="none" stroke="{ICE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <path id="okl8" d="M386,22 L226,22 M240,10 L224,22 L240,34" fill="none" stroke="{ICE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
  {kab}
  <text x="396" y="150" class="mono" font-size="18" fill="{MUTED}">GÜÇ KABLOLARI</text>
  <circle cx="640" cy="260" r="70" fill="none" stroke="{LINE}" stroke-width="10"/>
  {yay}
  <text x="640" y="368" text-anchor="middle" class="mono" font-size="18" fill="{MUTED}">TUR SAYACI</text>
  {kart(0, 410, 830, 190)}
  <text x="28" y="452" class="mono" font-size="20" fill="{INK}">KONTROL SİSTEMİ TURLARI SAYAR</text>
  <text id="esik8" x="28" y="506" class="mono" font-size="24" fill="{ICE}" opacity="0">EŞİKTE: TERS YÖNE DÖNER</text>
  <text id="olsun8" x="28" y="560" class="mono" font-size="20" fill="{MUTED}" opacity="0">RÜZGÂR OLSUN OLMASIN</text>''')


def p9():
    X0, X1, Y0, Y1 = 70, 560, 30, 300

    def wy(v):
        return Y1 - (Y1 - Y0) * v / 28
    dz = "M" + " L".join(f"{X0 + (X1-X0)*i/60:.1f},{wy(9 + 4*math.sin(i/7) + 2.2*math.sin(i/2.6+1)):.1f}" for i in range(61))
    return svg(f'''
  <line x1="{X0}" y1="{Y1}" x2="{X1}" y2="{Y1}" stroke="{MUTED}" stroke-width="2"/><line x1="{X0}" y1="{Y0}" x2="{X0}" y2="{Y1}" stroke="{MUTED}" stroke-width="2"/>
  <line x1="{X0}" y1="{wy(3):.1f}" x2="{X1}" y2="{wy(3):.1f}" stroke="{INK}" stroke-width="2" stroke-dasharray="8 6" opacity=".7"/>
  <line x1="{X0}" y1="{wy(25):.1f}" x2="{X1}" y2="{wy(25):.1f}" stroke="{INK}" stroke-width="2" stroke-dasharray="8 6" opacity=".7"/>
  <text x="{X0-12}" y="{wy(3)+7:.1f}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">3</text>
  <text x="{X0-12}" y="{wy(25)+7:.1f}" text-anchor="end" class="mono" font-size="18" fill="{MUTED}">25</text>
  <path id="rz9" d="{dz}" fill="none" stroke="{ELEC}" stroke-width="4" stroke-linejoin="round"/>
  <text x="{X0}" y="{Y1+34}" class="mono" font-size="16" fill="{MUTED}">RÜZGÂR (m/s) · ZAMAN → · TEMSİLÎ ÇİZİM</text>
  {kart(600, 60, 230, 180)}
  <text x="624" y="104" class="mono" font-size="17" fill="{MUTED}">NORDEX N90/2500</text>
  <text x="624" y="190" class="disp" font-size="60" fill="{ICE}">– kW</text>
  <foreignObject x="0" y="380" width="830" height="220"><div xmlns="http://www.w3.org/1999/xhtml" class="son9">
    <div class="adres"><span id="adr9">sonersoylu.com/ruzgar</span></div>
    <div class="kim">The Turbine Tech · Soner Soylu — Rüzgâr Türbini Saha Servis Teknisyeni</div>
    <div class="cta9"><span class="pill">Sıradaki soru için takip et</span></div></div></foreignObject>''')


PANELS = [p1, p2, p3, p4, p5, p6, p7, p8, p9]
BASLIK = [
    ("RÜZGÂR VAR · ÜRETİM YOK", "Rüzgâr esiyor, <i>türbin</i> duruyor."),
    ("GÜÇ EĞRİSİ · KESME ALTI", "Rüzgâr <i>zayıfsa</i> üretim yok."),
    ("GÜÇ EĞRİSİ · KESME ÜSTÜ", "Çok sert rüzgârda da <i>durur</i>."),
    ("KULE DİBİNDEN", ""),
    ("PLANLI BAKIM", "Bakımda türbin <i>durdurulur</i>."),
    ("ALARM YOK AMA DURUYOR", "Şebeke <i>kısıtı</i> gelirse durur."),
    ("TERSİ DE OLUR", "Rüzgâr yok, <i>nasel</i> dönüyor."),
    ("KABLO AÇMA", "Kablolar <i>burulur</i>, sonra açılır."),
    ("CANLI RÜZGÂR", "Eğriyi <i>canlı</i> rüzgârla gör."),
]

# ---------------------------------------------------------------- ANİMASYON (mutlak saniye)
J = []


def op(sel, at, d=.45):
    J.append(f'tl.fromTo("{sel}",{{opacity:0}},{{opacity:1,duration:{d},ease:E}},{r(at)});')


def ciz(sel, at, d, ease="power1.inOut"):
    J.append(f'(()=>{{const el=document.querySelector("{sel}");const L=el.getTotalLength();'
             f'tl.fromTo(el,{{strokeDasharray:L,strokeDashoffset:L}},{{strokeDashoffset:0,duration:{d},ease:"{ease}"}},{r(at)});}})();')


def don(sel, at, d, deg, ease="none"):
    J.append(f'tl.to("{sel}",{{rotation:"+={deg}",duration:{d},ease:"{ease}",svgOrigin:"0 0"}},{r(at)});')


def akis(cls, a, b, hiz=260):
    J.append(f'tl.fromTo("#root .{cls}",{{attr:{{"stroke-dashoffset":(i)=>i*55}}}},{{attr:{{"stroke-dashoffset":(i)=>i*55+{round(hiz*(b-a))}}},duration:{r(b-a)},ease:"none"}},{r(a)});')


# B1 — ilk kare dolu (K-004): türbin + akan rüzgâr + başlık 0. karede; rotor durmuş
akis("akis1", 0, S[1][1])
op("#soru1", t(1, "Arızalı"), .35)
op("#ariza1", t(1, "Arızalı"), .35)
J.append(f'tl.fromTo("#cokzaman",{{clipPath:"inset(0 100% 0 0)"}},{{clipPath:"inset(0 0% 0 0)",duration:.5,ease:E}},{r(t(1, "Çoğu"))});')
# B2 — eğri soldan çizilir, "üç"te 0–3 bandı + 3 m/s
s2 = S[2][0]
ciz("#egri2", s2 + .2, 1.6)
J.append(f'tl.to("#bant2",{{opacity:.16,duration:.4}},{r(t(2, "üç"))});')
op("#uc2", t(2, "üç"), .35)
# B3 — 25 m/s kesik çizgi, "bayrak"ta kesit 90° döner (K-001)
op("#kes3", t(3, "yirmi"), .35)
J.append(f'tl.to("#egri3",{{attr:{{stroke:"{ICE}"}},duration:.1}},{r(S[3][0])});')
don("#af3", t(3, "bayrak"), .8, 90, "power2.inOut")
op("#bayrak3", t(3, "bayrak") + .5, .4)
# B4 — alıntı + iki uç yanar
J.append(f'tl.fromTo("#p4 .soz4 p",{{opacity:0,y:24}},{{opacity:1,y:0,duration:.6,ease:E}},{r(S[4][0] + .1)});')
op("#p4 .imza", S[4][0] + .6)
J.append(f'tl.to(["#uc4a","#uc4b"],{{opacity:.2,duration:.5}},{r(t(4, "eğrinin"))});')
# B5 — LOTO üç adım sözle, rotor kilidi "Gerekiyorsa"da
for k, w in enumerate(["açılır", "kilitlenir", "etiketlenir"]):
    J.append(f'tl.to("#a5_{k}",{{opacity:1,duration:.35,ease:E}},{r(t(5, w))});'
             f'tl.to("#ar5_{k}",{{attr:{{stroke:"{ICE}"}},duration:.35}},{r(t(5, w))});')
op("#rk5", t(5, "Gerekiyorsa"))
op("#not5", t(5, "rotor") + .4)
# B6 — rotor döner, kısıtla yavaşlayıp durur; "Alarm"da uyarı satırı
s6 = S[6][0]
akis("akis6", s6, S[6][1])
dd = t(6, "durdurulur")
don("#r6", s6, dd - s6, round(70 * (dd - s6)))
don("#r6", dd, 1.6, 45, "power2.out")
op("#kisit6", t(6, "kısıtı"), .35)
op("#degil6", t(6, "Bu"))
op("#alarm6", t(6, "Alarm"))
# B7 — nasel yavaşça döner (yaw), etiketler sözle
s7 = S[7][0]
don("#nas7", s7 + .2, S[7][1] - s7 - .2, 55, "sine.inOut")
op("#ok7", s7 + .3)
op("#dog7", t(7, "makine"), .35)
op("#rot7", t(7, "rotor"), .35)
# B8 — nasel döner, kablolar burulur, sayaç yayı dolar; eşikte ters dönüş, kablolar açılır
s8 = S[8][0]
a8, b8 = s8 + .2, t(8, "tur")
c8, e8 = t(8, "türbin"), t(8, "döner", 2, son=True)
for f in range(3):
    J.append(f'tl.fromTo("#kb8_{f}",{{attr:{{d:"{kablo_d(0.001, f)}"}}}},{{attr:{{d:"{kablo_d(3, f)}"}},duration:{r(b8-a8)},ease:"none"}},{r(a8)});')
    J.append(f'tl.to("#kb8_{f}",{{attr:{{d:"{kablo_d(0.001, f)}"}},duration:{r(e8-c8)},ease:"power1.inOut"}},{r(c8)});')
J.append('(()=>{const el=document.querySelector("#yay8");const L=el.getTotalLength();'
         f'tl.fromTo(el,{{strokeDasharray:L,strokeDashoffset:L}},{{strokeDashoffset:0,duration:{r(b8-a8)},ease:"none"}},{r(a8)});'
         f'tl.to(el,{{strokeDashoffset:L,duration:{r(e8-c8)},ease:"power1.inOut"}},{r(c8)});}})();')
J.append(f'tl.to("#okr8",{{opacity:0,duration:.25}},{r(c8)});tl.to("#okl8",{{opacity:1,duration:.25}},{r(c8)});')
op("#esik8", c8); op("#olsun8", t(8, "rüzgâr"))
# B9 — rüzgâr çizgisi, adres maskeyle, kanal + CTA
s9 = S[9][0]
ciz("#rz9", s9 + .2, 1.6)
J.append(f'tl.fromTo("#adr9",{{clipPath:"inset(0 100% 0 0)"}},{{clipPath:"inset(0 0% 0 0)",duration:.6,ease:E}},{r(t(9, "Soner"))});')
J.append(f'tl.fromTo("#p9 .kim",{{opacity:0}},{{opacity:1,duration:.45}},{r(t(9, "Dı"))});')
J.append(f'tl.fromTo("#p9 .cta9",{{opacity:0,y:20}},{{opacity:1,y:0,duration:.5,ease:E}},{r(t(9, "Sıradaki"))});')

# ---------------------------------------------------------------- ALTYAZI (karaoke) + SRT
BIR = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
ON = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]


def sayi(n):
    n = int(n); y, o, b = n // 100, n // 10 % 10, n % 10
    return " ".join(w for w in [("" if y < 2 else BIR[y]) + (" yüz" if y else ""), ON[o], BIR[b]] if w.strip()).strip() or "sıfır"


GOSTER = {  # ekranda/SRT'de görünen biçim (rakamla); her belirteç konuşulan kelime(ler)e eşlenir
    1: "Rüzgâr esiyor, türbin duruyor. Arızalı mı? Çoğu zaman, hayır.",
    2: "Rüzgâr zayıfsa üretim olmaz. Örneğin bu modelde, saniyede 3 metrenin altında türbin durur.",
    3: "Çok sert rüzgârda da durur. Saniyede 25 metrenin üstünde, emniyet için kanatlar bayrak konumuna alınır.",
    4: "Kule dibinde makine niye durdu sorusunun cevabı çoğu zaman arıza değil, bu eğrinin bir ucudur.",
    5: "Planlı bakımda da türbin durdurulur. Şalter açılır, kilitlenir ve etiketlenir. Gerekiyorsa rotor kilidi de takılır.",
    6: None,  # metin.py'deki seçilen metinden (zaman.json) alınır
    7: "Tersi de olur: rüzgâr yok, ama rotor değil, tepedeki makine dairesi dönüyor.",
    8: "Kule içindeki güç kabloları, makine dairesiyle birlikte döner ve burularak dolanır. Belirli bir tur sayısından sonra türbin, rüzgâr olsun olmasın, kabloları açmak için ters yöne döner.",
    9: "Güç eğrisini canlı rüzgârla görmek için, sonersoylu.com sitesinde rüzgâr sayfası. The Turbine Tech. Sıradaki soru için takip et.",
}
GOSTER[6] = next(z["metin"] for z in Z if z["beat"] == 6)
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
open(f"{D}/{SRT_AD}", "w", encoding="utf-8").write("\n".join(srt))

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
    ek = '<div id="cokzaman" class="alt1">ÇOĞU ZAMAN: <b>HAYIR</b></div>' if i == 1 else ""
    beats_html += f'<div id="b{i}" class="clip beat" data-start="{r(s)}" data-duration="{r(e-s)}" data-track-index="3"><div class="bin"><div class="lab">{lab}</div>{h1}{ek}</div></div>\n'

giris = ""
for i in range(2, len(PANELS) + 1):
    s = S[i][0]
    giris += f'tl.fromTo("#b{i} .lab",{{opacity:0,y:14}},{{opacity:1,y:0,duration:.4,ease:E}},{r(s)});'
    if BASLIK[i - 1][1]:
        giris += f'tl.fromTo("#b{i} .w",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.5,ease:E,stagger:.04}},{r(s + .06)});'
    giris += f'tl.fromTo("#p{i} .pin",{{opacity:0,y:30}},{{opacity:1,y:0,duration:.5,ease:E}},{r(s)});'

html = f'''<!doctype html>
<html lang="tr" data-resolution="portrait">
<head><meta charset="UTF-8"/><meta name="viewport" content="width={W}, height={H}"/>
<title>Rüzgâr esiyor, türbin duruyor</title>
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
.alt1{{margin-top:16px;font-family:"Geist Mono",monospace;font-weight:500;font-size:28px;letter-spacing:.12em;color:{MUTED};display:inline-block}}
.alt1 b{{color:{ICE};font-weight:500}}
.w{{display:inline-block}}
.pin{{position:absolute;left:90px;top:440px;width:830px;height:600px}}
.psvg{{width:830px;display:block;overflow:visible}}
.mono{{font-family:"Geist Mono",monospace;font-weight:500;letter-spacing:.08em}}
.disp{{font-family:"Fraunces",Georgia,serif;font-weight:600}}
.ct{{position:absolute;left:90px;width:830px;top:1190px;transform:translateY(-50%);text-align:center;
  font-family:"Geist",sans-serif;font-weight:700;font-size:64px;line-height:1.14;color:{INK}}}
.cw{{display:inline}}
#p4 .pin{{top:330px;height:710px}}
.soz4{{position:absolute;left:0;top:0;width:830px}}
.soz4 p{{font-family:"Fraunces",Georgia,serif;font-weight:600;font-size:46px;line-height:1.16;letter-spacing:-.01em}}
.soz4 i{{font-style:italic;color:{ICE}}}
.imza{{margin-top:22px;font-family:"Geist Mono",monospace;font-weight:500;font-size:22px;letter-spacing:.12em;color:{MUTED}}}
.son9{{width:830px}}
.adres{{font-family:"Geist Mono",monospace;font-weight:500;font-size:44px;letter-spacing:.02em;color:{ICE}}}
#adr9{{display:inline-block}}
.kim{{margin-top:16px;font-size:24px;font-weight:500;color:{MUTED}}}
.cta9{{margin-top:26px}}
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
print(f"index.html yazıldı · süre {DUR} sn · {len(PARCA)} altyazı parçası · {len(srt)} SRT ipucu · amber geçişi/panel {amber}")
