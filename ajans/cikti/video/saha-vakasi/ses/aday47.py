"""K-011/K-013 (güncel): B4 "ısınma" ve B7 "yokluğu" için yeni adaylar.
1) Her beat için ADAY aday üret (Piper fahrettin), sona 0,4 sn sessizlik ekleyerek tek tek yazdır, rakamları
   yazıya çevirip puanla (norm()).
2) Karar tam dosyada: en iyi 3 aday sırayla anlatıma yerleştirilir (anlatim.py ile aynı dizilim), beat penceresi
   ±0,3 sn + 0,4 sn sessizlikle iki farklı dolguyla (0,3 / 0,5 sn) yazdırılır. İki geçişte de kelime kelime eşleşen
   en kısa aday seçilir. Seçilen sec_N.wav/json önbelleğe (aynı _anahtar) yazılır; anlatim.py sonra önbellekten dizer.
"""
import json, os, re, subprocess, sys, difflib
import numpy as np, soundfile as sf, sherpa_onnx
sys.path.insert(0, "/home/claude/video-edit/tools")
from ses import tts
from metin import BEAT
src = open("anlatim.py").read(); ns = {"re": re}; exec(src[src.index("BIR ="):src.index("wd = ")], ns); norm, sayi = ns["norm"], ns["sayi"]
M = os.environ.get("MODEL_DIZIN", "/home/claude/models")
ADAY = {4: int(os.environ.get("ADAY4", "6")), 7: int(os.environ.get("ADAY7", "6"))}; BOSLUK, BAS0, SON_PAY = 0.25, 0.05, 0.5
HEDEF = [4, 7]

wd = f"{M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd + "turbo-encoder.int8.onnx", decoder=wd + "turbo-decoder.int8.onnx",
        tokens=wd + "turbo-tokens.txt", language="tr", num_threads=os.cpu_count() or 2)

def r16(x, sr):
    sf.write("_r.wav", x, sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "_r.wav", "-ac", "1", "-ar", "16000", "_r16.wav"], check=True)
    z, _ = sf.read("_r16.wav", dtype="float32"); return z

def oku16(z):
    s = W.create_stream(); s.accept_waveform(16000, z); W.decode_stream(s); return s.result.text.strip()

def uyum(hedef, duy, kenar=False):
    h, d = norm(hedef), norm(duy)
    if kenar:  # tam dosyada pencere komşu beatin ilk/son hecesini alabilir: uçtaki kısa fazlalık sızıntıdır, ayıkla
        ops = difflib.SequenceMatcher(None, h, d).get_opcodes()
        if ops and ops[-1][0] == "insert" and len(" ".join(d[ops[-1][3]:ops[-1][4]])) <= 7: d = d[:ops[-1][3]]
        if ops and ops[0][0] == "insert" and len(" ".join(d[ops[0][3]:ops[0][4]])) <= 7: d = d[ops[0][4]:]
    return difflib.SequenceMatcher(None, h, d).ratio(), [(op, " ".join(h[a:b]), " ".join(d[c:e]))
            for op, a, b, c, e in difflib.SequenceMatcher(None, h, d).get_opcodes() if op != "equal"]

T = tts("fahrettin")
mevcut = {}
for i in range(1, len(BEAT) + 1):
    x, SR = sf.read(f"sec_{i}.wav", dtype="float32"); mevcut[i] = x

rapor = {}
for b in HEDEF:
    ad, metinler, hiz = BEAT[b - 1]; m = metinler[0]
    adaylar = []
    # eski seçim de yarışır (aday 0)
    adaylar.append(dict(no=0, x=mevcut[b]))
    for k in range(ADAY[b]):
        a = T.generate(m, sid=0, speed=1.0); SR = a.sample_rate
        x = np.array(a.samples, dtype=np.float32)
        nz = np.where(np.abs(x) > 10 ** (-50 / 20))[0]
        x = x[max(0, nz[0] - int(.02 * SR)): nz[-1] + int(.08 * SR)]
        adaylar.append(dict(no=k + 1, x=x))
    for c in adaylar:
        x = c["x"]; c["sure"] = round(len(x) / SR, 2)
        z = r16(np.concatenate([np.zeros(int(.3 * SR), np.float32), x, np.zeros(int(.7 * SR), np.float32)]), SR)  # sona 0,3+0,4 sn
        c["tek"] = oku16(z); c["tek_uyum"], c["tek_fark"] = uyum(m, c["tek"])
        print(f"B{b} aday {c['no']} {c['sure']}s tek={c['tek_uyum']:.3f} {c['tek_fark']} :: {c['tek']}", flush=True)
    adaylar.sort(key=lambda c: (-c["tek_uyum"], c["sure"]))
    rapor[b] = adaylar

