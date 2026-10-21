<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';
  import { SDK_VERSION } from '$lib/sdk';
  import starsFile from '$lib/stars.json';
  let { children } = $props();
  const links = [
    { href: '/docs', label: 'Docs' },
    { href: '/playground', label: 'Playground' },
    { href: '/agents', label: 'Agents' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/compare', label: 'Compare' },
    { href: '/use-cases', label: 'Use cases' },
  ];
  const playground = $derived(page.url.pathname.startsWith('/playground'));
  // Fetched at build time (scripts/github-stars.ts), not by each visitor.
  const stars: number | null = starsFile.stars;
  const series = SDK_VERSION.split('.').slice(0, 2).join('.');
  const docs = $derived(page.url.pathname.startsWith('/docs'));
</script>

<svelte:head>
  <script defer data-domain="oxframe.dev" src="https://plausible.io/js/script.js"></script>
</svelte:head>

<div class="shell" class:full={page.url.pathname.startsWith('/playground')}>
  {#if docs}
    <p class="status" role="note" data-testid="dev-status">
      <strong>Pre-1.0:</strong> the API is not stable yet and may change from version to version.
      Pin the exact version in your Cargo.toml and check the
      <a href="https://github.com/oxygenframe/oxframe-sdk/blob/main/CHANGELOG.md" rel="external"
        >changelog</a
      > before upgrading.
    </p>
  {/if}
  <header class="nav">
    <a class="brand" href="/">
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"
        ><rect x="3" y="9" width="14" height="14" rx="3" fill="#e13238" /><circle
          cx="22"
          cy="16"
          r="7"
          fill="#68abdf"
        /></svg
      >
      oxframe
    </a>
    {#if !docs}
      <a
        class="version"
        href="https://github.com/oxygenframe/oxframe-sdk/blob/main/CHANGELOG.md"
        rel="external"
        data-testid="dev-status"
        title="Pre-1.0: the API is not stable yet and may change from version to version. Pin the exact version."
        >v{series} · pre-1.0</a
      >
    {/if}
    <nav aria-label="Main">
      {#each links as l (l.href)}
        <a href={l.href} aria-current={page.url.pathname.startsWith(l.href) ? 'page' : undefined}
          >{l.label}</a
        >
      {/each}
      <a href="https://github.com/oxygenframe/oxframe-sdk" rel="external">GitHub</a>
    </nav>
  </header>

  <div class="page">
    {@render children()}
  </div>
  {#if !playground}
    <footer class="foot">
      <a href="https://github.com/oxygenframe/oxframe-sdk" rel="external">
        GitHub{stars ? ` · ${stars} stars` : ''}
      </a>
      <a href="https://github.com/oxygenframe/oxframe-sdk/blob/main/CHANGELOG.md" rel="external"
        >Changelog</a
      >
      <a href="https://crates.io/crates/oxframe" rel="external">crates.io</a>
      <a href="https://docs.rs/oxframe" rel="external">docs.rs</a>
      <a href="https://github.com/oxygenframe/release-video-action" rel="external"
        >Release video Action</a
      >
      <a href="/showcase">Showcase</a>
      <a href="/llms.txt">llms.txt</a>
      <span class="license">MIT or Apache-2.0 · no seats, no per-render fees</span>
    </footer>
  {/if}
</div>

<style>
  .nav {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 10px 20px;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
  }
  .brand {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 700;
    color: var(--text);
    text-decoration: none;
  }
  nav {
    display: flex;
    gap: 16px;
  }
  nav a {
    color: var(--muted);
    text-decoration: none;
  }
  nav a[aria-current='page'],
  nav a:hover {
    color: var(--text);
  }
  .page {
    box-sizing: border-box;
    width: 100%;
    max-width: 980px;
    margin: 0 auto;
    padding: 24px 20px 60px;
  }
  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  /* The playground fills exactly one screen under the banner and header. */
  .shell.full {
    height: 100vh;
  }
  .shell.full .page {
    flex: 1 1 0;
    min-height: 0;
    max-width: none;
    width: 100%;
    padding: 0;
  }
  /* Phones: the header fits without sideways scrolling. */
  @media (max-width: 520px) {
    .nav {
      flex-wrap: wrap;
      gap: 6px 14px;
      padding: 10px 16px;
    }
    nav {
      flex-wrap: wrap;
      gap: 4px 12px;
    }
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;
    margin-top: auto;
    padding: 18px 20px 28px;
    border-top: 1px solid var(--border);
    color: var(--muted);
  }
  .version {
    margin-left: -12px;
    padding: 2px 8px;
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12px;
    color: var(--muted);
    text-decoration: none;
    white-space: nowrap;
  }
  .license {
    color: var(--muted);
  }
  .status {
    margin: 0;
    padding: 6px 20px;
    font-size: 13px;
    line-height: 1.4;
    text-align: center;
    color: var(--text);
    background: color-mix(in srgb, #f5c242 18%, var(--panel));
    border-bottom: 1px solid var(--border);
  }
</style>
