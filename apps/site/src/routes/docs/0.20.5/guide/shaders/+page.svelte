<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>13. Shaders and effects</h1>
<p class="lead">
  Water, a wet lens, rings and a rising sea: presets that paint pixels, animated like any other
  property.
</p>

<LiveExample name="learn_13_shaders" open />

<h2>A shader is a node</h2>
<p>
  <code>shaders::waves()</code> paints water inside its box. Place it like a rectangle, with
  <code>.width(pct(100))</code>, <code>.height(..)</code> and <code>.to_edge(Edge::Bottom)</code>.
  <code>.amp()</code> is the wave height, and it is a signal: <code>water.amp().to(0.12, 1.0)</code>
  makes the sea grow. <code>.deep(Accent)</code> takes its color from the theme.
</p>

<h2>Shaders that read the picture</h2>
<p>
  <code>shaders::lens_drops()</code> puts drops on the lens over everything drawn before it, so add
  it last and make it <code>.fullscreen()</code>. Start dry with <code>.wetness(0.0)</code>; a
  splash is <code>lens.wetness().to(1.0, 0.5)</code>.
</p>
<p>
  <code>node.effect(shaders::ripple())</code> changes one node's own pixels: rings spread from its
  center. It returns a handle whose <code>.strength()</code> you animate. The colors move and the outline
  stays, so use it on water, text or an image.
</p>
<p>
  <code>Transition::shader(shaders::water_wipe())</code> is a transition from lesson 11 painted by a shader:
  water rises over the frame and the next scene is under it.
</p>

<h2>Make events signals</h2>
<p>
  A splash at two seconds is a signal change at that moment, not a formula of time. That way the
  editor shows it on the timeline and <code>oxframe check</code> sees it. A shader can only read
  finished pixels: inside a fading group or a blur, <code>check</code> reports
  <code>input_cycle</code>.
  <a href="/docs/0.20.5/rendering#shaders-that-read-pixels">Rendering video</a>
  has the details.
</p>

<Try>
  <ul>
    <li>A light drizzle: <code>.wetness(0.3)</code>.</li>
    <li>Taller waves on the line: <code>water_wipe().wave(0.1)</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>Presets live in <code>shaders::</code>; their parameters are signals.</li>
    <li><code>lens_drops</code> goes last; <code>effect</code> changes one node.</li>
    <li>Make events signal changes, so the timeline and check see them.</li>
  </ul>
</Recap>

<h2>Next</h2>
<p>
  <a href="/docs/0.20.5/guide/charts">Lesson 14</a> plots functions and data on axes that follow animated
  ranges.
</p>
