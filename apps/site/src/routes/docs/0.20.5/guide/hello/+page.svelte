<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>1. Your first animation</h1>
<p class="lead">
  You will add a circle to the screen and move it. That is most of what animation code ever does.
</p>

<LiveExample name="learn_01_hello" open />

<h2>A scene is a function</h2>
<p>
  An animation in oxframe is called a <strong>scene</strong>, and a scene is just a function marked
  with
  <code>#[oxframe::scene]</code>. It receives the <code>view</code> — the canvas you draw on.
</p>
<p>
  The word <code>async</code> is there because the function runs <em>over time</em>: it can stop,
  let a few frames pass, and continue. You do not need to know more about <code>async</code> than that.
</p>

<h2>Adding a shape</h2>
<pre><code>let ball = view.add(Circle::new().size(160.0).x(-400.0).fill(color!("#68abdf")));</code
  ></pre>
<p>
  <code>Circle::new()</code> starts describing a circle; each <code>.something(...)</code> sets how
  it looks at the start — 160 pixels wide, 400 pixels left of the center, light blue.
  <code>view.add(...)</code>
  puts it on screen and gives you back <code>ball</code>, a handle you use to animate it later.
</p>
<p>The center of the screen is (0, 0). Positive x goes right, positive y goes <em>down</em>.</p>

<h2>Animating it</h2>
<pre><code>ball.x().to(400.0, 1.0).await;</code></pre>
<p>
  Read it as: <em>take the ball's x, move it to 400 over 1 second, and wait until that is done.</em>
</p>
<ul>
  <li>
    <code>ball.x()</code> is the ball's horizontal position. Without an argument it gives you the property;
    with one (like in the builder) it sets the starting value.
  </li>
  <li>
    <code>.to(400.0, 1.0)</code> creates the animation: target value, then duration in seconds.
  </li>
  <li>
    <code>.await</code> plays it and waits. The next line only runs once the ball has arrived.
  </li>
</ul>
<p>
  So the scene plays its lines from top to bottom, and every <code>.await</code> takes time. That is the
  whole model.
</p>

<Try>
  <ul>
    <li>
      Open this lesson in the playground (link under the preview) and change <code>1.0</code> to
      <code>3.0</code>.
    </li>
    <li>Add <code>ball.fill().to(color!("#e13238"), 1.0).await;</code> before the last line.</li>
    <li>
      What happens if you remove the <code>.await</code> at the end of a line? (The compiler will tell
      you.)
    </li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>A scene is an <code>async fn</code> with <code>#[oxframe::scene]</code>.</li>
    <li><code>view.add(Shape::new()...)</code> adds a shape and returns a handle.</li>
    <li><code>handle.property().to(value, seconds).await</code> animates and waits.</li>
  </ul>
</Recap>
