"""K-005/K-013: full-file check — each beat transcribed with ±0.3 s padding (+0.4 s tail), compared to target text."""
import json, os, sys, difflib, subprocess
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import anlatim as A   # Whisper (en) + norm; chdir to SES_DIZIN
dosya = sys.argv[1] if len(sys.argv) > 1 else "anlatim.wav"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",dosya,"-ac","1","-ar","16000","_d.wav"], check=True)
a, SR = sf.read("_d.wav", dtype="float32"); os.remove("_d.wav")
out = []
for k in json.load(open("zaman.json")):
    b, e = max(0, k["ses_bas"]-.3), k["ses_son"]+.3
    seg = np.concatenate([a[int(b*SR):int(e*SR)], np.zeros(int(.4*SR), np.float32)])
    s = A.W.create_stream(); s.accept_waveform(SR, seg); A.W.decode_stream(s); t = s.result.text.strip()
    h, d = A.norm(k["metin"]), A.norm(t)
    fark = [(op, " ".join(h[i1:i2]), " ".join(d[j1:j2])) for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, h, d).get_opcodes() if op != "equal"]
    out.append(dict(beat=k["beat"], duyulan=t, fark=fark)); print(f'B{k["beat"]} {"OK " if not fark else "FARK"} :: {t}\n    {fark}')
json.dump(out, open("dogrula.json", "w"), ensure_ascii=False, indent=1)
