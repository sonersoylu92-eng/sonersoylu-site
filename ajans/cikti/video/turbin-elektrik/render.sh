#!/bin/bash
cd /home/claude/video-edit/videos/turbin-elektrik
. /home/claude/video-edit/env.sh
# hyperframes 0.8.106 başlarken ata süreç zincirini kaydeder; çağıran kabuk kapanınca
# "render_cancelled_parent_exited" ile iptal eder. setsid/nohup bunu engellemez:
export HYPERFRAMES_RENDER_DETACHED=1
timeout 3000 npx --yes hyperframes@0.8.106 render -o /home/claude/video-edit/turbin-elektrik-sesli.mp4 > ses/render.log 2>&1
echo "BITTI $?" >> ses/render.log
