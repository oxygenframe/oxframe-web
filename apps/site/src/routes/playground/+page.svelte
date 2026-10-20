<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import Seo from '$lib/components/Seo.svelte';

  // The app needs the browser; the prerendered page carries the title,
  // description and a short intro for crawlers and slow connections.
  let App = $state<Component>();
  onMount(async () => {
    App = (await import('$lib/components/Playground.svelte')).default;
  });
</script>

<Seo
  title="Rust animation playground — oxframe"
  description="Write Rust animation code in your browser and watch it play instantly. Edit examples, scrub the timeline, share a link or export an MP4 — nothing to install."
  jsonld={[
    {
      '@type': 'WebApplication',
      name: 'oxframe playground',
      url: 'https://oxframe.dev/playground',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (web browser)',
      browserRequirements: 'Requires WebAssembly',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  ]}
/>

{#if App}
  <App />
{:else}
  <section class="intro">
    <h1>Rust animation playground</h1>
    <p>
      Write an oxframe scene in Rust, and it compiles and plays right here: edit the examples, scrub
      the timeline, share a link or export an MP4. Loading the editor…
    </p>
  </section>
{/if}

<style>
  .intro {
    max-width: 680px;
    margin: 48px auto;
    padding: 0 16px;
    color: var(--muted);
  }
  .intro h1 {
    color: var(--text);
  }
</style>
