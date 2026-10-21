# syntax=docker/dockerfile:1
# Build machine for compile.oxframe.dev, run by Cloudflare Containers (one
# Firecracker VM per instance, internet disabled by the Worker). It runs
# services/compile with the local runner. Built by
# .github/workflows/deploy-compile.yml from the repository root.
#
# Unlike a usual Rust service this image must ship a compiler: compiling
# user scenes is its job. So the final stage is the Rust toolchain plus
# only the results of the other stages (tools, the warmed SDK build, the
# service). The base stays Debian slim: rust:*-alpine is larger (it adds
# gcc and musl-dev to the same toolchain) and musl's allocator makes rustc
# slower, which is the latency users wait for.
ARG RUST_IMAGE=docker.io/library/rust:1.97.1-slim-bookworm
ARG BUN_VERSION=1.3.14
# Must match apps/site/src/lib/sdk.ts (checked by scripts/gen-examples.ts).
ARG OXFRAME_SDK_VERSION=0.10.0

# Prebuilt, statically linked wasm-bindgen and wasm-opt.
FROM docker.io/library/debian:bookworm-slim AS tools
ARG WASM_BINDGEN_VERSION=0.2.129
ARG BINARYEN_VERSION=133
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
 && mkdir /out \
 && curl -fsSL https://github.com/wasm-bindgen/wasm-bindgen/releases/download/${WASM_BINDGEN_VERSION}/wasm-bindgen-${WASM_BINDGEN_VERSION}-x86_64-unknown-linux-musl.tar.gz \
    | tar -xz -C /tmp && cp /tmp/wasm-bindgen-${WASM_BINDGEN_VERSION}-x86_64-unknown-linux-musl/wasm-bindgen /out/ \
 && curl -fsSL https://github.com/WebAssembly/binaryen/releases/download/version_${BINARYEN_VERSION}/binaryen-version_${BINARYEN_VERSION}-x86_64-linux.tar.gz \
    | tar -xz -C /tmp && cp /tmp/binaryen-version_${BINARYEN_VERSION}/bin/wasm-opt /out/

# The service's production dependencies.
FROM docker.io/oven/bun:${BUN_VERSION} AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/site/package.json apps/site/
COPY packages/backends/package.json packages/backends/
COPY packages/editor-ui/package.json packages/editor-ui/
COPY packages/protocol/package.json packages/protocol/
COPY services/compile/package.json services/compile/
COPY services/compile-cf/package.json services/compile-cf/
RUN bun install --frozen-lockfile --ignore-scripts --production --filter @oxframe/compile-service

# The SDK sources, for checking an unreleased SDK before it is published
# (scripts/image-check.sh passes --build-context sdk=../oxframe-sdk and
# OXFRAME_DEP pointing at /sdk). Empty in production: crates.io is used.
FROM docker.io/library/busybox:1.37 AS sdk
RUN mkdir /sdk

FROM ${RUST_IMAGE} AS toolchain
RUN rustup target add wasm32-unknown-unknown \
 && useradd -m -u 10001 builder \
 && install -d -o builder /home/builder/data/work/w0

# The SDK compiled exactly as LocalRunner's worker 0 will build scenes
# (same paths, manifest and command), with network. Depends only on the
# template and the SDK version, so changes to the service reuse this layer.
FROM toolchain AS warm
ARG OXFRAME_SDK_VERSION
ARG OXFRAME_DEP="version = \"=${OXFRAME_SDK_VERSION}\""
COPY --from=sdk /sdk /sdk
USER builder
ENV CARGO_HOME=/home/builder/.cargo
WORKDIR /home/builder/data/work/w0
COPY --chown=builder infra/sandbox/template /tmp/template
RUN sed "s|{{OXFRAME_DEP}}|${OXFRAME_DEP}|g" /tmp/template/Cargo.toml.in > Cargo.toml \
 && mkdir src && cp /tmp/template/src/lib.rs /tmp/template/src/scene.rs src/ \
 && cargo build --release --target wasm32-unknown-unknown

FROM toolchain
ARG OXFRAME_SDK_VERSION
ARG OXFRAME_DEP="version = \"=${OXFRAME_SDK_VERSION}\""
COPY --from=warm /sdk /sdk
COPY --from=tools /out/ /usr/local/bin/
COPY --from=deps /usr/local/bin/bun /usr/local/bin/bun
# COPY keeps mtimes, so cargo sees the warmed build as fresh.
# --chown applies to the copied entries, not to destination directories that
# already exist (data/, work/, w0/ from the toolchain stage). The copy leaves
# those directories owned by root, so builder cannot mkdir artifacts/ or write
# the scene.
COPY --from=warm --chown=builder /home/builder/.cargo /home/builder/.cargo
COPY --from=warm --chown=builder /home/builder/data /home/builder/data
RUN chown builder:builder \
      /home/builder/data /home/builder/data/work /home/builder/data/work/w0 \
      /home/builder/.cargo \
 && chmod 755 \
      /home/builder/data /home/builder/data/work /home/builder/data/work/w0 \
      /home/builder/.cargo
WORKDIR /app
# bun's isolated install: packages live in node_modules/.bun, the service
# reaches them through relative links in its own node_modules.
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/services/compile/node_modules services/compile/node_modules
COPY services/compile/package.json services/compile/
COPY services/compile/src services/compile/src
COPY apps/site/src/lib/sdk.ts apps/site/src/lib/sdk.ts
COPY infra/sandbox/template infra/sandbox/template
USER builder
ENV CARGO_HOME=/home/builder/.cargo \
    CARGO_NET_OFFLINE=true \
    CARGO_TERM_COLOR=never \
    RUNNER=local \
    ALLOW_UNSANDBOXED=1 \
    HOST=0.0.0.0 \
    PORT=8080 \
    WORKERS=1 \
    QUEUE_LIMIT=64 \
    RATE_PER_MINUTE=100000 \
    BUILD_TIMEOUT_MS=90000 \
    CORS_ORIGINS=* \
    DATA_DIR=/home/builder/data \
    TOOLS_DIR=/usr/local/bin \
    EXAMPLES_DIR=/nonexistent \
    OXFRAME_SDK_VERSION=${OXFRAME_SDK_VERSION} \
    OXFRAME_DEP=${OXFRAME_DEP}
EXPOSE 8080
CMD ["bun", "services/compile/src/index.ts"]
