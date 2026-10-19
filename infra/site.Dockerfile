FROM oven/bun:1.3.14 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile && bun run build

FROM oven/bun:1.3.14-slim
WORKDIR /app
COPY --from=build /app/apps/site/build ./build
COPY apps/site/serve.ts ./serve.ts
CMD ["bun", "serve.ts"]
