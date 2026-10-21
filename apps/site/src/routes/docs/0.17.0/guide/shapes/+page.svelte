<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>3. Shapes, colors, transforms</h1>
<p class="lead">
  More shapes, outlines, and the properties every shape shares: rotation, scale, color.
</p>

<LiveExample name="learn_03_shapes" open />

<h2>The shapes</h2>
<p>
  <code>Rect</code>, <code>Circle</code>, <code>Polygon</code>, <code>Star</code> and
  <code>Line</code>
  are all made the same way: <code>Shape::new()</code>, then settings. <code>Rect</code> has
  <code>.radius()</code>
  for rounded corners,
  <code>Polygon</code> has <code>.sides()</code>, <code>Line</code> takes a list of points and can have
  arrows.
</p>

<h2>One name, two uses</h2>
<p>This is the pattern you will use everywhere, so it is worth a second look:</p>
<ul>
  <li>Before adding: <code>.size(140.0)</code> <em>sets</em> the starting size.</li>
  <li>
    After adding: <code>.size()</code> <em>gives you</em> the size, ready to animate with
    <code>.to(...)</code>.
  </li>
</ul>

<h2>Things every shape has</h2>
<ul>
  <li>
    <code>x</code>, <code>y</code> — position; <code>rotation</code> — degrees, clockwise;
    <code>scale</code>
    — a pair, so you can stretch (<code>Vec2::new(1.4, 0.7)</code>).
  </li>
  <li>
    <code>fill</code> — the inside color; <code>stroke</code> and <code>line_width</code> — the outline.
  </li>
  <li><code>opacity</code> — 0 is invisible, 1 is solid.</li>
</ul>
<p>
  Colors are written <code>color!("#e13238")</code> (checked when you compile — a typo is an error, not
  a surprise). When a color animates, it blends through perceptually even shades instead of going muddy
  in the middle.
</p>

<Try>
  <ul>
    <li>Give the hexagon an outline: <code>.stroke(Color::WHITE).line_width(8.0)</code>.</li>
    <li>Animate <code>star.points()</code> from 5 to 9.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>
      All shapes are built the same way and share position, rotation, scale, fill, stroke, opacity.
    </li>
    <li><code>.name(value)</code> sets before adding; <code>.name()</code> animates after.</li>
  </ul>
</Recap>
<h2>Themes</h2>
<p>
  A scene with no colors and no font sizes of its own already looks finished. Nodes take those from
  the project theme: <code>.fill(Accent)</code>, <code>.padding(Md)</code>,
  <code>.radius(Lg)</code>,
  <code>Txt::new().display()</code>. Text with no fill uses the theme's text color.
</p>
<pre><code
    >{`Project::new("explainer").theme(Theme::dark().accent(color!("#68abdf")))

let title = view.add(Txt::new().text("Binary search").display());
let note = view.add(Txt::new().text("O(log n)").caption().fill(Muted));
title.fade_in().await;`}</code
  ></pre>
<p>
  Built-in themes: <code>dark</code> (the default), <code>light</code>, <code>midnight</code>,
  <code>paper</code> and <code>vivid</code>. <code>.accent(color)</code> rebuilds the palette from
  one brand color and keeps text at a 4.5:1 contrast. The same override can live in
  <code>oxframe.toml</code> without a recompile:
</p>
<pre><code
    >{`[theme]
name = "midnight"
accent = "#68abdf"`}</code
  ></pre>
<p>
  <code>fade_in()</code> and a duration of <code>Fast</code>, <code>Normal</code> or
  <code>Slow</code>
  use the theme's motion. One <code>.theme(...)</code> line changes every token in the video.
</p>

<h2>Relative position and frame shape</h2>
<p>
  Place a node against another node or the safe area instead of counting pixels. The position is
  worked out again every frame, so it follows a neighbor that moves or changes size. <code
    >pct(80)</code
  > is 80% of the frame width.
</p>
<pre><code
    >{`let title = view.add(Txt::new().text("Binary search").h1().to_edge(Edge::Top));
let card = view.add(Rect::new().width(pct(80)).height(300.0).fill(Surface));
let label = view.add(Txt::new().text("mid").caption().next_to(card, Side::Bottom));`}</code
  ></pre>
<p>
  <code>align_to(other, Edge::Top)</code> shares an edge.
  <code>center_in(other)</code> shares a center.
  <code>to_edge</code> stops at the safe area: a portrait frame leaves room for a vertical video's
  status bar and buttons. <code>view.is_portrait()</code> and
  <code>view.safe_area()</code> are there when a layout really does have to branch.
</p>
<p>
  Declare every shape the video should exist in. <code>oxframe check</code> looks at each of them,
  and <code>oxframe render --aspect 9:16</code> (or
  <code>--aspect all</code>) exports them.
</p>
<pre><code
    >Project::new("explainer").aspects([Aspect::Landscape, Aspect::Portrait, Aspect::Square])</code
  ></pre>

<p>Every shape and all its settings are listed in <a href="/docs/0.17.0/nodes">All nodes</a>.</p>
