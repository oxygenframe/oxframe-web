<h1>CLI reference</h1>
<p class="lead">
  Everything the <code>oxframe</code> command can do. You will use <code>dev</code> most of the time;
  the rest are for creating, checking and exporting.
</p>

<h2>The everyday loop</h2>
<pre><code
    >{`oxframe init my-video     # once: create a project
cd my-video
oxframe dev               # edit code, watch the preview update
oxframe render            # when you are happy: out/my-video.mp4`}</code
  ></pre>

<h2>Commands</h2>
<p>
  Every command accepts <code>--json</code>. It then prints one JSON object on stdout (<code
    >ok</code
  >, <code>exit</code>, and on failure <code>error</code>, <code>diagnostics</code> and
  <code>hints</code>) and keeps the log on stderr.
</p>

<h3><code>oxframe init &lt;name&gt;</code></h3>
<p>
  Creates a folder with a ready-to-run project: <code>Cargo.toml</code> (SDK version pinned),
  <code>src/main.rs</code> with one scene, its <code>meta.json</code>, <code>oxframe.toml</code>,
  <code>.gitignore</code> and instructions for AI coding agents (see
  <a href="/docs/agents">Working with AI agents</a>).
</p>
<table>
  <tbody>
    <tr
      ><td><code>--sdk-path &lt;dir&gt;</code></td><td
        >Use a local <code>oxframe-sdk</code> checkout instead of crates.io (also
        <code>OXFRAME_SDK_PATH</code>).</td
      ></tr
    >
  </tbody>
</table>

<h3><code>oxframe dev</code></h3>
<p>
  Builds the project, opens the editor in your browser and rebuilds every time you save. If the code
  does not compile, the error shows over the preview and the last good build keeps playing.
</p>
<table>
  <tbody>
    <tr><td><code>--port &lt;n&gt;</code></td><td>Editor port (default 3000).</td></tr>
    <tr
      ><td><code>--open</code> / <code>--no-open</code></td><td
        >Open the browser, or don't (overrides <code>oxframe.toml</code>).</td
      ></tr
    >
    <tr
      ><td><code>--release</code></td><td
        >Optimized build: slower to compile, faster to play heavy scenes.</td
      ></tr
    >
    <tr
      ><td><code>--cpu</code></td><td
        >Render the preview on the CPU — useful on machines without a working GPU.</td
      ></tr
    >
  </tbody>
</table>

<h3><code>oxframe snapshot --at &lt;seconds&gt;</code></h3>
<p>
  Renders single frames as PNG without ffmpeg — handy to check a moment in the animation, to put a
  still in a README, or for an AI agent to look at its own work.
</p>
<pre><code
    >{`oxframe snapshot --at 1.5                       # out/snapshots/<project>-1.50.png
oxframe snapshot --at 0 --at 2 --at 4           # three frames
oxframe snapshot --at 1 --out cover.png         # exactly this file
oxframe snapshot --at 0.5 --scene outro         # time from the start of a scene`}</code
  ></pre>
<p>
  Each written file is printed on its own line (<code>path frame=N t=T</code>), so scripts can pick
  them up. Default size is 960×540; change it with <code>--size 1920x1080</code>.
</p>

<h3><code>oxframe render</code></h3>
<p>
  Builds in release mode and renders a video. See <a href="/docs/rendering">Rendering video</a> for examples.
</p>
<table>
  <tbody>
    <tr
      ><td><code>--out &lt;path&gt;</code></td><td
        >Output file or folder (default <code>out/&lt;project&gt;.mp4</code>).</td
      ></tr
    >
    <tr
      ><td><code>--format &lt;f&gt;</code></td><td
        ><code>mp4</code>, <code>webm</code>, <code>prores</code> or <code>png</code>; by default
        taken from the <code>--out</code> extension.</td
      ></tr
    >
    <tr><td><code>--scene &lt;name&gt;</code></td><td>Only this scene.</td></tr>
    <tr
      ><td><code>--range a..b</code></td><td
        >Only this time range, in seconds; either side can be left out (<code>2..</code>).</td
      ></tr
    >
    <tr><td><code>--size WxH</code></td><td>Output size, e.g. <code>3840x2160</code>.</td></tr>
    <tr
      ><td><code>--aspect &lt;shape&gt;</code></td><td
        ><code>16:9</code>, <code>9:16</code>, <code>1:1</code>, or <code>all</code>.
        <code>all</code> writes one file per format declared with
        <code>Project::aspects</code>.</td
      ></tr
    >
    <tr><td><code>--cpu</code></td><td>Use the CPU renderer, e.g. in CI without a GPU.</td></tr>
    <tr><td><code>--no-audio</code></td><td>Leave the soundtrack out.</td></tr>
  </tbody>
</table>

<h3><code>oxframe check</code></h3>
<p>
  Compiles the project (<code>cargo check</code>), validates every <code>meta.json</code>, compares
  the versions of the CLI, SDK and editor, and then looks at the picture. It writes
  <code>out/check/storyboard.png</code> (a grid of frames at markers and at equal intervals, with
  the time and marker name under each cell) and <code>out/check/report.json</code>.
</p>
<p>
  Each issue has a rule, a severity (<code>error</code> or <code>warning</code>), a time range, the
  node name, the source <code>file:line</code> and a hint:
