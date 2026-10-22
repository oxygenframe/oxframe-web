<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
  import DocsSearch from '$lib/search/DocsSearch.svelte';
  import { examplesUsing } from '$lib/uses';
  import { href, neighbors, sections, sectionsOf } from '$lib/docs';
  import { canonical, ORGANIZATION, SITE, WEBSITE } from '$lib/site';
  import { CURRENT, DOCS_VERSIONS, docsRs, latestPatch, locate } from '$lib/versions';
  let { children } = $props();

  const loc = $derived(locate(page.url.pathname));
  const archived = $derived(loc.series !== CURRENT);
  const list = $derived(sectionsOf(loc.series));
  const doc = $derived(list.flatMap((s) => s.pages).find((p) => p.slug === loc.slug));
  const around = $derived(neighbors(page.url.pathname));
  // The same page in the current docs, if it still exists there.
  const inCurrent = $derived(sections.flatMap((s) => s.pages).some((p) => p.slug === loc.slug));
  const current = (slug: string) => slug === loc.slug;

  // "1. Your first animation" reads better in results without the number.
  const name = $derived(doc?.title.replace(/^\d+\.\s*/, '') ?? 'Docs');
  const title = $derived(
    archived
      ? `${name} — oxframe ${loc.series} docs`
      : doc?.slug === ''
        ? 'Animation in Rust, step by step — oxframe docs'
        : `${name} — oxframe docs`,
  );
  // Archived pages point search engines at the current page.
  const canonicalUrl = $derived(
    archived ? canonical(inCurrent ? href(loc.slug) : '/docs') : undefined,
  );
  const jsonld = $derived(
    doc && !archived
      ? [
          {
            '@type': 'TechArticle',
            headline: name,
            description: doc.description,
            url: canonical(href(doc.slug)),
            inLanguage: 'en',
            isPartOf: { '@id': WEBSITE['@id'], '@type': 'WebSite', name: 'oxframe', url: SITE },
            about: { '@type': 'SoftwareApplication', name: 'oxframe' },
            publisher: ORGANIZATION,
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

  /** Same page in another version if it exists there, else that version's start. */
  function switchTo(series: string) {
    const has = sectionsOf(series)
      .flatMap((s) => s.pages)
      .some((p) => p.slug === loc.slug);
    void goto(href(has ? loc.slug : '', series));
  }
</script>

{#if doc}<Seo
    {title}
    description={doc.description}
    type="article"
    canonical={canonicalUrl}
    {jsonld}
  />{/if}

<div class="docs">
  <nav aria-label="Documentation">
    <div class="version">
      <label>
        <span>Version</span>
        <select
          value={loc.series}
          onchange={(e) => switchTo(e.currentTarget.value)}
          data-testid="docs-version"
        >
          {#each DOCS_VERSIONS as v (v.series)}
            <option value={v.series}>{v.version}{v.current ? ' (latest)' : ''}</option>
          {/each}
        </select>
      </label>
      <a href={docsRs(latestPatch(loc.series))} rel="external" data-testid="api-reference"
        >API reference ↗</a
      >
    </div>
    <!-- The index holds the current docs only. -->
    {#if !archived}<DocsSearch />{/if}
    {#each list as s (s.title)}
      <p class="section">{s.title}</p>
      {#each s.pages as p (p.slug)}
        <a href={href(p.slug, loc.series)} aria-current={current(p.slug) ? 'page' : undefined}
          >{p.title}</a
        >
      {/each}
    {/each}
  </nav>
  <!-- Pagefind indexes the current docs' articles (scripts: pagefind after build). -->
  <article data-pagefind-body={archived ? undefined : ''}>
    {#if archived}
      <p class="old" role="note" data-testid="old-version">
        This is the documentation for oxframe {latestPatch(loc.series)}. The latest version is
        {latestPatch(CURRENT)}:
        <a href={inCurrent ? href(loc.slug) : '/docs'}>read the current docs</a>.
      </p>
    {/if}
    {@render children()}
    {#if !archived && examplesUsing(loc.slug).length}
      <aside class="examples" data-pagefind-ignore aria-label="Examples">
        <p>Examples that use this</p>
        <ul>
          {#each examplesUsing(loc.slug) as e (e.href)}
            <li><a href={e.href}>{e.title}</a></li>
          {/each}
        </ul>
      </aside>
    {/if}
    {#if !archived}
      <p class="edit" data-pagefind-ignore>
        <a
          href="https://github.com/oxygenframe/oxframe-web/edit/main/apps/site/src/routes/docs/{loc.slug
            ? `${loc.slug}/`
            : ''}+page.svelte"
          rel="external">Edit this page on GitHub</a
        >
      </p>
    {/if}
    <footer class="pager" data-pagefind-ignore>
      {#if around.prev}
        <a class="prev" href={href(around.prev.slug, loc.series)}
          ><span>Previous</span>{around.prev.title}</a
        >
      {:else}<span></span>{/if}
      {#if around.next}
        <a class="next" href={href(around.next.slug, loc.series)}
          ><span>Next</span>{around.next.title}</a
        >
      {/if}
    </footer>
  </article>
</div>

<style>
  .version {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .version label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--muted);
  }
  .version select {
    flex: 1;
  }
  .old {
    padding: 10px 14px;
    border: 1px solid var(--accent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--accent) 10%, var(--panel));
  }
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
    overflow-x: hidden;
    overflow-y: auto;
    /* The menu is taller than most windows. Overlay scrollbars (Linux, macOS)
       are drawn over the content, so keep room for one beside the fields. */
    padding-right: 12px;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
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
  .examples {
    margin: 40px 0 0;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
  }
  .examples p {
    margin: 0 0 6px;
    font-weight: 600;
  }
  .examples ul {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .edit {
    margin: 24px 0 0;
    font-size: 14px;
  }
  .edit a {
    color: var(--muted);
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
      padding-right: 0;
    }
  }
</style>
