# syntax=docker/dockerfile:1
# compile-service for the local stack (infra/compose.yaml): the Bun service
# compiled into one executable, on a bare Alpine with the Docker CLI. Builds
# run in sibling sandbox containers (infra/sandbox/Dockerfile) through the
# host's Docker socket, so no Rust toolchain is needed here.
ARG BUN_VERSION=1.3.14

FROM docker.io/oven/bun:${BUN_VERSION} AS build
WORKDIR /app
# Every workspace manifest, or the frozen lockfile does not match; only the
# service's dependencies are installed.
COPY package.json bun.lock ./
COPY apps/site/package.json apps/site/
COPY packages/backends/package.json packages/backends/
COPY packages/editor-ui/package.json packages/editor-ui/
COPY packages/protocol/package.json packages/protocol/
COPY services/compile/package.json services/compile/
COPY services/compile-cf/package.json services/compile-cf/
COPY services/mcp/package.json services/mcp/
RUN bun install --frozen-lockfile --ignore-scripts --filter @oxframe/compile-service
COPY services/compile/src services/compile/src
COPY apps/site/src/lib/sdk.ts apps/site/src/lib/sdk.ts
ARG TARGETARCH
RUN arch=$([ "$TARGETARCH" = arm64 ] && echo arm64 || echo x64) \
 && bun build --compile --minify --target="bun-linux-$arch-musl" services/compile/src/index.ts --outfile /out/oxframe-compile

FROM docker.io/library/alpine:3.22
RUN apk add --no-cache docker-cli libstdc++ libgcc
COPY --from=build /out/oxframe-compile /usr/local/bin/oxframe-compile
COPY apps/site/src/lib/examples /srv/examples
COPY infra/sandbox/template /srv/template
# Runs as root: it drives the host's Docker socket (mounted by compose).
ENV EXAMPLES_DIR=/srv/examples TEMPLATE_DIR=/srv/template DATA_DIR=/data HOST=0.0.0.0 PORT=8787
EXPOSE 8787
ENTRYPOINT ["oxframe-compile"]
