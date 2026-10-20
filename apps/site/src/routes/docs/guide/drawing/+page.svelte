<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>9. Drawing and morphing</h1>
<p class="lead">Draw an outline as if with a pen, then turn one shape into another.</p>

<LiveExample name="learn_09_drawing" open />

<h2>Drawing an outline on</h2>
<p>
  Every outline has two properties, <code>start</code> and <code>end</code>, that say which part of
  it is drawn — as a fraction of its length. <code>.end(0.0)</code> hides it; animating
  <code>end</code>
  to 1 draws it on. Animating
  <code>start</code> to 1 afterwards erases it from the beginning.
</p>

<h2>Paths and morphing</h2>
<p>
  A <code>Path</code> is any shape you can describe with lines and curves — usually written in SVG
  path syntax (<code>"M0 -150 L44 -46 ..."</code>), which every vector tool can export. Animating
  <code>data</code> to another path morphs between them. oxframe lines up the two outlines first, so a
  star turns into a heart without twisting.
</p>
<pre><code>shape.data().to(heart, 1.2).await;</code></pre>

<Try>
  <ul>
    <li>Morph back to the star at the end.</li>
    <li>Animate <code>start</code> to 1 to erase the outline.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li><code>start</code>/<code>end</code> control how much of an outline is drawn.</li>
    <li><code>Path</code> + <code>data().to(other_path)</code> morphs shapes.</li>
  </ul>
</Recap>
