<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Writing your own node</h1>
<p class="lead">
  A struct that draws itself becomes a node: animatable fields, layout, effects and checks, like the
  built-in ones.
</p>

<LiveExample name="gauge" />

<h2>A struct that draws</h2>
<p>
  Turn on the <code>unstable-node-api</code> feature of <code>oxframe</code>. The API may change
  until it has outside users.
</p>
<pre><code>{`oxframe = { version = "…", features = ["unstable-node-api"] }`}</code></pre>
<pre><code
    >{`#[derive(Node)]
pub struct Gauge {
    #[signal] value: f64,   // 0..1
    #[signal] size: f64,
}

impl Draw for Gauge {
    fn draw(&self, ctx: &mut DrawCtx) {
        let r = self.size / 2.0 - 12.0;
        ctx.arc((0.0, 0.0), r, 135.0, 270.0 * self.value).stroke(Accent, 18.0);
    }
    fn size(&self) -> (f64, f64) {
        (self.size, self.size)
    }
}`}</code
  ></pre>
<p>
  <code>#[derive(Node)]</code> on a struct that implements <code>Draw</code> makes it a node. Each
  field marked <code>#[signal]</code> gets a setter on the builder, <code>Gauge::new()</code>, and a
  signal on the handle, <code>GaugeHandle</code>, so <code>gauge.value().to(0.8, 1.0)</code>
  animates it. Fields without the mark are set once on the builder. Every field type needs
  <code>Default</code> and <code>Clone</code>.
</p>
<pre><code
    >{`let gauge = view.add(Gauge::new().size(240.0));
gauge.value().to(0.8, 1.0).await;`}</code
  ></pre>

<h2>Drawing</h2>
<p>
  <code>Draw::draw</code> paints with the same <code>DrawCtx</code> as <code>Custom</code>:
  <code>ctx.line</code>, <code>ctx.circle</code>, <code>ctx.rect</code>, <code>ctx.path</code> and
  <code>DrawCtx::arc</code> for gauges and rings, each followed by <code>.fill(..)</code> or
  <code>.stroke(.., width)</code> with a color or a theme role. Coordinates are the node's own, with the
  origin at the center of its box.
</p>
<p>
  Draw only from the fields and <code>ctx.time()</code>, and take randomness from
  <code>ctx.rng(seed)</code>. The frame is painted again on every seek, and
  <code>oxframe check</code> reports a node whose two paints of one frame differ.
</p>

<h2>Its box</h2>
<p>
  <code>Draw::size</code> gives the box that flex layout, <code>Camera::fit</code> and
  <code>oxframe check</code> use; the default is 100 by 100. Everything else comes with the node:
  position, rotation, scale, opacity, relative placement such as <code>to_edge</code>, effects, flex
  properties and theme colors. <code>check</code> and <code>inspect</code> name it by its type, so
  an issue reads <code>Gauge</code>, not <code>Custom</code>.
</p>

<h2>A crate of your own</h2>
<pre><code>oxframe init --template node my-node</code></pre>
<p>
  <code>oxframe init --template node my-node</code> makes a library crate: the node in
  <code>src/lib.rs</code>, a demo scene in <code>examples/demo.rs</code>
  (<code>cargo run --example demo -- render</code>) and a reference test that renders the node on
  the CPU and checks its pixels. Publish it like any crate; scenes add it as a dependency.
</p>
<p>The playground has the feature on, so a node written in a scene there works too.</p>
