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
<h2 id="fix">The fix in each issue</h2>
<p>
  Most issues carry <code>fix</code>: the change that clears them, with the numbers worked out, so
  neither you nor an agent has to measure the frame. The hint says the same in words.
</p>
<div class="scroll">
  <table>
    <thead><tr><th><code>action</code></th><th>Fields</th><th>From</th></tr></thead>
    <tbody>
      <tr
        ><td><code>move</code></td><td
          ><code>dx</code>, <code>dy</code>: pixels, x to the right, y down</td
        ><td><code>out_of_frame</code>, <code>text_overlap</code></td></tr
      >
      <tr
        ><td><code>shrink</code></td><td
          ><code>width</code>, <code>height</code>: the most that fits</td
        ><td><code>out_of_frame</code> on a node bigger than the frame</td></tr
      >
      <tr
        ><td><code>color</code></td><td
          ><code>color</code> (<code>#rrggbb</code>, the same hue lightened or darkened) and the
          <code>contrast</code> it reaches</td
        ><td><code>low_contrast</code> over a fill</td></tr
      >
      <tr
        ><td><code>widen</code></td><td
          ><code>by</code>: pixels of extra width, or <code>font_scale</code> for the font size</td
        ><td><code>text_overflow</code></td></tr
      >
      <tr
        ><td><code>hold</code></td><td><code>seconds</code> the text must stay on screen</td><td
          ><code>too_fast</code> text</td
        ></tr
      >
      <tr
        ><td><code>slow</code></td><td><code>seconds</code> the move should last at least</td><td
          ><code>too_fast</code> motion</td
        ></tr
      >
    </tbody>
  </table>
</div>
<pre><code
    >{`{
  "rule": "out_of_frame",
  "node": "headline",
  "source": "src/main.rs:24",
  "hint": "The node reaches outside the frame. Move it 140 px to the left (or make it smaller).",
  "fix": { "action": "move", "dx": -140.0, "dy": 0.0 }
}`}</code
  ></pre>
<p>
  A fix clears the issue it belongs to; it does not know your design. Moving a headline 140 px may
  call for moving what sits next to it too, and a smaller font may read better as a shorter line.
  Text over a shader or an image has no single color behind it, so its <code>low_contrast</code>
  issue comes without a color. <code>dead_time</code> and <code>covers_text</code> have no fix: what
  to add, or where the shader goes, is a choice. In Rust the field is an
  <code>Option&lt;lint::Fix&gt;</code> on <code>lint::Issue</code>.
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
<p>
  A shader is drawn over text, so the text is hidden behind it. A shader that reads the frame (<code
    >lens_drops</code
  >, or your own with <code>Input::frame()</code>) shows the text through it and is not reported.
</p>
{@render pair('covers_text')}
<p>Fix: add the shader before the text, or move the text out of its box.</p>

<h3 id="low_contrast"><code>low_contrast</code></h3>
<p>
  Text is too close in color to what is behind it, below the WCAG ratio (4.5 by default,
  <code>--min-contrast</code>). Over a plain fill the two colors are compared. Over a shader, an
  image, a video, <code>Custom</code>, particles or 3D, <code>check</code> draws the frame without the
  text and reads the pixels behind it: the ratio is the median over the text's box, and it must stay low
  for 0.5 s, so something moving past a label is not reported.
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

<h2>Review</h2>

<h3 id="review_note"><code>review_note</code></h3>
<p>
  A note a person wrote in the <a href="/docs/0.23.10/editor#review-notes">editor</a> under
  <code>oxframe dev</code>, still open. <code>note_text</code> says what to change; the issue has
  the time, the node and its <code>file:line</code>, the marked area and a crop. Always an error.
</p>
<p>
  Fix: do what the note says, then <code
    >oxframe notes done &lt;id&gt; --reply "what you changed"</code
  >.
</p>

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
  Fix: the message names the line in the shader; see <a href="/docs/0.23.10/guide/shaders"
    >lesson 13</a
  >.
</p>

<h3 id="param_unknown"><code>param_unknown</code></h3>
<p>A parameter is set from Rust that the shader's <code>Params</code> does not have.</p>
<p>Fix: add it to <code>struct Params</code> or correct the name.</p>

<h3 id="shader_slow"><code>shader_slow</code></h3>
<p>A shader takes longer per frame than the budget.</p>
<p>Fix: a smaller box, fewer loop iterations, or a preset from <code>shaders::</code>.</p>

<h2>Determinism and media</h2>

<h3 id="nondeterministic"><code>nondeterministic</code></h3>
<p>Two paints of the same frame differ, so a seek or a render would not match the preview.</p>
<p>
  Fix: draw only from signals and <code>ctx.time()</code>; take randomness from
  <code>ctx.rng(seed)</code>, never from the clock or from numbers kept between paints.
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
  .scroll {
    overflow-x: auto;
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
