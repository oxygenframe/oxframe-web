<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { compile, examples } from '../compile';
  import { exampleByName } from '../examples';
  import { highlightedExample } from '../examples-highlighted';
  import { CURRENT, locate } from '../versions';
  import Player from './Player.svelte';

  /** `open`: show the source expanded (lessons). `at`: playhead in seconds. */
  let { name, open = false, at = 0 }: { name: string; open?: boolean; at?: number } = $props();
  let urls = $state<{ wasm: string; js: string } | null>(null);
  let building = $state(false);
  let failed = $state(false);
  const local = $derived(exampleByName(name));
  const source = $derived(highlightedExample(name));
  // In archived docs the playground is told which version the example is from.
  const series = $derived(locate(page.url.pathname).series);
  const playground = $derived(
    `/playground?${series === CURRENT ? '' : `v=${series}&`}ex=${encodeURIComponent(name)}`,
  );

  // Prebuilt examples play at once. One not built yet (right after a
  // deploy) is compiled on demand: the service shares the job and caches
  // the result, so this also fills the cache for the next visitor.
  onMount(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        let ex = (await examples()).find((e) => e.name === name);
        if (!ex) throw new Error(`unknown example ${name}`);
        if (ex.status !== 'done') {
          building = true;
          ex = { ...ex, ...(await compile(ex.source, abort.signal)) };
        }
        if (ex.status === 'done' && ex.wasm_url && ex.js_url)
          urls = { wasm: ex.wasm_url, js: ex.js_url };
        else failed = true;
      } catch {
        if (!abort.signal.aborted) failed = true;
      }
      building = false;
    })();
    return () => abort.abort();
  });
</script>

<figure class="live">
  {#if urls}
    <Player wasmUrl={urls.wasm} jsUrl={urls.js} compact {at} />
  {:else if failed}
    <p class="off">Live preview unavailable right now. The code:</p>
  {:else if building}
    <p class="off">Building the live preview (takes up to a minute after an update)…</p>
  {:else}
    <p class="off">Loading live preview…</p>
  {/if}
  {#if local}
    <details {open}>
      <summary
        >Source of <code>{name}</code> —
        <a href={playground}>edit in the playground</a></summary
      >
      {#if source}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time from our own example files -->
        {@html source}
      {:else}
        <pre><code>{local.source}</code></pre>
      {/if}
    </details>
  {/if}
</figure>

<style>
  .live {
    margin: 16px 0;
  }
  .off {
    color: var(--muted);
  }
</style>
