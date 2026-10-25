<script lang="ts">
  import { onMount } from 'svelte';
  import { COMPILE_URL } from '$lib/config';

  // The same /player.js other sites load (built by packages/player).
  onMount(() => {
    const src = '/player.js';
    void import(/* @vite-ignore */ src);
  });

  const DEFAULT_COMPILE = 'https://compile.oxframe.dev';
  // The live player below uses the compile service this site was built with.
  const compile = COMPILE_URL === DEFAULT_COMPILE ? undefined : COMPILE_URL;
</script>

<h1>Embed an animation in a web page</h1>
<p class="lead">
  <code>&lt;oxframe-player&gt;</code> plays an oxframe scene on any website: a blog post, a course, docs,
  a landing page. The scene itself runs in the browser, compiled to WebAssembly, so there is no video
  file to host, and every frame is drawn at the size it is shown, sharp on any screen.
</p>

<div class="demo" data-pagefind-ignore="all">
  <oxframe-player example="intro" {compile} controls loop data-testid="embed-demo"></oxframe-player>
</div>

<h2 id="quick-start">Quick start</h2>
<p>
  Open a scene in the <a href="/playground">playground</a>, press <strong>Embed</strong> and paste what
  it copies into your page:
</p>
<pre><code
    >&lt;script type="module" src="https://oxframe.dev/player.js"&gt;&lt;/script&gt;
&lt;oxframe-player build="a2e41d72bdf182b4502dbf61219fcfc9" controls loop&gt;&lt;/oxframe-player&gt;</code
  ></pre>
<p>
  <code>build</code> names one compiled build of the scene on compile.oxframe.dev. A build never changes,
  so an embed keeps playing exactly what you published, even after the code in the playground moves on.
  The player is a 5 kB script (gzip) plus the scene's own wasm; nothing loads until the player scrolls
  near the screen.
</p>

<h2 id="attributes">Attributes</h2>
<table>
  <thead><tr><th>Attribute</th><th>What it does</th></tr></thead>
  <tbody>
    <tr
      ><td><code>build</code></td><td>The build to play, from the playground's Embed button.</td
      ></tr
    >
    <tr
      ><td><code>example</code></td><td
        >Plays one of the <a href="/playground">playground</a> examples by name, such as
        <code>intro</code>, in its newest build.</td
      ></tr
    >
    <tr
      ><td><code>js</code>, <code>wasm</code></td><td
        >A build you host yourself (see <a href="#self-host">below</a>).</td
      ></tr
    >
    <tr><td><code>controls</code></td><td>Shows play/pause, the time bar and the time.</td></tr>
    <tr
      ><td><code>autoplay</code></td><td
        >Starts playing when the player is on screen. Not for visitors who ask their system for
        reduced motion.</td
      ></tr
    >
    <tr><td><code>loop</code></td><td>Starts again at the end.</td></tr>
    <tr><td><code>at</code></td><td>Opens at this time, in seconds (<code>at="2.5"</code>).</td></tr
    >
    <tr
      ><td><code>compile</code></td><td
        >Another compile service, for <code>build</code> and <code>example</code>. The default is
        <code>https://compile.oxframe.dev</code>.</td
      ></tr
    >
  </tbody>
</table>
<p>
  The player takes the width of its container and the shape of the scene. Set a width or height with
  CSS as for an image; style the inside with <code>::part(canvas)</code>,
  <code>::part(controls)</code>
  and
  <code>::part(message)</code>. Clicking the picture or pressing Space on the focused player plays
  and pauses. A player that scrolls off screen pauses, and goes on when it comes back.
</p>

<h2 id="javascript">From JavaScript</h2>
<p>The element works like a <code>&lt;video&gt;</code> for the basics:</p>
<pre><code
    >{`const player = document.querySelector('oxframe-player');
player.addEventListener('ready', () => console.log(player.duration, 's'));
player.addEventListener('ended', () => console.log('done'));
player.currentTime = 2; // seconds
player.play();
player.pause();
player.paused; // true or false`}</code
  ></pre>
<p>
  Events: <code>ready</code> (the scene is loaded and <code>duration</code> is known),
  <code>play</code>, <code>pause</code>, <code>timeupdate</code>, <code>ended</code>, and
  <code>error</code> with the reason in <code>event.detail.message</code>. Changing
  <code>build</code>,
  <code>example</code>, <code>js</code> or <code>wasm</code> loads the new scene.
</p>

<h2 id="self-host">Hosting the build yourself</h2>
<p>
  The playground builds one file. A project with several files or its own assets can be built to
  WebAssembly with wasm-bindgen and served from your own site. Add a library target that registers
  the project:
</p>
<pre><code
    >{`# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
oxframe = { version = "0.23", default-features = false, features = ["wasm", "gpu"] }
wasm-bindgen = "0.2"`}</code
  ></pre>
<pre><code
    >{`// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn start() {
    oxframe::wasm::register(crate::project); // your pub fn project() -> Project
}`}</code
  ></pre>
<pre><code
    >{`cargo build --release --lib --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir public/scene --out-name bundle --no-typescript \\
  target/wasm32-unknown-unknown/release/my_video.wasm`}</code
  ></pre>
<p>
  The wasm-bindgen command must be the same version as the <code>wasm-bindgen</code> crate in your
  Cargo.lock (<code>cargo install wasm-bindgen-cli --version …</code>). Running
  <code>wasm-opt -Os</code> from Binaryen on the <code>.wasm</code> afterwards makes it several times
  smaller.
</p>
<p>Then point the player at the two files:</p>
<pre><code
    >&lt;oxframe-player js="/scene/bundle.js" wasm="/scene/bundle_bg.wasm" controls&gt;&lt;/oxframe-player&gt;</code
  ></pre>
<p>
  The player runs the scene in a Web Worker, so a slow scene never freezes the page. With WebGPU it
  draws on the GPU, otherwise on the CPU. A page with a strict Content Security Policy needs
  <code>'wasm-unsafe-eval'</code> in <code>script-src</code>, and <code>worker-src blob:</code> when the
  player comes from another site.
</p>

<h2 id="video-instead">When a video file is better</h2>
<p>
  Where scripts cannot run (email, social networks, a slide deck), render a file with
  <code>oxframe render</code> (<a href="/docs/rendering">Rendering video</a>), or share a link to a
  video with <code>oxframe publish</code>.
</p>

<style>
  .demo {
    margin: 16px 0 24px;
    max-width: 720px;
  }
</style>
