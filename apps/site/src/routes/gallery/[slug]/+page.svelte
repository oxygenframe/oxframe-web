<script lang="ts">
  // One gallery example: the video, the brief, the parts of oxframe it uses
  // (with their docs), the source and the way into the playground.
  import Seo from '$lib/components/Seo.svelte';
  import ExampleVideo from '$lib/components/ExampleVideo.svelte';
  import { galleryItem, galleryItems, slugOf } from '$lib/gallery';
  import { mediaFor, videoObject } from '$lib/media';
  import { SITE } from '$lib/site';
  import { SDK_VERSION } from '$lib/sdk';
  import { track } from '$lib/track';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const item = $derived(galleryItem(data.name)!);
  const media = $derived(mediaFor(data.name));
  const url = $derived(`${SITE}/gallery/${slugOf(data.name)}`);
  const github = $derived(
    `https://github.com/oxygenframe/oxframe-sdk/blob/main/examples/src/${data.name}.rs`,
  );
  // Other examples with a tag in common, then the rest, three in all.
  const related = $derived(
    [
      ...galleryItems.filter(
        (i) => i.name !== item.name && i.tags.some((t) => item.tags.includes(t)),
      ),
      ...galleryItems.filter((i) => i.name !== item.name),
    ]
      .filter((i, n, all) => all.findIndex((j) => j.name === i.name) === n)
      .slice(0, 3),
  );
  const description = $derived(
    item.prompt.length < 110
      ? `${item.prompt} Watch it, read the Rust source and open it in the playground.`
      : item.prompt,
  );
  const jsonld = $derived(
    [
      videoObject(item.name, item.title, item.prompt),
      {
        '@type': 'SoftwareSourceCode',
        name: `${item.title} (oxframe example ${item.name})`,
        description: item.prompt,
        programmingLanguage: 'Rust',
        codeRepository: 'https://github.com/oxygenframe/oxframe-sdk',
        url: github,
        license: 'https://opensource.org/licenses/MIT',
        runtimePlatform: `oxframe ${SDK_VERSION}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Gallery', item: `${SITE}/gallery` },
          { '@type': 'ListItem', position: 2, name: item.title, item: url },
        ],
      },
    ].filter((d): d is object => d !== null),
  );
</script>

<Seo
  title="{item.title} in Rust — oxframe"
  {description}
  {jsonld}
  image={media
    ? {
        url: SITE + media.poster,
        width: media.width,
        height: media.height,
        alt: `${item.title}: a frame of the video rendered by oxframe`,
      }
    : undefined}
  video={media ? { url: SITE + media.mp4, width: media.width, height: media.height } : undefined}
/>

<nav class="crumb" aria-label="Breadcrumb"><a href="/gallery">Gallery</a> ›</nav>
<h1>{item.title}</h1>
<p class="tags">{item.tags.join(' · ')}</p>

{#if media}
  <ExampleVideo {media} title={item.title} />
{/if}

<p class="brief"><strong>The brief.</strong> {item.prompt}</p>
<p class="actions">
  <a class="btn primary" href="/playground?ex={item.name}" onclick={() => track('Open playground')}
    >Open in the playground</a
  >
  <a class="btn" href={github} rel="external">Source on GitHub</a>
</p>

{#if data.uses.length}
  <h2>What it uses</h2>
  <ul class="uses">
    {#each data.uses as u (u.label)}
      <li><a href={u.href}>{u.label}</a></li>
    {/each}
  </ul>
{/if}

<h2>The code</h2>
<p>
  <code>examples/src/{item.name}.rs</code> in oxframe-sdk, for oxframe {SDK_VERSION}. In the
  playground it compiles in the browser and you can change it.
</p>
<!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time from the example file -->
{@html data.code}

<h2>More examples</h2>
<ul class="more">
  {#each related as r (r.name)}
    {@const m = mediaFor(r.name)}
    <li>
      <a href="/gallery/{slugOf(r.name)}">
        {#if m}<img src={m.poster} width={m.width} height={m.height} loading="lazy" alt="" />{/if}
        <span>{r.title}</span>
      </a>
    </li>
  {/each}
</ul>

<style>
  .crumb {
    font-size: 14px;
    color: var(--muted);
  }
  .crumb a {
    color: var(--muted);
  }
  h1 {
    margin-bottom: 4px;
  }
  .tags {
    margin: 0 0 16px;
    color: var(--muted);
    font-size: 14px;
  }
  .brief {
    max-width: 68ch;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .uses {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0;
    list-style: none;
  }
  .uses a {
    display: inline-block;
    padding: 4px 12px;
    border: 1px solid var(--border);
    border-radius: 999px;
    color: var(--text);
    font-size: 14px;
    text-decoration: none;
  }
  .uses a:hover {
    border-color: var(--muted);
  }
  .more {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 0;
    list-style: none;
  }
  .more a {
    display: block;
    color: var(--text);
    text-decoration: none;
  }
  .more img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .more span {
    display: block;
    margin-top: 6px;
    font-size: 14px;
  }
</style>
