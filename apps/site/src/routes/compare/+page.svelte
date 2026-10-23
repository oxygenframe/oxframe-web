<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { rows, tools } from '$lib/compare';
  import { vsPages } from '$lib/vs';
</script>

<Seo
  title="oxframe vs HyperFrames, Remotion, fframes, Manim — oxframe"
  description="A neutral comparison of oxframe, fframes, Remotion, HyperFrames, Motion Canvas and Manim: language, renderer, scene model, morphing, editor and agent checks."
/>

<h1>oxframe, fframes, Remotion, HyperFrames, Motion Canvas, Manim</h1>
<p class="lead">
  Six ways to make a video from code. This table is about fit, not a ranking. The facts are the
  public models of each tool as of October 2026.
</p>

<article>
  <table>
    <thead>
      <tr>
        <th></th>
        {#each tools as t (t)}<th>{t}</th>{/each}
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
    Pick HyperFrames when the agent should write HTML and CSS rather than Rust, and you want its
    block catalog, player and <code>publish</code>. oxframe's edge is a native render with no
    Chrome, determinism, and a check that points at the line of code.
  </li>
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

<h2>One tool at a time</h2>
<p>
  Each page compares oxframe with one tool, with dated facts, one scene in both and its render time.
</p>
<ul>
  {#each vsPages as p (p.slug)}
    <li><a href="/vs/{p.slug}">oxframe vs {p.name}</a></li>
  {/each}
  <li><a href="/alternatives/remotion">Remotion alternatives in 2026</a></li>
</ul>

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
