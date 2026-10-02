#!/bin/bash
# K-007: ayrık render. hyperframes ata süreç zincirini izler; DETACHED=1 + setsid ile başlatılır, PID dosyasıyla izlenir.
cd /home/claude/video-edit/videos/saha-vakasi
. /home/claude/video-edit/env.sh
export HYPERFRAMES_RENDER_DETACHED=1
echo $$ > out/render.pid
timeout 3600 npx --yes hyperframes@0.8.106 render -o /home/claude/video-edit/videos/saha-vakasi/out/ham.mp4 > out/render.log 2>&1
echo "BITTI $?" >> out/render.log
