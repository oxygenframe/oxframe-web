<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>10. Randomness and background tasks</h1>
<p class="lead">
  Lots of things happening on their own, while the main story continues — and still the same video
  every time.
</p>

<LiveExample name="learn_10_random" open />

<h2>Random, but repeatable</h2>
<p>
  <code>random()</code> gives a number between 0 and 1, <code>random_range(a, b)</code> one between
  a and b. They look random, but they come from the project's <strong>seed</strong> (<code
    >Project::new(..).seed(7)</code
  >), so every run — in the editor, in the final render, on another computer — produces exactly the
  same confetti. Change the seed for a different, again repeatable, result.
</p>
<p>
  This is a rule worth knowing: oxframe renders the same frames every time. That is why scenes must
  not use the clock or other sources of real randomness.
</p>

<h2>Background tasks</h2>
<p>
  <code>{'spawn(async move { ... })'}</code> starts an animation that runs on its own, while the
  scene continues with the next line. Each confetti piece is spawned, falls, and removes itself.
  <code>spawn</code>
  returns a handle you can
  <code>.await</code> later to wait for the task — here the title waits for the confetti to finish.
</p>

<Try>
  <ul>
    <li>Change the seed.</li>
    <li>Make the pieces fall slower: change <code>2.0</code> to <code>4.0</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>
      <code>random()</code> and <code>random_range()</code> are seeded: same video every time.
    </li>
    <li><code>spawn</code> runs animations in the background.</li>
  </ul>
</Recap>

<h2>You made it</h2>
<p>
  That is the whole core of oxframe. From here, browse <a href="/docs/0.4.0/nodes">all nodes</a> and
  <a href="/docs/0.4.0/effects">effects</a>, open the
  <a href="/playground?v=0.4.0&ex=quicksort">quicksort showcase</a>
  to see everything working together, or read
  <a href="/docs/0.4.0/how-it-works">how oxframe works</a> inside.
</p>
