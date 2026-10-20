<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="A Manim alternative in Rust — oxframe"
  description="oxframe is a Rust engine for code-based explainers: a live timeline, deterministic frames, and checks an agent can read. Manim stays the Python choice for lectures."
/>

<h1>A Manim alternative in Rust</h1>
<p>
  Manim is how a lot of math lectures get made in Python. oxframe is for the same kind of
  step-by-step picture when the source of truth is Rust and an agent has to see what it drew. A
  function plot in the gallery is the closest example. Use Manim when the surrounding Python tools
  are the reason you are there. See the <a href="/compare">comparison</a>.
</p>
<p><a class="btn" href="/playground?ex=chart">Open the chart example</a></p>
