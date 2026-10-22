<script lang="ts">
  // Open benchmarks: render speed of one scene in each tool (from
  // bench/vs/measure.sh, vs-measurements.json) and the agent success rate on
  // the reference prompts (oxframe-cli/evals, measurements.json). Every number
  // has a date and a script, and other engines' authors are invited to send a PR.
  import Seo from '$lib/components/Seo.svelte';
  import vs from '$lib/vs-measurements.json';
  import { measurements } from '$lib/measurements';

  const a7 = measurements.a7;

  type Row = {
    name: string;
    slug: string | null;
    version: string;
    videoSeconds: number;
    seconds: number;
    oxframe: { seconds: number; cpuSeconds: number };
  };
  const speed: Row[] = [
    { name: 'Remotion', slug: 'remotion', ...vs.remotion },
    { name: 'HyperFrames', slug: 'hyperframes', ...vs.hyperframes },
    { name: 'Revideo', slug: 'revideo', ...vs.revideo },
    { name: 'Manim', slug: 'manim', ...vs.manim },
  ];
  const s = (n: number) => `${n.toFixed(2)} s`;
</script>

<Seo
  title="Open benchmarks: render speed and agent success — oxframe"
  description="How fast oxframe renders next to Remotion, HyperFrames, Revideo and Manim, and how often a coding agent gets a scene right — every number dated, with its script."
  jsonld={[
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'oxframe benchmarks: render speed and agent success',
      description:
        'Render time of one scene in oxframe and other code-video tools, and the pass rate of a coding agent on oxframe reference prompts.',
      creator: { '@type': 'Organization', name: 'oxframe' },
      dateModified: measurements.date,
      url: 'https://oxframe.dev/benchmarks',
    },
  ]}
/>

<h1>Benchmarks</h1>
<p class="lead">
  Two things decide whether video-as-code is worth it: how fast a render is, and how often an agent
  gets the scene right without a human. Both are measured here on one machine, each with a date and
  a script you can run. The scripts are open; if you maintain another engine and the numbers are
  stale or unfair, send a pull request.
</p>

<h2>Render speed</h2>
<p>
  The same scene written in each tool and in oxframe, rendered at 1920 × 1080. Wall time of the
  render command, median of three runs after a warm-up, {vs.date}, on {vs.machine}. oxframe renders
  on the GPU by default; <code>--cpu</code> forces the software renderer so the number does not depend
  on the graphics card.
</p>
<div class="scroll">
  <table>
    <thead>
      <tr>
        <th>Scene from</th>
        <th>Video</th>
        <th>That tool</th>
        <th>oxframe (GPU)</th>
        <th>oxframe (CPU)</th>
      </tr>
    </thead>
    <tbody>
      {#each speed as r (r.name)}
        <tr>
          <td>
            {#if r.slug}<a href="/vs/{r.slug}">{r.name}</a>{:else}{r.name}{/if}
            <span class="v">{r.version}</span>
          </td>
          <td>{r.videoSeconds.toFixed(1)} s</td>
          <td>{s(r.seconds)}</td>
          <td>{s(r.oxframe.seconds)}</td>
          <td>{s(r.oxframe.cpuSeconds)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
<p class="note">
  Each row is a different scene, so compare a tool with oxframe across a row, not one row with
  another. fframes is not timed here yet — it needs codec development packages the benchmark machine
  lacks — and Motion Canvas has no headless render to time. A batch of {vs.csv.rows} personalised cards,
  {vs.csv.videoSeconds} s each, renders in {s(vs.csv.seconds)} on the CPU, one after another.
</p>
<p>
  Script: <a href="https://github.com/oxygenframe/oxframe-web/blob/main/{vs.script}"
    ><code>{vs.script}</code></a
  >. Each tool's version is in the table; the full command per tool is in
  <a
    href="https://github.com/oxygenframe/oxframe-web/blob/main/apps/site/src/lib/vs-measurements.json"
    ><code>vs-measurements.json</code></a
  >.
</p>

<h2>Agent success</h2>
<p>
  The harder question for an AI agent is not speed but whether it gets the scene right. The
  reference set is {a7.prompts} prompts — algorithms, charts, code walkthroughs, shaders, slides, voice
  and vertical formats — each given to {a7.agent} in a fresh <code>oxframe init</code> project. A
  prompt passes when the scene builds, <code>oxframe check</code> reports no error, and the scene does
  what the prompt asked.
</p>
<div class="numbers">
  <article>
    <p class="figure">{Math.round(a7.passRate * 100)}%</p>
    <h3>Passed</h3>
    <p>{a7.passed} of {a7.prompts} prompts, end to end.</p>
  </article>
  <article>
    <p class="figure">{Math.round(a7.buildRate * 100)}%</p>
    <h3>Built</h3>
    <p>Every scene the agent wrote compiled.</p>
  </article>
  <article>
    <p class="figure">{a7.meanTurns}</p>
    <h3>Turns, median run</h3>
    <p>Mean agent turns to finish a prompt.</p>
  </article>
  <article>
    <p class="figure">{a7.meanMinutes} min</p>
    <h3>Per prompt</h3>
    <p>Mean wall time, including the build and <code>oxframe check</code>.</p>
  </article>
</div>
<p class="note">
  oxframe {a7.version}, {a7.date}. The {a7.prompts - a7.passed} misses are the useful part: the agent
  did not reach for the <code>Code</code> component on one, forgot the 9:16 aspect on two vertical
  prompts, and left one <code>check</code> warning on another — each a gap in the skills or docs to close
  next.
</p>
<p>
  Script: <a href={a7.scriptUrl}><code>evals/run.py</code></a> in oxframe-cli, with the prompts
  beside it. It runs any agent (<code>--agent 'cmd:…'</code>), so the same set can time another tool
  once its skill exists — that cross-tool table is the open invitation above.
</p>

<style>
  .lead,
  .note {
    max-width: 68ch;
    color: var(--muted);
  }
  .note {
    font-size: 15px;
  }
  .scroll {
    overflow-x: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    min-width: 520px;
    margin: 8px 0 4px;
  }
  th,
  td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  th {
    font-size: 14px;
    color: var(--muted);
    font-weight: 600;
  }
  .v {
    color: var(--muted);
    font-size: 13px;
    margin-left: 6px;
  }
  .numbers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin: 12px 0;
  }
  .numbers article {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
  }
  .figure {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
  }
  .numbers h3 {
    margin: 4px 0;
    font-size: 15px;
  }
  .numbers p {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
  }
</style>
