"""Doğrulanmış bir beat sesinin sonuna yeni cümle ekler (K-011/K-013). Uzun beati baştan üretmek yerine:
eski seçili klip (sec_N.wav, önceki metin) + ARA sn sessizlik + yeni cümlenin en iyi adayı.
Yeni cümle için ADAY aday üretilir, iki dolguyla (0,3 / 0,5 sn) yazdırılır, iki geçişte de kelime kelime eşleşen en yüksek CTC benzerlikli (eşitse en kısa) seçilir.
Sonuç sec_N.wav/json'a metin.py'deki güncel metin anahtarıyla yazılır; anlatim.py sonra önbellekten dizer.
Kullanım: python3 ekle.py 6 "Alarm varsa iş değişir: önce alarmı doğru okuyun."   (ESKI_WAV: eski klip, varsayılan sec_N_eski.wav)"""
import json, os, sys, subprocess, difflib
import numpy as np, soundfile as sf, sherpa_onnx
B = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, B)
import aday as A   # modeller ve yardımcılar (aday.py argümansız içe aktarılınca beat üretmez)
from metin import BEAT
# İkinci hakem: harf düzeyli CTC (Omnilingual) — Whisper sessizlikte son cümleyi tekrar uydurabiliyor (D-061 benzeri);
# CTC uydurmaz. Kabul: iki Whisper geçişi hedefle BAŞLAR ve fazlası yalnız hedefin son kelimelerinin tekrarıdır,
# CTC yazımı hedefe harf benzerliği ≥0,85 ve hedeften %15'ten uzun değil.
C = sherpa_onnx.OfflineRecognizer.from_omnilingual_asr_ctc(model=f"{A.M}/omni/model.int8.onnx", tokens=f"{A.M}/omni/tokens.txt", num_threads=os.cpu_count() or 2)
def ctc(x, sr):
    sf.write("_c.wav", np.concatenate([np.zeros(int(.3*sr), np.float32), x, np.zeros(int(.3*sr), np.float32)]), sr)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i","_c.wav","-ac","1","-ar","16000","_c16.wav"], check=True)
    z, _ = sf.read("_c16.wav", dtype="float32"); st = C.create_stream(); st.accept_waveform(16000, z); C.decode_stream(st)
    return st.result.text.strip()
def whisper_ok(d, h):
    w = A.esle(d)
    if w[:len(h)] != h: return False
    fazla = w[len(h):]
    return not fazla or " ".join(fazla) in " ".join(h)   # yalnız hedeften bir parçanın tekrarı
n, cumle = int(sys.argv[1]), sys.argv[2]
ADAY, ARA = int(os.environ.get("ADAY", "5")), float(os.environ.get("ARA", "0.35"))
eski = os.environ.get("ESKI_WAV", f"sec_{n}_eski.wav")
x0, SR = sf.read(eski, dtype="float32"); e0 = json.load(open(eski.replace(".wav", ".json")))
iyi = []
for k in range(ADAY):
    a = A.T.generate(cumle, sid=0, speed=1.0); x = np.array(a.samples, np.float32)
    nz = np.where(np.abs(x) > 10 ** (-50 / 20))[0]; x = x[max(0, nz[0] - int(.02*SR)): nz[-1] + int(.08*SR)]
    d1, d2 = A.yaz(x, SR, .3), A.yaz(x, SR, .5); h = A.esle(cumle); c = ctc(x, SR)
    hc, cc = "".join(h), "".join(A.esle(c))
    oran = difflib.SequenceMatcher(None, hc, cc).ratio()
    ok = whisper_ok(d1, h) and whisper_ok(d2, h) and oran >= .85 and len(cc) <= 1.15 * len(hc)
    print(f"  ek aday {k+1} {len(x)/SR:.2f}s {'TAM' if ok else 'fark'} ctc={oran:.2f} :: {d1} || {d2} || CTC: {c}", flush=True)
    if ok: iyi.append((-oran, len(x), x, d1, c))
for f in ("_c.wav", "_c16.wav", "_a.wav", "_b.wav"):
    if os.path.exists(f): os.remove(f)
if not iyi: sys.exit("tam eşleşen aday yok")
_, _, x, d, c = min(iyi, key=lambda z: (z[0], z[1]))   # önce en yüksek CTC benzerliği, sonra en kısa
print(f"  seçilen CTC: {c}")
y = np.concatenate([x0, np.zeros(int(ARA*SR), np.float32), x])
ad, metinler, hiz = BEAT[n-1]
hedef = next(m for m in metinler if m.endswith(cumle))
k = {"ad": ad, "atempo": hiz, "puan": 1.5, "son_kelime": True, "metin": hedef, "duyulan": e0["duyulan"] + " " + d,
     "sure": round(len(y)/SR, 2), "secim": f"ekle.py: doğrulanmış eski klip + {ARA} sn + yeni cümlenin tam eşleşen en kısa adayı",
     "_anahtar": [metinler, hiz]}
sf.write(f"sec_{n}.wav", y, SR); json.dump(k, open(f"sec_{n}.json", "w"), ensure_ascii=False)
print(f"B{n} birleşti {k['sure']} sn :: {k['duyulan']}")
