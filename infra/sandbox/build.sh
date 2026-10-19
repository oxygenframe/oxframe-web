#!/bin/sh
# Runs inside the sandbox. Input: /work/src/scene.rs (read-only mount).
# Output: /out/bundle.js, /out/bundle.wasm. Cargo JSON goes to stdout.
set -eu
# The root file system is read-only; cargo still wants a writable
# CARGO_HOME for its package-cache lock. Point it at /tmp and reuse the
# baked-in registry.
export CARGO_HOME=/tmp/cargo-home
mkdir -p "$CARGO_HOME" && ln -sf /usr/local/cargo/registry "$CARGO_HOME/registry"
# First use of a worker's target volume: seed it with the warmed build.
if [ ! -e /work/target/.seeded ]; then cp -a /work/target.seed/. /work/target/ && touch /work/target/.seeded; fi
cargo build --release --target wasm32-unknown-unknown --offline --message-format=json-diagnostic-rendered-ansi
wasm-bindgen --target web --out-dir /tmp/out --out-name bundle --no-typescript \
  /work/target/wasm32-unknown-unknown/release/scene.wasm >&2
wasm-opt -Os --enable-bulk-memory --enable-nontrapping-float-to-int --enable-sign-ext --enable-mutable-globals \
  /tmp/out/bundle_bg.wasm -o /out/bundle.wasm >&2
cp /tmp/out/bundle.js /out/bundle.js
