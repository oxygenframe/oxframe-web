# Compile sandbox for playground scenes. Rebuilt for every SDK release:
#   docker build -f infra/sandbox/Dockerfile --build-arg OXFRAME_SDK_VERSION=0.4.0 -t oxframe-sandbox:0.4.0 .
# Run only under gVisor (`--runtime=runsc`) with --network=none; see
# services/compile/src/runner.ts (DockerRunner) for the exact flags.
# Prebuilt, statically linked wasm-bindgen and wasm-opt (no cargo install).
FROM debian:bookworm-slim AS tools
ARG WASM_BINDGEN_VERSION=0.2.129
ARG BINARYEN_VERSION=133
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && mkdir /out \
 && curl -fsSL https://github.com/wasm-bindgen/wasm-bindgen/releases/download/${WASM_BINDGEN_VERSION}/wasm-bindgen-${WASM_BINDGEN_VERSION}-x86_64-unknown-linux-musl.tar.gz \
    | tar -xz -C /tmp && cp /tmp/wasm-bindgen-${WASM_BINDGEN_VERSION}-x86_64-unknown-linux-musl/wasm-bindgen /out/ \
 && curl -fsSL https://github.com/WebAssembly/binaryen/releases/download/version_${BINARYEN_VERSION}/binaryen-version_${BINARYEN_VERSION}-x86_64-linux.tar.gz \
    | tar -xz -C /tmp && cp /tmp/binaryen-version_${BINARYEN_VERSION}/bin/wasm-opt /out/

# The final image ships the Rust toolchain on purpose: it compiles scenes.
# Debian slim, not Alpine: rust:*-alpine is larger and musl slows rustc.
FROM rust:1.97.1-slim-bookworm
ARG OXFRAME_SDK_VERSION=0.4.0
RUN rustup target add wasm32-unknown-unknown && useradd -m -u 10001 builder
COPY --from=tools /out/ /usr/local/bin/
WORKDIR /work
COPY infra/sandbox/template/Cargo.toml.in /work/Cargo.toml.in
COPY infra/sandbox/template/src /work/src
COPY infra/sandbox/build.sh /work/build.sh
RUN sed "s|{{OXFRAME_DEP}}|version = \"=${OXFRAME_SDK_VERSION}\"|" Cargo.toml.in > Cargo.toml \
 && cargo generate-lockfile \
 # Fetch and compile all dependencies now: builds run without network.
 && cargo build --release --target wasm32-unknown-unknown \
 && cp -a target /work/target.seed \
 && chown -R builder /work
ENV CARGO_NET_OFFLINE=true CARGO_TERM_COLOR=never
USER builder
