<h1>Formulas</h1>
<p class="lead">
  Math typeset by Typst, as nodes you color and animate glyph by glyph. The font is bundled, so no
  TeX install is needed and a formula looks the same on every machine.
</p>

<figure>
  <img
    src="/images/formulas.png"
    width="1280"
    height="720"
    alt="A frame of the formulas example: Euler's identity e to the i pi plus 1 equals 0 in blue, and below it the sum of k from 1 to n equals n times n plus 1 over 2"
  />
  <figcaption>
    The last frame of the
    <a href="https://github.com/oxygenframe/oxframe-sdk/blob/main/examples/src/formulas.rs"
      ><code>formulas</code> example on GitHub</a
    >.
  </figcaption>
</figure>

<h2>Turn on the math feature</h2>
<pre><code>{`oxframe = { version = "…", features = ["math"] }`}</code></pre>
<p>
  The feature adds the Typst compiler and a 1.4 MB font to your binary, so it is off by default. It
  works with <code>oxframe dev</code>, <code>oxframe check</code> and <code>oxframe render</code>
  on your machine and in CI. The browser playground does not have it: the playground's engine stays small,
  so formulas cannot be tried there.
</p>

<h2>A formula by its source</h2>
<pre><code
    >{`let euler = view.add(Math::new("e^(i pi) + 1 = 0").size(140.0));
stagger(0.08, euler.paths(), |glyph| glyph.pop_in()).await;
euler.color().to(Accent, 0.6).await;

let sum = view.add(
    Math::new("sum_(k=1)^n k = (n(n + 1)) / 2")
        .display()
        .size(72.0)
        .y(220.0),
);
sum.fade_in().await;`}</code
  ></pre>
<p>
  <code>Math::new("e^(i pi) + 1 = 0")</code> takes
  <a href="https://typst.app/docs/reference/math/">Typst math syntax</a> without the dollar signs. A formula
  Typst cannot set (an unknown symbol, a missing bracket) stops the scene with Typst's message, which
  names the formula.
</p>
<table>
  <thead><tr><th>You write</th><th>You get</th></tr></thead>
  <tbody>
    <tr><td><code>x^2</code>, <code>x_i</code></td><td>superscript, subscript</td></tr>
    <tr><td><code>(a + b) / c</code></td><td>a fraction</td></tr>
    <tr><td><code>sqrt(x)</code></td><td>a square root</td></tr>
    <tr
      ><td><code>sum_(k=1)^n</code>, <code>integral_0^1</code></td><td
        >sums and integrals with limits</td
      ></tr
    >
    <tr><td><code>alpha pi</code></td><td>Greek letters by name</td></tr>
    <tr><td><code>vec(1, 2)</code>, <code>mat(1, 2; 3, 4)</code></td><td>a vector, a matrix</td></tr
    >
    <tr><td><code>"text"</code></td><td>upright words inside a formula</td></tr>
  </tbody>
</table>

<h2>Size, color and display style</h2>
<p>
  <code>.size(px)</code> is the font size in pixels, as for <code>Txt</code>; the box is as tall as
  a line of text, so formulas of one size line up. <code>.color(..)</code> takes a color or a theme
  role and defaults to the theme's text color. <code>.display()</code> sets the formula on its own
  line, as <code>$ … $</code> does in Typst: a sum gets its limits above and below and a fraction is full
  size. Without it the formula is set inline, as in running text.
</p>

<h2>Animate it</h2>
<p>
  The handle, <code>Math</code>, is a node like any other: <code>fade_in</code>,
  <code>next_to</code>, <code>scale</code> and layout work on it. <code>color()</code> is a signal
  for the whole formula, and <code>paths()</code> gives every glyph and rule (fraction bars, root
  signs) in reading order, for <code>stagger</code>. Glyphs are filled shapes, so write them on with
  <code>pop_in</code> or <code>fade_in</code> rather than <code>draw_on</code>.
</p>
<p>Run the example from a clone of the SDK:</p>
<pre><code>cargo run -p oxframe-examples --features math --bin formulas -- preview</code></pre>

<style>
  figure {
    margin: 0 0 24px;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  figcaption {
    margin-top: 8px;
    font-size: 0.9em;
    opacity: 0.8;
  }
</style>
