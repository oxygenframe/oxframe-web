<script lang="ts">
  // Every page's <head> for search engines and link previews: title,
  // description, canonical URL, Open Graph / Twitter cards and optional
  // JSON-LD. Pages render exactly one of these.
  import { page } from '$app/state';
  import { canonical, OG_IMAGE } from '$lib/site';

  interface Props {
    title: string;
    description: string;
    type?: 'website' | 'article';
    noindex?: boolean;
    /** Canonical URL when it is another page (e.g. an archived doc). */
    canonical?: string;
    jsonld?: object[];
  }
  let {
    title,
    description,
    type = 'website',
    noindex = false,
    canonical: canonicalUrl,
    jsonld = [],
  }: Props = $props();

  const url = $derived(canonicalUrl ?? canonical(page.url.pathname));
  // `<` is escaped so the JSON cannot close the script element.
  const ld = $derived(
    jsonld.map(
      (d) =>
        `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...d }).replace(/</g, '\\u003c')}</` +
        'script>',
    ),
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  {#if noindex}<meta name="robots" content="noindex" />{/if}
  <meta property="og:type" content={type} />
  <meta property="og:site_name" content="oxframe" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="oxframe — motion graphics your AI agent can see" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={OG_IMAGE} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD built from our own data -->
  {#each ld as s, i (i)}{@html s}{/each}
</svelte:head>
