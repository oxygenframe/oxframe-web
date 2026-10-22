<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { rows } from '$lib/compare';
</script>

<Seo
  title="oxframe vs Remotion, Manim, Motion Canvas, fframes — oxframe"
  description="A neutral comparison of oxframe, fframes, Remotion, Motion Canvas and Manim: language, renderer, scene model, morphing, editor and checks an AI agent can read."
/>

<h1>oxframe, fframes, Remotion, Motion Canvas, Manim</h1>
<p class="lead">
  Five ways to make a video from code. This table is about fit, not a ranking. The facts are the
  public models of each tool as of October 2026.
</p>

<article>
  <table>
    <thead>
      <tr>
        <th></th>
        <th>oxframe</th>
        <th>fframes</th>
        <th>Remotion</th>
        <th>Motion Canvas</th>
        <th>Manim</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row[0])}
        <tr>
          {#each row as cell, i (i)}
            {#if i === 0}<th scope="row">{cell}</th>{:else}<td>{cell}</td>{/if}
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</article>

<h2>When to pick something else</h2>
<ul>
  <li>
    Pick fframes when generative design is the priority. Each frame is its own SVG, so the frames
    are not rigidly tied together.
  </li>
  <li>Pick Remotion when the video is a React app and the team already lives in that stack.</li>
  <li>
    Pick Motion Canvas when you want the coroutine model in TypeScript and a browser editor is
    enough.
  </li>
  <li>
    Pick Manim when the subject is a math lecture and the Python ecosystem around it is the point.
  </li>
  <li>
    Pick oxframe when a coding agent has to see the frames, fix them, and render without a browser.
  </li>
</ul>
<p>oxframe is early. The API is not stable; the banner at the top of this site says so.</p>

<style>
  .lead {
    color: var(--muted);
    max-width: 68ch;
  }
  article {
    overflow-x: auto;
    max-width: 100%;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
  }
  table {
    border-collapse: collapse;
    min-width: 920px;
    width: 100%;
  }
  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }
  tbody th {
    white-space: nowrap;
  }
</style>
