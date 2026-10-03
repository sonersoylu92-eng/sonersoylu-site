#!/bin/bash
# anlatim_ham.wav -> ../anlatim.wav (iki geçişli loudnorm, -15 LUFS, 48 kHz stereo). Süre ham dosyadan alınır.
set -e
cd "${SES_DIZIN:-/home/claude/video-edit/videos/ruzgar-esiyor/ses}"
J=$(ffmpeg -hide_banner -i anlatim_ham.wav -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
MI=$(echo "$J" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(f"measured_I={d["input_i"]}:measured_TP={d["input_tp"]}:measured_LRA={d["input_lra"]}:measured_thresh={d["input_thresh"]}:offset={d["target_offset"]}")')
ffmpeg -y -loglevel error -i anlatim_ham.wav -af "loudnorm=I=-15:TP=-1.5:LRA=11:$MI:linear=true,aresample=48000" -ac 2 -ar 48000 -c:a pcm_s16le ../anlatim.wav
cp ../anlatim.wav anlatim.wav
ffmpeg -hide_banner -nostats -i ../anlatim.wav -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:|LRA:"
