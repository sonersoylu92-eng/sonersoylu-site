"""HyperFrames Reels kiti — MOTION.md paleti, yardımcı çizimler ve sayfa şablonu."""
import math, re
W, H = 1080, 1920
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



def sayfa(DUR, PANELS, BEATS, JS, cta=None, uzun=68):
    panels_html = ""
    for i, (s, e, fn) in enumerate(PANELS, 1):
        panels_html += f'<div id="p{i}" class="clip panel" data-start="{s}" data-duration="{round(e-s,3)}" data-track-index="2"><div class="pin">{fn()}</div></div>\n'
    beats_html = ""
    cta = cta or len(BEATS)
    for i, (s, e, lab, txt) in enumerate(BEATS, 1):
        extra = ""
        if i == cta:
            extra = '<div class="cta"><span class="pill">Devamı için takip et</span><span class="url">sonersoylu.com</span></div>'
        duz = re.sub(r"<[^>]+>", "", txt)
        cls = "hl" + (" son" if i == cta else "") + (" uzun" if len(duz) > uzun and i != cta else "")
        beats_html += (f'<div id="b{i}" class="clip beat" data-start="{s}" data-duration="{round(e-s,3)}" data-track-index="3"><div class="bin">'
                       f'<div class="lab">{lab}</div><h1 class="{cls}">{words(txt)}</h1>{extra}</div></div>\n')
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
.hl.uzun{{font-size:64px}}
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
'''
    giris = "".join(f'tl.fromTo("#b{i} .lab",{{opacity:0,y:16}},{{opacity:1,y:0,duration:.45,ease:E}},{s});tl.fromTo("#b{i} .w",{{opacity:0,y:38}},{{opacity:1,y:0,duration:.6,ease:E,stagger:.05}},{s+0.08});' for i,(s,e,l,t) in enumerate(BEATS,1) if i>1)
    giris += "".join(f'tl.fromTo("#p{i} .pin",{{opacity:0,y:40}},{{opacity:1,y:0,duration:.7,ease:E}},{s});' for i,(s,e,f) in enumerate(PANELS,1) if i>1)
    return html + "<script>\nconst tl = gsap.timeline({paused:true});\nconst E = \"power3.out\";\n" + giris + "\n" + JS + "\nwindow.__timelines[\"main\"] = tl;\ntl.seek(0);\n</script>\n</body></html>"
