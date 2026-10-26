<script lang="ts">
  // "Best Remotion alternatives": the tools people move to from Remotion,
  // with what each is good at and a comparison page where we have one.
  import Seo from '$lib/components/Seo.svelte';
  import { remotionAlternatives as list } from '$lib/alternatives';
  import { SITE } from '$lib/site';
  import { CHECKED, vsPage } from '$lib/vs';
  import m from '$lib/vs-measurements.json';

  const checked = new Date(`${CHECKED}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const faq = [
    {
      q: 'Is there a free Remotion alternative for companies?',
      a: 'Yes. oxframe (MIT or Apache-2.0), HyperFrames (Apache-2.0), Revideo, Motion Canvas, fframes and Manim (all MIT) are free for companies of any size. Remotion is free for individuals, non-profits and companies of up to three people.',
    },
    {
      q: 'Which Remotion alternative renders without a browser?',
      a: 'oxframe, fframes and Manim draw frames themselves. HyperFrames and Revideo, like Remotion, render in a headless browser, and Motion Canvas renders in its browser editor.',
    },
    {
      q: 'Which alternative is closest to Remotion for an AI agent?',
      a: 'HyperFrames if the agent should write HTML; oxframe if the agent should check its own frames, since oxframe check returns a JSON report of what is wrong with the node and the time of each problem.',
    },
    {
      q: 'Can I keep using React?',
      a: 'Among these, no: HyperFrames uses HTML and JavaScript, Revideo and Motion Canvas use TypeScript with their own JSX nodes, and oxframe and fframes use Rust. If React components are the point, Remotion is the tool.',
    },
    {
      q: 'Who wrote this list?',
      a: 'The oxframe team, so oxframe is first. Every other entry links to its source, and corrections are welcome as issues on oxframe-web.',
    },
  ];
  const jsonld = [
    {
      '@type': 'ItemList',
      name: 'Remotion alternatives',
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
  title="Best Remotion alternatives in 2026, compared — oxframe"
  description="Remotion alternatives in 2026: oxframe, HyperFrames, Revideo, Motion Canvas, fframes, Manim and cloud APIs, with licenses, renderers and measured render times."
  type="article"
  {jsonld}
/>

<nav class="crumb" aria-label="Breadcrumb"><a href="/alternatives">Alternatives</a> ›</nav>
<h1>Remotion alternatives in 2026</h1>
<p class="lead">
  Remotion renders React in a headless browser and asks companies above three people for a license.
  People leave it for one of three reasons: the license, the browser in the render, or a language
  other than React. Here is where they go, and what each tool is good at. This list is by the
  oxframe team, so oxframe comes first; the facts were checked on {checked}.
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

<h2>The same scene in three tools</h2>
<p>
  The scene from the <a href="/docs/migrate/remotion">Remotion migration guide</a>, a title and a
  counter, {m.remotion.videoSeconds} s at 1080p, rendered by Remotion, by HyperFrames (as HTML and GSAP)
  and by oxframe on one laptop:
</p>
<div class="table">
  <table class="times">
    <caption>
      Median of three runs after a warm-up, {m.date}, {m.machine}. Script:
      <code>{m.script}</code>.
    </caption>
    <thead>
      <tr><th scope="col">Tool</th><th scope="col">Render time</th></tr>
    </thead>
    <tbody>
      <tr
        ><th scope="row">Remotion {m.remotion.version}</th><td>{m.remotion.seconds.toFixed(2)} s</td
        ></tr
      >
      <tr
        ><th scope="row">HyperFrames {m.hyperframes.version}</th><td
          >{m.hyperframes.seconds.toFixed(2)} s</td
        ></tr
      >
      <tr
        ><th scope="row">oxframe {m.remotion.oxframe.version}, CPU</th><td
          >{m.remotion.oxframe.cpuSeconds.toFixed(2)} s</td
        ></tr
      >
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

<h2>When to stay on Remotion</h2>
<p>
  Stay when your team writes React and wants HTML, CSS and Lottie in the frame, when you fit its
  free license, or when you render at scale on Lambda and value a mature toolkit over a cheaper one.
  The
  <a href="/vs/remotion">full comparison</a> covers the license in detail.
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
  .times {
    min-width: 0;
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
  .times td {
    font-variant-numeric: tabular-nums;
  }
</style>
