---
name: yt-script
description: >-
  Write a YouTube video script from a raw idea - hook options off 21
  formulas, scored, then the full spoken script with the retention beats
  marked. Use whenever the user wants a video script, a hook, an opening
  line, "what should I say", "write my next video", or is about to record
  and does not have the first fifteen seconds yet.
---

# yt-script

One idea into a script somebody finishes.

Two tools live in this folder and both actually run. Use them. Do not eyeball the hook.

```bash
python3 hookscore.py hooks.txt              # rank your hook options
python3 hookscore.py --hook "one line"      # score a single one
```

## Before you write

1. Read `ajans/youtube/voice.md` (depo kökünden) if it exists. That is the user's voice profile: how they talk
   on camera, the words they never use, who they are talking to, what they will not claim. If it
   does not exist, ask for **three of their own videos**, read or transcribe them, infer the voice,
   and write the file. A script in the wrong voice is worse than no script, because they have to
   read it out loud.
2. Never invent a number, a result or a source. If a figure would strengthen it and you do not have
   one, ask for it or write the line without it.

## The Turbine Tech (bu depo)

Bu kopya Soner Soylu'nun kanalına uyarlandı. Yukarıdaki genel kurallara ek olarak:

- Önce `ajans/OGRENME.md` "Aktif kurallar"ı oku ve uy. Çelişirse OGRENME kazanır.
- Senaryo Türkçe yazılır. `hookscore.py` Türkçeyi tanır (ek sözlük + 7-20 kelime bandı). Bantlar İngilizce
  kancalarla ayarlandı; Türkçede 50 civarı iyi bir kanca demektir, puanı tek başına karar sayma.
- Rakamlar yalnız sitedeki sayfadan (`<sayfa>/index.html:satır`) ya da araştırmacının kaynaklı notundan gelir;
  her beat'in yanına kaynağını yaz. Kaynak yoksa satırı rakamsız yaz.
- Her beat iki metin taşır: **ekranda** (doğru yazım) ve **TTS** (sayılar yazıyla, adlar okunuşla).
- Süre tahmini 2,3 kelime/sn ile yapılır (aşağıdaki 150 kelime/dk yerine).
- Kapanış tek istek: "… sonersoylu.com sitesinde. The Turbine Tech. Sıradaki … için takip et."
- Short ise İngilizce sürümünü de yaz (K-044).
- Teslim: `ajans/cikti/plan-<ad>-YYYY-AA-GG.md`. Bu bir plandır; Soner onaylamadan ses/görüntü üretilmez (K-040).
  "Ship it, or change it?" sorusu Türkçe sorulur: **Yayına hazır mı, yoksa değiştireyim mi?**

## The shape

**The first 15 seconds is the whole job.** It does three things or the video leaks: confirm the
click the title promised, open a question the viewer cannot close, and prove the payoff exists.

1. **Hook.** Write FIVE against [the 21 formulas](hooks.json), run them through `hookscore.py`,
   keep the top two, and show the user both with their scores. Never hand over one hook.
2. **The turn** (0:15-0:45). Say what the video is going to do, in one sentence, and start doing it.
   No channel intro, no "before we get started", no subscribe pitch. Those are the single most
   common cause of the 0:30 cliff.
3. **The body.** One idea per beat. Mark each beat with what is ON SCREEN, not just what is said -
   a talking head with nothing to look at is a podcast.
4. **The payoff.** Deliver the thing the hook promised, explicitly, and say that you are delivering
   it: "that is the prompt, it is in the description".
5. **The close.** One ask. Not three.

## What to hand back

- the two best hooks with their scored panels
- the script, beat by beat, with `[ON SCREEN: ...]` on every beat
- the runtime estimate at 150 words per minute
- one line naming which formula the winning hook used and why it fits this idea

## The gate

Nothing here publishes. This skill writes and you publish. Every output ends in a block the user
copies, and the last line of every run is the question: **ship it, or change it?**
