<script lang="ts">
  // oxframe next to one other tool: when to pick which, a dated table, one
  // scene in both with its render time, migration and an FAQ.
  import Seo from '$lib/components/Seo.svelte';
  import { code } from '$lib/migrate';
  import { SITE } from '$lib/site';
  import { CHECKED, vsPage, vsPages } from '$lib/vs';
  import measurements from '$lib/vs-measurements.json';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const p = $derived(vsPage(data.slug)!);
  const bench = $derived(p.scene?.bench ? measurements[p.scene.bench] : undefined);
  const checked = new Date(`${CHECKED}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const others = $derived(vsPages.filter((o) => o.slug !== p.slug));
  // FAQ answers are plain text, so they go into JSON-LD as they are.
  const jsonld = $derived([
    {
      '@type': 'FAQPage',
      mainEntity: p.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Compare', item: `${SITE}/compare` },
        {
          '@type': 'ListItem',
          position: 2,
          name: `oxframe vs ${p.name}`,
          item: `${SITE}/vs/${p.slug}`,
        },
      ],
    },
  ]);
  const s = (n: number) => `${n.toFixed(2)} s`;
</script>

<Seo title="{p.title} — oxframe" description={p.description} type="article" {jsonld} />

<nav class="crumb" aria-label="Breadcrumb"><a href="/compare">Compare</a> ›</nav>
<h1>oxframe vs {p.name}</h1>
<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text from src/lib/vs.ts -->
<p class="lead">{@html p.lead}</p>

<h2>At a glance</h2>
<div class="table">
  <table>
    <caption>Checked against the sources below on {checked}.</caption>
    <thead>
      <tr><th scope="col"></th><th scope="col">oxframe</th><th scope="col">{p.name}</th></tr>
    </thead>
    <tbody>
      {#each p.rows as [label, ours, theirs] (label)}
        <tr>
          <th scope="row">{label}</th>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text -->
          <td>{@html ours}</td>
          <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text -->
          <td>{@html theirs}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#if p.scene}
  <h2>One scene in both</h2>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text -->
  <p>{@html p.scene.intro}</p>
  <div class="pair">
    <div>
      <h3>{p.name}</h3>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time -->
      {@html code(p.scene.theirs)}
    </div>
    <div>
      <h3>oxframe</h3>
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time -->
      {@html code(p.scene.ours)}
    </div>
  </div>
  {#if bench}
    <h3>Render time</h3>
    <div class="table">
      <table class="times">
        <caption>
          {bench.videoSeconds} s of 1920 × 1080 video, median of three runs after a warm-up, {measurements.date},
          {measurements.machine}.
        </caption>
        <thead>
          <tr><th scope="col">Tool</th><th scope="col">Command</th><th scope="col">Time</th></tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{p.name} {bench.version}</th>
            <td><code>{bench.command}</code></td>
            <td>{s(bench.seconds)}</td>
          </tr>
          <tr>
            <th scope="row">oxframe {bench.oxframe.version}</th>
            <td><code>render --cpu</code></td>
            <td>{s(bench.oxframe.cpuSeconds)}</td>
          </tr>
          <tr>
            <th scope="row">oxframe {bench.oxframe.version}</th>
            <td><code>render</code> (GPU)</td>
            <td>{s(bench.oxframe.seconds)}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="note">
      Each time is the whole render command, start to file. oxframe's scene is already compiled;
      after a one-line edit, <code>cargo build</code> adds about 0.6 s. On a scene this short the
      GPU spends more time starting than drawing, so the CPU renderer wins. The script is
      <a href="https://github.com/oxygenframe/oxframe-web/blob/main/{measurements.script}"
        ><code>{measurements.script}</code></a
      >: run it to time both on your machine.
    </p>
  {/if}
{/if}

{#each p.sections as section (section.heading)}
  <h2>{section.heading}</h2>
  <div class="prose">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text from src/lib/vs.ts -->
    {@html section.html}
  </div>
{/each}

{#if p.example}
  <h2>{p.example.heading}</h2>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text -->
  <p>{@html p.example.intro}</p>
  <div class="pair">
    {#each p.example.files as file (file)}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time -->
      <div>{@html code(file)}</div>
    {/each}
  </div>
  {#if p.slug === 'cloud-video-apis'}
    <p>
      On the benchmark machine the loop renders {measurements.csv.rows} cards of
      {measurements.csv.videoSeconds} s each, 1080p at 60 fps, in {s(measurements.csv.seconds)} on the
      CPU, one after another ({measurements.date}).
    </p>
  {/if}
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text -->
  <p>{@html p.example.outro}</p>
{/if}

<h2>When to pick {p.name}</h2>
<ul>
  {#each p.pickThem as item (item)}<li>{item}</li>{/each}
</ul>

<h2>When to pick oxframe</h2>
<ul>
  {#each p.pickOxframe as item (item)}<li>{item}</li>{/each}
</ul>

{#if p.migrate}
  <h2>Moving from {p.name}</h2>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own text -->
  <p>{@html p.migrate}</p>
{/if}

<h2>FAQ</h2>
{#each p.faq as f (f.q)}
  <h3>{f.q}</h3>
  <p>{f.a}</p>
{/each}

<h2>Sources</h2>
<p class="note">
  Checked on {checked}. Found something out of date? Open an issue on
  <a href="https://github.com/oxygenframe/oxframe-web/issues">oxframe-web</a>.
</p>
<ul class="sources">
  {#each p.sources as src (src.url)}
    <li><a href={src.url} rel="external">{src.label}</a></li>
  {/each}
</ul>

<h2>Other comparisons</h2>
<ul class="others">
  {#each others as o (o.slug)}
    <li><a href="/vs/{o.slug}">oxframe vs {o.name}</a></li>
  {/each}
  <li><a href="/alternatives/remotion">Remotion alternatives</a></li>
</ul>

<p><a class="btn primary" href="/docs/getting-started">Get started with oxframe</a></p>

<style>
  .crumb {
    font-size: 14px;
    color: var(--muted);
  }
  .crumb a {
    color: var(--muted);
  }
  .lead {
    max-width: 68ch;
    font-size: 18px;
  }
  .table {
    overflow-x: auto;
    max-width: 100%;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
  }
  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 560px;
  }
  caption {
    caption-side: bottom;
    text-align: left;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--muted);
  }
  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }
  tbody th {
    white-space: nowrap;
  }
  .times td:last-child {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
    gap: 16px;
    min-width: 0;
  }
  .pair > div {
    min-width: 0;
  }
  .pair :global(pre) {
    overflow-x: auto;
    font-size: 13px;
  }
  .prose {
    max-width: 100%;
    overflow-x: auto;
  }
  .prose :global(table) {
    border-collapse: collapse;
    min-width: 560px;
  }
  .prose :global(th),
  .prose :global(td) {
    text-align: left;
    vertical-align: top;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .prose :global(pre) {
    overflow-x: auto;
  }
  .note {
    color: var(--muted);
    font-size: 14px;
    max-width: 68ch;
  }
  .others {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    padding: 0;
    list-style: none;
  }
</style>