</p>
<ul>
  <li>
    <code>out_of_frame</code> — a node stays outside the frame (or inside the frame but outside the safe
    area, which is a warning).
  </li>
  <li><code>text_overlap</code> — two text blocks cover each other.</li>
  <li>
    <code>text_overflow</code> — text is wider than its <code>max_width</code> or its layout parent.
  </li>
  <li><code>low_contrast</code> — text against its backdrop is below WCAG 4.5:1.</li>
  <li>
    <code>too_fast</code> — a long line flashes too briefly to read (error), or a large move is shorter
    than 0.15s (warning).
  </li>
  <li>
    <code>dead_time</code> — nothing on screen changes for several seconds and the project has no soundtrack
    (warning).
  </li>
  <li>
    <code>nondeterministic</code> — painting the same frame twice did not match. Draw from the time
    and <code>ctx.rng(seed)</code>, not from a counter saved in the closure.
  </li>
</ul>
<p>
  Errors make the command exit 1; warnings do not. A project that declares
  <code>Project::aspects</code> is checked in every format; the other storyboards are
  <code>storyboard-9x16.png</code> and <code>storyboard-1x1.png</code>. <code>--frames</code> also
  writes each cell at full size under <code>out/check/frames/</code>. The check renders only the
  frames it needs, on the CPU, at a reduced size, so a 30 second scene finishes in a few seconds.
</p>
<p>
  Name a node with <code>.name("title")</code> so the report is readable. Without a name it is
  labeled by the line that called <code>add</code>.
</p>

<h3><code>oxframe inspect --at &lt;seconds&gt;</code></h3>
<p>
  Prints the scene tree at that time as JSON: kind, name, source location, scene bounds, opacity,
  text and draw order. <code>--scene outro</code> measures the time from the start of that scene.
  <code>--graph</code> adds a <code>passes</code> array: one vector pass, then a composite for each layer
  (a group opacity, a blend, a blur, a shadow or a clip). Without the flag the JSON is unchanged.
</p>

<h3><code>oxframe agents</code></h3>
<p>
  Writes or refreshes <code>AGENTS.md</code>, <code>CLAUDE.md</code> and
  <code>.claude/skills/oxframe/</code> — run it after upgrading oxframe. Files you edited yourself
  are left alone unless you pass <code>--force</code>.
</p>

<h3><code>oxframe upgrade</code></h3>
<p>
  Moves the project to the SDK version your CLI is made for: updates the <code>oxframe</code> pin in
  <code>Cargo.toml</code> (keeping your formatting), runs <code>cargo update</code> and refreshes the
  agent files. If the project already uses a newer SDK, it tells you to update the CLI instead.
</p>

<h3><code>oxframe mcp</code></h3>
<p>
  An MCP server on stdin and stdout, for Claude Code and other clients. Started in a project, it
  serves <code>check</code>, <code>storyboard</code>, <code>render_frame</code>,
  <code>inspect</code>, <code>render_graph</code>,
  <code>list_components</code>, <code>docs_search</code> and <code>render</code>.
  <code>render_graph</code> is <code>oxframe inspect --graph</code> without the node tree: the
  render passes at one time, with the shader of each effect pass. Messages are newline-delimited
  JSON-RPC; a <code>Content-Length</code> frame is accepted too. Nothing but the protocol is written to
  stdout.
</p>

<h2>Updating</h2>
<pre><code
    >{`cargo install oxframe-cli --force   # a new CLI
oxframe upgrade                     # then in each project`}</code
  ></pre>
<p>
  Projects pin the SDK version, so a release never changes an existing project on its own. Once a
  day the CLI checks crates.io in the background and mentions a newer version; set
  <code>OXFRAME_NO_UPDATE_CHECK=1</code> to turn that off.
</p>

<h2>oxframe.toml</h2>
<p>Project settings for the CLI. Every key is optional.</p>
<pre><code
    >{`[dev]
port = 3000
open = true        # open the browser on "oxframe dev"
profile = "dev"    # or "release"

[render]
ffmpeg = "/opt/ffmpeg/bin/ffmpeg"   # default: ffmpeg from PATH

[theme]
name = "dark"         # dark, light, midnight, paper, vivid
accent = "#68abdf"    # one brand color; other colors stay readable

[check]
interval = 1.0        # seconds between storyboard frames
safe_inset = 48       # px; 0 turns the safe-area warning off
min_contrast = 4.5
min_motion = 0.15
max_still = 3.0
chars_per_second = 20
min_chars = 24
cell_width = 320`}</code
  ></pre>

<h2>Exit codes</h2>
<table>
  <tbody>
    <tr><td>0</td><td>Success.</td></tr>
    <tr
      ><td>1</td><td
        >Your code does not compile, the scene fails, or <code>oxframe check</code> found an error.</td
      ></tr
    >
    <tr><td>2</td><td>Environment: no ffmpeg, port in use, cannot write a file.</td></tr>
    <tr><td>3</td><td>Version mismatch between the CLI, SDK and editor.</td></tr>
  </tbody>
</table>
<p>Add <code>-v</code> to any command for detailed logs.</p>

<h2>Security</h2>
<p>
  The editor server listens on 127.0.0.1 only, checks the <code>Origin</code> of every WebSocket connection
  and requires a one-time token. The CLI runs nothing but cargo and your own project.
</p>
