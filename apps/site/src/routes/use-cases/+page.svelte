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
  description="Release notes, algorithm explainers, code tutorials, product updates and vertical videos, each with a gallery example and the brief it answers."
/>

<h1>Use cases</h1>
<p class="lead">
  Each one is a scene already in the gallery. The brief is the request; the playground has the code.
</p>

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
