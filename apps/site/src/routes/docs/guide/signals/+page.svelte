<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>8. Signals</h1>
<p class="lead">
  Make one thing follow another automatically — a line that always connects two dots, a label that
  always shows a value.
</p>

<LiveExample name="learn_08_signals" open />

<h2>Every property is a signal</h2>
<p>
  <code>a.x()</code> — what you have been animating — is a <strong>signal</strong>: a value that can
  change over time. Besides <code>.to(...)</code>, signals have <code>.get()</code> (read now),
  <code>.set(v)</code>
  (change now) and
  <code>.bind(...)</code>:
</p>
<!-- snippet-setup: let label = view.add(Txt::new().text("mid")); let (ax, bx) = (view.add(Circle::new()).x(), view.add(Circle::new()).x()); -->
<pre><code>label.x().bind(move || (ax.get() + bx.get()) / 2.0);</code></pre>
<p>
  <code>Signal::set</code> takes what <code>Signal::to</code> takes, so
  <code>text.set("Done")</code>
  and <code>fill.set(Accent)</code> need no conversion. <code>Node::scale()</code> is a
  <code>ScaleSignal</code>: a <code>Signal&lt;Vec2&gt;</code> whose <code>to</code> and
  <code>set</code> also take one number for both axes, as in <code>node.scale().to(1.2, 0.3)</code>.
  On a builder, <code>.scale(..)</code> takes one number, a pair or a <code>Vec2</code>:
  <code>.scale(1.5)</code>, <code>.scale((2.0, 0.5))</code>, <code>.scale(2)</code>.
</p>
<p>
  This says: <em>the label's x is always halfway between the two dots.</em> Whenever a dot moves, the
  label follows by itself. In the preview only the two dots are animated; the line, the label and its
  text are all bound.
</p>

<h2>About <code>move</code> and the extra lines</h2>
<p>
  The formula runs later, every time something changes, so it needs its own copies of the signals it
  reads — that is what <code>let (ax, bx) = (a.x(), b.x());</code> before it and <code>move</code> in
  front of it are for. Copying a signal is cheap: both copies point to the same value.
</p>
<p>
  Bound values are computed lazily — only when something needs them for drawing — so binding costs
  almost nothing.
</p>

<Try>
  <ul>
    <li>Bind <code>b.fill()</code> so the blue dot turns red when it gets close to the red one.</li>
    <li>Bind the label's <code>font_size</code> to the distance.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>
      Properties are signals: <code>get</code>, <code>set</code>, <code>to</code>,
      <code>bind</code>.
    </li>
    <li><code>bind(move || ...)</code> keeps a value up to date with a formula.</li>
  </ul>
</Recap>
