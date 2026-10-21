<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>All nodes</h1>
<p class="lead">
  A reference of every node and its properties. If you followed the guide, you already know the
  pattern; this page is for looking things up.
</p>
<p>
  Builders set initial values; <code>view.add(builder)</code> (or <code>node.add</code> for
  children) returns a
  <code>Copy</code> handle whose methods of the same names return signals.
</p>
<table>
  <thead><tr><th>Node</th><th>Builder</th><th>Signals</th></tr></thead>
  <tbody>
    <tr
      ><td><code>Rect</code></td><td><code>.width .height .size .radius</code></td><td
        ><code>width height radius</code></td
      ></tr
    >
    <tr
      ><td><code>Circle</code></td><td><code>.size .start_angle .end_angle .pie</code></td><td
        ><code>size start_angle end_angle</code> — arcs, pie slices</td
      ></tr
    >
    <tr
      ><td><code>Polygon</code></td><td><code>.sides .size</code></td><td
        ><code>sides size</code> — sides animate</td
      ></tr
    >
    <tr
      ><td><code>Star</code></td><td><code>.points .size .inner</code></td><td
        ><code>points size inner</code></td
      ></tr
    >
    <tr
      ><td><code>Path</code></td><td><code>.data(BezPath) .svg("M0 0 …")</code></td><td
        ><code>data</code> — morphs</td
      ></tr
    >
    <tr
      ><td><code>Line</code></td><td
        ><code>.points .smooth .closed .start_arrow .end_arrow</code></td
      ><td><code>points arrow_size</code></td></tr
    >
    <tr
      ><td><code>Txt</code></td><td
        ><code>.text .rich([span(..)]) .font_size .weight .family .italic .align .max_width</code
        ></td
      ><td><code>text spans font_size weight</code>, <code>morph_to</code></td></tr
    >
    <tr
      ><td><code>Code</code></td><td><code>.code .language .theme .focus(a, b) .dim</code></td><td
        ><code>font_size focus dim</code>, <code>code().to</code> (a token diff),
        <code>insert</code>, <code>remove</code>, <code>replace</code>, <code>focus_lines</code></td
      ></tr
    >
    <tr
      ><td><code>Img</code></td><td
        ><code>.src(include_bytes!(..)) .file(path) .width .height</code></td
      ><td><code>width height</code></td></tr
    >
    <tr
      ><td><code>Svg</code></td><td
        ><code>.src(include_bytes!(..)) .file(path) .width .height</code></td
      ><td><code>width height</code>, <code>find("id")</code>, <code>paths()</code></td></tr
    >
    <tr
      ><td><code>Layout</code></td><td
        ><code>.row .column .wrap .grid(n) .gap .padding .align .justify .width .height</code></td
      ><td><code>gap padding width height radius</code></td></tr
    >
    <tr
      ><td><code>Grid</code></td><td><code>.width .height .spacing</code></td><td
        ><code>width height spacing</code></td
      ></tr
    >
    <tr><td><code>Group</code></td><td>—</td><td>—</td></tr>
    <tr
      ><td><code>Custom</code></td><td><code>.new(|ctx, t| …) .size .fullscreen</code></td><td
        >paints each frame; <code>ctx.rng(seed)</code>, <code>ctx.time()</code></td
      ></tr
    >
    <tr
      ><td><code>Particles</code></td><td
        ><code>.seed .gravity .life .speed .radius .toward_camera</code></td
      ><td><code>gravity</code>, <code>burst(origin, count)</code></td></tr
    >
    <tr
      ><td><a href="/docs/0.19.0/camera"><code>Camera</code></a></td><td><code>.zoom</code></td><td
        ><code>zoom</code> (and <code>x y rotation</code>), <code>center_on fit reset</code></td
      ></tr
    >
  </tbody>
</table>
<p>
  Every node has <code>x y rotation scale opacity fill stroke line_width start end</code>, the paint
  and compositing properties described in <a href="/docs/0.19.0/effects">Effects</a>, and the flex
  item properties <code>grow shrink basis margin align_self</code>. <code>start</code>/<code
    >end</code
  >
  trim outlines — animate <code>end</code> from 0 to 1 to draw a shape on (on text it reveals glyph by
  glyph).
</p>
<p>
  <code>Svg</code> reads a whole file and turns it into those nodes: groups stay groups, shapes
  become <code>Path</code>s (so <code>data</code> still morphs), and embedded PNG or JPEG images
  become <code>Img</code>. <code>find("id")</code> is the element with that id.
  <code>paths()</code> is every contour in paint order. Filters, masks and clip paths are skipped
  with a warning. <code>Svg::new().width()</code> and <code>.height()</code> take pixels or
  <code>pct()</code> of the parent, read when the node is added; set one and the other keeps the drawing's
  aspect.
