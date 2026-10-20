#!/usr/bin/env bash
# Builds and smoke-tests the container images with podman (or docker), the
# way CI and Cloudflare will, before a release:
#   1. compile.oxframe.dev's image, built on the local SDK checkout
#      (OXFRAME_SDK_PATH, default ../oxframe-sdk) instead of crates.io, then
#      run with no network and asked to build a real scene;
#   2. the local stack images (site, compile), started and queried.
# Part of oxframe-sdk/scripts/release-check.sh.
set -euo pipefail
cd "$(dirname "$0")/.."
engine=${CONTAINER_ENGINE:-$(command -v podman || command -v docker)}
sdk=$(cd "${OXFRAME_SDK_PATH:-../oxframe-sdk}" && pwd)
step() { printf '\n== %s\n' "$*"; }
cleanup() { "$engine" rm -f oxcheck-compile oxcheck-site oxcheck-stack >/dev/null 2>&1 || true; rm -rf "${ctx:-}"; }
trap cleanup EXIT

step "compile service image on $sdk"
# The SDK sources (no build output) as the `sdk` build context, under sdk/.
ctx=$(mktemp -d)
mkdir "$ctx/sdk"
(cd "$sdk" && git ls-files -z | xargs -0 cp --parents -t "$ctx/sdk")
"$engine" build -f services/compile-cf/Dockerfile \
  --ignorefile services/compile-cf/Dockerfile.dockerignore \
  --build-context "sdk=$ctx" \
  --build-arg 'OXFRAME_DEP=path = "/sdk/crates/oxframe"' \
  -t oxframe-compile-builder:check .
"$engine" image inspect oxframe-compile-builder:check --format '{{.Size}}' \
  | awk '{printf "image size: %.0f MB\n", $1/1e6}'
"$engine" run -d --name oxcheck-compile --network none oxframe-compile-builder:check
"$engine" cp services/compile-cf/scripts/smoke.ts oxcheck-compile:/tmp/smoke.ts
"$engine" cp apps/site/src/lib/examples/intro.rs oxcheck-compile:/tmp/intro.rs
"$engine" exec oxcheck-compile bun /tmp/smoke.ts /tmp/intro.rs \
  || { "$engine" logs oxcheck-compile | tail -50; exit 1; }

step "local stack images"
"$engine" build -f infra/site.Dockerfile --ignorefile infra/site.Dockerfile.dockerignore -t oxframe-site:check .
"$engine" build -f infra/compile.Dockerfile --ignorefile infra/compile.Dockerfile.dockerignore -t oxframe-compile:check .
"$engine" run -d --name oxcheck-site -p 13000:3000 oxframe-site:check
"$engine" run -d --name oxcheck-stack -p 18787:8787 oxframe-compile:check
for _ in $(seq 30); do
  curl -sf 127.0.0.1:13000/docs >/dev/null && curl -sf 127.0.0.1:18787/healthz >/dev/null && break
  sleep 1
done
curl -sf 127.0.0.1:13000/docs | grep -q '<title>'
curl -sf 127.0.0.1:18787/api/examples | grep -q '"name":"intro"'

printf '\nimage-check: all green\n'
