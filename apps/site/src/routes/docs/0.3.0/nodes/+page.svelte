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
        ><code>code font_size focus dim</code>, <code>focus_lines</code></td
      ></tr
    >
    <tr
      ><td><code>Img</code></td><td
        ><code>.src(include_bytes!(..)) .file(path) .width .height</code></td
      ><td><code>width height</code></td></tr
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
  </tbody>
</table>
<p>
  Every node has <code>x y rotation scale opacity fill stroke line_width start end</code>, the paint
  and compositing properties described in <a href="/docs/0.3.0/effects">Effects</a>, and the flex
  item properties <code>grow shrink basis margin align_self</code>. <code>start</code>/<code
    >end</code
  >
  trim outlines — animate <code>end</code> from 0 to 1 to draw a shape on (on text it reveals glyph by
  glyph).
</p>

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
