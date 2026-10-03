"""K-005/K-013: son anlatimi beat başına ±0,3 sn dolgulu Whisper ile yazdır, hedef metinle kıyasla."""
import json, os, re, sys, difflib, subprocess
import numpy as np, soundfile as sf, sherpa_onnx
M = os.environ.get("MODEL_DIZIN", "/home/claude/models")
B = os.path.dirname(os.path.abspath(__file__)); src = open(f"{B}/anlatim.py").read(); os.chdir(os.environ.get("SES_DIZIN", "/home/claude/video-edit/videos/ruzgar-esiyor/ses")); ns = {"re": re}; exec(src[src.index("BIR ="):src.index("wd = ")], ns); norm = ns["norm"]
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "anlatim.wav", "-ac", "1", "-ar", "16000", "_d.wav"], check=True)
a, SR = sf.read("_d.wav", dtype="float32"); os.remove("_d.wav")
wd = f"{M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd+"turbo-encoder.int8.onnx", decoder=wd+"turbo-decoder.int8.onnx", tokens=wd+"turbo-tokens.txt", language="tr", num_threads=os.cpu_count())
z = json.load(open("zaman.json")); out = []
for k in z:
    b, e = max(0, k["ses_bas"] - .3), k["ses_son"] + .3
    seg = np.concatenate([a[int(b*SR):int(e*SR)], np.zeros(int(.4*SR), np.float32)])
    st = W.create_stream(); st.accept_waveform(SR, seg); W.decode_stream(st); t = st.result.text.strip()
    h, d = norm(k["metin"]), norm(t)
    oran = difflib.SequenceMatcher(None, h, d).ratio()
    fark = [(op, " ".join(h[i1:i2]), " ".join(d[j1:j2])) for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, h, d).get_opcodes() if op != "equal"]
    out.append(dict(beat=k["beat"], ad=k["ad"], duyulan=t, kelime_uyum=round(oran, 3), fark=fark))
    print(f'B{k["beat"]:>2} {k["ad"]:9s} uyum={oran:.2f} :: {t}\n      fark: {fark}')
json.dump(out, open("dogrula.json", "w"), ensure_ascii=False, indent=1)
