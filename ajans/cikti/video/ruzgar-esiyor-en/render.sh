#!/bin/bash
# K-007: ayrık render. hyperframes ata süreç zincirini izler; DETACHED=1 + setsid ile başlatılır, PID dosyasıyla izlenir.
# K-008: sürüm sabit. Başlatma: setsid nohup bash render.sh < /dev/null > /dev/null 2>&1 & disown
V=/home/claude/video-edit/videos/ruzgar-esiyor-en
cd $V
. /home/claude/video-edit/env.sh
export HYPERFRAMES_RENDER_DETACHED=1
mkdir -p out
echo $$ > out/render.pid
timeout 3600 npx --yes hyperframes@0.8.106 render -o $V/out/ham.mp4 > out/render.log 2>&1
echo "BITTI $?" >> out/render.log
