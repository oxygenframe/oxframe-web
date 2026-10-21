<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>14. Charts and graphs</h1>
<p class="lead">
  A function on a set of axes, a dot that rides it, and a zoom that the whole chart follows.
</p>

<LiveExample name="learn_14_charts" open />

<h2>Axes map data into a box</h2>
<p>
  <code>Axes::new().x_range(-4.0..4.0).y_range(-1.5..1.5)</code> puts data coordinates into a box with
  a grid, ticks and labels. You think in data — x from -4 to 4 — and oxframe finds the pixels.
</p>

<h2>A plot is a function of x</h2>
<p>
  <code>axes.plot(|x| (x * 1.5).sin())</code> draws the curve. It is a path, so
  <code>.draw_on()</code> works as in lesson 9. <code>axes.point_on(&curve, x)</code> keeps a dot on
  it; move the signal <code>x</code> and the dot rides the curve.
</p>

<h2>Everything follows the ranges</h2>
<p>
  <code>curve.to_fn(..)</code> morphs into another function, and
  <code>axes.x_range().to(-8.0..8.0, 1.0)</code> zooms out: the grid, the labels, the curve and the dot
  move together, because they are drawn from the range every frame.
</p>

<Try>
  <ul>
    <li>Plot <code>|x| x.tan()</code> and look at the gaps.</li>
    <li>Add bars: <code>axes.bars([1.0, 0.5]).labels(["a", "b"])</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li><code>Axes</code> maps data into a box; ranges are signals.</li>
    <li>
      <code>plot</code>, <code>point_on</code> and <code>to_fn</code> draw and move functions.
    </li>
    <li>
      <a href="/docs/charts">Animated charts and plots</a> has bars, data series and number lines.
    </li>
  </ul>
</Recap>

<h2>You made it</h2>
<p>
  That is the whole core of oxframe. From here, browse <a href="/docs/nodes">all nodes</a> and
  <a href="/docs/effects">effects</a>, open the
  <a href="/playground?ex=ocean">ocean scene</a> to see everything working together, or read
  <a href="/docs/how-it-works">how oxframe works</a> inside.
</p>
