<svelte:head><title>How oxframe works — oxframe</title></svelte:head>

<h1>How oxframe works</h1>
<p class="lead">
  You don't need any of this to make animations. Read it if you are curious why scrubbing is
  instant, why renders are reproducible, or how the playground runs Rust in your browser.
</p>

<h2>A scene is a coroutine</h2>
<p>
  <code>#[oxframe::scene]</code> turns your <code>async fn</code> into a future. oxframe polls it
  with a small single-threaded executor: <strong>one poll is one frame</strong>. Each awaited
  animation updates its signals and returns "pending" until its time is up, so the code after it
  runs on the right frame.
</p>
<p>
  Time is virtual: each task keeps its own clock, advanced by exactly one frame per poll. A
  <code>.to(x, 1.0)</code> that ends between two frames hands the remaining fraction to the next animation,
  so a long chain of steps never drifts from where the timeline says it should be.
</p>

<h2>Everything is deterministic</h2>
<p>
  There is no wall clock and no thread pool in the scene code. Randomness comes from a ChaCha8
  generator seeded by <code>Project::seed</code>, and every <code>spawn</code>ed task runs in a
  fixed order. The same code and the same <code>meta.json</code> produce the same frames — on your laptop,
  in CI and in the browser.
</p>
<p>
  That is what makes seeking possible: to show frame 900, oxframe replays the scene from its start
  without drawing anything, which takes milliseconds, and then draws only the frame you asked for.
</p>

<h2>Signals</h2>
<p>
  Every property — position, color, text — is a <code>Signal</code>. A signal is either a value or a
  function of other signals (<code>.bind(…)</code>). Derived signals are lazy: they recompute only
  when read and only if something they depend on changed. Cycles are detected and reported instead
  of hanging.
</p>

<h2>From nodes to pixels</h2>
<ol>
  <li>
    After each frame, the node tree is laid out (flexbox and grid via taffy) and flattened into a
    <em>display list</em>: fills, strokes, images and layers.
  </li>
  <li>
    A renderer draws the list. <strong>vello</strong> does it on the GPU through wgpu;
    <strong>tiny-skia</strong> on the CPU. Layers with blur, shadow or glow are rasterized only within
    their bounds.
  </li>
  <li>
    For video, frames stream to <strong>ffmpeg</strong> through a pipe while the next ones are being drawn.
  </li>
</ol>
<p>
  Both renderers are checked against the same reference images: the average color difference must
  stay below ΔE 1 in OKLab, which is below what the eye can see.
</p>

<h2>The editor and the engine</h2>
<p>
  Your project compiles into an ordinary binary. <code>oxframe dev</code> runs it as a preview
  server; the editor in your browser talks to it over a WebSocket with a small JSON protocol (<em
    >seek</em
  >, <em>play</em>, <em>set marker</em>…) plus binary frames. When you save, the CLI rebuilds and
  restarts the binary, and the editor reconnects to the same frame.
</p>
<p>
  Edits to markers, eases and tunables go the other way: the editor sends them, the engine writes
  <code>meta.json</code> and re-runs the scene — no compilation needed.
</p>

<h2>The playground</h2>
<p>
  The playground sends your code to a compile service that builds it to WebAssembly in a sandbox
  (results are cached by the hash of the source and SDK version). The same engine then runs inside a
  Web Worker in your page. With WebGPU it renders on your GPU through vello into an
  <code>OffscreenCanvas</code>; without it, it falls back to the CPU renderer. The editor speaks the
  same protocol to the worker as it does to <code>oxframe dev</code>, so they behave the same.
</p>

<h2>Where the code lives</h2>
<table>
  <tbody>
    <tr
      ><td><code>oxframe-sdk</code></td><td
        >The Rust crates: core (executor, signals, easing), 2d (nodes, layout), text, render,
        export, preview, protocol.</td
      ></tr
    >
    <tr
      ><td><code>oxframe-cli</code></td><td
        >The <code>oxframe</code> command and the embedded editor build.</td
      ></tr
    >
    <tr
      ><td><code>oxframe-web</code></td><td
        >The editor UI, this site, the playground and the compile service.</td
      ></tr
    >
  </tbody>
</table>
