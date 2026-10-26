<script lang="ts">
  import Port from '$lib/migrate/Port.svelte';
</script>

<h1>Migrating from Remotion</h1>
<p class="lead">
  Remotion builds every frame from React components. oxframe runs each scene as a Rust
  <code>async fn</code> on a timeline. This page maps the concepts, ports one composition line by line,
  and lists what has no counterpart yet.
</p>

<h2>How the two models differ</h2>
<p>
  A Remotion component is a function of the frame number: <code>useCurrentFrame()</code> and
  <code>interpolate()</code> compute every value on every frame, and a <code>&lt;Sequence&gt;</code>
  shifts time for its children. An oxframe scene says what happens in order instead:
  <code>title.opacity().to(1.0, 0.5).await</code> animates for half a second, then the next line
  runs. Values are signals; <code>all((…))</code> runs animations together and <code>spawn</code> runs
  one alongside the rest.
</p>
<p>
  Seeking works the same way in both: oxframe replays the scene up to the frame you ask for, so
  every frame is deterministic and the editor scrubs freely. Rendering needs no browser. oxframe
  draws with its own renderer, on the CPU by default (any machine) or the GPU with <code>--gpu</code
  >, and encodes with ffmpeg.
</p>

<h2>Concepts side by side</h2>
<table>
  <thead><tr><th>Remotion</th><th>oxframe</th></tr></thead>
  <tbody>
    <tr
      ><td><code>&lt;Composition&gt;</code> with fps, size, duration</td><td
        ><code>Project::new("name").fps(30).size(1920, 1080).scene(main())</code>; the length is
        however long the scene runs</td
      ></tr
    >
    <tr
      ><td><code>useCurrentFrame()</code> + <code>interpolate()</code></td><td
        ><code>node.opacity().to(1.0, 0.5).await</code>, or a <code>Signal</code> animated with
        <code>.to()</code></td
      ></tr
    >
    <tr
      ><td><code>spring()</code></td><td
        >an ease: <code>.ease(presets::OUT_BACK)</code> overshoots,
        <code>oxframe::elastic_out</code>
        bounces</td
      ></tr
    >
    <tr
      ><td><code>&lt;Sequence from=&#123;30&#125;&gt;</code></td><td
        ><code>wait_for(1.0).await</code> (frames ÷ fps) before it, <code>spawn</code> to keep something
        else going, or a scene of its own</td
      ></tr
    >
    <tr
      ><td><code>&lt;Series&gt;</code>, <code>&lt;TransitionSeries&gt;</code></td><td
        >scenes in order; <code>transition(Transition::fade()).await</code> at the start of the next one</td
      ></tr
    >
    <tr
      ><td><code>&lt;AbsoluteFill&gt;</code>, flexbox styles</td><td
        >the <code>View</code>; <code>Layout::new().column().gap(Md)</code> for rows and columns;
        <code>to_edge</code>, <code>next_to</code></td
      ></tr
    >
    <tr
      ><td>CSS colors and type</td><td
        >the theme: <code>Accent</code>, <code>Surface</code>, <code>.h1()</code>,
        <code>.radius(Lg)</code></td
      ></tr
    >
    <tr
      ><td><code>&lt;Img&gt;</code>, <code>staticFile()</code></td><td
        ><code>Img::new().file("assets/a.png")</code>,
        <code>Svg::new().file("assets/logo.svg")</code></td
      ></tr
    >
    <tr
      ><td><code>&lt;OffthreadVideo&gt;</code>, <code>&lt;Audio&gt;</code></td><td
        ><code>Video</code> (feature <code>video</code>), <code>sound("hit.wav").play()</code>,
        <code>Audio::track("music.mp3")</code></td
      ></tr
    >
    <tr
      ><td><code>defaultProps</code>, input props</td><td
        >ordinary Rust values; read inputs from a file or the environment before building the
        project</td
      ></tr
    >
    <tr
      ><td><code>npx remotion render</code></td><td
        ><code>oxframe render</code>; <code>--jobs</code> renders 2-second segments in parallel</td
      ></tr
    >
    <tr><td>Remotion Lambda</td><td>a plain CI runner; rendering needs no GPU</td></tr>
  </tbody>
</table>

<h2>The same scene in both</h2>
<p>
  A title rises in with a spring, and one second later a line counts up to 100. In Remotion every
  value is computed from the frame; in oxframe the scene plays the same beats in order.
</p>
<Port tool="Remotion" theirs="remotion.tsx.txt" name="remotion" />
<ul>
  <li>
    <code>spring()</code> becomes an ease with overshoot. It is a curve, not a physics simulation, so
    its length is the one you give it.
  </li>
  <li>
    <code>&lt;Sequence from=&#123;30&#125;&gt;</code> at 30 fps is <code>wait_for(1.0)</code>. The
    title is still moving then, so its animation runs in <code>spawn</code>.
  </li>
  <li>
    The counter is a <code>Signal</code> animated with <code>.to()</code>; the text is bound to it
    and follows on every frame.
  </li>
  <li>
    The styles become theme roles: <code>.h1()</code> and <code>.body()</code> for the type, the theme's
    background and text colors for the rest.
  </li>
</ul>

<h2>What does not carry over</h2>
<ul>
  <li>
    <strong>HTML and CSS.</strong> oxframe does not render web pages, so DOM layouts, React
    component libraries and CSS effects have to be rebuilt with nodes, <code>Layout</code> and the
    theme. Inter and JetBrains Mono are built in; other fonts load with
    <code>oxframe::register_font(include_bytes!(…))</code> and <code>.family("Name")</code>.
  </li>
  <li>
    <strong>npm packages for visuals.</strong> There is no Lottie player. For 3D,
    <a href="/docs/0.23.10/3d">View3d</a> covers lit meshes and glTF models, not a full three.js scene.
  </li>
  <li>
    <strong>Embedding.</strong>
    <a href="/docs/0.23.10/embed"><code>&lt;oxframe-player&gt;</code></a> plays a scene on your own site;
    there is no npm or React package yet.
  </li>
</ul>

<h2>Porting a project</h2>
<ol>
  <li>List the compositions and the sequences inside each.</li>
  <li>
    Write one scene per composition, or per large sequence, and turn frame numbers into seconds
    (frames ÷ fps).
  </li>
  <li>
    Replace hand-built boxes with <a href="/docs/0.23.10/guide/components">components</a> where they
    fit:
    <code>TitleCard</code>, <code>BulletList</code>, <code>LowerThird</code>, <code>EndCard</code>.
  </li>
  <li>
    Run <code>oxframe check</code> until it passes, then compare stills with
    <code>oxframe snapshot --at &lt;seconds&gt;</code>.
  </li>
</ol>
<p>
  With an agent: <code>npx skills add oxygenframe/oxframe-sdk</code> installs the
  <a href="/agents/skills/remotion-to-oxframe">remotion-to-oxframe skill</a> next to the main one. Then
  ask it to port a composition, for example “Port src/Intro.tsx to an oxframe scene and make oxframe check
  pass”.
</p>
