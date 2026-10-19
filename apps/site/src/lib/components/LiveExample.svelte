<script lang="ts">
  import { onMount } from 'svelte';
  import { examples, type Example } from '../compile';
  import { exampleByName } from '../examples';
  import Player from './Player.svelte';

  /** `open`: show the source expanded (lessons). */
  let { name, open = false }: { name: string; open?: boolean } = $props();
  let ex = $state<Example | null>(null);
  let failed = $state(false);
  const local = $derived(exampleByName(name));

  onMount(async () => {
    try {
      ex = (await examples()).find((e) => e.name === name && e.status === 'done') ?? null;
      failed = !ex;
    } catch {
      failed = true;
    }
  });
</script>

<figure class="live">
  {#if ex?.wasm_url && ex.js_url}
    <Player wasmUrl={ex.wasm_url} jsUrl={ex.js_url} compact />
  {:else if failed}
    <p class="off">Live preview unavailable (compile service offline). The code:</p>
  {:else}
    <p class="off">Loading live preview…</p>
  {/if}
  {#if local}
    <details {open}>
      <summary
        >Source of <code>{name}</code> —
        <a href="/playground?ex={name}">edit in the playground</a></summary
      >
      <pre><code>{local.source}</code></pre>
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
