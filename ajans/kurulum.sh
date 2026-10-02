#!/bin/bash
# The Turbine Tech ajansı · video ortamı kurulumu (yeni bulut oturumunda bir kez, ~5–8 dk)
# Kullanım: bash ajans/kurulum.sh   (depo kökünden)
# Kurar: Python paketleri, Whisper (metin + kelime zamanı), Türkçe ses, HyperFrames skill'leri, GSAP, fontlar.
# Not: HuggingFace bu ortamda kapalı (K-024 benzeri); tüm modeller GitHub sürümlerinden iner.
set -e
DEPO="$(cd "$(dirname "$0")/.." && pwd)"
V=/home/claude/video-edit; M=/home/claude/models; R=https://github.com/k2-fsa/sherpa-onnx/releases/download
mkdir -p "$V/tools" "$V/shared/font" "$V/videos" "$M"

echo "· Python paketleri"
pip install --break-system-packages -q sherpa-onnx soundfile numpy 2>&1 | grep -v WARNING || true

indir() { # $1 sürüm $2 ad $3 hedef klasör adı
  [ -d "$M/$3" ] && return 0
  curl -sL -o "$M/t.tar.bz2" "$R/$1/$2.tar.bz2" && tar xjf "$M/t.tar.bz2" -C "$M" && rm "$M/t.tar.bz2"
  [ "$2" != "$3" ] && mv "$M/$2" "$M/$3"; echo "  ✓ $3"
}
echo "· Modeller (GitHub)"
indir asr-models sherpa-onnx-whisper-turbo sherpa-onnx-whisper-turbo
indir asr-models sherpa-onnx-omnilingual-asr-1600-languages-300M-ctc-int8-2025-11-12 omni
indir tts-models vits-piper-tr_TR-fahrettin-medium vits-piper-tr_TR-fahrettin-medium
[ -f "$M/vad.onnx" ] || curl -sL -o "$M/vad.onnx" "$R/asr-models/silero_vad.onnx"

echo "· Araçlar, marka dosyası, fontlar"
cp "$DEPO/ajans/araclar/"*.py "$V/tools/"; cp "$DEPO/ajans/araclar/MOTION.md" "$V/MOTION.md"
cp "$DEPO/assets/font/"*.woff2 "$V/shared/font/"
if [ ! -f "$V/shared/gsap.min.js" ]; then
  npm i -s gsap@3.14.2 --prefix "$V/tools/node" >/dev/null 2>&1 && cp "$V/tools/node/node_modules/gsap/dist/gsap.min.js" "$V/shared/"
fi

echo "· HyperFrames skill'leri"
if [ ! -d "$V/.claude/skills/hyperframes" ]; then
  git clone -q --depth 1 https://github.com/heygen-com/hyperframes /tmp/hf-src && mkdir -p "$V/.claude/skills" && cp -r /tmp/hf-src/skills/* "$V/.claude/skills/"
fi

echo "· Tarayıcı yolu"
HS=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)
cat > "$V/env.sh" <<ENV
export HYPERFRAMES_BROWSER_PATH=$HS
export HYPERFRAMES_SKIP_SKILLS=1
export HYPERFRAMES_RENDER_DETACHED=1   # K-007
export MODEL_DIZIN=$M
# K-008: sürümü sabitle → npx --yes hyperframes@0.8.106 …
ENV
. "$V/env.sh"
timeout 300 npx --yes hyperframes@0.8.106 doctor 2>&1 | grep -E "✓|✗" | grep -E "Chrome|FFmpeg|Node" || true
echo "✓ Kurulum bitti → . $V/env.sh"
