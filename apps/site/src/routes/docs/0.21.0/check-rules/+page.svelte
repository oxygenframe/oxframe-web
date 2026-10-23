<script lang="ts">
  const pictures = [
    {
      rule: 'out_of_frame',
      before: 'A title pushed past the right edge.',
      after: 'The same title, centered and a size smaller.',
    },
    {
      rule: 'text_overflow',
      before: 'A heading wider than the 420 px card that holds it.',
      after: 'A shorter line in a smaller type style.',
    },
    {
      rule: 'text_overlap',
      before: 'Two lines placed on top of each other.',
      after: 'The second line placed under the first with next_to.',
    },
    {
      rule: 'covers_text',
      before: 'A waves shader added after the title paints over it.',
      after: 'The shader added first and the title moved to the top.',
    },
    {
      rule: 'low_contrast',
      before: 'Dark grey text on a dark grey card.',
      after: 'The theme roles Text on Surface.',
    },
  ];
  const picture = (rule: string) => pictures.find((p) => p.rule === rule);
</script>

<h1>Check rules</h1>
<p class="lead">
  What each rule in an <code>oxframe check</code> report means and how to fix it. Every issue in
  <code>report.json</code> links to its section here in its <code>docs</code> field (Rust code gets
  the same link from <code>Issue::docs</code>).
</p>
<p>
  <code>oxframe check</code> plays every scene, samples frames and reports what a viewer would see
  as a mistake. An error makes the command exit 1; a warning does not. Each issue names the rule,
  the time range, the node and the line of code that added it. Thresholds live in
  <code>oxframe.toml</code> under <code>[check]</code>.
</p>
<p>
  An issue on a node comes with a close-up in <code>out/check/issues/</code>: the frame around the
  node at full resolution, the node outlined in red. Its path is the issue's <code>crop</code> field
  in <code>report.json</code>, next to <code>bounds</code>, the node's box. A node wholly outside
  the frame gets the strip along the edge it went past.
</p>
<figure class="crop">
  <img
    src="/rules/crop-out_of_frame.png"
    width="1481"
    height="436"
    loading="lazy"
    alt="The crop oxframe check writes for out_of_frame: a headline running off the right edge of the frame, outlined in red"
  />
  <figcaption>
    <code>issues/02-out_of_frame.png</code>: a headline that runs off the right edge.
  </figcaption>
</figure>

