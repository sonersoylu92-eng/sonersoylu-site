"""Karaoke/SRT için kelime zamanları: hedef metin (metin.py, konuşulan biçim) beat penceresinde Omnilingual CTC harf
zamanlarına zorunlu hizalanır (transcribe.align_words). Whisper metni kullanılmaz (K-013: uçları keser, B12'nin yarısını
hiç yazmadı). Zamanı bulunamayan kelime komşu çapalar arasında harf sayısıyla paylaştırılır. Çıktı: kelime.json
[{beat, w, s, e}] (s/e anlatim.wav'a göre saniye)."""
import json, os, sys, subprocess
import numpy as np, soundfile as sf, sherpa_onnx
sys.path.insert(0, "/home/claude/video-edit/tools")
from transcribe import align_words, norm
M = os.environ.get("MODEL_DIZIN", "/home/claude/models"); SR = 16000
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "anlatim.wav", "-ac", "1", "-ar", "16000", "_k.wav"], check=True)
a, _ = sf.read("_k.wav", dtype="float32"); os.remove("_k.wav")
ctc = sherpa_onnx.OfflineRecognizer.from_omnilingual_asr_ctc(model=f"{M}/omni/model.int8.onnx", tokens=f"{M}/omni/tokens.txt", num_threads=2)
z = json.load(open("zaman.json")); out = []
for k in z:
    b0, b1 = k["ses_bas"] - 0.05, k["ses_son"] + 0.1
    seg = a[int(b0 * SR):int(b1 * SR)]
    c = ctc.create_stream(); c.accept_waveform(SR, seg); ctc.decode_stream(c)
    chars = [(ch, t) for tok, t in zip(c.result.tokens, c.result.timestamps) for ch in norm(tok)]
    words = k["metin"].split()
    al = align_words(words, chars)
    n = len(al); bulunan = sum(1 for x in al if x[1] is not None)
    # boşluk doldurma: çapa yoksa beat başı/sonu çapa; aradaki kelimelere harf sayısına göre pay
    i = 0
    while i < n:
        if al[i][1] is not None: i += 1; continue
        j = i
        while j < n and al[j][1] is None: j += 1
        t0 = al[i - 1][2] + 0.04 if i > 0 else k["ses_bas"] - b0
        t1 = al[j][1] - 0.04 if j < n else k["ses_son"] - b0
        L = [max(1, len(norm(al[m][0]))) for m in range(i, j)]; top = sum(L); t = t0
        for m, l in zip(range(i, j), L):
            d = (t1 - t0) * l / top; al[m][1], al[m][2] = t, t + d * 0.9; t += d
        i = j
    for m in range(n):
        s = al[m][1]; e = max(al[m][2] + 0.06, s + 0.12)
        if m + 1 < n: e = min(e, al[m + 1][1])
        out.append(dict(beat=k["beat"], w=al[m][0], s=round(b0 + s, 3), e=round(b0 + e, 3)))
    print(f'B{k["beat"]:>2} çapa {bulunan}/{n}  {out[-n]["s"]:.2f}–{out[-1]["e"]:.2f} (ses {k["ses_bas"]}–{k["ses_son"]})')
json.dump(out, open("kelime.json", "w"), ensure_ascii=False, indent=0)
