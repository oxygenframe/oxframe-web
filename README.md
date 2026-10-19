# oxframe-web

Editor UI, site, playground and compile-service for
[oxframe](https://github.com/oxygenframe/oxframe-sdk).

| Path                 | What                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `packages/protocol`  | `@oxframe/protocol`: types generated from the Rust crate (`bun run sync-protocol`)                                         |
| `packages/backends`  | `LocalWs` (oxframe dev), `InPageWasm` (engine in a Worker, 5 s watchdog, WebCodecs export), `MockBackend`                  |
| `packages/editor-ui` | The editor (Svelte 5): viewport, timeline, inspector, curve editor, error overlay. Library + standalone bundle for the CLI |
| `apps/site`          | SvelteKit: landing, docs with live examples, playground (Monaco), gallery                                                  |
| `services/compile`   | Bun + Hono: compiles `scene.rs` to wasm in a sandbox, caches by hash, serves artifacts                                     |
| `infra`              | Sandbox image, compose, load test                                                                                          |

## Develop

```sh
bun install
bun run build:editor                       # packages/editor-ui/dist (≈31 KB gz)
bun --cwd packages/editor-ui run dev       # editor alone at http://localhost:5173/?backend=mock

# playground end-to-end (needs Rust + wasm32 target + ../oxframe-sdk)
./scripts/install-wasm-tools.sh            # once: wasm-bindgen 0.2.129, wasm-opt → .tools/bin
bun run dev                                # compile-service (:8787, NO sandbox) + site (:5173)

# playground end-to-end (needs Rust + wasm32 target + ../oxframe-sdk)
./scripts/install-wasm-tools.sh            # wasm-bindgen 0.2.129, wasm-opt → .tools/bin
RUNNER=local bun services/compile/src/index.ts   # http://127.0.0.1:8787 (NO sandbox: dev only)
bun run build && PORT=4173 bun apps/site/serve.ts
```

## Test

```sh
bun run lint && bun run check && bun run test   # eslint/prettier, svelte-check/tsc, vitest + bun test
bun run e2e                                     # editor against the mock engine (Playwright)
bun --cwd apps/site run e2e                     # site + real compile-service
bun services/compile/bench/load.ts http://127.0.0.1:8787 50
k6 run -e URL=… infra/load/compile.k6.js
```

Licensed under MIT.

## Deploy

Both halves run on Cloudflare.

**Site** (`oxframe.dev`, static assets, [`wrangler.jsonc`](wrangler.jsonc)).
Workers Builds with the defaults (root `/`, build `bun run build`, deploy
`npx wrangler deploy`) and the build variable
`PUBLIC_COMPILE_URL=https://compile.oxframe.dev`. By hand:
`PUBLIC_COMPILE_URL=https://compile.oxframe.dev bun run deploy`. The build
writes `apps/site/build/_headers` (security headers, engine worker CSP).

**Compile service** (`compile.oxframe.dev`,
[`services/compile-cf`](services/compile-cf)): a Worker answers the same API
as `services/compile`, keeps finished builds in R2 (bucket `oxframe`) and
sends cache misses to a small pool of Cloudflare Containers. Each container
is a Firecracker VM without internet that runs `services/compile` with the
local runner; its image carries the toolchain and a pre-compiled SDK, so a
build takes seconds. A cron prebuilds the site's examples into R2.
[`deploy-compile.yml`](.github/workflows/deploy-compile.yml) deploys it on
pushes that touch it (Docker is needed to build the image); it needs the
repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
