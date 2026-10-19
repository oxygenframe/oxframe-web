<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<svelte:head><title>2. In order, or all at once — oxframe</title></svelte:head>

<h1>2. In order, or all at once</h1>
<p class="lead">
  In lesson 1 things happened one after another. Now you will make several things move at the same
  time.
</p>

<LiveExample name="learn_02_together" open />

<h2>One after another</h2>
<p>
  Two lines, each ending in <code>.await</code>: the second one starts when the first is finished.
</p>
<pre><code
    >{`a.x().to(500.0, 0.8).await;
b.x().to(500.0, 0.8).await;`}</code
  ></pre>

<h2>At the same time: <code>all</code></h2>
<p>
  To play animations together, put them in <code>all((...))</code> — note the double parentheses, it
  takes a group of animations — and await that once. It finishes when the <em>longest</em> one does.
</p>
<pre><code>all((c.x().to(500.0, 0.8), d.x().to(500.0, 1.6))).await;</code></pre>

<h2>Pauses and waves</h2>
<p>
  <code>wait_for(0.3).await</code> simply waits. <code>sequence(0.1, ...)</code> starts a list of animations
  0.1 s apart, which gives that nice ripple at the end of the preview.
</p>
<p>
  The list is built with a small helper syntax — <code>Box::pin(...)</code> — because Rust needs animations
  of different kinds in one list. Copy the pattern from the example; you will rarely need more.
</p>

<Try>
  <ul>
    <li>Wrap the two red squares in <code>all((...))</code> so they move together.</li>
    <li>Change the delay in <code>sequence</code> to <code>0.3</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>Lines with <code>.await</code> run in order.</li>
    <li><code>all((a, b, c)).await</code> runs them together and waits for all.</li>
    <li><code>wait_for(seconds)</code> pauses; <code>sequence(delay, list)</code> staggers.</li>
  </ul>
</Recap>
