<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { galleryItem } from '$lib/gallery';

  const cases = [
    {
      title: 'Release videos',
      example: 'components',
      text: 'A version note: a title, three changes, an end card. The components already know the theme.',
    },
    {
      title: 'Algorithm explainers',
      example: 'quicksort',
      text: 'The code and the data move together. The focus in the listing matches the bars.',
    },
    {
      title: 'Code tutorials',
      example: 'typography',
      text: 'A listing with a moving focus, and words that morph into the next term.',
    },
    {
      title: 'Product updates',
      example: 'camera',
      text: 'A diagram of the system, a zoom onto one step, a title that stays on screen.',
    },
    {
      title: 'Vertical videos',
      example: 'relative',
      text: 'The same scene in 16:9, 9:16 and 1:1, placed against the safe area instead of pixel guesses.',
    },
  ];
</script>

<Seo
  title="What people make with oxframe — oxframe"
  description="A GitHub release's notes become a video on that release. Gallery scenes cover explainers, tutorials, product updates and vertical videos."
/>

<h1>Use cases</h1>
<p class="lead">
  A GitHub release can grow its video from the notes alone. The scenes below are already in the
  gallery: the brief is the request, and the playground has the code.
</p>

<article>
  <h2>A video on every release</h2>
  <p>
    Publish a release and the notes become the MP4 attached to it. Headings and lists turn into
    title cards and bullet lists. Text that does not fit is split across cards, and the end card
    says "made with oxframe".
  </p>
  <pre><code
      >on:
  release:
    types: [published]
jobs:
  video:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: oxygenframe/release-video-action@v1
        with:
          portrait: true</code
    ></pre>
  <p>
    <a class="btn" href="https://github.com/oxygenframe/release-video-action"
      >oxygenframe/release-video-action</a
    >
  </p>
</article>

{#each cases as item (item.example)}
  {@const card = galleryItem(item.example)}
  <article>
    <h2>{item.title}</h2>
    <p>{item.text}</p>
    {#if card}
      <p><strong>Brief.</strong> {card.prompt}</p>
    {/if}
    <p>
      <a class="btn" href="/playground?ex={item.example}">Open {item.example} in the playground</a>
    </p>
  </article>
{/each}

<style>
  .lead {
    color: var(--muted);
  }
  article {
    margin-top: 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px 16px;
    background: var(--panel);
  }
  article p {
    color: var(--muted);
  }
</style>
