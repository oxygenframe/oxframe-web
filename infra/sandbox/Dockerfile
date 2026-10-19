# Compile sandbox for playground scenes. Rebuilt for every SDK release:
#   docker build -f infra/sandbox/Dockerfile --build-arg OXFRAME_SDK_VERSION=0.1.0 -t oxframe-sandbox:0.1.0 .
# Run only under gVisor (`--runtime=runsc`) with --network=none; see
# services/compile/src/runner.ts (DockerRunner) for the exact flags.
FROM rust:1.97.1-slim-bookworm AS tools
ARG WASM_BINDGEN_VERSION=0.2.129
ARG BINARYEN_VERSION=133
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/* \
 && rustup target add wasm32-unknown-unknown \
 && cargo install --locked wasm-bindgen-cli --version ${WASM_BINDGEN_VERSION} \
 && curl -fsSL https://github.com/WebAssembly/binaryen/releases/download/version_${BINARYEN_VERSION}/binaryen-version_${BINARYEN_VERSION}-x86_64-linux.tar.gz \
    | tar -xz -C /opt && cp /opt/binaryen-version_${BINARYEN_VERSION}/bin/wasm-opt /usr/local/bin/

FROM rust:1.97.1-slim-bookworm
ARG OXFRAME_SDK_VERSION=0.1.0
RUN rustup target add wasm32-unknown-unknown && useradd -m -u 10001 builder
COPY --from=tools /usr/local/cargo/bin/wasm-bindgen /usr/local/bin/wasm-bindgen
COPY --from=tools /usr/local/bin/wasm-opt /usr/local/bin/wasm-opt
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
