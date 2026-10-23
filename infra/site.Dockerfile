# syntax=docker/dockerfile:1
# oxframe.dev self-hosted (production runs on Cloudflare): the static build
# plus serve.ts compiled into one executable, on a bare Alpine.
#   docker build -f infra/site.Dockerfile --build-arg PUBLIC_COMPILE_URL=https://compile.example -t oxframe-site .
ARG BUN_VERSION=1.3.14

FROM docker.io/oven/bun:${BUN_VERSION} AS build
WORKDIR /app
# Manifests first, so the dependency layer is reused until they change.
COPY package.json bun.lock ./
COPY apps/site/package.json apps/site/
COPY packages/backends/package.json packages/backends/
COPY packages/editor-ui/package.json packages/editor-ui/
COPY packages/protocol/package.json packages/protocol/
COPY services/compile/package.json services/compile/
COPY services/compile-cf/package.json services/compile-cf/
COPY services/mcp/package.json services/mcp/
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
ARG PUBLIC_COMPILE_URL=http://localhost:8787
ARG TARGETARCH
RUN PUBLIC_COMPILE_URL="$PUBLIC_COMPILE_URL" bun run build \
 && arch=$([ "$TARGETARCH" = arm64 ] && echo arm64 || echo x64) \
 && bun build --compile --minify --target="bun-linux-$arch-musl" apps/site/serve.ts --outfile /out/oxframe-site \
 && cp -r apps/site/build /out/site

FROM docker.io/library/alpine:3.22
# The bun runtime inside the executable needs the C++ runtime.
RUN apk add --no-cache libstdc++ libgcc && adduser -D -H -u 10001 site
COPY --from=build /out/oxframe-site /usr/local/bin/oxframe-site
COPY --from=build /out/site /srv/site
ARG PUBLIC_COMPILE_URL=http://localhost:8787
ENV SITE_DIR=/srv/site PORT=3000 PUBLIC_COMPILE_URL=${PUBLIC_COMPILE_URL}
USER site
EXPOSE 3000
ENTRYPOINT ["oxframe-site"]
