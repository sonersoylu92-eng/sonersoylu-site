"""Son anlatımı doğrula: VAD parçası başına ±0,3 sn dolgulu Whisper metni + transcribe.py kelime zamanları."""
import sys, json, os, sherpa_onnx
sys.path.insert(0, "/home/claude/video-edit/tools")
import transcribe as tr
a = tr.load_audio("../anlatim.wav"); SR = 16000
z = json.load(open("zaman.json")); w = json.load(open("geri.json"))
wd = f"{tr.M}/sherpa-onnx-whisper-turbo/"
W = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=wd+"turbo-encoder.int8.onnx", decoder=wd+"turbo-decoder.int8.onnx", tokens=wd+"turbo-tokens.txt", language="tr", num_threads=os.cpu_count())
segs = [(st, st + len(s)/SR) for st, s in tr.vad_segments(a)]
satir = []
print("| # | Sahne aralığı | Ses başı (+gecikme) | Ses sonu (pay) | Sahnede mi | Whisper (dolgulu) |")
print("|---|---|---|---|---|---|")
for k in z:
    sg = [s for s in segs if k["sahne_bas"] <= s[0] < k["sahne_son"]]
    b, e = sg[0][0], sg[-1][1]
    ws = [x for x in w if k["sahne_bas"] <= x["start"] < k["sahne_son"]]
    b = min(b, ws[0]["start"])
    st = W.create_stream(); st.accept_waveform(SR, a[int(max(0, b-.3)*SR):int(min(e+.3, k["sahne_son"])*SR)]); W.decode_stream(st)
    ok = k["sahne_bas"] <= b and k["ses_son"] <= k["sahne_son"] - 0.15
    print(f'| {k["sahne"]} | {k["sahne_bas"]:.2f}–{k["sahne_son"]:.2f} | {b:.2f} (+{b-k["sahne_bas"]:.2f}) | {k["ses_son"]:.2f} ({k["sahne_son"]-k["ses_son"]:.2f}) | {"evet" if ok else "HAYIR"} | {st.result.text.strip()} |')
