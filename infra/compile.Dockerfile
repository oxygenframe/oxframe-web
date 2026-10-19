FROM oven/bun:1.3.14-slim
RUN apt-get update && apt-get install -y --no-install-recommends docker.io && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock ./
COPY services/compile ./services/compile
COPY apps/site/src/lib/examples ./apps/site/src/lib/examples
COPY infra/sandbox ./infra/sandbox
RUN bun install --frozen-lockfile --filter @oxframe/compile-service
WORKDIR /app/services/compile
CMD ["bun", "src/index.ts"]
