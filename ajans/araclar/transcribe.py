#!/usr/bin/env python3
"""Kelime zamanlı transkript (Türkçe dahil).

Whisper large-v3-turbo metni yazar, Omnilingual CTC modeli harf zamanlarını verir,
ikisi hizalanır. Çıktı: HyperFrames formatında transcript.json
  [{"text": "...", "start": s, "end": s}, ...]

Kullanım: python3 tools/transcribe.py <video/ses> [--lang tr] [--names "Claude,HyperFrames,Soner"] [-o transcript.json]
"""
import argparse, difflib, json, os, re, subprocess, sys, tempfile, unicodedata
import numpy as np
import sherpa_onnx
import soundfile as sf

M = __import__("os").environ.get("MODEL_DIZIN", "/home/claude/models")
SR = 16000


def load_audio(path):
    tmp = tempfile.mktemp(suffix=".wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR), tmp], check=True)
    a, _ = sf.read(tmp, dtype="float32")
    os.remove(tmp)
    return a


def vad_segments(a):
    cfg = sherpa_onnx.VadModelConfig()
    cfg.silero_vad.model = f"{M}/vad.onnx"
    cfg.silero_vad.min_silence_duration = 0.35
    cfg.silero_vad.min_speech_duration = 0.2
    cfg.silero_vad.max_speech_duration = 25
    cfg.sample_rate = SR
    vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=600)
    w = 512
    for i in range(0, len(a), w):
        vad.accept_waveform(a[i:i + w])
    vad.flush()
    segs = []
    while not vad.empty():
        s = vad.front
        segs.append((s.start / SR, np.array(s.samples, dtype="float32")))
        vad.pop()
    return segs


def norm(s):
    s = s.replace("İ", "i").replace("I", "ı").lower()
    return "".join(ch for ch in unicodedata.normalize("NFC", s) if ch.isalnum())


def align_words(words, ctc_chars):
    """words: list[str]; ctc_chars: list[(char, t)] -> list[(word, start, end)]"""
    wchars, owner = [], []
    for i, w in enumerate(words):
        for ch in norm(w):
            wchars.append(ch); owner.append(i)
    cchars = [c for c, _ in ctc_chars]
    times = [t for _, t in ctc_chars]
    sm = difflib.SequenceMatcher(None, wchars, cchars, autojunk=False)
    t_of = [None] * len(wchars)
    for a0, b0, n in sm.get_matching_blocks():
        for k in range(n):
            t_of[a0 + k] = times[b0 + k]
    res = []
    for i, w in enumerate(words):
        ts = [t_of[j] for j in range(len(wchars)) if owner[j] == i and t_of[j] is not None]
        res.append([w, min(ts) if ts else None, max(ts) if ts else None])
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--lang", default="tr")
    ap.add_argument("--names", default="")
    ap.add_argument("-o", "--output", default="transcript.json")
    args = ap.parse_args()

    a = load_audio(args.input)
    dur = len(a) / SR
    wd = f"{M}/sherpa-onnx-whisper-turbo/"
    whisper = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=wd + "turbo-encoder.int8.onnx", decoder=wd + "turbo-decoder.int8.onnx",
        tokens=wd + "turbo-tokens.txt", language=args.lang, num_threads=os.cpu_count() or 2)
    ctc = sherpa_onnx.OfflineRecognizer.from_omnilingual_asr_ctc(
        model=f"{M}/omni/model.int8.onnx", tokens=f"{M}/omni/tokens.txt",
        num_threads=os.cpu_count() or 2)

    names = [n.strip() for n in args.names.split(",") if n.strip()]
    out = []
    for seg_start, samples in vad_segments(a):
        seg_dur = len(samples) / SR
        s = whisper.create_stream(); s.accept_waveform(SR, samples); whisper.decode_stream(s)
        text = s.result.text.strip()
        if not text:
            continue
        # özel isim düzeltme (ör. "Cloud" -> "Claude")
        words = text.split()
        for i, w in enumerate(words):
            core = re.sub(r"[^\w]", "", w)
            for n in names:
                if core and difflib.SequenceMatcher(None, norm(core), norm(n)).ratio() >= 0.72:
                    words[i] = w.replace(core, n)
                    break
        c = ctc.create_stream(); c.accept_waveform(SR, samples); ctc.decode_stream(c)
        chars = []
        for tok, t in zip(c.result.tokens, c.result.timestamps):
            for ch in norm(tok):
                chars.append((ch, t))
        al = align_words(words, chars)
        # boşlukları doldur: zamanı bulunamayan kelimeleri komşular arasında paylaştır
        n = len(al)
        for i in range(n):
            if al[i][1] is None:
                prev_end = next((al[j][2] for j in range(i - 1, -1, -1) if al[j][2] is not None), 0.0)
                nxt = next(((j, al[j][1]) for j in range(i + 1, n) if al[j][1] is not None), (n, seg_dur))
                gap = (nxt[1] - prev_end) / (nxt[0] - i + 1)
                al[i][1] = prev_end + gap * 0.1
                al[i][2] = prev_end + gap
        for i in range(n):
            st = al[i][1]
            en = al[i + 1][1] - 0.02 if i + 1 < n else min(seg_dur, al[i][2] + 0.35)
            en = max(en, al[i][2] + 0.08, st + 0.1)
            if i + 1 < n:
                en = min(en, al[i + 1][1])
            out.append({"text": al[i][0], "start": round(seg_start + st, 3),
                        "end": round(min(seg_start + en, dur), 3)})

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(out)} kelime -> {args.output}")
    for w in out:
        print(f"{w['start']:7.2f}-{w['end']:6.2f}  {w['text']}")


if __name__ == "__main__":
    main()
