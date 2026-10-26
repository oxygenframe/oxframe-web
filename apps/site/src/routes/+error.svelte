<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import DocsSearch from '$lib/search/DocsSearch.svelte';

  const missing = $derived(page.status === 404);
  // Words of the missing address, for the search box: /docs/render-gif → "render gif".
  const words = $derived(
    page.url.pathname
      .split(/[/\-_.]+/)
      .filter((w) => w && !/^(docs|html|md|\d+)$/.test(w))
      .join(' '),
  );

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
  // The scene (lib/examples/not_found.rs) rendered by `oxframe render` to a
  // 90 kB loop. With reduced motion only the finished frame (the poster) shows.
  let video = $state<HTMLVideoElement>();

  onMount(() => {
    if (!missing) return;
    if (video && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.pause();
      video.currentTime = 4.5;
    }
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
    <video
      bind:this={video}
      class="scene"
      src="/images/404/not-found.mp4"
      poster="/images/404/not-found.webp"
      width="960"
      height="540"
      autoplay
      muted
      loop
      playsinline
      aria-hidden="true"
    ></video>
  {/if}
  <h1>{missing ? 'Page not found' : 'Something went wrong'}</h1>
  {#if missing}
    <p class="lead">
      Nothing lives at <code>{page.url.pathname}</code>.
    </p>
    {#if suggestions.length}
      <p class="mean">
        Did you mean
        {#each suggestions as s, i (s)}{i ? ', ' : ' '}<a href={s}>{s}</a>{/each}?
      </p>
    {/if}
    <div class="find"><DocsSearch query={words} inline /></div>
  {/if}
  <p>
    Or start from the <a href="/docs">docs</a>, the <a href="/playground">playground</a> or the
    <a href="/">home page</a>.
  </p>
  {#if missing}
    <p class="made">
      The animation above was made by Oxframe in under 80 lines of Rust.
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
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    margin-bottom: 8px;
    border-radius: 12px;
    background: #141414;
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
