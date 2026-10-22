<script lang="ts">
  import Port from '$lib/migrate/Port.svelte';
</script>

<h1>Migrating from Motion Canvas</h1>
<p class="lead">
  Motion Canvas is the closest tool to oxframe: scenes are coroutines over signals in both. Porting
  is mostly syntax — <code>yield*</code> becomes <code>.await</code>, refs become handles — and this
  page maps the rest.
</p>

<h2>How the two models differ</h2>
<p>
  A Motion Canvas scene is a TypeScript generator: <code>yield* circle().x(300, 1)</code> tweens a
  signal and waits for it. An oxframe scene is a Rust <code>async fn</code>:
  <code>circle.x().to(300.0, 1.0).await</code> does the same. Both replay a scene from the start to reach
  any frame, both keep markers and timing edits in a meta file next to the scene, and both have an editor
  with a timeline.
</p>
<p>
  The difference is around the scene. oxframe is a compiled Rust program: <code>oxframe render</code
  >
  writes the video headless, with no editor open, so it runs in CI, and <code>oxframe check</code>
  reviews every frame for text off screen, overlaps, low contrast and text that is gone too fast.
</p>

<h2>Concepts side by side</h2>
<table>
  <thead><tr><th>Motion Canvas</th><th>oxframe</th></tr></thead>
  <tbody>
    <tr
      ><td><code>makeScene2D(function* (view) &#123; … &#125;)</code></td><td
        ><code>#[oxframe::scene] async fn name(view: View) &#123; … &#125;</code></td
      ></tr
    >
    <tr
      ><td><code>yield* node().x(300, 1)</code></td><td
        ><code>node.x().to(300.0, 1.0).await</code></td
      ></tr
    >
    <tr
      ><td><code>createRef&lt;Circle&gt;()</code> and <code>ref=&#123;…&#125;</code></td><td
        >the handle that <code>view.add(…)</code> returns</td
      ></tr
    >
    <tr
      ><td><code>createSignal(0)</code>, <code>() =&gt; …</code></td><td
        ><code>Signal::new(0.0)</code>, <code>.bind(move || …)</code></td
      ></tr
    >
    <tr
      ><td><code>all(…)</code>, <code>chain(…)</code></td><td
        ><code>all((…)).await</code>; awaits one after another</td
      ></tr
    >
    <tr
      ><td><code>sequence(0.1, …)</code>, <code>loop(3, …)</code></td><td
        ><code>stagger(0.1, &amp;items, …)</code>, <code>repeat(3, …)</code></td
      ></tr
    >
    <tr
      ><td><code>yield</code> a task without <code>*</code></td><td
        ><code>spawn(async move &#123; … &#125;)</code></td
      ></tr
    >
    <tr
      ><td><code>waitFor(1)</code>, <code>waitUntil('event')</code></td><td
        ><code>wait_for(1.0)</code>, <code>wait_until("event")</code></td
      ></tr
    >
    <tr
      ><td><code>easeInOutCubic</code>, <code>easeOutBack</code></td><td
        ><code>presets::IN_OUT_CUBIC</code>, <code>presets::OUT_BACK</code></td
      ></tr
    >
    <tr
      ><td><code>&lt;Layout direction="column" gap=&#123;20&#125;&gt;</code></td><td
        ><code>Layout::new().column().gap(20.0)</code></td
      ></tr
    >
    <tr
      ><td><code>&lt;Code&gt;</code> with <code>edit</code> and <code>selection</code></td><td
        ><code>Code</code> with <code>.code().to(next, s)</code>, <code>insert</code>,
        <code>replace</code>, <code>focus_lines</code></td
      ></tr
    >
    <tr
      ><td><code>&lt;Line&gt;</code>, <code>&lt;Spline&gt;</code>, <code>&lt;Ray&gt;</code></td><td
        ><code>Line</code> (<code>.smooth(true)</code>, <code>.end_arrow(true)</code>),
        <code>Path</code></td
      ></tr
    >
    <tr
      ><td><code>&lt;Img&gt;</code>, <code>&lt;Video&gt;</code>, the project's audio</td><td
        ><code>Img</code>, <code>Video</code> (feature <code>video</code>),
        <code>Audio::track(…)</code></td
      ></tr
    >
    <tr
      ><td><code>slideTransition(Direction.Left)</code></td><td
        ><code>transition(Transition::slide(Dir::Left)).await</code></td
      ></tr
    >
    <tr
      ><td><code>beginSlide('name')</code> and the presenter</td><td
        ><code>slide_break().await</code> and <code>oxframe present</code></td
      ></tr
    >
    <tr
      ><td><code>makeProject(&#123;scenes: […]&#125;)</code></td><td
        ><code>Project::new("name").scene(a()).scene(b())</code></td
      ></tr
    >
    <tr><td>rendering from the editor</td><td><code>oxframe render</code>, headless</td></tr>
  </tbody>
</table>

<h2>The same scene in both</h2>
<p>A circle moves, turns blue while it grows, and a number below counts to 100.</p>
<Port tool="Motion Canvas" theirs="motion-canvas.tsx.txt" name="motion-canvas" />
<ul>
  <li>
    The refs disappear: <code>view.add</code> returns a handle, and handles are <code>Copy</code>,
    so they can go into closures and background tasks.
  </li>
  <li>
    The computed text <code>() =&gt; count().toFixed(0)</code> becomes a binding; it is recomputed when
    the signal changes.
  </li>
  <li>
    <code>scale(1.5, 1)</code> sets both axes from one number; in oxframe the target is a
    <code>Vec2</code>.
  </li>
</ul>

<h2>What does not carry over</h2>
<ul>
  <li>
    <strong>LaTeX.</strong> There is no <code>&lt;Latex&gt;</code> node yet; formulas are planned.
  </li>
  <li>
    <strong>Custom TSX components.</strong> A component made of other nodes becomes a Rust function
    that adds them to a <code>Group</code>; a node that draws itself uses the
    <a href="/docs/custom-nodes">node API</a>.
  </li>
  <li>
    <strong>Plugins for the editor.</strong> oxframe's editor is not extensible yet.
  </li>
</ul>

<h2>Porting a project</h2>
<ol>
  <li>Port the scenes one by one and keep their names: markers move with the same names.</li>
  <li>
    Replace <code>yield*</code> with <code>.await</code>, refs with handles, signals with
    <code>Signal</code>; keep the durations, they are seconds in both.
  </li>
  <li>
    Run <code>oxframe dev</code> to scrub the result and drag the markers back into place, then
    <code>oxframe check</code>.
  </li>
</ol>
<p>
  With an agent: <code>npx skills add oxygenframe/oxframe-sdk</code> installs the
  <a href="/agents/skills/motion-canvas-to-oxframe">motion-canvas-to-oxframe skill</a>. Then ask,
  for example, “Port src/scenes/intro.tsx to oxframe and make oxframe check pass”.
</p>
