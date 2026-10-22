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
    </nav>
    <!-- On the right, apart from the site's own sections. -->
    <a
      class="star-top"
      href="https://github.com/oxygenframe/oxframe-sdk"
      rel="external"
      aria-label="Star oxframe on GitHub{stars ? ` (${stars} stars)` : ''}"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
        ><path
          fill="currentColor"
          d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
        /></svg
      >
      <span class="star-label">Star</span>
      {#if stars}<span class="star-count">{stars}</span>{/if}
    </a>
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
    /* As wide as the page's content (940 px), so the logo and the star line
       up with its edges; the playground's editor fills the screen instead. */
    padding: 10px max(20px, calc((100% - 940px) / 2));
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
  .star-top {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    padding: 4px 12px;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text);
    font-size: 14px;
    text-decoration: none;
    white-space: nowrap;
  }
  .star-top:hover {
    border-color: var(--muted);
  }
  .star-count {
    padding-left: 6px;
    border-left: 1px solid var(--border);
    color: var(--muted);
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
  .shell.full .nav {
    padding-inline: 20px;
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
    /* Next to the logo, an icon is enough. */
    .star-top {
      order: 1;
      padding: 4px 8px;
    }
    .star-label {
      display: none;
    }
    nav {
      order: 2;
      width: 100%;
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
    max-width: 940px;
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
    max-width: 940px;
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
