<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Animated charts and plots</h1>
<p class="lead">
  Axes, number lines, function plots and bars. Data coordinates map into a box, and every part
  follows when a range animates.
</p>

<LiveExample name="charts" />

<h2>Axes</h2>
<p>
  <code>Axes::new()</code> is a plotting box with a grid, two axes with arrows, ticks and labels.
  <code>.x_range(-5.0..5.0)</code> and <code>.y_range(-2.0..2.0)</code> set the data ranges;
  <code>.width()</code> and <code>.height()</code> set the box in pixels or <code>pct()</code> of
  the frame (80 % by 60 % by default); <code>.no_grid()</code> drops the grid. The axes cross at 0 when
  0 is in range. Lines and labels take their colors from the theme.
</p>
<pre><code
    >{`let axes = view.add(Axes::new().x_range(-5.0..5.0).y_range(-2.0..2.0));
axes.x_range().to(-10.0..10.0, 1.0).await;`}</code
  ></pre>
<p>
  <code>axes.x_range()</code> is a signal of <code>Interval</code>, so
  <code>axes.x_range().to(-10.0..10.0, 1.0)</code> zooms out. Ticks sit on round steps (1, 2 or 5 times
  a power of ten), and each label keeps its value while the range slides, so nothing flickers.
</p>

<h2>Function plots</h2>
<p>
  <code>axes.plot(|x| x.sin())</code> draws a function and returns a <code>Plot</code>. It is
  sampled again every frame, finer where it bends, so it follows the ranges. It breaks where it
  jumps — <code>tan</code> has no vertical line across its gaps — and it is cut at the edge of the
  box. <code>.stroke(Accent)</code> and <code>.width(4.0)</code> style it, <code>.draw_on()</code>
  draws it like any path, and <code>plot.to_fn(|x| x.cos(), 1.0)</code> morphs it: every x moves from
  the old value to the new one.
</p>
<!-- snippet-after: 0 -->
<pre><code
    >{`let wave = axes.plot(|x| x.sin()).stroke(Accent);
wave.draw_on().await;
let x = Signal::new(-5.0);
axes.point_on(&wave, x.clone());
x.to(5.0, 2.0).await;
wave.to_fn(|x| (2.0 * x).sin(), 1.0).await;`}</code
  ></pre>
<p>
  <code>axes.point_on(&plot, x)</code> keeps a dot on the curve at a signal <code>x</code>.
  <code>axes.c2p(x, y)</code> gives the scene point of a data point, and
  <code>axes.place(node, x, y)</code> keeps any node there while the ranges move.
</p>

<h2>Bars and data</h2>
<p>
  <code>axes.bars([3.0, 7.5])</code> draws a bar per value at x = 0, 1, 2… with the value above it;
  set the x range to <code>-0.5..n - 0.5</code>. With bars the y axis sits at the left edge.
  <code>bars.value(0).to(9.0, 1.0)</code> grows one bar and its label, and
  <code>.labels(["a", "b"])</code> names the bars. <code>axes.line_series(..)</code> draws a line
  through data points and <code>axes.scatter(..)</code> a dot per point.
</p>
<!-- snippet-setup: let axes = view.add(Axes::new().x_range(-0.5..2.5).y_range(0.0..8.0)); -->
<pre><code
    >{`let bars = axes.bars([0.0, 0.0, 0.0]).labels(["rustc", "gcc", "clang"]);
stagger(0.15, [3.2, 7.5, 5.1].into_iter().enumerate(), |(i, v)| bars.value(i).to(v, 1.0)).await;`}</code
  ></pre>

<h2>Number lines</h2>
<p>
  <code>NumberLine::new(0.0..10.0)</code> is a single axis with ticks, labels and an arrow. It has
  the same methods as the axes: <code>x_range</code>, <code>c2p</code> and <code>place</code>.
</p>
<p>
  There is no pie-chart component yet; draw each slice with
  <code>Circle::new().pie(true).start_angle(a).end_angle(b)</code>. Long rows of a
  <code>BulletList</code> now wrap inside the frame, so a list of results next to a chart stays readable.
</p>
