<h1>Install and first project</h1>
<p class="lead">Five minutes from nothing to an editor with your own animation in it.</p>

<p>
  <strong>Want to skip installing?</strong> Everything in the guide also works in the
  <a href="/playground">playground</a>. Come back here when you want to render videos on your
  machine.
</p>

<h2>1. Install the tools</h2>
<p>You need Rust and, to make videos, ffmpeg.</p>
<pre><code
    >{`# Rust (skip if you have it)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# ffmpeg
sudo apt install ffmpeg        # Linux
brew install ffmpeg            # macOS
winget install Gyan.FFmpeg     # Windows

# the oxframe command
cargo install oxframe-cli`}</code
  ></pre>

<h2>2. Create a project</h2>
<pre><code
    >{`oxframe init hello
cd hello
oxframe dev --open`}</code
  ></pre>
<p>
  The first build takes a minute or two — Rust compiles the engine once. Then your browser opens the
  editor: the animation in the middle, the timeline at the bottom. Press <kbd>Space</kbd> to play.
</p>

<h2>3. Change something</h2>
<p>
  Open <code>src/main.rs</code>, find <code>color!("#68abdf")</code> and change it to
  <code>color!("#2ecc71")</code>. Save. About a second later the editor shows the new color — and
  stays on the same frame. That loop, edit → save → look, is how you will work.
</p>

<h2>4. Make a video</h2>
<pre><code>oxframe render        # writes out/hello.mp4</code></pre>

<h2>What is in the project</h2>
<table>
  <tbody>
    <tr><td><code>src/main.rs</code></td><td>Your scene. Everything you write goes here.</td></tr>
    <tr
      ><td><code>src/intro.meta.json</code></td><td
        >Timing values you adjust in the editor (lesson 7). Commit it.</td
      ></tr
    >
    <tr
      ><td><code>oxframe.toml</code></td><td
        >Settings for <code>oxframe dev</code> and <code>render</code>.</td
      ></tr
    >
    <tr><td><code>assets/</code></td><td>Images and audio.</td></tr>
    <tr
      ><td><code>AGENTS.md</code>, <code>.claude/</code></td><td
        >Instructions for AI coding assistants (see <a href="/docs/0.17.0/agents"
          >Working with AI agents</a
        >).</td
      ></tr
    >
  </tbody>
</table>

<p>
  Next, <a href="/docs/0.17.0/guide/hello">lesson 1</a> walks through that first scene line by line.
</p>

<style>
  td {
    padding: 6px 12px 6px 0;
    vertical-align: top;
    border-bottom: 1px solid var(--border);
  }
</style>
