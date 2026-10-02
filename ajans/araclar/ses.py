#!/usr/bin/env python3
"""Türkçe seslendirme (Piper · fahrettin, erkek sesi; GitHub'dan indirilir, ücretsiz).
Kullanım: python3 ses.py "metin" cikti.wav [--hiz 1.15]
Kurallar (K-005): sayıları yazıyla ver, İngilizce adları okunuşla yaz, sonucu transcribe.py ile geri kontrol et."""
import sys, subprocess, numpy as np, soundfile as sf, sherpa_onnx, os
M = os.environ.get("MODEL_DIZIN", "/home/claude/models")

def tts(ad="fahrettin"):
    d = f"{M}/vits-piper-tr_TR-{ad}-medium/"
    c = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=d + f"tr_TR-{ad}-medium.onnx", tokens=d + "tokens.txt", data_dir=d + "espeak-ng-data"),
        num_threads=os.cpu_count() or 2))
    return sherpa_onnx.OfflineTts(c)

if __name__ == "__main__":
    metin, cikti = sys.argv[1], sys.argv[2]
    hiz = float(sys.argv[sys.argv.index("--hiz") + 1]) if "--hiz" in sys.argv else 1.0
    a = tts().generate(metin, sid=0, speed=1.0)   # Piper 'speed'i yok sayar (D-006): hız ffmpeg atempo ile
    sf.write(cikti, np.array(a.samples, np.float32), a.sample_rate)
    if hiz != 1.0:
        g = cikti + ".tmp.wav"; os.replace(cikti, g)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", g, "-af", f"atempo={hiz}", cikti], check=True); os.remove(g)
    print(cikti, round(len(a.samples) / a.sample_rate / hiz, 2), "sn")
