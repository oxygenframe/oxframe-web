<h1>Welcome to oxframe</h1>
<p class="lead">
  oxframe lets you make animations by writing code. You describe what happens, step by step, and
  oxframe turns it into a video — with a live editor to scrub through it and fine-tune the timing.
</p>

<p>Here is a whole animation: a square slides to the right and becomes a circle.</p>
<pre><code
    >{`#[oxframe::scene]
async fn intro(view: View) {
    let square = view.add(Rect::new().size(200.0).x(-300.0));
    all((square.x().to(300.0, 1.0), square.radius().to(100.0, 1.0))).await;
}`}</code
  ></pre>
<p>
  If that reads like a recipe — <em
    >add a square, then move it and round its corners at the same time</em
  > — you already understand the main idea. The rest of these docs teach you the details, one small step
  at a time.
</p>

<h2>How to read these docs</h2>
<ul>
  <li>
    <strong>Start here</strong> gets oxframe running. If you just want to look around first, open
    the
    <a href="/playground">playground</a>: it runs in your browser, nothing to install.
  </li>
  <li>
    <strong>Guide</strong> is fourteen short lessons. Each one adds a single idea and has a live preview
    you can play with. Read them in order — none of them assumes more than the lessons before it.
  </li>
  <li>
    <strong>Going further</strong> is the reference: every node, effect, editor feature and command.
  </li>
  <li><strong>Under the hood</strong> explains how oxframe works inside, for the curious.</li>
</ul>

<h2>What you need to know</h2>
<p>
  The basics of Rust are enough: <code>let</code>, functions, and calling methods. You do not need
  to know
  <code>async</code> — lesson 1 explains the only part of it you will use. No graphics experience required.
</p>

<p>
  Ready? <a href="/docs/0.16.0/getting-started">Install oxframe</a>, or jump straight to
  <a href="/docs/0.16.0/guide/hello">lesson 1</a> in the browser.
</p>
