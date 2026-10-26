<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import ExampleVideo from '$lib/components/ExampleVideo.svelte';
  import { galleryItems, slugOf } from '$lib/gallery';
  import { exampleByName } from '$lib/examples';
  import { track } from '$lib/track';
  import { mediaFor } from '$lib/media';
  import { SITE } from '$lib/site';

  // The examples as a list of their pages, where each video is marked up.
  const jsonld = [
    {
      '@type': 'ItemList',
      itemListElement: galleryItems.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/gallery/${slugOf(item.name)}`,
        name: item.title,
      })),
    },
  ];
</script>

<Seo
  title="Gallery of code-based videos — oxframe"
  description="Explainer, code, chart and vertical videos made by Oxframe. Each card has the brief, the source and a link into the playground."
  {jsonld}
/>

<h1>Gallery</h1>
<p class="lead">
  Examples from <code>oxframe-sdk/examples</code>. Each card shows the brief the scene was written
  from, what it uses and its source.
</p>

<ul class="cards">
  {#each galleryItems as item (item.name)}
    {@const example = exampleByName(item.name)}
    <li>
      <p class="tags">{item.tags.join(' · ')}</p>
      <h2><a href="/gallery/{slugOf(item.name)}">{item.title}</a></h2>
      {#if mediaFor(item.name)}
        <ExampleVideo media={mediaFor(item.name)!} title={item.title} />
      {/if}
      <p>{item.prompt}</p>
      {#if example}
        <details>
          <summary>Source</summary>
          <pre><code>{example.source}</code></pre>
        </details>
      {/if}
      {#if item.playground !== false}
        <a class="btn" href="/playground?ex={item.name}" onclick={() => track('Open playground')}
          >Open in playground</a
        >
      {/if}
    </li>
  {/each}
</ul>

<style>
  .lead {
    color: var(--muted);
    max-width: 68ch;
  }
  .cards {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  @media (min-width: 800px) {
    .cards {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
  }
  h2 a {
    color: var(--text);
    text-decoration: none;
  }
  h2 a:hover {
    text-decoration: underline;
  }
  li {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px 16px;
    background: var(--panel);
  }
  li p {
    color: var(--muted);
  }
  .tags {
    margin-top: 12px;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  h2 {
    font-size: 1.15rem;
  }
  details {
    margin-bottom: 12px;
  }
</style>
