<script lang="ts">
  // Every page's <head> for search engines and link previews: title,
  // description, canonical URL, Open Graph / Twitter cards and optional
  // JSON-LD. Pages render exactly one of these.
  import { page } from '$app/state';
  import { canonical, OG_IMAGE, SITE, X_HANDLE } from '$lib/site';
  import cards from '$lib/og.json';

  interface Props {
    title: string;
    description: string;
    type?: 'website' | 'article';
    noindex?: boolean;
    /** Canonical URL when it is another page (e.g. an archived doc). */
    canonical?: string;
    jsonld?: object[];
    /** A picture of the page's own (a video poster) instead of its card. */
    image?: { url: string; width: number; height: number; alt: string };
    /** A video the link preview can play (X, Slack, Discord). */
    video?: { url: string; width: number; height: number };
  }
  let {
    title,
    description,
    type = 'website',
    noindex = false,
    canonical: canonicalUrl,
    jsonld = [],
    image: picture,
    video,
  }: Props = $props();

  const url = $derived(canonicalUrl ?? canonical(page.url.pathname));
  // The page's own card (scripts/og-images.ts), else the site card. Looked
  // up by the canonical URL, so an archived doc shows its current page's.
  const card = $derived(
    (cards as Record<string, { title: string; image: string }>)[url.slice(SITE.length) || '/'],
  );
  const image = $derived(picture?.url ?? (card ? SITE + card.image : OG_IMAGE));
  const imageAlt = $derived(
    picture?.alt ??
      (card ? `${card.title} — oxframe` : 'oxframe — motion graphics your AI agent can see'),
  );
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
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content={String(picture?.width ?? 1200)} />
  <meta property="og:image:height" content={String(picture?.height ?? 630)} />
  <meta property="og:image:alt" content={imageAlt} />
  {#if video}
    <meta property="og:video" content={video.url} />
    <meta property="og:video:type" content="video/mp4" />
    <meta property="og:video:width" content={String(video.width)} />
    <meta property="og:video:height" content={String(video.height)} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@{X_HANDLE}" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={image} />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON-LD built from our own data -->
  {#each ld as s, i (i)}{@html s}{/each}
</svelte:head>
