<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { showcaseExamples } from '$lib/examples';
</script>

<Seo
  title="Gallery of Rust animations — oxframe"
  description="Motion graphics made with oxframe, from a step-by-step quicksort visualization to text, shape and effect demos. Open any example and edit it in your browser."
/>

<h1>Gallery</h1>
<p>
  Examples from <code>oxframe-sdk/examples</code>. Open one in the playground to edit and run it in
  your browser.
</p>
<a class="featured" href="/playground?ex=quicksort">
  <span class="tag">Showcase</span>
  <h2>Quicksort, step by step</h2>
  <p>
    The code with a moving focus, synced to bars that compare, swap and settle — highlighted code,
    hundreds of coordinated tweens, seeded data, tunables, markers, glow and text morphing in one
    scene.
  </p>
  <span class="btn primary">Open in playground →</span>
</a>

<ul class="cards">
  {#each showcaseExamples as ex (ex.name)}
    <li>
      <h2>{ex.name}</h2>
      <p>{ex.title}</p>
      <a class="btn" href="/playground?ex={ex.name}">Open in playground →</a>
    </li>
  {/each}
</ul>

<style>
  .featured {
    display: block;
    margin: 20px 0 8px;
    padding: 4px 20px 20px;
    border-radius: 14px;
    border: 1px solid var(--accent);
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--accent) 14%, var(--panel)),
      var(--panel)
    );
    color: var(--text);
    text-decoration: none;
  }
  .featured p {
    color: var(--muted);
    max-width: 720px;
  }
  .tag {
    display: inline-block;
    margin-top: 16px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--accent);
  }
  .cards {
    list-style: none;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  li {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px 16px;
    background: var(--panel);
  }
  li p {
    color: var(--muted);
    min-height: 3em;
  }
</style>
