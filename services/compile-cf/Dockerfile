# Build machine for compile.oxframe.dev, run by Cloudflare Containers (one
# Firecracker VM per instance, internet disabled by the Worker). It runs
# services/compile with the local runner; every crate is fetched and the SDK
# compiled while building this image, so builds work offline.
# Build context: the repository root (see wrangler.jsonc).
# Prebuilt tools: Workers Builds gives an image build 20 minutes.
FROM debian:bookworm-slim AS tools
ARG WASM_BINDGEN_VERSION=0.2.129
ARG BINARYEN_VERSION=133
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://github.com/wasm-bindgen/wasm-bindgen/releases/download/${WASM_BINDGEN_VERSION}/wasm-bindgen-${WASM_BINDGEN_VERSION}-x86_64-unknown-linux-musl.tar.gz \
    | tar -xz -C /opt && cp /opt/wasm-bindgen-${WASM_BINDGEN_VERSION}-x86_64-unknown-linux-musl/wasm-bindgen /usr/local/bin/ \
 && curl -fsSL https://github.com/WebAssembly/binaryen/releases/download/version_${BINARYEN_VERSION}/binaryen-version_${BINARYEN_VERSION}-x86_64-linux.tar.gz \
    | tar -xz -C /opt && cp /opt/binaryen-version_${BINARYEN_VERSION}/bin/wasm-opt /usr/local/bin/

FROM oven/bun:1.3.14 AS bun

FROM rust:1.97.1-slim-bookworm
ARG OXFRAME_SDK_VERSION=0.2.1
RUN rustup target add wasm32-unknown-unknown && useradd -m -u 10001 builder
COPY --from=tools /usr/local/bin/wasm-bindgen /usr/local/bin/wasm-bindgen
COPY --from=tools /usr/local/bin/wasm-opt /usr/local/bin/wasm-opt
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app
COPY services/compile/package.json services/compile/
COPY services/compile/src services/compile/src
# The SDK version (one source for the site, the playground and the service).
COPY apps/site/src/lib/sdk.ts apps/site/src/lib/sdk.ts
COPY services/compile-cf/container services/compile-cf/container
COPY infra/sandbox/template infra/sandbox/template
RUN chown -R builder /app
USER builder

ENV CARGO_HOME=/home/builder/.cargo \
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
    OXFRAME_DEP="version = \"=${OXFRAME_SDK_VERSION}\""
RUN cd services/compile && bun install --production \
 && cd /app && bun services/compile-cf/container/warm.ts
# From here on nothing may need the network.
ENV CARGO_NET_OFFLINE=true
EXPOSE 8080
CMD ["bun", "services/compile/src/index.ts"]