{#snippet pair(rule: string)}
  {@const p = picture(rule)}
  {#if p}
    <div class="pair">
      <figure>
        <img
          src="/rules/{rule}-before.png"
          width="640"
          height="360"
          loading="lazy"
          alt="Reported by {rule}: {p.before}"
        />
        <figcaption>Before: {p.before}</figcaption>
      </figure>
      <figure>
        <img
          src="/rules/{rule}-after.png"
          width="640"
          height="360"
          loading="lazy"
          alt="Fixed: {p.after}"
        />
        <figcaption>After: {p.after}</figcaption>
      </figure>
    </div>
  {/if}
{/snippet}

<h2>Frame and layout</h2>

<h3 id="out_of_frame"><code>out_of_frame</code></h3>
<p>
  A node stays outside the frame (error) or outside the safe area near the edges (warning). A node
  that only passes through the edge, entering or leaving, is not reported.
</p>
{@render pair('out_of_frame')}
<p>
  Fix: move it inward, make it smaller, or place it with <code>pct()</code>,
  <code>to_edge(Edge::…)</code> or a <code>Layout</code>. <code>--safe-inset 0</code> turns the warning
  off for a frame without a safe area.
</p>

<h3 id="text_overflow"><code>text_overflow</code></h3>
<p>
  Text is wider than its block: its <code>max_width</code>, or the <code>Layout</code> that holds it.
</p>
{@render pair('text_overflow')}
<p>
  Fix: shorter text, a smaller type style (<code>.h2()</code>, <code>.body()</code>), or a wider
  block.
</p>

<h3 id="text_overlap"><code>text_overlap</code></h3>
<p>Two pieces of text cover each other.</p>
{@render pair('text_overlap')}
<p>
  Fix: place one relative to the other (<code>next_to(other, Side::Bottom)</code>), put both in a
  <code>Layout</code>, or fade the first out before the second comes in.
</p>

<h3 id="covers_text"><code>covers_text</code></h3>
<p>A shader is drawn over text, so the text is hidden behind it.</p>
{@render pair('covers_text')}
<p>Fix: add the shader before the text, or move the text out of its box.</p>

<h3 id="low_contrast"><code>low_contrast</code></h3>
<p>
  Text is too close in color to what is behind it, below the WCAG ratio (4.5 by default,
  <code>--min-contrast</code>).
</p>
{@render pair('low_contrast')}
<p>
  Fix: use theme roles, which are built to contrast: <code>Text</code> on <code>Background</code> or
  <code>Surface</code>, <code>OnAccent</code> on <code>Accent</code>.
</p>

<h2>Timing</h2>

<h3 id="too_fast"><code>too_fast</code></h3>
<p>
  Text is not on screen long enough to read at the reading speed (<code>--chars-per-second</code>),
  or a large move is quicker than <code>--min-motion</code>.
</p>
<p>
  Fix: hold the text with <code>wait_for(…)</code> after it appears, or give the move a longer
  duration. In a presentation, hold before each <code>slide_break</code>: the video plays through
  it.
</p>

<h3 id="dead_time"><code>dead_time</code></h3>
<p>
  Nothing changes on screen for longer than <code>--max-still</code> (not checked with a soundtrack).
</p>
<p>Fix: shorten the wait, or give the viewer something to look at while it lasts.</p>

<h2>Voice</h2>

<h3 id="voice_cut"><code>voice_cut</code></h3>
<p>A spoken line runs past the end of its scene and is cut.</p>
<p>Fix: <code>line.await</code> before the scene ends, or shorten the line.</p>

<h3 id="voice_overlap"><code>voice_overlap</code></h3>
<p>Two spoken lines overlap.</p>
<p>Fix: start the second line after <code>first.await</code>.</p>

<h2>Shaders</h2>

<h3 id="shader_error"><code>shader_error</code></h3>
<p>
  The WGSL of a shader does not compile, or a name or type does not match its <code>Params</code>.
</p>
<p>
  Fix: the message names the line in the shader; see <a href="/docs/0.21.0/guide/shaders"
    >lesson 13</a
  >.
</p>

<h3 id="param_unknown"><code>param_unknown</code></h3>
<p>A parameter is set from Rust that the shader's <code>Params</code> does not have.</p>
<p>Fix: add it to <code>struct Params</code> or correct the name.</p>

<h3 id="shader_slow"><code>shader_slow</code></h3>
<p>A shader takes longer per frame than the budget.</p>
<p>Fix: a smaller box, fewer loop iterations, or a preset from <code>shaders::</code>.</p>

<h3 id="input_cycle"><code>input_cycle</code></h3>
<p>
  A shader that reads drawn pixels (<code>lens_drops</code>, an effect) is inside a group that is
  itself drawn as a layer (opacity below 1, blur, clip, blend, shadow, another effect). The shader
  is skipped.
</p>
<p>Fix: put the effect on that group instead, or take the node out of it.</p>

<h2>Determinism and media</h2>

<h3 id="nondeterministic"><code>nondeterministic</code></h3>
<p>Two paints of the same frame differ, so a seek or a render would not match the preview.</p>
<p>
  Fix: draw only from signals and <code>ctx.time()</code>; take randomness from
  <code>ctx.rng(seed)</code> or <code>random()</code>, never from the clock.
</p>

<h3 id="video_unavailable"><code>video_unavailable</code></h3>
<p>A video clip cannot be opened; it shows as a dark box.</p>
<p>
  Fix: check the path, build with the <code>video</code> feature and install ffmpeg. The playground cannot
  play videos.
</p>

<style>
  .pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
    margin: 0 0 12px;
  }
  figure {
    margin: 0;
  }
  .crop {
    margin: 0 0 16px;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  figcaption {
    margin-top: 4px;
    font-size: 14px;
    color: var(--muted);
  }
  h3 {
    scroll-margin-top: 16px;
  }
</style>
