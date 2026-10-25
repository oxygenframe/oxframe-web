<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import { COMPILE_URL } from '$lib/config';
  import DocsSearch from '$lib/search/DocsSearch.svelte';

  const missing = $derived(page.status === 404);
  // Words of the missing address, for the search box: /docs/render-gif → "render gif".
  const words = $derived(
    page.url.pathname
      .split(/[/\-_.]+/)
      .filter((w) => w && !/^(docs|html|md|\d+)$/.test(w))
      .join(' '),
  );
  const compile = COMPILE_URL === 'https://compile.oxframe.dev' ? undefined : COMPILE_URL;

  /** Edit distance, for "did you mean". */
  function distance(a: string, b: string): number {
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const row = [i];
      for (let j = 1; j <= b.length; j++)
        row[j] = Math.min(
          prev[j]! + 1,
          row[j - 1]! + 1,
          prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
        );
      prev = row;
    }
    return prev[b.length]!;
  }

  let suggestions = $state<string[]>([]);
  // The scene is drawn by oxframe itself (lib/examples/not_found.rs). If it
  // cannot load, the plain heading stays.
  let played = $state(false);

  onMount(() => {
    if (!missing) return;
    const src = '/player.js';
    void import(/* @vite-ignore */ src);
    const wanted = page.url.pathname.toLowerCase().replace(/\/+$/, '');
    void fetch('/sitemap.xml')
      .then((r) => r.text())
      .then((xml) => {
        const paths = [...xml.matchAll(/<loc>https?:\/\/[^/<]+([^<]*)<\/loc>/g)].map(
          (m) => m[1] || '/',
        );
        const last = (p: string) => p.split('/').filter(Boolean).at(-1) ?? '';
        suggestions = paths
          .map((p) => ({
            p,
            d: Math.min(distance(wanted, p), distance(last(wanted), last(p)) + 2),
          }))
          .filter((x) => x.d <= Math.max(3, wanted.length / 3))
          .sort((a, b) => a.d - b.d)
          .slice(0, 4)
          .map((x) => x.p);
      })
      .catch(() => {});
  });
</script>

<Seo
  title="{missing ? 'Page not found' : 'Error'} — oxframe"
  description="This page does not exist on oxframe.dev."
  noindex
/>

<div class="lost">
  {#if missing}
    <div class="scene" class:played aria-hidden="true">
      <oxframe-player
        example="not_found"
        {compile}
        autoplay
        loop
        at="4.5"
        onready={() => (played = true)}
      ></oxframe-player>
    </div>
  {/if}
  <h1>{missing ? 'Page not found' : 'Something went wrong'}</h1>
  {#if missing}
    <p class="lead">
      Nothing lives at <code>{page.url.pathname}</code>. Search the docs, or try one of these:
    </p>
    <div class="find"><DocsSearch query={words} /></div>
    {#if suggestions.length}
      <p class="mean">
        Did you mean
        {#each suggestions as s, i (s)}{i ? ', ' : ' '}<a href={s}>{s}</a>{/each}?
      </p>
    {/if}
  {/if}
  <p>
    Or start from the <a href="/docs">docs</a>, the <a href="/playground">playground</a> or the
    <a href="/">home page</a>.
  </p>
  {#if missing}
    <p class="made">
      The animation above is oxframe, running in your browser: under 80 lines of Rust.
      <a href="/playground?ex=not_found">Open it in the playground</a>.
    </p>
  {/if}
</div>

<style>
  .lost {
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 0 48px;
  }
  .scene {
    aspect-ratio: 16 / 9;
    margin-bottom: 8px;
    border-radius: 12px;
    overflow: hidden;
    background: #141414;
    opacity: 0;
    transition: opacity 0.4s;
  }
  .scene.played {
    opacity: 1;
  }
  oxframe-player {
    width: 100%;
    border-radius: 0;
  }
  .lead {
    color: var(--muted);
  }
  .lead code {
    overflow-wrap: anywhere;
  }
  .find {
    max-width: 440px;
    margin: 16px 0 8px;
  }
  .mean,
  .made {
    color: var(--muted);
  }
  .made {
    margin-top: 32px;
    font-size: 14px;
  }
</style>
