"""Türbin nasıl elektrik üretir — sahne başına seslendirme, Whisper denetimli aday seçimi, zaman yerleştirme.
Şablon: /tmp/claude-0/tts/anlatim.py (kanat-ucu). K-005, K-006.
Piper (VITS) her çağrıda gürültüyle farklı çıktı verir; bazen son kelimeyi yutar. Bu yüzden her sahnede
birkaç aday üretilir, her biri Whisper ile yazdırılır, metne en yakın + sığan aday seçilir."""
import json, os, re, subprocess, sys, difflib
import numpy as np, soundfile as sf, sherpa_onnx
sys.path.insert(0, "/home/claude/video-edit/tools")
from ses import tts

M = os.environ.get("MODEL_DIZIN", "/home/claude/models")
DUR, PAY, ADAY = 52, 0.15, 5
# (sahne_bas, sahne_son, [metin varyantları], atempo)
SAHNE = [
 (0,    2.5,  ["Bu kanatlar dakikada sadece on dört tur atıyor."], 1.15),
 (2.5,  7,    ["Ama arkasında bir mahalleye yetecek elektrik var. Nasıl?"], 1.0),
 (7,    13,   ["Birinci adım, rüzgâr. Rüzgâr kanada çarpmaz, etrafından akar."], 1.0),
 (13,   19,   ["Uçak kanadı gibi: üstte basınç düşer, kanat döner."], 1.0),
 (19,   26,   ["İkinci adım, dişli kutusu. Rotor yavaş, jeneratör hızlı ister. Dişliler devri yaklaşık yüz kat artırır."], 1.05),
 (26,   32,   ["Üçüncü adım, jeneratör. Dönen manyetik alan, bakır sargılarda akım doğurur."], 1.0),
 (32,   38.5, ["Dördüncü adım, transformatör. Enerji, altı yüz altmış volttan otuz dört bin beş yüz volta çıkar."], 1.0),
 (38.5, 45,   ["Rüzgâr iki kat artarsa, güç sekiz kat artar. Her şey hızın küpü."], 1.0),
 (45,   52,   ["Sahadan anlatan, Soner Soylu. Dı Törbayn Tek. Devamı için takip et.",
               "Sahâdan anlatan, Soner Soylu. Dı Törbayn Tek. Devamı için takip et.",
               "Sahada anlatan, Soner Soylu. Dı Törbayn Tek. Devamı için takip et."], 1.0),
]

def norm(s):
    s = s.replace("İ", "i").replace("I", "ı").lower().replace("â", "a")
    return [w for w in re.sub(r"[^\w\s]", " ", s).split() if not w.isdigit()]

wd = f"{M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd + "turbo-encoder.int8.onnx", decoder=wd + "turbo-decoder.int8.onnx",
        tokens=wd + "turbo-tokens.txt", language="tr", num_threads=os.cpu_count() or 2)

def yazdir(x, sr):
    y = np.concatenate([np.zeros(int(.5*sr), np.float32), x, np.zeros(int(.5*sr), np.float32)])
    sf.write("_a.wav", y, sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "_a.wav", "-ac", "1", "-ar", "16000", "_b.wav"], check=True)
    z, _ = sf.read("_b.wav", dtype="float32")
    s = W.create_stream(); s.accept_waveform(16000, z); W.decode_stream(s)
    return s.result.text.strip()

def puan(hedef, duyulan):
    h, d = norm(hedef), norm(duyulan)
    r = difflib.SequenceMatcher(None, " ".join(h), " ".join(d)).ratio()
    son_ok = bool(d) and difflib.SequenceMatcher(None, h[-1], d[-1]).ratio() >= .75
    return r + (0.5 if son_ok else 0), son_ok

T = tts("fahrettin")
SR = None
parcalar, kayit = [], []
for i, (s, e, metinler, hiz) in enumerate(SAHNE):
    bas = 0.05 if i == 0 else s + 0.18
    onb = f"sec_{i+1}.json"   # önbellek: metin ve hız aynıysa önceki seçimi kullan
    if os.path.exists(onb) and os.path.exists(f"sec_{i+1}.wav"):
        k = json.load(open(onb))
        if k["_anahtar"] == [metinler, hiz, bas]:
            x, SR = sf.read(f"sec_{i+1}.wav", dtype="float32")
            kayit.append({a: b for a, b in k.items() if a != "_anahtar"}); parcalar.append((bas, x))
            print(f"  S{i+1} önbellekten", flush=True); continue
    adaylar = []
    for m in metinler:
        for k in range(ADAY):
            a = T.generate(m, sid=0, speed=1.0)  # Piper speed'i yok sayar (D-006)
            SR = a.sample_rate
            x = np.array(a.samples, dtype=np.float32)
            if hiz != 1.0:
                sf.write("_h.wav", x, SR)
                subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "_h.wav", "-af", f"atempo={hiz}", "_h2.wav"], check=True)
                x, _ = sf.read("_h2.wav", dtype="float32")
            nz = np.where(np.abs(x) > 10 ** (-50 / 20))[0]
            x = x[max(0, nz[0] - int(.02 * SR)): nz[-1] + int(.08 * SR)]
            son = bas + len(x) / SR
            duy = yazdir(x, SR)
            p, son_ok = puan(metinler[0], duy)
            sigdi = son <= e - PAY
            adaylar.append((sigdi, p, -len(x), x, m, duy, son_ok))
            print(f"  S{i+1} aday {len(adaylar)} {len(x)/SR:.2f}s sığdı={sigdi} puan={p:.2f} :: {duy}", flush=True)
    adaylar.sort(key=lambda t: (t[0], t[1], t[2]), reverse=True)
    sigdi, p, _, x, m, duy, son_ok = adaylar[0]
    son = bas + len(x) / SR
    sf.write(f"sec_{i+1}.wav", x, SR)
    kayit.append({"sahne": i + 1, "sahne_bas": s, "sahne_son": e, "ses_bas": round(bas, 2), "ses_son": round(son, 2),
                  "pay": round(e - son, 2), "atempo": hiz, "sigdi": sigdi, "son_kelime": son_ok, "puan": round(p, 2),
                  "metin": m, "duyulan": duy})
    json.dump(dict(kayit[-1], _anahtar=[metinler, hiz, bas]), open(onb, "w"), ensure_ascii=False)
    parcalar.append((bas, x))

iz = np.zeros(int(DUR * SR), dtype=np.float32)
for bas, x in parcalar:
    j = int(bas * SR); iz[j:j + len(x)] += x[:len(iz) - j]
sf.write("anlatim_ham.wav", iz, SR)
json.dump(kayit, open("zaman.json", "w"), ensure_ascii=False, indent=1)
print("SEÇİM")
for k in kayit:
    print(k["sahne"], k["ses_bas"], k["ses_son"], "pay", k["pay"], "sığdı" if k["sigdi"] else "SIĞMADI",
          "son✓" if k["son_kelime"] else "SON EKSİK", k["puan"], "::", k["duyulan"])
for f in ("_a.wav", "_b.wav", "_h.wav", "_h2.wav"):
    if os.path.exists(f): os.remove(f)
