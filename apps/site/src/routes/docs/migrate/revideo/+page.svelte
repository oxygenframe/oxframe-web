<script lang="ts">
  import Port from '$lib/migrate/Port.svelte';
</script>

<h1>Migrating from Revideo</h1>
<p class="lead">
  Revideo is a fork of Motion Canvas built for rendering from code: scenes with variables, a render
  function and a player. Its scenes port to oxframe the same way as Motion Canvas scenes; this page
  covers what Revideo adds on top.
</p>

<h2>Scenes: the Motion Canvas guide applies</h2>
<p>
  A Revideo scene is a Motion Canvas generator with a name: <code
    >makeScene2D('card', function* …)</code
  >. Nodes, signals, <code>all</code>, <code>waitFor</code> and the rest map as in
  <a href="/docs/migrate/motion-canvas">Migrating from Motion Canvas</a>: <code>yield*</code>
  becomes
  <code>.await</code>, refs become the handles <code>view.add</code> returns, and the scene's name
  is the name of the <code>async fn</code>.
</p>

<h2>What Revideo adds, in oxframe</h2>
<table>
  <thead><tr><th>Revideo</th><th>oxframe</th></tr></thead>
  <tbody>
    <tr
      ><td><code>useScene().variables.get('name', 'Ada')</code></td><td
        >ordinary Rust: read the value from the environment or a file in the scene, or build the
        project in <code>main</code> from it</td
      ></tr
    >
    <tr
      ><td><code>renderVideo(&#123; projectFile, variables, settings &#125;)</code></td><td
        ><code>NAME=Grace oxframe render --out welcome.mp4</code>; a loop in a shell script or CI
        renders one video per input</td
      ></tr
    >
    <tr
      ><td>rendering in headless Chromium</td><td
        >no browser: oxframe draws frames itself, on the CPU by default or the GPU with <code
          >--gpu</code
        ></td
      ></tr
    >
    <tr
      ><td>parallel rendering in workers</td><td
        ><code>oxframe render --jobs 8</code>: 2-second segments in parallel, the same bytes as one
        job</td
      ></tr
    >
    <tr
      ><td><code>&lt;Audio&gt;</code>, <code>&lt;Video&gt;</code></td><td
        ><code>sound(…).play()</code>, <code>Audio::track(…)</code>, <code>Video</code> (feature
        <code>video</code>)</td
      ></tr
    >
    <tr
      ><td>the player for your own site</td><td
        ><a href="/docs/embed"><code>&lt;oxframe-player&gt;</code></a> from a script tag; no npm package
        yet</td
      ></tr
    >
  </tbody>
</table>

<h2>The same scene in both</h2>
<p>A welcome title with a name passed in from outside, rendered to a file.</p>
<Port tool="Revideo" theirs="revideo.tsx.txt" name="revideo" />
<ul>
  <li>
    The variable becomes <code>std::env::var("NAME")</code> with a default, so the scene still runs when
    nothing is passed — in the editor and in the playground too.
  </li>
  <li>
    <code>renderVideo</code> becomes the CLI:
    <code>NAME=Grace oxframe render --out welcome.mp4</code>.
  </li>
</ul>

<h2>Porting a project</h2>
<ol>
  <li>Port the scenes as in the <a href="/docs/migrate/motion-canvas">Motion Canvas guide</a>.</li>
  <li>
    Move each variable into Rust: the environment for one value, a JSON or CSV file for many (read
    it with <code>std::fs</code> and <code>serde</code>).
  </li>
  <li>
    Replace the render script with <code>oxframe render</code> in CI; it runs on any runner, no GPU needed.
  </li>
  <li>Run <code>oxframe check</code> for each input you render.</li>
</ol>
<p>
  With an agent: the
  <a href="/agents/skills/motion-canvas-to-oxframe">motion-canvas-to-oxframe skill</a> covers
  Revideo scenes as well; install it with <code>npx skills add oxygenframe/oxframe-sdk</code>.
</p>
