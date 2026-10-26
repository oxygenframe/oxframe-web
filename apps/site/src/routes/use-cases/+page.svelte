<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { mediaFor } from '$lib/media';
  import { SITE } from '$lib/site';
  import { useCases } from '$lib/use-cases';

  const jsonld = [
    {
      '@type': 'ItemList',
      itemListElement: useCases.map((u, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/use-cases/${u.slug}`,
        name: u.name,
      })),
    },
  ];
</script>

<Seo
  title="What people make with oxframe — oxframe"
  description="Release videos, code walkthroughs, math animations, animated charts, product explainers, presentations and voiceovers, each with examples and a prompt."
  {jsonld}
/>

<h1>Use cases</h1>
<p class="lead">
  What oxframe is used for, each with a video, how it is built, a first prompt for your agent and
  the examples to start from.
</p>

<ul class="cases">
  {#each useCases as u (u.slug)}
    {@const m = mediaFor(u.examples[0]!)}
    <li>
      <a href="/use-cases/{u.slug}">
        {#if m}<img src={m.poster} width={m.width} height={m.height} loading="lazy" alt="" />{/if}
        <h2>{u.name}</h2>
        <p>{u.description}</p>
      </a>
    </li>
  {/each}
</ul>

<style>
  .lead {
    color: var(--muted);
    max-width: 68ch;
  }
  .cases {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
    padding: 0;
    list-style: none;
  }
  .cases a {
    display: block;
    box-sizing: border-box;
    height: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--panel);
    color: var(--text);
    text-decoration: none;
  }
  .cases a:hover {
    border-color: var(--muted);
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  h2 {
    margin: 12px 0 4px;
    font-size: 18px;
  }
  p {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
  }
</style>