</p>
<LiveExample name="svg" />

<h2>Video</h2>
<p>
  <code>Video::new().file("assets/demo.mp4")</code> shows a clip as a node: a screen recording in a
  laptop frame, a product demo next to a diagram. Turn on the <code>video</code> feature of
  <code>oxframe</code>; clips are decoded with ffmpeg, which <code>oxframe render</code> already
  needs. Size it like an image with <code>.width(pct(70))</code> — the height follows the clip —
  round it with <code>.radius(24.0)</code>, and add effects or put it under a camera like any node.
</p>
<pre><code
    >{`let demo = view.add(Video::new().file("assets/demo.mp4").width(pct(70)).radius(24.0));
demo.play();
wait_for(2.0).await;
demo.playback_rate().to(0.25, 0.5).await;   // slow motion`}</code
  ></pre>
<p>
  <code>demo.play()</code> returns at once and the clip plays alongside the scene;
  <code>demo.pause()</code> holds the frame and <code>demo.seek(2.0)</code> jumps.
  <code>demo.playback_rate()</code> and <code>demo.time()</code> are signals, so
  <code>demo.playback_rate().to(0.25, 0.5)</code> eases into slow motion and animating
  <code>time</code> scrubs. The frame shown is a function of the scene's time, so a render and a seek
  in the editor show the same frame. MP4 (H.264), WebM (VP9, with alpha) and ProRes 4444 (with alpha)
  are read.
</p>
<p>
  The clip's sound goes into the mix while it plays at rate 1; <code>.muted(true)</code> leaves it
  out. A clip that cannot be opened draws a dark box and fails <code>oxframe check</code> with
  <code>video_unavailable</code>. The browser playground cannot read your files, so there a video is
  always that box; <code>oxframe dev</code> plays it.
</p>

<h2>Your own geometry</h2>
<p>
  <code>Custom::new(|ctx, t| {'{ … }'})</code> paints the frame itself.
  <code>ctx.line</code>, <code>ctx.circle</code>, <code>ctx.rect</code> and <code>ctx.path</code>
  take
  <code>.fill</code> or <code>.stroke</code>. Take numbers from <code>t</code> and
  <code>ctx.rng(seed)</code>. The closure runs after the scene step, so <code>random()</code> is not
  available there, and a counter closed over from outside fails <code>check</code> as
  <code>nondeterministic</code>.
</p>
<p>
  <code>Particles</code> keeps a seeded spray: <code>.seed(7).gravity(900.0).toward_camera()</code>
  and <code>burst(origin, count).await</code>. Seeking back replays from a checkpoint, so the dots
  match. <code>toward_camera</code> only scales them.
</p>
<LiveExample name="spray" />

<h2>Shapes and morphing</h2>
<p>
  Tweening <code>Path::data</code> between any two paths aligns them first (segment counts, start points,
  winding), so shapes morph without twisting.
</p>
<LiveExample name="morph" />
<LiveExample name="shapes" />

<h2>Layout</h2>
<p>
  <code>Layout</code> is real flexbox (and CSS grid with <code>.grid(columns)</code>), computed by
  taffy. Children take
  <code>.grow</code>, <code>.shrink</code>, <code>.basis</code>, <code>.margin</code> and
  <code>.align_self</code>;
  <code>LayoutAlign::Stretch</code> resizes rects, images and nested layouts. Layout properties are signals:
  animate the width or the gap and everything re-flows.
</p>
<LiveExample name="layout" />

<h2>Text</h2>
<p>
  Inter and JetBrains Mono are embedded (OFL), so text renders identically everywhere. Strings tween
  like a typewriter.
</p>
<LiveExample name="text" />

<h2>Rich text, code and morphing</h2>
<pre><code
    >{`Txt::new().rich([span("Signals are "), span("lazy").bold().color(color!("#f5c242"))])
Code::new().language("rust").code(src).focus(3, 4)   // code.focus_lines(5, 5, 0.4).await moves it
code.code().to(next, 1.0).await                       // tokens slide; not a typewriter
code.insert(3, 0, "    let y = x * 2;\n", 0.6).flash().await
code.remove(((5, 0), (6, 0)), 0.5).await              // lines from 1, columns from 0
word.morph_to("frame", 1.0).await                    // shared letters travel, the others fade`}</code
  ></pre>
<p>
  Highlighting covers Rust, JS/TS, Python, JSON, TOML and shell, with One Dark and One Light themes.
</p>
<LiveExample name="typography" />

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th,
  td {
    text-align: left;
    border-bottom: 1px solid var(--border);
    padding: 6px 8px;
    vertical-align: top;
  }
</style>
