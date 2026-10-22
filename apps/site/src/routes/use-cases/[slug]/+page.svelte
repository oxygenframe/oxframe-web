<script lang="ts">
  // One use case: a video of it, how such a video is built, a prompt for an
  // agent, and the gallery examples to start from.
  import Seo from '$lib/components/Seo.svelte';
  import ExampleVideo from '$lib/components/ExampleVideo.svelte';
  import { INSTALL_SKILLS } from '$lib/agents';
  import { galleryItem, slugOf } from '$lib/gallery';
  import { mediaFor, videoObject } from '$lib/media';
  import { SITE } from '$lib/site';
  import { useCaseBySlug } from '$lib/use-cases';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const u = $derived(useCaseBySlug(data.slug)!);
  const lead = $derived(u.examples[0]!);
  const leadItem = $derived(galleryItem(lead)!);
  const media = $derived(mediaFor(lead));
  const jsonld = $derived(
    [
      videoObject(lead, leadItem.title, leadItem.prompt),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Use cases', item: `${SITE}/use-cases` },
          { '@type': 'ListItem', position: 2, name: u.name, item: `${SITE}/use-cases/${u.slug}` },
        ],
      },
    ].filter((d): d is object => d !== null),
  );
</script>

<Seo title="{u.title} — oxframe" description={u.description} {jsonld} />

<nav class="crumb" aria-label="Breadcrumb"><a href="/use-cases">Use cases</a> ›</nav>
<h1>{u.name}</h1>
<p class="lead">{u.lead}</p>

{#if media}
  <figure>
    <ExampleVideo {media} title={leadItem.title} />
    <figcaption>
      {leadItem.title}. <a href="/gallery/{slugOf(lead)}">The code of this video</a>
    </figcaption>
  </figure>
{/if}

<h2>How it is built</h2>
<ul>
  {#each u.points as p (p)}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text from src/lib/use-cases.ts -->
    <li>{@html p}</li>
  {/each}
</ul>

{#if u.slug === 'release-videos'}
  <h2>The workflow</h2>
  <p>Add this to <code>.github/workflows/release-video.yml</code>:</p>
  <pre><code
      >{`on:
  release:
    types: [published]
jobs:
  video:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: oxygenframe/release-video-action@v1
        with:
          portrait: false`}</code
    ></pre>
  <p>
    A release made by a workflow with <code>GITHUB_TOKEN</code> does not start
    <code>on: release</code>; pass <code>tag: $&#123;&#123; github.ref_name &#125;&#125;</code> in
    the job that creates it instead. Every oxframe release gets its video this way: see the
    <a href="/changelog">changelog</a>.
  </p>
{/if}

<h2>With an agent</h2>
<p>
  Install the skills, then give your agent a first prompt. The
  <a href="/agents/skills/{u.skill}">{u.skill} skill</a> tells it how videos of this kind are made,
  and <code>oxframe check</code> shows it what is wrong before anything is rendered.
</p>
<pre><code>{INSTALL_SKILLS}</code></pre>
<blockquote class="prompt">{u.prompt}</blockquote>

<h2>Start from an example</h2>
<ul class="examples">
  {#each u.examples as name (name)}
    {@const item = galleryItem(name)}
    {@const m = mediaFor(name)}
    {#if item}
      <li>
        <a href="/gallery/{slugOf(name)}">
          {#if m}<img src={m.poster} width={m.width} height={m.height} loading="lazy" alt="" />{/if}
          <span>{item.title}</span>
        </a>
      </li>
    {/if}
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
  .lead {
    color: var(--muted);
    max-width: 68ch;
  }
  figure {
    margin: 16px 0 8px;
  }
  figcaption {
    margin-top: 6px;
    font-size: 14px;
    color: var(--muted);
  }
  .prompt {
    margin: 12px 0;
    padding: 10px 16px;
    border-left: 3px solid var(--accent);
    background: var(--panel);
    border-radius: 0 8px 8px 0;
  }
  .examples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 0;
    list-style: none;
  }
  .examples a {
    display: block;
    color: var(--text);
    text-decoration: none;
  }
  .examples img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .examples span {
    display: block;
    margin-top: 6px;
    font-size: 14px;
  }
</style>
