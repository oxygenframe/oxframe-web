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
  // Footer columns; most links are pages of this site, so they also tie it together.
  const footer = [
    {
      title: 'Product',
      links: [
        { href: '/playground', label: 'Playground' },
        { href: '/gallery', label: 'Gallery' },
        { href: '/use-cases', label: 'Use cases' },
        { href: '/showcase', label: 'Showcase' },
        { href: '/compare', label: 'Compare' },
      ],
    },
    {
      title: 'Docs',
      links: [
        { href: '/docs/getting-started', label: 'Getting started' },
        { href: '/docs/guide/hello', label: 'Guide' },
        { href: '/docs/cli', label: 'CLI reference' },
        { href: '/docs/check-rules', label: 'Check rules' },
        { href: 'https://docs.rs/oxframe', label: 'API on docs.rs' },
      ],
    },
    {
      title: 'Agents',
      links: [
        { href: '/agents', label: 'Agents and skills' },
        { href: '/agents/claude-code', label: 'Claude Code' },
        { href: '/agents/cursor', label: 'Cursor' },
        { href: '/agents/codex', label: 'Codex' },
        { href: '/llms.txt', label: 'llms.txt' },
      ],
    },
    {
      title: 'Alternatives',
      links: [
        { href: '/remotion-alternative', label: 'Remotion alternative' },
        { href: '/manim-alternative', label: 'Manim alternative' },
        { href: '/rust', label: 'Animation in Rust' },
        { href: '/ai-video-from-code', label: 'AI video from code' },
      ],
    },
    {
      title: 'Project',
      links: [
        { href: 'https://github.com/oxygenframe/oxframe-sdk', label: 'GitHub' },
        { href: '/changelog', label: 'Changelog' },
        { href: 'https://crates.io/crates/oxframe', label: 'crates.io' },
        { href: '/license', label: 'License' },
        {
          href: 'https://github.com/oxygenframe/release-video-action',
          label: 'Release video Action',
        },
      ],
    },
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
      <a href="/changelog">changelog</a> before upgrading.
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
        href="/changelog"
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
      <div class="foot-top">
        <div class="foot-brand">
          <a class="brand" href="/">
            <svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true"
              ><rect x="3" y="9" width="14" height="14" rx="3" fill="#e13238" /><circle
                cx="22"
                cy="16"
                r="7"
                fill="#68abdf"
              /></svg
            >
            oxframe
          </a>
          <p>Motion graphics in Rust that your AI agent can see and check.</p>
          <a class="star" href="https://github.com/oxygenframe/oxframe-sdk" rel="external">
            Star on GitHub{stars ? ` · ${stars}` : ''}
          </a>
        </div>
        {#each footer as col (col.title)}
          <nav class="foot-col" aria-label={col.title}>
            <p class="foot-title">{col.title}</p>
            <ul>
              {#each col.links as l (l.href)}
                <li>
                  <a href={l.href} rel={l.href.startsWith('http') ? 'external' : undefined}
                    >{l.label}</a
                  >
                </li>
              {/each}
            </ul>
          </nav>
        {/each}
      </div>
      <div class="foot-bottom">
        <span
          >© 2026 oxframe · <a href="/license">MIT or Apache-2.0</a> · no seats, no per-render fees</span
        >
        <span>oxframe {SDK_VERSION} · pre-1.0</span>
      </div>
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
    margin-top: auto;
    padding: 40px 20px 24px;
    border-top: 1px solid var(--border);
    background: var(--panel);
    color: var(--muted);
    font-size: 14px;
  }
  .foot-top {
    display: grid;
    grid-template-columns: minmax(200px, 1.6fr) repeat(5, minmax(0, 1fr));
    gap: 28px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  .foot-brand p {
    margin: 10px 0 14px;
    max-width: 260px;
    line-height: 1.5;
  }
  .star {
    display: inline-block;
    padding: 5px 12px;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text);
    text-decoration: none;
  }
  .star:hover {
    border-color: var(--muted);
  }
  /* Not the header's nav row. */
  .foot-col {
    display: block;
  }
  .foot-title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }
  .foot-col ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .foot-col li {
    margin: 0 0 7px;
  }
  .foot-col a {
    color: var(--muted);
    text-decoration: none;
  }
  .foot-col a:hover {
    color: var(--text);
  }
  .foot-bottom {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 6px 18px;
    max-width: 1200px;
    margin: 32px auto 0;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-size: 13px;
  }
  .foot-bottom a {
    color: var(--muted);
  }
  @media (max-width: 960px) {
    .foot-top {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .foot-brand {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 560px) {
    .foot-top {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
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
