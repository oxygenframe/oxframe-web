<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import Seo from '$lib/components/Seo.svelte';
  import { ORGANIZATION } from '$lib/site';

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
      publisher: { '@id': ORGANIZATION['@id'] },
    },
    ORGANIZATION,
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
    <p>
      The scene is built on compile.oxframe.dev and runs in your browser as WebAssembly, with the
      same timeline, markers and tunables as <code>oxframe dev</code> on your machine. Start from an
      example — shapes, text, charts, code walkthroughs, particles, 3D, transitions — or from a
      lesson of the
      <a href="/docs/guide/hello">guide</a>. The <a href="/gallery">gallery</a> shows every example
      as a video, and <a href="/docs/embed">Embed</a> puts a scene on your own site. To render
      longer videos with sound, install the CLI (<a href="/docs/getting-started">getting started</a
      >).
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
