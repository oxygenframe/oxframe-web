<script lang="ts">
  import ExampleVideo from '$lib/components/ExampleVideo.svelte';
  import Seo from '$lib/components/Seo.svelte';
  import { measurements } from '$lib/measurements';
  import { mediaFor } from '$lib/media';

  const a7 = measurements.a7;
  const release = mediaFor('release')!;

  const faq = [
    [
      'Is oxframe an AI video generator like Sora or Veo?',
      'No. Those models draw the pixels of a clip from a prompt. With oxframe an AI coding agent writes the video as Rust code, and oxframe renders that code. It suits explainers, product and release videos, charts and code; it does not film people or places.',
    ],
    [
      'Which AI agents can make videos with oxframe?',
      'Claude Code, Codex, Cursor, GitHub Copilot and other coding agents that can run commands. Every new project carries instructions for them, and the oxframe MCP server gives them the check, single frames and the docs as tools.',
    ],
    [
      'Can I change one word or one color afterwards?',
      'Yes. The video is code: change the text or the theme color, or ask the agent to, and render again. Nothing else in the video moves.',
    ],
    [
      'How long can a video be?',
      'As long as the scenes you write. Rendering is local and the same code gives the same file every time, so a 2-minute explainer is rendered like a 10-second one.',
    ],
    [
      'Does it cost anything?',
      'oxframe is open source under MIT or Apache-2.0 and renders on your own machine. The agent you use is billed by its own provider.',
    ],
  ];
</script>

<Seo
  title="AI video generator for explainers, from code — oxframe"
  description="Ask a coding agent for a video: it writes the scenes in code, oxframe checks every frame and renders an MP4. Exact text, editable later, the same file every time."
  jsonld={[
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(([q, a]) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ]}
/>

<article>
  <h1>AI video from code</h1>
  <p class="lead">
    Ask your coding agent for a video. It writes the scenes as code, oxframe shows it every frame
    and what is wrong with them, and when the agent has fixed that, oxframe renders the MP4. The
    text is exactly what you asked for, and a change later is one edit, not a new generation.
  </p>

  <ExampleVideo media={release} title="Release notes as a video" />
  <p class="caption">
    A <a href="/gallery/release">gallery example</a>: release notes, each section in its color, an
    end card. About 230 lines of Rust you can read and change.
  </p>

  <h2>Generated pixels or generated code</h2>
  <p>
    Video models such as Sora, Veo or Runway draw a clip from a prompt. That is the right tool for
    footage: people, places, camera moves through a world. For a video made of words, numbers, code
    and diagrams the result has to be exact, and that is where code wins.
  </p>
  <div class="scroll">
    <table>
      <thead>
        <tr><th></th><th>Video model</th><th>Agent + oxframe</th></tr>
      </thead>
      <tbody>
        <tr><td>What is produced</td><td>Pixels</td><td>A scene in Rust, then the MP4</td></tr>
        <tr
          ><td>Text, numbers, code</td><td>Drawn, can come out garbled</td><td
            >Set as type, exactly as written</td
          ></tr
        >
        <tr
          ><td>Change one word</td><td>Generate again, and the rest changes too</td><td
            >Edit one line, render again</td
          ></tr
        >
        <tr
          ><td>Brand colors and fonts</td><td>Described in the prompt</td><td
            >A theme: tokens and your font files</td
          ></tr
        >
        <tr><td>Same input, same video</td><td>No</td><td>Yes, byte for byte</td></tr>
        <tr><td>Length</td><td>Short clips</td><td>As long as the scenes</td></tr>
        <tr
          ><td>Best for</td><td>Footage, people, nature</td><td
            >Explainers, releases, charts, code, data</td
          ></tr
        >
      </tbody>
    </table>
  </div>

  <h2>How an agent makes the video</h2>
  <ol class="steps">
    <li>
      <strong>You ask.</strong> “Make a 20-second video for our 2.0 release: three new features, the speed-up
      as a chart, and the install command at the end.”
    </li>
    <li>
      <strong>The agent writes the scenes</strong> in <code>src/main.rs</code>: titles, lists,
      charts, code and diagrams are ready-made <a href="/docs/guide/components">components</a>, and
      <code>oxframe add</code> drops in blocks like a feature grid or a terminal.
    </li>
    <li>
      <strong>oxframe checks the frames.</strong> <code>oxframe check</code> plays the video and reports
      what a viewer would notice — text leaving the frame, overlaps, low contrast, a shot that stands
      still — with the time, the element and the line of code, plus a storyboard image. The agent fixes
      and checks again until the report is clean.
    </li>
    <li>
      <strong>You watch and adjust.</strong> <code>oxframe dev</code> opens an editor with the
      timeline; drag a timing, or ask the agent for a change. <code>oxframe render</code> writes the
      MP4, and
      <code>oxframe publish</code> gives a link to share.
    </li>
  </ol>
  <p>
    On our {a7.prompts} reference prompts, {a7.agent} on oxframe {a7.version} finished
    {a7.passed} with a clean check, in {a7.meanTurns} turns on average. The prompts and the script are
    on the <a href="/benchmarks">benchmarks page</a>.
  </p>

  <h2>Start</h2>
  <pre><code
      >{`curl -fsSL https://github.com/oxygenframe/oxframe-cli/releases/latest/download/install.sh | sh
oxframe init my-video && cd my-video
# then, in Claude Code, Codex or Cursor: "make a video about …"`}</code
    ></pre>
  <p>
    Rust is needed on the machine, and ffmpeg is downloaded on the first render if missing (<a
      href="/docs/getting-started">Install and first project</a
    >); you do not need to know Rust. Setup for each agent is on
    <a href="/agents">Agents and skills</a>, the tools an agent calls on
    <a href="/docs/mcp">MCP server</a>. Or try a scene in the
    <a href="/playground">playground</a> without installing anything.
  </p>

  <h2>Questions</h2>
  {#each faq as [q, a] (q)}
    <h3>{q}</h3>
    <p>{a}</p>
  {/each}
</article>

<style>
  article {
    max-width: 760px;
  }
  .lead,
  .caption {
    color: var(--muted);
  }
  article :global(video) {
    width: 100%;
    height: auto;
  }
  .scroll {
    overflow-x: auto;
  }
  .steps li {
    margin-bottom: 0.6em;
  }
</style>
