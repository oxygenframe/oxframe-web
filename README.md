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

Only the site is deployed to Cloudflare Workers (static assets, no Worker
code), configured in [`wrangler.jsonc`](wrangler.jsonc). The compile-service
needs cargo and Docker/gVisor, so it runs on its own host (`infra/sandbox`)
with `CORS_ORIGINS=https://oxframe.dev,https://www.oxframe.dev`.

**Workers Builds (git integration):** keep the defaults (root directory `/`,
build `bun run build`, deploy `npx wrangler deploy`) and add the build
variable `PUBLIC_COMPILE_URL=https://compile.oxframe.dev`.

**By hand:**

```sh
bunx wrangler login                                                    # once
PUBLIC_COMPILE_URL=https://compile.oxframe.dev bun run deploy          # oxframe.dev
PUBLIC_COMPILE_URL=https://compile.oxframe.dev bun run deploy:preview  # preview URL only
```

The site build writes `apps/site/build/_headers` (security headers and the
engine worker's CSP, see `apps/site/scripts/cf-headers.ts`).
