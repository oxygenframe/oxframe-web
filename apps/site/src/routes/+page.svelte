<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { measurements } from '$lib/measurements';
  import { LOGO, ORGANIZATION, SITE, WEBSITE } from '$lib/site';
  import { track } from '$lib/track';
  import { mediaFor, videoObject } from '$lib/media';

  // The reel (oxframe-sdk/examples/src/showreel.rs), rendered to R2 by
  // scripts/render-media.ts; the old file in static/ until one exists.
  const reel = mediaFor('showreel');
  const REEL_TITLE = 'oxframe showreel: charts, 3D, a linear map and a shader sea';
  const REEL_TEXT =
    'Scenes from the oxframe examples, rendered by oxframe on the CPU: functions on axes, a lit 3D cube with labels, a shear of the plane, and waves from a shader.';

  const features = [
    [
      'oxframe check',
      'A storyboard and a JSON report after every change. Errors name the rule, the time, the node and the line.',
    ],
    [
      'MCP server',
      'oxframe mcp gives an agent check, inspect, a single frame and the docs for this version.',
    ],
    [
      'Themes',
      'Color, type and motion come from tokens, so a scene looks finished before anyone picks a hex value.',
    ],
    [
      'Components',
      'Title cards, lists, code, diagrams, callouts and end cards. Add them like any other node.',
    ],
    [
      '16:9, 9:16 and 1:1',
      'One scene, three frames. Relative placement follows the safe area of each shape.',
    ],
    [
      'Deterministic',
      'Fixed time steps and a seeded random source. The same code renders the same frames everywhere.',
    ],
    [
      'Edit timing without recompiling',
      'Markers, eases and tunables live beside the code. Drag them in the editor.',
    ],
    [
      'Fast preview',
      'Save, and the editor reconnects to the new build. Scrubbing re-simulates without drawing every frame.',
    ],
    [
      'GPU and CPU',
      'vello on wgpu for playback, tiny-skia as the reference and for machines without a GPU.',
    ],
    [
      'Video out',
      'MP4, WebM with alpha, ProRes 4444 or a PNG sequence, with the soundtrack muxed in.',
    ],
  ];

  let video: HTMLVideoElement | undefined = $state();
  let copied = $state(false);

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText('cargo install oxframe-cli');
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      copied = false;
    }
    track('Copy install');
  }

  function loadHero(node: HTMLVideoElement) {
    if (node.getAttribute('src')) return;
    node.src = reel?.mp4 ?? '/hero.mp4';
    // preload="none" keeps the page light until the reel is in view, so no
    // data arrives on its own; play() starts the download (muted autoplay).
    node.play().catch(() => {});
  }

  function heroInView(node: HTMLVideoElement) {
    const box = node.getBoundingClientRect();
    return box.bottom > 0 && box.top < window.innerHeight;
  }

  $effect(() => {
    const node = video;
    if (!node) return;
    if (heroInView(node)) {
      loadHero(node);
      return;
    }
    const onScroll = () => {
      if (heroInView(node)) loadHero(node);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) loadHero(node);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

<Seo
  title="oxframe — motion graphics your AI agent can see"
  description="AI-native motion graphics in Rust: code-based animation, live timeline editor, deterministic rendering, and visual checks for coding agents."
  jsonld={[
    {
      '@type': 'SoftwareApplication',
      name: 'oxframe',
      url: `${SITE}/`,
      description:
        'AI-native motion graphics in Rust: code-based animation, live timeline editor, deterministic rendering, and visual checks for coding agents.',
      applicationCategory: 'MultimediaApplication',
      applicationSubCategory: 'Animation software',
      operatingSystem: 'Linux, macOS, Windows',
      softwareVersion: measurements.version,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      downloadUrl: 'https://crates.io/crates/oxframe-cli',
      image: LOGO,
      publisher: { '@id': ORGANIZATION['@id'] },
      sameAs: ['https://github.com/oxygenframe', 'https://crates.io/crates/oxframe'],
    },
    ORGANIZATION,
    WEBSITE,
    ...[videoObject('showreel', REEL_TITLE, REEL_TEXT)].filter((v) => v !== null),
  ]}
/>

<section class="hero">
  <div>
    <h1>Motion graphics your AI agent can see</h1>
    <p class="lead">
      Code-based animation in Rust with a live editor and visual checks, so AI agents fix their own
      mistakes before you ever hit render.
    </p>
    <p class="cta">
      <a class="btn primary" href="/playground" onclick={() => track('Open playground')}
        >Open the playground</a
      >
      <a class="btn" href="/docs/getting-started">Get started</a>
      <a class="btn" href="/docs/agents" onclick={() => track('Use with Claude Code')}
        >Use with Claude Code</a
      >
    </p>
    <div class="install">
      <div class="box">
        <pre><code>cargo install oxframe-cli</code></pre>
        <button
          class="copy"
          class:done={copied}
          type="button"
          onclick={copyInstall}
          aria-label={copied ? 'Copied' : 'Copy the install command'}
          title={copied ? 'Copied' : 'Copy'}
        >
          {#if copied}
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
              ><path d="M20 6 9 17l-5-5" /></svg
            >
          {:else}
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
              ><rect x="9" y="9" width="12" height="12" rx="2" /><path
                d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
              /></svg
            >
          {/if}
        </button>
      </div>
    </div>
  </div>
  <figure class="reel">
    <video
      bind:this={video}
      poster={reel?.poster ?? '/hero-poster.png'}
      width="1280"
      height="720"
      muted
      loop
      playsinline
      preload="none"
      controls
      aria-label={REEL_TEXT}
      onplay={() => track('Hero video')}
    ></video>
    <figcaption>
      Every frame drawn by oxframe.
      <a
        href="https://github.com/oxygenframe/oxframe-sdk/blob/main/examples/src/showreel.rs"
        rel="external">View the code of this video</a
      >
    </figcaption>
  </figure>
</section>

<section>
  <h2>How it works with agents</h2>
  <p class="lead">
    Prompt, then check, then render. The agent reads the picture and the report, not only the
    compiler.
  </p>
  <div class="steps">
    <article>
      <h3>Prompt</h3>
      <img
        src="/hero-poster.png"
        alt="A title card that says A prompt, Explain binary search"
        width="640"
        height="360"
      />
    </article>
    <article>
      <h3>Check</h3>
      <img
        src="/storyboard.png"
        alt="Storyboard grid from oxframe check on oxframe 0.4.0"
        width="640"
        height="360"
      />
      <pre><code class="language-json"
          >{`{
  "duration": 2.7,
  "issues": [{
    "rule": "text_overlap",
    "severity": "error",
    "time": [1.4, 2.3],
    "node": "line",
    "source": "src/title.rs:218",
    "hint": "Text overlaps title. Move one of them."
  }]
}`}</code
        ></pre>
    </article>
    <article>
      <h3>Render</h3>
      <img
        src={reel?.poster ?? '/hero-poster.png'}
        alt="A frame of the rendered showreel: a sheared grid with vectors i, j and v, and its matrix"
        width="640"
        height="360"
      />
    </article>
  </div>
</section>

<section>
  <h2>Numbers</h2>
  <p class="lead">
    oxframe {measurements.version}, measured {measurements.date} on {measurements.machine}. {measurements.scene}
  </p>
  <div class="numbers">
    <article>
      <p class="figure">{measurements.editSeconds}s</p>
      <h3>One-line rebuild</h3>
      <p><code>cargo build</code> after changing a single string, with oxframe already compiled.</p>
    </article>
    <article>
      <p class="figure">{measurements.checkWarmSeconds}s</p>
      <h3>Warm check</h3>
      <p><code>oxframe check</code> when that build is already current.</p>
    </article>
    <article>
      <p class="figure">{measurements.checkAfterEditSeconds}s</p>
      <h3>Check after an edit</h3>
      <p><code>oxframe check</code> right after a change, the build included.</p>
    </article>
    <article>
      <p class="figure">{measurements.render30Seconds}s</p>
      <h3>{measurements.render30VideoSeconds}-second video</h3>
      <p>
        <code>oxframe render --cpu</code> in {measurements.render30Jobs} parallel segments ({measurements.render30OneJobSeconds}s
        with one), no GPU. Both files are byte for byte the same.
      </p>
    </article>
  </div>
  <p>
    An agent pass rate and an average iteration count have not been measured. The prompt set and the
    runner are in the CLI; the baseline run is waiting on a real agent.
  </p>
</section>

<section class="split">
  <div>
    <h2>You don't need to know Rust. Your agent does.</h2>
    <p>
      Themes and components carry the look. This scene is the whole program: a title, three steps
      and an end card.
    </p>
    <p>
      <a href="/playground?ex=components" onclick={() => track('Open playground')}
        >Open the component example</a
      >
    </p>
  </div>
  <pre><code class="language-rust"
      >{`use oxframe::prelude::*;

#[oxframe::scene]
async fn intro(view: View) {
    let title = view.add(TitleCard::new("Binary search").subtitle("O(log n)"));
    title.enter().await;
    let steps = view.add(BulletList::new(["Take the middle", "Compare", "Drop half"]));
    steps.enter().await;
    for _ in 0..steps.len() {
        steps.next().await;
    }
    let end = view.add(EndCard::new("That's the search"));
    end.enter().await;
}

fn main() {
    Project::new("intro").theme(Theme::dark()).scene(intro()).main();
}`}</code
    ></pre>
</section>

<section>
  <h2>Features</h2>
  <div class="grid">
    {#each features as [title, text] (title)}
      <article>
        <h3>{title}</h3>
        <p>{text}</p>
      </article>
    {/each}
  </div>
  <p>
    Inspired by Motion Canvas: scenes are coroutines, and an <code>await</code> is a point on the timeline.
    oxframe runs that model in Rust, with a native renderer and a check an agent can read.
  </p>
</section>

<section>
  <h2>Works with your agent</h2>
  <div class="grid">
    <article>
      <h3>Claude Code</h3>
      <p>
        <code>oxframe init</code> writes a skill and <code>AGENTS.md</code>. The docs are on the
        <a href="/docs/agents">agents page</a>.
      </p>
      <pre><code>oxframe init my-video</code></pre>
    </article>
    <article>
      <h3>Cursor</h3>
      <p>
        The same <code>AGENTS.md</code> is what Cursor reads. Refresh it after an upgrade with
        <code>oxframe agents</code>.
      </p>
      <pre><code>oxframe agents</code></pre>
    </article>
    <article>
      <h3>Codex</h3>
      <p>
        Codex reads <code>AGENTS.md</code> from the project before it edits.
        <code>oxframe init</code>
        writes that file.
      </p>
      <pre><code>npm install -g @openai/codex</code></pre>
    </article>
    <article>
      <h3>OpenAI</h3>
      <p>
        No plugin. Give the model the project's <code>AGENTS.md</code>, or the docs of this version
        at <a href="/llms.txt">/llms.txt</a>.
      </p>
    </article>
    <article>
      <h3>MCP</h3>
      <p>Any client that speaks MCP can run <code>oxframe mcp</code> from the project directory.</p>
      <pre><code>oxframe mcp</code></pre>
    </article>
    <article>
      <h3>llms.txt</h3>
      <p>The docs of this version as plain text, for tools that read the web.</p>
      <p><a href="/llms.txt">/llms.txt</a> and <a href="/llms-full.txt">/llms-full.txt</a></p>
    </article>
  </div>
</section>

<style>
  .reel {
    margin: 0;
    min-width: 0;
  }
  .reel figcaption {
    margin-top: 6px;
    font-size: 14px;
    color: var(--muted);
  }
  .hero {
    display: grid;
    gap: 28px;
    padding: 28px 0 8px;
    min-width: 0;
  }
  @media (min-width: 860px) {
    .hero {
      grid-template-columns: 1.1fr 1fr;
      align-items: center;
    }
  }
  h1 {
    font-size: clamp(32px, 5vw, 46px);
    margin: 0 0 12px;
  }
  .lead {
    color: var(--muted);
    max-width: 62ch;
  }
  .cta,
  .install {
    display: flex;
  }
  /* As wide as the command, never wider than the column. */
  .box {
    position: relative;
    min-width: 0;
  }
  .install pre {
    margin: 0;
    padding: 8px 44px 8px 12px;
  }
  /* The copy button sits in the box and shows on hover or keyboard focus;
     touch screens have no hover, so it is always shown there. */
  .copy {
    position: absolute;
    top: 50%;
    right: 6px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--panel);
    color: var(--muted);
    cursor: pointer;
    opacity: 0;
    transform: translateY(-50%);
    transition:
      opacity 0.15s,
      color 0.15s;
  }
  .install:hover .copy,
  .copy:focus-visible,
  .copy.done {
    opacity: 1;
  }
  .copy:hover {
    color: var(--text);
  }
  .copy.done {
    color: #3fb950;
  }
  .copy svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (hover: none) {
    .copy {
      opacity: 1;
    }
  }
  video,
  img {
    box-sizing: border-box;
    width: 100%;
    height: auto;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: #000;
  }
  .steps,
  .numbers,
  .grid,
  .split {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  @media (min-width: 800px) {
    .steps,
    .numbers {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }
    .split {
      grid-template-columns: 1fr 1.2fr;
      align-items: start;
    }
  }
  article {
    min-width: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px 12px;
    background: var(--panel);
  }
  article h3 {
    font-size: 1.05rem;
  }
  article p {
    color: var(--muted);
  }
  .figure {
    font-size: 40px;
    font-weight: 700;
    margin: 12px 0 0;
    color: var(--text);
  }
  section {
    margin-top: 48px;
  }
</style>
