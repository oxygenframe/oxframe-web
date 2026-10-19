<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<svelte:head><title>3. Shapes, colors, transforms — oxframe</title></svelte:head>

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
<p>Every shape and all its settings are listed in <a href="/docs/nodes">All nodes</a>.</p>
