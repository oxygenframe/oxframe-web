<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<svelte:head><title>6. Groups and layout — oxframe</title></svelte:head>

<h1>6. Groups and layout</h1>
<p class="lead">Put shapes inside other shapes, and let a layout arrange them for you.</p>

<LiveExample name="learn_06_groups" open />

<h2>Children</h2>
<p>
  So far everything was added to the <code>view</code>. You can also add shapes to other shapes:
  <code>sun.add(...)</code>. A child's position is measured from its parent, and it moves, rotates
  and fades along with it. Rotate the sun, and the planet orbits; rotate the planet, and its moon
  orbits the planet.
</p>
<p><code>Group</code> is a shape that draws nothing — a container for others.</p>

<h2>Layout</h2>
<p>
  Placing ten cards by hand is tedious. A <code>Layout</code> places its children in a row (or
  <code>.column()</code>), with <code>.gap()</code> between them and <code>.padding()</code> around.
  It works like flexbox on the web: children can <code>.grow(1.0)</code> to fill space, the row can
  <code>.wrap(true)</code>, and
  <code>.grid(3)</code> makes a three-column grid.
</p>
<p>
  Layout settings are animatable like everything else. Animate the gap and the cards slide apart;
  remove a card and the others close the gap.
</p>

<Try>
  <ul>
    <li>Add <code>.width(500.0)</code> to the row and <code>.grow(1.0)</code> to one card.</li>
    <li>Add a second moon to the planet.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li><code>parent.add(child)</code> — children follow their parent.</li>
    <li><code>Layout</code> arranges children: row, column, wrap, grid, grow.</li>
  </ul>
</Recap>
