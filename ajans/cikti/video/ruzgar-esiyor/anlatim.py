"""Rüzgâr esiyor Short — beat başına seslendirme, Whisper denetimli aday seçimi (K-011), sıralı yerleştirme (K-006).
Plan aşaması: sahne pencereleri sesten türetilir (ses önce, görüntü sonra). Çıktı: anlatim.wav, zaman.json."""
import json, os, re, subprocess, sys, difflib
import numpy as np, soundfile as sf, sherpa_onnx
sys.path.insert(0, "/home/claude/video-edit/tools")
from ses import tts
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metin import BEAT
# Çalışma klasörü (ses dosyaları depoya girmez): /home/claude/video-edit/videos/ruzgar-esiyor/ses
os.chdir(os.environ.get("SES_DIZIN", "/home/claude/video-edit/videos/ruzgar-esiyor/ses"))
M = os.environ.get("MODEL_DIZIN", "/home/claude/models")
TOPLAM_ADAY, BOSLUK, BAS0, SON_PAY = 5, 0.25, 0.05, 0.5

BIR = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"]
ON = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"]
def sayi(n):
    n = int(n); y, o, b = n // 100, n // 10 % 10, n % 10
    return " ".join(w for w in [("" if y < 2 else BIR[y]) + (" yüz" if y else ""), ON[o], BIR[b]] if w.strip()).strip() or "sıfır"

def norm(s):
    s = re.sub(r"\d+", lambda m: " " + sayi(m.group()) + " ", s)
    s = s.replace("İ", "i").replace("I", "ı").lower().replace("â", "a")
    return [w for w in re.sub(r"[^\w\s]", " ", s).split()]

wd = f"{M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd + "turbo-encoder.int8.onnx", decoder=wd + "turbo-decoder.int8.onnx",
        tokens=wd + "turbo-tokens.txt", language="tr", num_threads=os.cpu_count() or 2)

def yazdir(x, sr):
    kuyruk = .7 if len(x) / sr > 7.5 else .3   # K-013
    y = np.concatenate([np.zeros(int(.3*sr), np.float32), x, np.zeros(int(kuyruk*sr), np.float32)])
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

T = tts("fahrettin"); SR = None
parcalar, kayit, t = [], [], BAS0
for i, (ad, metinler, hiz) in enumerate(BEAT):
    onb = f"sec_{i+1}.json"
    if os.path.exists(onb) and os.path.exists(f"sec_{i+1}.wav") and json.load(open(onb))["_anahtar"] == [metinler, hiz]:
        k = json.load(open(onb)); x, SR = sf.read(f"sec_{i+1}.wav", dtype="float32"); print(f"  B{i+1} önbellekten", flush=True)
    else:
        adaylar = []
        for m in metinler:
            for _ in range(-(-TOPLAM_ADAY // len(metinler))):   # beat başına ≥5 aday (K-011)
                a = T.generate(m, sid=0, speed=1.0); SR = a.sample_rate   # speed etkisiz (D-006)
                x = np.array(a.samples, dtype=np.float32)
                if hiz != 1.0:
                    sf.write("_h.wav", x, SR)
                    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "_h.wav", "-af", f"atempo={hiz}", "_h2.wav"], check=True)
                    x, _ = sf.read("_h2.wav", dtype="float32")
                nz = np.where(np.abs(x) > 10 ** (-50 / 20))[0]
                x = x[max(0, nz[0] - int(.02 * SR)): nz[-1] + int(.08 * SR)]
                duy = yazdir(x, SR); p, son_ok = puan(m, duy)
                adaylar.append((p, -len(x), x, m, duy, son_ok))
                print(f"  B{i+1} {ad} aday {len(adaylar)} {len(x)/SR:.2f}s puan={p:.2f} :: {duy}", flush=True)
        adaylar.sort(key=lambda z: (z[0], z[1]), reverse=True)
        p, _, x, m, duy, son_ok = adaylar[0]
        k = {"ad": ad, "atempo": hiz, "puan": round(p, 3), "son_kelime": son_ok, "metin": m, "duyulan": duy, "sure": round(len(x)/SR, 2)}
        sf.write(f"sec_{i+1}.wav", x, SR); json.dump(dict(k, _anahtar=[metinler, hiz]), open(onb, "w"), ensure_ascii=False)
    k = {a: b for a, b in k.items() if a != "_anahtar"}
    k.update(beat=i+1, ses_bas=round(t, 2), ses_son=round(t + len(x)/SR, 2))
    k["sahne_bas"] = 0.0 if i == 0 else round(kayit[-1]["ses_son"] + BOSLUK/2, 2)
    parcalar.append((t, x)); kayit.append(k); t += len(x)/SR + BOSLUK
for j, k in enumerate(kayit):
    k["sahne_son"] = kayit[j+1]["sahne_bas"] if j+1 < len(kayit) else round(k["ses_son"] + SON_PAY, 2)
DUR = kayit[-1]["sahne_son"]
iz = np.zeros(int(round(DUR * SR)), dtype=np.float32)
for b, x in parcalar:
    j = int(b * SR); iz[j:j + len(x)] += x[:len(iz) - j]
sf.write("anlatim_ham.wav", iz, SR)
json.dump(kayit, open("zaman.json", "w"), ensure_ascii=False, indent=1)
print("SEÇİM")
for k in kayit:
    print(k["beat"], k["ad"], k["sahne_bas"], k["sahne_son"], "ses", k["ses_bas"], k["ses_son"], "son✓" if k["son_kelime"] else "SON EKSİK", k["puan"], "::", k["duyulan"])
for f in ("_a.wav", "_b.wav", "_h.wav", "_h2.wav"):
    if os.path.exists(f): os.remove(f)