def dizi(secim):
    """anlatim.py ile aynı yerleşim: secim = {beat: x} ile mevcut üzerine yazılmış anlatım; beat pencereleri döner."""
    t, parca, pen = BAS0, [], {}
    for i in range(1, len(BEAT) + 1):
        x = secim.get(i, mevcut[i]); parca.append((t, x)); pen[i] = (t, t + len(x) / SR); t += len(x) / SR + BOSLUK
    DUR = pen[len(BEAT)][1] + SON_PAY
    iz = np.zeros(int(round(DUR * SR)), np.float32)
    for s, x in parca:
        j = int(s * SR); iz[j:j + len(x)] += x[:len(iz) - j]
    return iz, pen, DUR

sonuc = {}
for b in HEDEF:
    m = BEAT[b - 1][1][0]
    for c in rapor[b][:6]:
        iz, pen, DUR = dizi({b: c["x"]})
        z = r16(iz, SR); s, e = pen[b]; gec = []
        for dol, ses in ((0.3, 0.4), (0.12, 0.8)):   # K-013 standardı (dogrula.py) + sızıntısız dar pencere, uzun sessizlik
            seg = np.concatenate([z[int(max(0, s - dol) * 16000):int((e + dol) * 16000)], np.zeros(int(ses * 16000), np.float32)])
            t = oku16(seg); u, f = uyum(m, t, kenar=True); gec.append((dol, round(u, 3), f, t))
        # kuyruk: cümlenin son 2,4 sn'si tek başına (+0,8 sn sessizlik). Uzun cümlede Whisper'ın son kelimeyi kesmesi
        # (K-013) ile sesin gerçekten kesik olması burada ayrılır.
        hk = norm(m)[-3:]
        seg = np.concatenate([z[int((e - 2.4) * 16000):int((e + 0.12) * 16000)], np.zeros(int(.8 * 16000), np.float32)])
        kt = oku16(seg); c["kuyruk"] = kt; c["kuyruk_ok"] = norm(kt)[-len(hk):] == hk
        c["tam"] = gec; c["tam_ok"] = all(g[1] == 1.0 for g in gec)
        # son kelime dışında her şey doğru + kuyruk doğru = kabul (son kelime kesilmesi Whisper'ın uzun cümle kusuru)
        govde = lambda f: all(op == "replace" and a == hk[-1] or op == "delete" and a == hk[-1] for op, a, _ in f)
        c["kabul"] = c["tam_ok"] or (c["kuyruk_ok"] and all(govde(g[2]) for g in gec))
        os.makedirs("aday", exist_ok=True); sf.write(f"aday/b{b}_{c['no']}.wav", c["x"], SR)
        print(f"   kuyruk: {kt!r} ok={c['kuyruk_ok']} kabul={c['kabul']}", flush=True)
        print(f"B{b} aday {c['no']} TAM DOSYA {c['sure']}s ok={c['tam_ok']} " + " | ".join(f"±{g[0]}: {g[1]} {g[2]}" for g in gec), flush=True)
    iyi = [c for c in rapor[b][:6] if "tam" in c and c["tam_ok"]] or [c for c in rapor[b][:6] if c.get("kabul")]
    sec = min(iyi, key=lambda c: c["sure"]) if iyi else max([c for c in rapor[b][:6] if "tam" in c], key=lambda c: (sum(g[1] for g in c["tam"]), -c["sure"]))
    sonuc[b] = sec
    print(f"B{b} SEÇİLDİ aday {sec['no']} ({sec['sure']} s) tam_ok={sec['tam_ok']}", flush=True)

for b, c in sonuc.items():
    ad, metinler, hiz = BEAT[b - 1]
    sf.write(f"sec_{b}.wav", c["x"], SR)
    k = {"ad": ad, "atempo": hiz, "puan": round(c["tek_uyum"] + .5, 3), "son_kelime": c["tam_ok"] or c.get("kuyruk_ok", False), "kuyruk": c.get("kuyruk"), "metin": metinler[0],
         "duyulan": c["tam"][0][3], "sure": c["sure"], "secim": f"aday47 no={c['no']} tam dosya ±0,3+0,4 sn / ±0,12+0,8 sn",
         "_anahtar": [metinler, hiz]}
    json.dump(k, open(f"sec_{b}.json", "w"), ensure_ascii=False)
json.dump({b: [dict(no=c["no"], sure=c["sure"], tek=c["tek"], tek_uyum=round(c["tek_uyum"], 3), tam=c.get("tam"), kuyruk=c.get("kuyruk"), kabul=c.get("kabul"))
              for c in rapor[b]] for b in HEDEF}, open("aday47.json", "w"), ensure_ascii=False, indent=1)
for f in ("_r.wav", "_r16.wav"):
    if os.path.exists(f): os.remove(f)
