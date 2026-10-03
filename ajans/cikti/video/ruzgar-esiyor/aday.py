"""K-011/K-013: seçili beatler için yeni adaylar; her aday iki farklı dolguyla (0,3 / 0,5 sn baş, +0,4 sn kuyruk) yazdırılır.
İki geçişte de kelime kelime eşleşen en kısa aday sec_N.wav/json önbelleğine yazılır; anlatim.py sonra önbellekten dizer.
Kullanım: python3 aday.py 3 9   (ADAY ortam değişkeni: beat başına aday, varsayılan 5)
Yazım eşdeğerleri (ses aynı, Whisper yazımı farklı) ESDEGER'de; yalnız bunlar fark sayılmaz."""
import json, os, re, subprocess, sys, difflib
import numpy as np, soundfile as sf, sherpa_onnx
B = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, B); sys.path.insert(0, "/home/claude/video-edit/tools")
from ses import tts
from metin import BEAT
src = open(f"{B}/anlatim.py").read(); ns = {"re": re}; exec(src[src.index("BIR ="):src.index("wd = ")], ns); norm = ns["norm"]
os.chdir(os.environ.get("SES_DIZIN", "/home/claude/video-edit/videos/ruzgar-esiyor/ses"))
M = os.environ.get("MODEL_DIZIN", "/home/claude/models"); ADAY = int(os.environ.get("ADAY", "5"))
ESDEGER = [("erinin", "eğrinin"), ("eriyi", "eğriyi"), ("sonersoylu com", "soner soylu nokta kom"),
           ("the turbine tech", "dı törbayn tek"), ("the turbine tek", "dı törbayn tek"), ("rüzgarda makinede", "rüzgar da makine de"), ("rüzgarda makine de", "rüzgar da makine de")]
def esle(s):
    s = " ".join(norm(s))
    for a, b in ESDEGER: s = s.replace(a, b)
    return s.split()
wd = f"{M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd+"turbo-encoder.int8.onnx", decoder=wd+"turbo-decoder.int8.onnx",
        tokens=wd+"turbo-tokens.txt", language="tr", num_threads=os.cpu_count() or 2)
def yaz(x, sr, bas):
    y = np.concatenate([np.zeros(int(bas*sr), np.float32), x, np.zeros(int((.3+.4)*sr), np.float32)])
    sf.write("_a.wav", y, sr); subprocess.run(["ffmpeg","-y","-loglevel","error","-i","_a.wav","-ac","1","-ar","16000","_b.wav"], check=True)
    z, _ = sf.read("_b.wav", dtype="float32"); s = W.create_stream(); s.accept_waveform(16000, z); W.decode_stream(s); return s.result.text.strip()
T = tts("fahrettin")
for n in (map(int, sys.argv[1:]) if __name__ == "__main__" else []):
    ad, metinler, hiz = BEAT[n-1]; iyi = []
    for m in metinler:
        for k in range(ADAY):
            a = T.generate(m, sid=0, speed=1.0); SR = a.sample_rate; x = np.array(a.samples, np.float32)
            nz = np.where(np.abs(x) > 10 ** (-50 / 20))[0]; x = x[max(0, nz[0] - int(.02*SR)): nz[-1] + int(.08*SR)]
            d1, d2 = yaz(x, SR, .3), yaz(x, SR, .5); h = esle(m)
            ok = esle(d1) == h and esle(d2) == h
            print(f"  B{n} aday {k+1} {len(x)/SR:.2f}s {'TAM' if ok else 'fark'} :: {d1} || {d2}", flush=True)
            if ok: iyi.append((len(x), x, m, d1))
    if not iyi: print(f"B{n}: tam eşleşen aday yok, önbellek değişmedi"); continue
    _, x, m, d = min(iyi, key=lambda z: z[0])
    k = {"ad": ad, "atempo": hiz, "puan": 1.5, "son_kelime": True, "metin": m, "duyulan": d, "sure": round(len(x)/SR, 2),
         "secim": "aday.py: iki dolgulu geçişte tam eşleşen en kısa aday", "_anahtar": [metinler, hiz]}
    sf.write(f"sec_{n}.wav", x, SR); json.dump(k, open(f"sec_{n}.json", "w"), ensure_ascii=False)
    print(f"B{n} seçildi {k['sure']} sn :: {d}")
if __name__ == "__main__":
    for f in ("_a.wav", "_b.wav"):
        if os.path.exists(f): os.remove(f)
