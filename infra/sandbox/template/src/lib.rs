// Entry point of a compiled playground scene. `scene.rs` (the user's code)
// must define `pub fn project() -> oxframe::Project`.
mod scene;

use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn start() {
    oxframe::wasm::register(scene::project);
}
