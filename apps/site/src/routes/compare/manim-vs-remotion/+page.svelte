<script lang="ts">
  // "Manim vs Remotion": the two tools people weigh first for video from code,
  // compared with each other, then oxframe as a third option. Facts come from
  // the same sources as /vs/manim and /vs/remotion (lib/vs.ts).
  import Seo from '$lib/components/Seo.svelte';
  import { CHECKED } from '$lib/vs';

  const checked = new Date(`${CHECKED}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  // Criterion, Manim, Remotion, oxframe.
  const rows: [string, string, string, string][] = [
    ['Language', 'Python', 'React (TypeScript or JavaScript)', 'Rust'],
    [
      'How a frame is drawn',
      'Cairo, or OpenGL',
      'A React tree in Chrome Headless Shell',
      'Its own renderer, CPU or GPU',
    ],
    [
      'Made for',
      'Math and science explainers',
      'Video as a web app: templates, data, personalized clips',
      'Motion graphics written and checked by AI agents',
    ],
    [
      'Formulas',
      'LaTeX, and Typst as an optional extra',
      'Any web library the browser runs',
      'Typst, with a bundled font',
    ],
    ['HTML, CSS, Lottie', 'No', 'Yes', 'No'],
    ['Live preview', 'No timeline editor', 'Remotion Studio', 'oxframe dev, with a timeline'],
    [
      'Install',
      'Python with Cairo and Pango; LaTeX for formulas',
      'Node.js; Chrome Headless Shell on first render',
      'Rust (ffmpeg is downloaded if missing), or nothing in the browser playground',
    ],
    [
      'Rendering at scale',
      'One machine',
      'Lambda and Cloud Run',
      'Parallel jobs on one machine, same bytes for any count',
    ],
    [
      'License',
      'MIT',
      'Source-available: free up to 3 people, a company license above that',
      'MIT or Apache-2.0',
    ],
    [
      'Community',
      'Large, years of 3Blue1Brown-style scenes',
      'Large, years in production',
      'New, pre-1.0',
    ],
  ];
  const faq = [
    {
      q: 'Is Manim or Remotion better?',
      a: 'Neither in general. Manim is better for math: equations, plots and geometry, written in Python. Remotion is better when the video is a web page that moves: React components, CSS, data from an API, many personalized renders.',
    },
    {
      q: 'Can Remotion make 3Blue1Brown-style videos?',
      a: 'It can draw anything a browser draws, so with SVG, a plotting library and KaTeX or MathJax you can build such a scene. Manim gives you those parts ready: axes, plots, transforms and LaTeX in one API.',
    },
    {
      q: 'Can Manim make product or marketing videos?',
      a: 'It can, but it has no HTML or CSS, no Lottie and no timeline editor, and its parts are built for math. Most product videos made from code use Remotion or a similar tool.',
    },
    {
      q: 'Which one is free for a company?',
      a: 'Manim is MIT, free for anyone. Remotion is free for individuals, non-profits and companies of up to three people; above that a company needs a license, per seat or per render.',
    },
    {
      q: 'Which one works better with an AI coding agent?',
      a: 'Both can be written by an agent, but in both the agent has to render frames to see what it made. oxframe was built for that loop: oxframe check renders a storyboard and reports problems in the frames as JSON, with the line to fix.',
    },
  ];
  const jsonld = [
    {
      '@type': 'Article',
      headline: 'Manim vs Remotion',
      dateModified: CHECKED,
      author: { '@type': 'Organization', name: 'oxframe', url: 'https://oxframe.dev' },
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
  title="Manim vs Remotion: math animation or React video? — oxframe"
  description="Manim vs Remotion, checked {checked}: Python and math vs React and the browser, formulas, install, license and rendering at scale, and when a third tool fits."
  type="article"
  {jsonld}
/>

<nav class="crumb" aria-label="Breadcrumb"><a href="/compare">Compare</a> ›</nav>
<h1>Manim vs Remotion</h1>
<p class="lead">
  Both make video from code, but they come from different places. Manim is a Python library for math
  animation, the one behind 3Blue1Brown. Remotion renders React components in a browser, frame by
  frame. Pick Manim when the video explains math; pick Remotion when the video is a web page that
  moves. This page is by the oxframe team, so oxframe is the third column; the facts were checked in
  {checked}.
</p>

<h2>At a glance</h2>
<div class="table">
  <table>
    <thead>
      <tr>
        <th scope="col"></th>
        <th scope="col">Manim</th>
        <th scope="col">Remotion</th>
        <th scope="col">oxframe</th>
      </tr>
    </thead>
    <tbody>
      {#each rows as row (row[0])}
        <tr>
          <th scope="row">{row[0]}</th>
          <td>{row[1]}</td>
          <td>{row[2]}</td>
          <td>{row[3]}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<h2>When Manim is the right tool</h2>
<p>
  Manim's parts are made for explaining math: number planes, function plots, vectors, matrices,
  <code>Transform</code> between shapes, and formulas typeset by LaTeX. A scene is a Python class, so
  NumPy and SciPy are a line away. Years of 3Blue1Brown-style scenes, plugins and answers mean most things
  you want to show have been shown before.
</p>
<p>
  The costs: an install with Cairo, Pango and a LaTeX distribution; no timeline editor, so you
  retime by editing code and rendering again; and parts that fit lectures better than product
  videos.
</p>

<h2>When Remotion is the right tool</h2>
<p>
  Remotion is React: components, props, CSS, web fonts, Lottie, anything a browser draws. That makes
  it strong for templated and data-driven video, such as a year-in-review for each user or a clip
  per product, rendered in parallel on AWS Lambda or Cloud Run. Remotion Studio previews the video
  with a timeline.
</p>
<p>
  The costs: every frame goes through Chrome, which is slower to start and heavier to run in CI; and
  the license. Remotion is source-available, free for individuals, non-profits and companies of up
  to three people. Above that a company pays per seat ($25 a month) or per render ($0.01, with a
  $100 monthly minimum); the <a href="/vs/remotion">oxframe vs Remotion</a> page quotes the terms.
</p>

<h2>Where they overlap</h2>
<p>
  Charts, diagrams, animated text and explainers can be made in either. Choose by your team's
  language, whether the video needs browser content, and where it renders: Manim on one machine from
  Python, Remotion in Chrome from Node.
</p>

<h2>A third option: oxframe</h2>
<p>
  oxframe sits between the two. Like Manim it draws frames itself, with axes, plots, matrices, path
  morphing and <a href="/docs/formulas">formulas set by Typst</a>, and needs no browser. Like
  Remotion it has a live editor with a timeline and makes product videos: code walkthroughs,
  captions, voice, 16:9, 9:16 and 1:1 from one scene. It is MIT or Apache-2.0 with no telemetry.
</p>
<p>
  Its main case is AI agents: <code>oxframe check</code> renders a storyboard and reports what is
  wrong in the frames as JSON, so an agent can fix a scene before anyone watches it. It is new and
  its API still changes. Try a scene in the <a href="/playground">playground</a> with nothing to
  install, or read the one-to-one pages: <a href="/vs/manim">oxframe vs Manim</a> and
  <a href="/vs/remotion">oxframe vs Remotion</a>, each with one scene timed in both tools.
</p>
<p>
  Coming from either one, the <a href="/docs/migrate/manim">Manim migration guide</a> and the
  <a href="/docs/migrate/remotion">Remotion migration guide</a> port a scene line by line.
</p>

<h2>FAQ</h2>
{#each faq as f (f.q)}
  <h3>{f.q}</h3>
  <p>{f.a}</p>
{/each}

<h2>Sources</h2>
<ul>
  <li>
    <a href="https://github.com/ManimCommunity/manim" rel="external">Manim Community on GitHub</a>
  </li>
  <li>
    <a href="https://docs.manim.community/en/stable/installation.html" rel="external"
      >Manim installation</a
    >
  </li>
  <li><a href="https://github.com/remotion-dev/remotion" rel="external">Remotion on GitHub</a></li>
  <li><a href="https://www.remotion.pro/license" rel="external">Remotion pricing</a></li>
  <li>
    <a href="https://www.remotion.dev/docs/license/faq" rel="external">Remotion license FAQ</a>
  </li>
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
    min-width: 760px;
  }
  th,
  td {
    text-align: left;
    vertical-align: top;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
  }
</style>
