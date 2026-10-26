<script lang="ts">
  // "Motion Canvas alternatives": where people go now that Motion Canvas has
  // had no release since December 2024, with what each tool is good at.
  import Seo from '$lib/components/Seo.svelte';
  import { MOTION_CANVAS_CHECKED, motionCanvasAlternatives as list } from '$lib/alternatives';
  import { SITE } from '$lib/site';
  import { vsPage } from '$lib/vs';

  const checked = new Date(`${MOTION_CANVAS_CHECKED}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const faq = [
    {
      q: 'Is Motion Canvas still maintained?',
      a: 'Its last release is v3.17.2 from December 2024, and its main branch has had one commit since February 2025, a docs domain change in July 2026. An open issue asks whether the repository is dead. There is no statement that the project has ended.',
    },
    {
      q: 'Which alternative keeps my Motion Canvas code?',
      a: 'Canvas Commons, a community fork, keeps the same TypeScript API. Revideo is a fork too, with headless rendering added; its scenes stay close to Motion Canvas.',
    },
    {
      q: 'Which alternative renders without the browser editor?',
      a: 'oxframe renders from its CLI with its own renderer, on any machine or CI. Revideo renders from Node in a headless browser, Remotion in Chrome Headless Shell, and Manim with Cairo or OpenGL.',
    },
    {
      q: 'How close is oxframe to Motion Canvas?',
      a: 'The model is the same: signals, a scene that runs as time passes, all and sequences, an editor with a timeline. Generators become async functions and yield* becomes .await; the migration guide ports a scene line by line.',
    },
    {
      q: 'Who wrote this list?',
      a: 'The oxframe team, so oxframe is first. Every other entry links to its source, and corrections are welcome as issues on oxframe-web.',
    },
  ];
  const jsonld = [
    {
      '@type': 'ItemList',
      name: 'Motion Canvas alternatives',
      itemListElement: list.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: a.name,
        url: a.vs ? `${SITE}/vs/${a.vs}` : a.url,
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];
</script>

<Seo
  title="Motion Canvas alternatives in 2026, compared — oxframe"
  description="Motion Canvas alternatives in 2026: oxframe, Canvas Commons, Revideo, Midrender, Remotion and Manim, with licenses, how each renders and what each is good at."
  type="article"
  {jsonld}
/>

<nav class="crumb" aria-label="Breadcrumb"><a href="/alternatives">Alternatives</a> ›</nav>
<h1>Motion Canvas alternatives in 2026</h1>
<p class="lead">
  Motion Canvas made animation with signals and generators popular, but it has had no release since
  December 2024 and renders only from its browser editor. People look for something that is
  maintained, renders on a server, or works with an AI agent. Here is where they go. This list is by
  the oxframe team, so oxframe comes first; the facts were checked on {checked}.
</p>

<h2>At a glance</h2>
<div class="table">
  <table>
    <thead>
      <tr>
        <th scope="col">Tool</th>
        <th scope="col">License</th>
        <th scope="col">Renders with</th>
        <th scope="col">Best for</th>
      </tr>
    </thead>
    <tbody>
      {#each list as a (a.name)}
        <tr>
          <th scope="row">{a.name}</th>
          <td>{a.license}</td>
          <td>{a.renders}</td>
          <td>{a.bestFor}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

{#each list as a (a.name)}
  <h2>{a.name}</h2>
  <p>{a.what}</p>
  <ul>
    <li><strong>License:</strong> {a.license}.</li>
    <li><strong>Renders with:</strong> {a.renders}.</li>
    <li><strong>Best for:</strong> {a.bestFor}.</li>
    <li><strong>Watch out for:</strong> {a.watchOut}</li>
  </ul>
  <p>
    {#if a.vs}<a href="/vs/{a.vs}">oxframe vs {vsPage(a.vs)?.name ?? a.name}</a> ·
    {/if}<a href={a.url} rel="external">{a.name} source</a>
  </p>
{/each}

<h2>Moving a scene over</h2>
<p>
  The <a href="/docs/migrate/motion-canvas">Motion Canvas migration guide</a> ports a scene to
  oxframe line by line: generators become async functions, <code>yield*</code> becomes
  <code>.await</code>, and signals stay signals. Try the result in the
  <a href="/playground">playground</a> without installing anything.
</p>

<h2>When to stay on Motion Canvas</h2>
<p>
  Stay when your scenes work, you render them by hand from the editor, and you do not need new
  features. The <a href="/vs/motion-canvas">full comparison</a> covers the differences in detail.
</p>

<h2>FAQ</h2>
{#each faq as f (f.q)}
  <h3>{f.q}</h3>
  <p>{f.a}</p>
{/each}

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
    min-width: 640px;
  }
  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }
</style>
