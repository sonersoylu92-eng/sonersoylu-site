"""English Short — per-beat Piper (en_US ryan) narration, 3 candidates per beat scored with Whisper (K-011), placed in
sequence (K-006). Output in SES_DIZIN: sec_N.wav/json cache, anlatim_ham.wav, zaman.json (same schema as Turkish)."""
import json, os, re, subprocess, sys, difflib
import numpy as np, soundfile as sf, sherpa_onnx
B = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, B)
from metin import BEAT
os.chdir(os.environ.get("SES_DIZIN", "/home/claude/video-edit/videos/ruzgar-esiyor-en/ses"))
M = os.environ.get("MODEL_DIZIN", "/home/claude/models"); SES = os.environ.get("SES_MODEL", "vits-piper-en_US-ryan-medium")
ADAY, BOSLUK, BAS0, SON_PAY = 3, 0.25, 0.05, 0.5
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]
def sayi(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
    return str(n)
ESDEGER = [("sonersoylu com", "soner soylu dot com"), ("nacel ", "nacelle "),
           ("its ", "it s "), ("there s", "there s")]
def norm(s):
    s = s.lower().replace("m/s", " meters per second").replace("mph", " miles per hour").replace("-", " ")
    s = re.sub(r"\d+", lambda m: " " + sayi(m.group()) + " ", s)
    s = " ".join(re.sub(r"[^\w\s]", " ", s).split()) + " "
    for a, b in ESDEGER: s = s.replace(a, b)
    return s.split()
wd = f"{M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd+"turbo-encoder.int8.onnx", decoder=wd+"turbo-decoder.int8.onnx",
        tokens=wd+"turbo-tokens.txt", language="en", num_threads=os.cpu_count() or 2)
def yazdir(x, sr, bas=.3):
    kuyruk = .7 if len(x) / sr > 7.5 else .3   # K-013
    y = np.concatenate([np.zeros(int(bas*sr), np.float32), x, np.zeros(int(kuyruk*sr), np.float32)])
    sf.write("_a.wav", y, sr); subprocess.run(["ffmpeg","-y","-loglevel","error","-i","_a.wav","-ac","1","-ar","16000","_b.wav"], check=True)
    z, _ = sf.read("_b.wav", dtype="float32"); s = W.create_stream(); s.accept_waveform(16000, z); W.decode_stream(s); return s.result.text.strip()
def puan(h, d):
    h, d = norm(h), norm(d)
    return difflib.SequenceMatcher(None, h, d).ratio() + (0.5 if d[:len(h)] == h else 0)
if __name__ == "__main__":
    d = f"{M}/{SES}/"; mdl = SES.replace("vits-piper-", "")
    T = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=d+f"{mdl}.onnx", tokens=d+"tokens.txt", data_dir=d+"espeak-ng-data"),
        num_threads=os.cpu_count() or 2)))
    parcalar, kayit, t = [], [], BAS0
    for i, (ad, metinler, hiz) in enumerate(BEAT):
        onb = f"sec_{i+1}.json"
        if os.path.exists(onb) and json.load(open(onb))["_anahtar"] == [metinler, hiz]:
            k = json.load(open(onb)); x, SR = sf.read(f"sec_{i+1}.wav", dtype="float32"); print(f"  B{i+1} cache", flush=True)
        else:
            ad_ = []
            for m in metinler:
                for _ in range(ADAY):
                    a = T.generate(m, sid=0, speed=1.0); SR = a.sample_rate; x = np.array(a.samples, np.float32)
                    nz = np.where(np.abs(x) > 10 ** (-50 / 20))[0]; x = x[max(0, nz[0]-int(.02*SR)): nz[-1]+int(.08*SR)]
                    du = yazdir(x, SR); p = puan(m, du); ad_.append((p, -len(x), x, m, du))
                    print(f"  B{i+1} {ad} cand {len(ad_)} {len(x)/SR:.2f}s score={p:.3f} :: {du}", flush=True)
            ad_.sort(key=lambda z: (z[0], z[1]), reverse=True); p, _, x, m, du = ad_[0]
            k = {"ad": ad, "atempo": hiz, "puan": round(p, 3), "metin": m, "duyulan": du, "sure": round(len(x)/SR, 2), "_anahtar": [metinler, hiz]}
            sf.write(f"sec_{i+1}.wav", x, SR); json.dump(k, open(onb, "w"), ensure_ascii=False)
        k = {a: b for a, b in k.items() if a != "_anahtar"}
        k.update(beat=i+1, ses_bas=round(t, 2), ses_son=round(t + len(x)/SR, 2))
        k["sahne_bas"] = 0.0 if i == 0 else round(kayit[-1]["ses_son"] + BOSLUK/2, 2)
        parcalar.append((t, x)); kayit.append(k); t += len(x)/SR + BOSLUK
    for j, k in enumerate(kayit):
        k["sahne_son"] = kayit[j+1]["sahne_bas"] if j+1 < len(kayit) else round(k["ses_son"] + SON_PAY, 2)
    iz = np.zeros(int(round(kayit[-1]["sahne_son"] * SR)), np.float32)
    for b, x in parcalar:
        j = int(b * SR); iz[j:j+len(x)] += x[:len(iz)-j]
    sf.write("anlatim_ham.wav", iz, SR); json.dump(kayit, open("zaman.json", "w"), ensure_ascii=False, indent=1)
    for k in kayit: print(k["beat"], k["ad"], k["sahne_bas"], k["sahne_son"], k["puan"], "::", k["duyulan"])
    for f in ("_a.wav", "_b.wav"):
        if os.path.exists(f): os.remove(f)
