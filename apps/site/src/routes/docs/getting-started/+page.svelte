<h1>Install and first project</h1>
<p class="lead">Five minutes from nothing to an editor with your own animation in it.</p>

<p>
  <strong>Want to skip installing?</strong> Everything in the guide also works in the
  <a href="/playground">playground</a>. Come back here when you want to render videos on your
  machine.
</p>

<h2>1. Install the tools</h2>
<p>You need Rust with a C linker and, to make videos, ffmpeg.</p>
<pre><code
    >{`# Rust (skip if you have it)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# a C linker, if this machine has never built C or Rust
sudo apt install build-essential   # Debian/Ubuntu
xcode-select --install             # macOS

# ffmpeg
sudo apt install ffmpeg        # Linux
brew install ffmpeg            # macOS
winget install Gyan.FFmpeg     # Windows

# the oxframe command
cargo install oxframe-cli`}</code
  ></pre>

<h3>Requirements</h3>
<table>
  <tbody>
    <tr
      ><td>System</td><td>Linux (x86_64, arm64), macOS (Intel, Apple Silicon), Windows (x86_64).</td
      ></tr
    >
    <tr
      ><td>Rust</td><td
        >1.95 or newer, from <a href="https://rustup.rs">rustup</a>. <code>rustup update</code> moves
        an older one forward.</td
      ></tr
    >
    <tr
      ><td>C linker</td><td
        >Rust links programs with it. Linux: <code>build-essential</code> (Debian, Ubuntu),
        <code>gcc</code> (Fedora), <code>base-devel</code> (Arch). macOS: the Xcode command line tools.
        Windows: the MSVC build tools, which rustup offers to install.</td
      ></tr
    >
    <tr
      ><td>ffmpeg</td><td
        >For MP4, WebM and ProRes. The editor, <code>oxframe check</code>, snapshots and PNG frames
        work without it.</td
      ></tr
    >
    <tr
      ><td>GPU</td><td
        >Not needed: frames are drawn on the CPU. <code>--gpu</code> uses Vulkan, Metal or DirectX 12
        when the machine has them.</td
      ></tr
    >
    <tr
      ><td>Disk</td><td
        >A few GB per project for Rust's build cache in <code>target/</code>; the first build fills
        it.</td
      ></tr
    >
  </tbody>
</table>

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
        >Instructions for AI coding assistants (see <a href="/docs/agents">Working with AI agents</a
        >).</td
      ></tr
    >
  </tbody>
</table>

<p>Next, <a href="/docs/guide/hello">lesson 1</a> walks through that first scene line by line.</p>

<style>
  td {
    padding: 6px 12px 6px 0;
    vertical-align: top;
    border-bottom: 1px solid var(--border);
  }
</style>
