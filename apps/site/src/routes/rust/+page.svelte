<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { SDK_VERSION } from '$lib/sdk';
</script>

<Seo
  title="Animation and video in Rust: the oxframe library — oxframe"
  description="oxframe is a Rust library for motion graphics and video: scenes are async functions, renders are deterministic, and it runs native, headless or in WebAssembly."
  jsonld={[
    {
      '@type': 'SoftwareSourceCode',
      name: 'oxframe',
      description: 'Procedural animation in Rust: scenes are coroutines, frames are await points.',
      programmingLanguage: 'Rust',
      codeRepository: 'https://github.com/oxygenframe/oxframe-sdk',
      license: 'https://opensource.org/licenses/MIT',
      version: SDK_VERSION,
    },
  ]}
/>

<article>
  <h1>Animation and video in Rust</h1>
  <p class="lead">
    oxframe is a Rust library for motion graphics: explainers, code walkthroughs, charts and release
    videos. A scene is an <code>async fn</code>, every value is a signal, and the same code renders
    to MP4 natively, headless in CI, or live in the browser through WebAssembly.
  </p>

  <h2>A scene is an async function</h2>
  <pre><code
      >{`use oxframe::prelude::*;

#[oxframe::scene]
async fn intro(view: View) {
    let square = view.add(Rect::new().size(200.0).x(-300.0).fill(color!("#e13238")));
    all((
        square.x().to(300.0, 1.0),
        square.radius().to(100.0, 1.0),
        square.fill().to(color!("#68abdf"), 1.0),
    ))
    .await;
}

fn main() {
    Project::new("intro").scene(intro()).main();
}`}</code
    ></pre>
  <p>
    Each <code>.await</code> is a beat of the video; <code>all((…))</code> runs animations together.
    The project's binary is also its tool: <code>cargo run -- render</code> writes the MP4 and
    <code>cargo run -- check</code> reviews the frames; the <code>oxframe</code> CLI adds the editor,
    presentations and agent setup on top.
  </p>

  <h2>What it is built on</h2>
  <ul>
    <li>
      <strong>A deterministic executor.</strong> Scenes run on a single-threaded coroutine executor
      in <code>oxframe-core</code>; a frame is a point where every scene task has awaited. Seeking
      replays from the start, so frame 900 is the same whether you play, scrub or render.
    </li>
    <li>
      <strong>Two renderers.</strong> vello on the GPU and tiny-skia on the CPU, from the same scene
      graph; <code>--cpu</code> renders on a machine without a GPU. 3D is a software rasterizer with byte-identical
      output.
    </li>
    <li>
      <strong>Text.</strong> parley and skrifa lay out and outline text, with Inter and JetBrains
      Mono embedded and any font through <code>register_font</code>.
    </li>
    <li>
      <strong>Export.</strong> Frames are piped to ffmpeg for MP4, WebM with alpha and ProRes 4444,
      with audio mixed in; <code>--jobs</code> renders segments in parallel with the same bytes as one
      job.
    </li>
    <li>
      <strong>WebAssembly.</strong> The <code>wasm</code> feature runs a project in the browser;
      that is how the <a href="/playground">playground</a> works.
    </li>
  </ul>

  <h2>Crates and features</h2>
  <p>
    <code>cargo add oxframe</code> brings the whole SDK ({SDK_VERSION}); the parts are separate
    crates, and the core has no graphics in it.
  </p>
  <table>
    <thead><tr><th>Crate</th><th>What it does</th></tr></thead>
    <tbody>
      <tr><td><code>oxframe-core</code></td><td>signals, tweens, the coroutine executor</td></tr>
      <tr><td><code>oxframe-2d</code></td><td>the scene graph and its nodes</td></tr>
      <tr
        ><td><code>oxframe-components</code></td><td>titles, lists, diagrams, code explainers</td
        ></tr
      >
      <tr><td><code>oxframe-render</code></td><td>tiny-skia on the CPU, vello on the GPU</td></tr>
      <tr><td><code>oxframe-3d</code></td><td>meshes, lights and a software rasterizer</td></tr>
      <tr
        ><td><code>oxframe-math</code></td><td>formulas set by Typst, with a bundled math font</td
        ></tr
      >
      <tr><td><code>oxframe-export</code></td><td>ffmpeg video, PNG sequences, audio</td></tr>
    </tbody>
  </table>
  <p>
    Features: <code>gpu</code> (default), <code>3d</code>, <code>icons</code>, <code>video</code>,
    <a href="/docs/formulas"><code>math</code></a>, <code>wasm</code> and
    <code>unstable-node-api</code> for nodes of your own. The API reference is on
    <a href="https://docs.rs/oxframe" rel="external">docs.rs</a>.
  </p>

  <h2>Start</h2>
  <pre><code
      >cargo install oxframe-cli
oxframe init my-video
cd my-video && oxframe dev</code
    ></pre>
  <p>
    <a href="/docs/getting-started">Getting started</a> walks through it, the
    <a href="/docs/guide/hello">guide</a> teaches the API lesson by lesson, and the
    <a href="/gallery">gallery</a> has the source of every example.
  </p>
</article>

<style>
  article {
    max-width: 760px;
  }
  .lead {
    color: var(--muted);
  }
</style>
