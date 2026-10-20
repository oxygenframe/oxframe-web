# Infrastructure

| File                                                    | What                                                                                                                       |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `sandbox/Dockerfile`                                    | Compile sandbox image: fixed template crate with warmed dependencies, `wasm-bindgen`, `wasm-opt`. Rebuilt per SDK release. |
| `sandbox/build.sh`                                      | Build steps inside the sandbox.                                                                                            |
| `sandbox/template/`                                     | The only crate users can compile; they provide `src/scene.rs`.                                                             |
| `compile.Dockerfile`, `site.Dockerfile`, `compose.yaml` | Local stack. Each service is compiled into one executable (`bun build --compile`) and shipped on a bare Alpine.            |

## Sandbox guarantees (spec §7)

Each build runs in a fresh container: gVisor (`--runtime=runsc`),
`--network=none`, read-only root, writable `/tmp` (tmpfs, 100 MB) and the
worker's target volume only, empty environment, `--cap-drop=ALL`,
`--pids-limit`, 2 GB memory, 2 CPUs, 60 s wall clock, 16 MB result. Users
cannot add dependencies, build scripts or proc-macros; the service rejects
`#![no_std]`, `#![feature]`, `asm!`, `wasm_bindgen`, linkage attributes and
`extern crate` before building.

Hosting: the provider must support nested virtualization (or bare metal) for
gVisor's KVM platform; `runsc --platform=systrap` works on ordinary VMs at
some speed cost.

## Images

Build in one stage, ship only the result. Each Dockerfile has its own
context filter (`<Dockerfile>.dockerignore`).

- `site.Dockerfile`, `compile.Dockerfile`: the Bun service compiled into a
  single executable on `alpine` (plus `libstdc++` for the Bun runtime).
- `sandbox/Dockerfile` and `services/compile-cf/Dockerfile` must contain a
  Rust toolchain, because compiling scenes is their job. They stay on Debian
  slim: `rust:*-alpine` is larger (gcc + musl-dev on top of the same
  toolchain) and musl's allocator makes rustc slower. Tools come as prebuilt
  static binaries from a separate stage; the SDK is warmed in its own stage
  that depends only on the template and the SDK version.
