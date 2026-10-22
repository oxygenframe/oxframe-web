#!/usr/bin/env bash
# Times the scene of each migration guide (/docs/migrate/*) in the other tool
# and in oxframe, and writes apps/site/src/lib/vs-measurements.json for the
# /vs/* pages. Each command runs once to warm up, then three times; the median
# wall time is kept. Run from anywhere:
#
#   bench/vs/measure.sh
#
# Needs cargo, node/npm, uv and ffmpeg. The first run installs Remotion,
# Revideo and Manim into bench/vs/*/ and builds the oxframe ports.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
site="$here/../../apps/site/src/lib"
out="$(mktemp -d)"
trap 'rm -rf "$out"' EXIT
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$here/oxframe/target}"

(cd "$here/remotion" && npm install --silent)
(cd "$here/revideo" && npm install --silent)
(cd "$here/hyperframes" && npm install --silent)
(cd "$here/manim" && uv sync -q)
(cd "$here/oxframe" && cargo build -q --release)
bin="$CARGO_TARGET_DIR/release"

# The scenes are the code on the site: the migration guides and /vs/hyperframes.
migrate="$here/../../apps/site/src/lib/migrate"
cp "$migrate/remotion.tsx.txt" "$here/remotion/src/Hello.tsx"
cp "$migrate/manim.py.txt" "$here/manim/scene.py"
cp "$migrate/hyperframes.html.txt" "$here/hyperframes/index.html"
python3 - "$migrate/revideo.tsx.txt" "$here/revideo" <<'PY'
import sys
card, render = open(sys.argv[1]).read().split('// render.ts\n')
open(sys.argv[2] + '/src/scenes/card.tsx', 'w').write(card.replace('// src/scenes/card.tsx\n', ''))
open(sys.argv[2] + '/render.ts', 'w').write(render)
PY

median() { sort -n | awk '{a[NR]=$1} END {print a[int((NR+1)/2)]}'; }
# time_of <dir> <command...>: median wall seconds of 3 runs after a warm-up.
time_of() {
  local dir=$1
  shift
  (cd "$dir" && "$@" >/dev/null 2>&1)
  for _ in 1 2 3; do
    local t0 t1
    t0=$(date +%s.%N)
    (cd "$dir" && "$@" >/dev/null 2>&1)
    t1=$(date +%s.%N)
    echo "$t1 - $t0" | bc
  done | median | xargs printf '%.2f'
}
seconds() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1" | xargs printf '%.2f'; }

remotion=$(time_of "$here/remotion" npx remotion render Hello "$out/remotion.mp4")
ox_remotion=$(time_of "$here" "$bin/remotion" render --out "$out/ox-remotion.mp4")
ox_remotion_cpu=$(time_of "$here" "$bin/remotion" render --cpu --out "$out/ox-remotion-cpu.mp4")

# HyperFrames gets the Remotion scene, written as HTML and GSAP.
export HYPERFRAMES_SKIP_SKILLS=1
hyperframes=$(time_of "$here/hyperframes" npx --yes hyperframes@0.8.185 render --fps 30 --quiet -o "$out/hyperframes.mp4")

revideo=$(time_of "$here/revideo" npx tsx render.ts)
ox_revideo=$(time_of "$here" "$bin/revideo" render --out "$out/ox-revideo.mp4")
ox_revideo_cpu=$(time_of "$here" "$bin/revideo" render --cpu --out "$out/ox-revideo-cpu.mp4")

# The oxframe port holds both guide scenes at 60 fps, so Manim renders both too.
manim=$(time_of "$here/manim" uv run manim render -r 1920,1080 --fps 60 --disable_caching -a scene.py)
ox_manim=$(time_of "$here" "$bin/manim" render --out "$out/ox-manim.mp4")
ox_manim_cpu=$(time_of "$here" "$bin/manim" render --cpu --out "$out/ox-manim-cpu.mp4")

# /vs/cloud-video-apis: one video per row of a CSV, the loop on that page.
csv() {
  tail -n +2 "$here/oxframe/people.csv" | while IFS=, read -r name prs; do
    NAME="$name" PRS="$prs" "$bin/thanks" render --cpu --out "$out/thanks-$name.mp4"
  done
}
csv_rows=$(($(wc -l <"$here/oxframe/people.csv") - 1))
csv_seconds=$(time_of "$here" csv)

v_remotion=$(cd "$here/remotion" && node -p "require('remotion/package.json').version")
v_revideo=$(cd "$here/revideo" && node -p "require('@revideo/core/package.json').version")
v_hyperframes=$(sed -n 's/.*hyperframes@\([0-9.]*\) render.*/\1/p' "$here/hyperframes/package.json")
v_manim=$(cd "$here/manim" && uv run python -c "import manim; print(manim.__version__)")
v_oxframe=$(grep -m1 -A1 'name = "oxframe"' "$here/oxframe/Cargo.lock" | sed -n 's/version = "\(.*\)"/\1/p')
cpu=$(grep -m1 'model name' /proc/cpuinfo | cut -d: -f2 | sed 's/^ *//')

cat >"$site/vs-measurements.json" <<EOF
{
  "date": "$(date +%F)",
  "machine": "$cpu, $(nproc) threads, $(uname -s)",
  "script": "bench/vs/measure.sh",
  "note": "Wall time of the render command, median of 3 after a warm-up. 1920x1080, H.264. oxframe renders on the GPU by default; --cpu forces the CPU renderer.",
  "remotion": {
    "version": "$v_remotion",
    "command": "npx remotion render Hello",
    "videoSeconds": $(seconds "$out/remotion.mp4"),
    "seconds": $remotion,
    "oxframe": { "version": "$v_oxframe", "seconds": $ox_remotion, "cpuSeconds": $ox_remotion_cpu }
  },
  "hyperframes": {
    "version": "$v_hyperframes",
    "command": "npx hyperframes render --fps 30 (the Remotion scene as HTML)",
    "videoSeconds": $(seconds "$out/hyperframes.mp4"),
    "seconds": $hyperframes,
    "oxframe": { "version": "$v_oxframe", "seconds": $ox_remotion, "cpuSeconds": $ox_remotion_cpu }
  },
  "revideo": {
    "version": "$v_revideo",
    "command": "npx tsx render.ts (renderVideo)",
    "videoSeconds": $(seconds "$out/ox-revideo.mp4"),
    "seconds": $revideo,
    "oxframe": { "version": "$v_oxframe", "seconds": $ox_revideo, "cpuSeconds": $ox_revideo_cpu }
  },
  "csv": {
    "rows": $csv_rows,
    "videoSeconds": $(seconds "$out/thanks-Ada.mp4"),
    "seconds": $csv_seconds
  },
  "manim": {
    "version": "$v_manim",
    "command": "manim render -r 1920,1080 --fps 60 -a scene.py (both scenes)",
    "videoSeconds": $(seconds "$out/ox-manim.mp4"),
    "seconds": $manim,
    "oxframe": { "version": "$v_oxframe", "seconds": $ox_manim, "cpuSeconds": $ox_manim_cpu }
  }
}
EOF
cat "$site/vs-measurements.json"
