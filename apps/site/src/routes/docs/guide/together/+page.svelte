<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>2. In order, or all at once</h1>
<p class="lead">
  In lesson 1 things happened one after another. Now you will make several things move at the same
  time.
</p>

<LiveExample name="learn_02_together" open />

<h2>One after another</h2>
<p>
  Two lines, each ending in <code>.await</code>: the second one starts when the first is finished.
</p>
<!-- snippet-setup: let (a, b) = (view.add(Circle::new()), view.add(Circle::new())); -->
<pre><code
    >{`a.x().to(500.0, 0.8).await;
b.x().to(500.0, 0.8).await;`}</code
  ></pre>

<h2>At the same time: <code>all</code></h2>
<p>
  To play animations together, put them in <code>all((...))</code> — note the double parentheses, it
  takes a group of animations — and await that once. It finishes when the <em>longest</em> one does.
</p>
<!-- snippet-setup: let (c, d) = (view.add(Circle::new()), view.add(Circle::new())); -->
<pre><code>all((c.x().to(500.0, 0.8), d.x().to(500.0, 1.6))).await;</code></pre>

<h2>Pauses and waves</h2>
<p>
  <code>wait_for(0.3).await</code> simply waits. <code>stagger(0.1, &wave, |c| ...)</code> runs the same
  animation on every item of a list, each one starting 0.1 s after the previous — that is the ripple at
  the end of the preview.
</p>
<!-- snippet-setup: let wave: Vec<Circle> = (0..5).map(|_| view.add(Circle::new())).collect(); -->
<pre><code>stagger(0.1, &wave, |c| c.y().to(200.0, 0.4)).await;</code></pre>
<p>
  For a list of the same animation that should all start at once, <code>all</code> takes it
  directly:
  <code>all(wave.iter().map(|c| c.y().to(200.0, 0.4)))</code>.
</p>

<h2>Ready-made entrances</h2>
<p>
  Every shape has a few common moves built in. They take their length and easing from the theme, so
  a whole video stays consistent; <code>.duration(seconds)</code> changes one of them.
</p>
<!-- snippet-setup: let title = view.add(Txt::new().text("Title")); let badge = view.add(Circle::new()); let card = view.add(Rect::new()); let outline = view.add(Rect::new().stroke(Accent).line_width(4.0)); -->
<pre><code
    >title.fade_in().await;
badge.pop_in().await;              // grows from nothing with a small overshoot
card.slide_in(Side::Left).await;   // slides in from the left while fading in
outline.draw_on().await;           // the outline is drawn like with a pen
title.fade_out().duration(0.3).await;</code
  ></pre>

<Try>
  <ul>
    <li>Wrap the two red squares in <code>all((...))</code> so they move together.</li>
    <li>Change the delay in <code>stagger</code> to <code>0.3</code>.</li>
    <li>Replace the wave's animation with <code>|c| c.pop_in()</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>Lines with <code>.await</code> run in order.</li>
    <li><code>all((a, b, c)).await</code> runs them together and waits for all.</li>
    <li>
      <code>wait_for(seconds)</code> pauses; <code>stagger(delay, &list, |x| ...)</code> ripples through
      a list.
    </li>
    <li>
      <code>fade_in</code>, <code>pop_in</code>, <code>slide_in</code>, <code>draw_on</code> are ready-made
      entrances.
    </li>
  </ul>
</Recap>
