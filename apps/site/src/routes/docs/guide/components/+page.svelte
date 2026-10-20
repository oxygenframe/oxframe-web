<h1>Components</h1>
<p class="lead">
  An explainer is a handful of blocks. Each one takes its color and type from the theme,
  places itself, and answers <code>enter</code>, <code>next</code> and <code>exit</code>.
</p>

<h2>Title card</h2>
<pre><code>{`let title = view.add(TitleCard::new("Binary search").subtitle("O(log n)"));
title.enter().await;
title.next().await;
title.exit().await;`}</code></pre>
<p><code>enter</code> fades the card and the title in. <code>next</code> reveals the subtitle.</p>

<h2>Chapter marker</h2>
<pre><code>{`let chapter = view.add(ChapterMarker::new("1  Search"));
chapter.enter().await;`}</code></pre>
<p>A label pinned to the top safe area, including on a vertical frame.</p>

<h2>Bullet list</h2>
<pre><code>{`let steps = view.add(BulletList::new(["Take the middle", "Compare", "Drop half"]));
steps.enter().await;
for _ in 0..steps.len() { steps.next().await; }`}</code></pre>
<p><code>enter</code> shows the stack. Each <code>next</code> reveals one row.</p>

<h2>Code explainer</h2>
<pre><code>{`let code = view.add(
    CodeExplainer::new("lo + (hi - lo) / 2").step(1, 1, "the middle"),
);
code.enter().await;
code.next().await;`}</code></pre>
<p>
  <code>enter</code> shows the source. Each <code>next</code> focuses the next line range
  (1-based, inclusive) and sets the caption. A light theme uses a light code theme.
</p>

<h2>Flow diagram</h2>
<pre><code>{`let flow = view.add(FlowDiagram::new().edge("Client", "API").edge("API", "DB"));
flow.enter().await;
for _ in 0..flow.len() { flow.next().await; }`}</code></pre>
<p>
  You name the links. The diagram lays the nodes out in layers, left to right.
  <code>.down()</code> stacks the layers. <code>next</code> highlights the next node.
</p>

<h2>Callout</h2>
<pre><code>{`let card = view.add(Rect::new().size(280.0).fill(Surface));
let call = view.add(Callout::new(card).text("the middle"));
call.enter().await;
call.next().await;`}</code></pre>
<p>The caption sits above the target. <code>enter</code> draws the arrow, <code>next</code> shows the words.</p>

<h2>Lower third</h2>
<pre><code>{`let lower = view.add(LowerThird::new("Ada").role("walks the half"));
lower.enter().await;
lower.next().await;`}</code></pre>
<p>Pinned to the bottom safe area. <code>next</code> reveals the role.</p>

<h2>End card</h2>
<pre><code>{`let end = view.add(EndCard::new("That's the search").note("Repeat from the top"));
end.enter().await;
end.next().await;
end.exit().await;`}</code></pre>
<p>Same rhythm as a title card. The note waits for <code>next</code>.</p>

<p>
  The gallery example <code>components</code> is a full explainer in under 40 lines.
  <code>Project::aspects</code> makes <code>oxframe check</code> look at 16:9, 9:16 and 1:1.
</p>
