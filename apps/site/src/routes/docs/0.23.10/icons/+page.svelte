<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Icons</h1>
<p class="lead">
  Lucide, Tabler and Simple Icons by name, as nodes you color and animate. Only the icons a scene
  names end up in its binary.
</p>

<LiveExample name="architecture" />

<h2>An icon by name</h2>
<p>Turn on the <code>icons</code> feature of <code>oxframe</code>:</p>
<pre><code>{`oxframe = { version = "…", features = ["icons"] }`}</code></pre>
<pre><code
    >{`let server = view.add(icon!("lucide:server").size(64.0).color(Accent));
view.add(icon!("tabler:heart-filled"));
view.add(icon!("simple:github").color(Muted));`}</code
  ></pre>
<p>
  <code>icon!</code> takes the set and the name. The name is the one on the set's site:
  <a href="https://lucide.dev/icons/">lucide.dev/icons</a>,
  <a href="https://tabler.io/icons">tabler.io/icons</a> (add <code>-filled</code> for the filled
  variant) and <a href="https://simpleicons.org">simpleicons.org</a> for brand logos. A name that
  does not exist fails to compile and the error lists the closest names, so
  <code>icon!("lucide:arow-right")</code> suggests <code>arrow-right</code>.
</p>
<table>
  <thead><tr><th>Prefix</th><th>Set</th><th>Icons</th><th>License</th></tr></thead>
  <tbody>
    <tr><td><code>lucide:</code></td><td>Lucide, outlines</td><td>2,171</td><td>ISC</td></tr>
    <tr
      ><td><code>tabler:</code></td><td>Tabler Icons, outlines and <code>-filled</code></td><td
        >6,238</td
      ><td>MIT</td></tr
    >
    <tr
      ><td><code>simple:</code></td><td>Simple Icons, brand logos</td><td>3,466</td><td
        >CC0; the brands are trademarks of their owners</td
      ></tr
    >
  </tbody>
</table>

<h2>Size, color and line width</h2>
<p>
  An icon is a 24 by 24 grid scaled to <code>.size()</code>, 48 pixels by default. Its color is the
  theme's text color unless you set <code>.color()</code> with a color or a theme role. Outline
  icons take <code>.stroke_width()</code> on the 24-unit grid, 2 by default; filled icons and logos have
  no lines.
</p>
<p>
  The handle, <code>Icon</code>, has <code>color()</code> and <code>stroke_width()</code> as
  signals, so a whole icon animates at once. It is a node like any other: <code>fade_in</code>,
  <code>next_to</code>, <code>scale</code> and layout work on it. <code>Icon::paths</code> gives its
  paths one by one, for <code>draw_on</code>, and <code>Icon::style</code> tells an
  <code>IconStyle::Stroke</code> icon from an <code>IconStyle::Fill</code> one.
</p>
<!-- snippet-setup: let server = view.add(icon!("lucide:server")); -->
<pre><code
    >{`server.color().to(Danger, 0.3).await;
server.stroke_width().to(3.0, 0.3).await;
for path in server.paths() {
    path.draw_on().await;
}`}</code
  ></pre>

<h2>In a flow diagram</h2>
<p>
  <code>FlowDiagram</code> puts an icon at the start of a node's card with
  <code>.icon(name, icon!(..))</code>. <code>flow.icon(name)</code> returns its handle.
</p>
<pre><code
    >{`let flow = view.add(
    FlowDiagram::new()
        .edge("api", "database")
        .icon("api", icon!("lucide:server"))
        .icon("database", icon!("lucide:database")),
);
flow.enter().await;
if let Some(db) = flow.icon("database") {
    db.color().to(Danger, 0.3).await;
}`}</code
  ></pre>

<h2>Any other SVG</h2>
<p>
  <code>Icon::from_svg(bytes, IconStyle::Stroke)</code> makes the same node from a 24 by 24 SVG of
  your own. For a logo or an illustration at its own size, use
  <a href="/docs/0.23.10/nodes">the <code>Svg</code> node</a>.
</p>
<p>The playground has the feature on, so <code>icon!</code> works in a scene there.</p>
