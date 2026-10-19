<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';
  let { children } = $props();
  const links = [
    { href: '/docs', label: 'Docs' },
    { href: '/playground', label: 'Playground' },
    { href: '/gallery', label: 'Gallery' },
  ];
</script>

<svelte:head>
  <title>oxframe — procedural animation in Rust</title>
  <meta
    name="description"
    content="Motion Canvas-style procedural animation in Rust: scenes are coroutines, frames are await points."
  />
</svelte:head>

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
  <nav aria-label="Main">
    {#each links as l (l.href)}
      <a href={l.href} aria-current={page.url.pathname.startsWith(l.href) ? 'page' : undefined}
        >{l.label}</a
      >
    {/each}
    <a href="https://github.com/oxygenframe/oxframe-sdk" rel="external">GitHub</a>
  </nav>
</header>

<div class="page" class:full={page.url.pathname.startsWith('/playground')}>
  {@render children()}
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
    max-width: 980px;
    margin: 0 auto;
    padding: 24px 20px 60px;
  }
  .page.full {
    max-width: none;
    padding: 0;
    height: calc(100vh - 49px);
  }
</style>
