<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { galleryItems } from '$lib/gallery';
  import { exampleByName } from '$lib/examples';
  import { track } from '$lib/track';
  import { mediaFor, videoObject } from '$lib/media';

  // The videos as an item list, so search can show them as video results.
  const videos = galleryItems
    .map((item) => videoObject(item.name, item.title, item.prompt))
    .filter((v): v is object => v !== null);
  const jsonld = videos.length
    ? [
        {
          '@type': 'ItemList',
          itemListElement: videos.map((v, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: v,
          })),
        },
      ]
    : [];
</script>

<Seo
  title="Gallery of code-based videos — oxframe"
  description="Explainer, code, chart and vertical videos made with oxframe. Each card has the brief, the source and a link into the playground."
  {jsonld}
/>

<h1>Gallery</h1>
<p class="lead">
  Examples from <code>oxframe-sdk/examples</code>. None of these cards is an agent run, so there is
  no iteration count. The brief is the request the scene answers.
</p>

<ul class="cards">
  {#each galleryItems as item (item.name)}
    {@const example = exampleByName(item.name)}
    <li>
      <p class="tags">{item.tags.join(' · ')}</p>
      <h2>{item.title}</h2>
      {#if mediaFor(item.name)}
        {@const m = mediaFor(item.name)!}
        {#if m.captions}
          <video
            src={m.mp4}
            poster={m.poster}
            width={m.width}
            height={m.height}
            controls
            playsinline
            preload="none"
            aria-label="{item.title}, rendered by oxframe"
          >
            <track kind="captions" src={m.captions} srclang="en" label="English" />
          </video>
        {:else}
          <!-- No sound track: muted says so, and there is nothing to caption. -->
          <video
            src={m.mp4}
            poster={m.poster}
            width={m.width}
            height={m.height}
            controls
            muted
            playsinline
            preload="none"
            aria-label="{item.title}, rendered by oxframe"
          ></video>
        {/if}
      {/if}
      <p>{item.prompt}</p>
      {#if example}
        <details>
          <summary>Source</summary>
          <pre><code>{example.source}</code></pre>
        </details>
      {/if}
      <a class="btn" href="/playground?ex={item.name}" onclick={() => track('Open playground')}
        >Open in playground</a
      >
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
  video {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
    background: #111;
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
