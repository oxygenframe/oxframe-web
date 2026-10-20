<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import { href, neighbors, pages, sections } from '$lib/docs';
  import { canonical, SITE } from '$lib/site';
  let { children } = $props();
  const around = $derived(neighbors(page.url.pathname));
  const current = (slug: string) => page.url.pathname.replace(/\/$/, '') === href(slug);
  const doc = $derived(pages.find((p) => current(p.slug)));
  // "1. Your first animation" reads better in results without the number.
  const name = $derived(doc?.title.replace(/^\d+\.\s*/, '') ?? 'Docs');
  const title = $derived(
    doc?.slug === '' ? 'oxframe docs — animation in Rust, step by step' : `${name} — oxframe docs`,
  );
  const jsonld = $derived(
    doc
      ? [
          {
            '@type': 'TechArticle',
            headline: name,
            description: doc.description,
            url: canonical(href(doc.slug)),
            inLanguage: 'en',
            isPartOf: { '@type': 'WebSite', name: 'oxframe', url: SITE },
            about: { '@type': 'SoftwareApplication', name: 'oxframe' },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'oxframe', item: `${SITE}/` },
              { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE}/docs` },
              ...(doc.slug
                ? [{ '@type': 'ListItem', position: 3, name, item: canonical(href(doc.slug)) }]
                : []),
            ],
          },
        ]
      : [],
  );
</script>

{#if doc}<Seo {title} description={doc.description} type="article" {jsonld} />{/if}

<div class="docs">
  <nav aria-label="Documentation">
    {#each sections as s (s.title)}
      <p class="section">{s.title}</p>
      {#each s.pages as p (p.slug)}
        <a href={href(p.slug)} aria-current={current(p.slug) ? 'page' : undefined}>{p.title}</a>
      {/each}
    {/each}
  </nav>
  <article>
    {@render children()}
    <footer class="pager">
      {#if around.prev}
        <a class="prev" href={href(around.prev.slug)}><span>Previous</span>{around.prev.title}</a>
      {:else}<span></span>{/if}
      {#if around.next}
        <a class="next" href={href(around.next.slug)}><span>Next</span>{around.next.title}</a>
      {/if}
    </footer>
  </article>
</div>

<style>
  .docs {
    display: grid;
    grid-template-columns: 230px minmax(0, 1fr);
    gap: 40px;
  }
  nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    position: sticky;
    top: 16px;
    align-self: start;
    max-height: calc(100vh - 32px);
    overflow: auto;
  }
  .section {
    margin: 14px 0 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--muted);
  }
  .section:first-child {
    margin-top: 0;
  }
  nav a {
    color: var(--muted);
    text-decoration: none;
    padding: 2px 0;
  }
  nav a[aria-current='page'] {
    color: var(--text);
    font-weight: 600;
  }
  article {
    min-width: 0;
    max-width: 760px;
  }
  .pager {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .pager a {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: var(--text);
    font-weight: 600;
  }
  .pager a span {
    font-size: 12px;
    font-weight: 400;
    color: var(--muted);
  }
  .next {
    text-align: right;
    margin-left: auto;
  }
  article :global(.try) {
    border-left: 3px solid var(--accent);
    background: var(--panel);
    padding: 4px 16px;
    border-radius: 0 8px 8px 0;
    margin: 20px 0;
  }
  article :global(.recap) {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px;
    margin: 20px 0;
  }
  article :global(.lead) {
    font-size: 18px;
    color: var(--muted);
  }
  @media (max-width: 760px) {
    .docs {
      grid-template-columns: 1fr;
    }
    nav {
      position: static;
      max-height: none;
    }
  }
</style>
