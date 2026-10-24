<script lang="ts">
  import Port from '$lib/migrate/Port.svelte';
</script>

<h1>Migrating from Manim</h1>
<p class="lead">
  Manim scenes are Python classes that play animations one <code>self.play</code> at a time. oxframe
  scenes are Rust <code>async fn</code>s that do the same with <code>.await</code>, with a live
  editor, plots, matrices and morphing built in. This page maps the concepts and ports two scenes.
</p>

<h2>How the two models differ</h2>
<p>
  In Manim, <code>construct</code> builds mobjects and hands animations to
  <code>self.play</code>, which renders them before the next line runs. In oxframe each node has
  signals — position, color, the path itself — and <code>.to(target, seconds).await</code> animates
  one and waits. <code>all((…))</code> is <code>self.play</code> with several animations;
  <code>wait_for</code> is <code>self.wait</code>.
</p>
<p>
  Instead of rendering a file and opening it, <code>oxframe dev</code> shows the scene in an editor
  you can scrub, and every frame can be reached instantly. The same code runs in the
  <a href="/playground">browser playground</a>, with no Cairo, LaTeX or Python to install.
</p>
<p>
  Two habits to drop: Manim measures in units (the frame is about 14.2 wide) with y pointing up;
  oxframe measures in pixels from the center of the frame, with y pointing down. At 1920 × 1080 one
  Manim unit is about 135 px, and <code>UP</code> is negative y.
</p>

<h2>Concepts side by side</h2>
<table>
  <thead><tr><th>Manim</th><th>oxframe</th></tr></thead>
  <tbody>
    <tr
      ><td><code>class S(Scene): def construct(self)</code></td><td
        ><code>#[oxframe::scene] async fn s(view: View)</code></td
      ></tr
    >
    <tr><td><code>self.add(m)</code></td><td><code>view.add(…)</code></td></tr>
    <tr><td><code>self.play(Create(m))</code></td><td><code>m.draw_on().await</code></td></tr>
    <tr
      ><td><code>FadeIn</code>, <code>FadeOut</code></td><td
        ><code>m.fade_in().await</code>, <code>m.fade_out().await</code></td
      ></tr
    >
    <tr
      ><td><code>Write(text)</code></td><td
        ><code>text.end().to(1.0, 1.0).await</code> reveals it letter by letter</td
      ></tr
    >
    <tr
      ><td><code>Transform(a, b)</code></td><td
        ><code>a.data().to(path, 1.0)</code> for shapes, <code>t.morph_to("new", 1.0)</code> for text</td
      ></tr
    >
    <tr
      ><td><code>m.animate.shift(RIGHT * 2)</code></td><td
        ><code>m.x().to(m.x().get() + 270.0, 1.0).await</code></td
      ></tr
    >
    <tr><td><code>self.play(a, b)</code></td><td><code>all((a, b)).await</code></td></tr>
    <tr
      ><td><code>LaggedStart(…, lag_ratio=0.1)</code></td><td
        ><code>stagger(0.1, &amp;items, |m| m.fade_in()).await</code></td
      ></tr
    >
    <tr
      ><td><code>run_time=2</code>, <code>rate_func=smooth</code></td><td
        >the seconds argument, <code>.ease(presets::IN_OUT_CUBIC)</code></td
      ></tr
    >
    <tr
      ><td><code>ValueTracker</code>, <code>always_redraw</code>, updaters</td><td
        ><code>Signal::new(…)</code>, <code>.bind(move || …)</code></td
      ></tr
    >
    <tr
      ><td><code>Axes</code>, <code>axes.plot</code>, <code>NumberLine</code></td><td
        ><code>Axes::new()</code>, <code>axes.plot(|x| …)</code>, <code>NumberLine::new(…)</code> —
        <a href="/docs/0.22.0/charts">charts</a></td
      ></tr
    >
    <tr
      ><td><code>Matrix</code>, <code>Table</code>, <code>Vector</code></td><td
        ><code>Matrix::new</code>, <code>Table::new</code>, <code>axes.vector</code> —
        <a href="/docs/0.22.0/matrices">matrices</a></td
      ></tr
    >
    <tr
      ><td><code>MovingCameraScene</code></td><td
        ><a href="/docs/0.22.0/camera">Camera</a>: <code>zoom</code>, <code>center_on</code>,
        <code>fit</code></td
      ></tr
    >
    <tr
      ><td><code>ThreeDScene</code></td><td
        ><a href="/docs/0.22.0/3d">View3d</a>: lit meshes and glTF models inside a 2D scene</td
      ></tr
    >
    <tr><td><code>MathTex</code>, <code>Tex</code></td><td>not yet — formulas are planned</td></tr>
    <tr
      ><td><code>manim -pql scene.py S</code></td><td
        ><code>oxframe dev</code> to watch, <code>oxframe render</code> for the file</td
      ></tr
    >
  </tbody>
</table>

<h2>The same scenes in both</h2>
<p>
  A circle is drawn, becomes a square and moves right; then a sine wave is drawn on axes and a dot
  rides along it.
</p>
<Port tool="Manim" theirs="manim.py.txt" name="manim" />
<ul>
  <li>
    <code>Transform</code> is a path morph: the shape's <code>data</code> signal animates to another path.
    Any two paths morph, with matched start points so they do not twist.
  </li>
  <li>
    The <code>ValueTracker</code> becomes a <code>Signal</code>, and <code>axes.point_on</code> adds
    a dot that follows it — what <code>always_redraw</code> does in Manim.
  </li>
  <li>
    Two Manim scene classes become two scenes of one project; they play in order and a
    <a href="/docs/0.22.0/guide/scenes">transition</a> can join them.
  </li>
</ul>

<h2>What does not carry over</h2>
<ul>
  <li>
    <strong>LaTeX.</strong> There is no <code>MathTex</code> yet. Formulas are planned; until then, write
    them with rich text and Unicode, or as an SVG made elsewhere.
  </li>
  <li>
    <strong>Surfaces and 3D plots.</strong> 3D covers meshes (cube, sphere, plane, cylinder, glTF) inside
    a 2D frame, not parametric surfaces or 3D axes.
  </li>
  <li>
    <strong>Python.</strong> The scenes are Rust. They are short and mostly calls like the ones
    above; an agent with the oxframe skill writes them well, and <code>oxframe check</code> tells it what
    went wrong.
  </li>
</ul>

<h2>Porting a project</h2>
<ol>
  <li>One oxframe scene per Manim scene class, in the same order.</li>
  <li>
    Turn units into pixels (× 135 at 1920 × 1080) and flip y. Prefer placing with
    <code>next_to</code>, <code>to_edge</code> and <code>Layout</code> over coordinates.
  </li>
  <li>
    Each <code>self.play(…)</code> becomes one <code>.await</code>, or <code>all((…)).await</code> for
    several animations.
  </li>
  <li>Run <code>oxframe dev</code> to compare, then <code>oxframe check</code>.</li>
</ol>
<p>
  With an agent: <code>npx skills add oxygenframe/oxframe-sdk</code> installs the
  <a href="/agents/skills/manim-to-oxframe">manim-to-oxframe skill</a>. Then ask, for example, “Port
  scenes.py to oxframe, one scene per class, and make oxframe check pass”.
</p>
