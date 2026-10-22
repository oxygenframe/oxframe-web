<script lang="ts">
  // The hub of the comparison pages: one line per /vs/* page, and the lists.
  import Seo from '$lib/components/Seo.svelte';
  import { vsPages } from '$lib/vs';
</script>

<Seo
  title="oxframe alternatives and comparisons — oxframe"
  description="oxframe compared with Remotion, HyperFrames, fframes, Manim, Motion Canvas, Revideo and cloud video APIs: when to pick each, with dated facts and render times."
/>

<h1>oxframe and the alternatives</h1>
<p class="lead">
  Each page puts oxframe next to one other tool: when to pick which, a table checked against the
  other tool’s own pages, the same scene in both and how long each takes to render.
</p>

<h2>Comparisons</h2>
<ul class="list">
  {#each vsPages as p (p.slug)}
    <li>
      <a href="/vs/{p.slug}">oxframe vs {p.name}</a>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text from src/lib/vs.ts -->
      <p>{@html p.lead}</p>
    </li>
  {/each}
</ul>

<h2>Lists</h2>
<ul class="list">
  <li>
    <a href="/alternatives/remotion">Remotion alternatives in 2026</a>
    <p>Seven tools people move to from Remotion, with licenses, renderers and render times.</p>
  </li>
</ul>

<p>
  The <a href="/compare">comparison table</a> puts five tools side by side, and the
  <a href="/docs/migrate/remotion">migration guides</a> port a scene from each.
</p>

<style>
  .lead {
    max-width: 68ch;
    color: var(--muted);
  }
  .list {
    padding: 0;
    list-style: none;
    display: grid;
    gap: 16px;
  }
  .list a {
    font-weight: 600;
    font-size: 18px;
  }
  .list p {
    margin: 4px 0 0;
    max-width: 68ch;
    color: var(--muted);
  }
</style>
