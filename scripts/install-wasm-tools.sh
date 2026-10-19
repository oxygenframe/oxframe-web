#!/usr/bin/env bash
# Installs wasm-bindgen-cli (matching the template's pin) and wasm-opt into
# .tools/bin for the local compile runner.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .tools/bin
cargo install --locked --root .tools wasm-bindgen-cli --version 0.2.129
v=133
curl -fsSL "https://github.com/WebAssembly/binaryen/releases/download/version_$v/binaryen-version_$v-x86_64-linux.tar.gz" | tar -xz -C .tools
cp ".tools/binaryen-version_$v/bin/wasm-opt" .tools/bin/
.tools/bin/wasm-opt --version && .tools/bin/wasm-bindgen --version
