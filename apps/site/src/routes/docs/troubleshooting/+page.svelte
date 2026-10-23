<h1>Troubleshooting</h1>
<p class="lead">
  The messages people meet on a first install or a first render, what they mean, and the fix. Each
  heading is the text you see.
</p>

<h2>linker `cc` not found</h2>
<p>
  Rust compiles your scene and then links it with the system C toolchain. A machine that has never
  built C or Rust code has none. Install it once:
</p>
<pre><code
    >{`sudo apt install build-essential   # Debian, Ubuntu
sudo dnf install gcc               # Fedora
sudo pacman -S base-devel          # Arch
xcode-select --install             # macOS`}</code
  ></pre>
<p>
  On Windows the error is <em>linker `link.exe` not found</em>: install the Visual Studio Build
  Tools with the <strong>Desktop development with C++</strong> workload (rustup offers it when you install
  Rust), then open a new terminal.
</p>

<h2>cannot be built because it requires rustc 1.95 or newer</h2>
<p>Your Rust is older than the SDK needs. Update it:</p>
<pre><code>rustup update stable</code></pre>

<h2>ffmpeg was not found in PATH</h2>
<p>
  <code>oxframe render</code> hands frames to ffmpeg to make MP4, WebM or ProRes. Install it, or
  point oxframe at a copy with <code>ffmpeg = "/path/to/ffmpeg"</code> under <code>[render]</code>
  in
  <code>oxframe.toml</code>:
</p>
<pre><code
    >{`sudo apt install ffmpeg         # Linux (or dnf / pacman)
brew install ffmpeg             # macOS
winget install Gyan.FFmpeg      # Windows, then open a new terminal`}</code
  ></pre>
<p>
  Everything else works without it: <code>oxframe dev</code>, <code>oxframe check</code>,
  <code>oxframe snapshot</code> and <code>oxframe render --format png</code>.
</p>

<h2>cannot listen on 127.0.0.1:3000 (another `oxframe dev`? use --port)</h2>
<p>
  The editor's port is taken, usually by an <code>oxframe dev</code> still running in another
  terminal. Stop that one, or start this one elsewhere: <code>oxframe dev --port 3001</code>.
</p>

<h2>protocol versions differ</h2>
<p>
  <code>oxframe check</code> stops with exit code 3 when the <code>oxframe</code> command and the project's
  SDK speak different editor protocols. Install the newest command, then move the project to it:
</p>
<pre><code
    >{`cargo install oxframe-cli
oxframe upgrade`}</code
  ></pre>
<p>
  See <a href="/docs/versions">Versions and upgrades</a> for what an upgrade changes.
</p>

<h2>build failed; the previous version keeps running</h2>
<p>
  In <code>oxframe dev</code> this is not a crash. Your last save does not compile, so the editor
  keeps showing the last version that did. The compiler error is in the terminal; fix it and save,
  and the editor picks the new build up. A scene that panics again and again stops with
  <em>project keeps crashing; fix the code and save to retry</em>; the next save starts it again.
</p>

<h2>No GPU, or a server or CI runner</h2>
<p>
  Nothing to do: frames are drawn on the CPU by default, so oxframe needs no graphics driver.
  <code>--gpu</code> asks for vello on Vulkan, Metal or DirectX 12 and falls back to the CPU when the
  machine has no usable adapter.
</p>

<h2>WSL</h2>
<p>
  Install Rust and ffmpeg inside the Linux distribution, not on Windows. If <code>oxframe dev</code>
  cannot open a browser, copy the address it prints, token included, into the browser on Windows; WSL
  2 forwards <code>127.0.0.1</code> to Windows by default. Keep projects in the Linux file system (<code
    >~/…</code
  >, not <code>/mnt/c/…</code>): builds and file watching are much faster there.
</p>

<h2>The disk fills up</h2>
<p>
  Rust keeps each project's build cache in <code>target/</code>, a few gigabytes per project. Run
  <code>cargo clean</code> in a project you are not working on to get the space back; the next build starts
  from scratch.
</p>

<h2>Works locally, not in the playground</h2>
<p>
  The browser playground builds with a fixed set of features. Video clips (<code>video</code>) and
  formulas (<code>math</code>) are not in it; scenes that use them run with <code>oxframe dev</code> on
  your machine.
</p>

<h2>Still stuck</h2>
<p>
  Open an issue on
  <a href="https://github.com/oxygenframe/oxframe-sdk/issues/new/choose">GitHub</a> with the
  command, its full output, <code>oxframe --version</code> and your system. Add
  <code>-v</code> to the command for detailed logs.
</p>
