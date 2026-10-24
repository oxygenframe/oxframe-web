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
  <code>--template node</code> makes a library crate with a node of your own instead (see
  <a href="/docs/custom-nodes">Writing your own node</a>).
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
<figure>
  <img
    src="/images/editor.png"
    width="1440"
    height="900"
    loading="lazy"
    alt="The editor oxframe dev opens: the frame of a new project in the middle, the inspector on the right and the timeline with a marker at the bottom"
  />
  <figcaption>
    What <code>oxframe dev</code> opens, on the project <code>oxframe init</code> creates.
  </figcaption>
</figure>
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
      ><td><code>--gpu</code></td><td
        >Draw the preview on the GPU (vello). The CPU is the default; <code>--cpu</code> is still accepted.</td
      ></tr
    >
  </tbody>
</table>

<h3><code>oxframe present</code></h3>
<p>
  Builds the project like <code>oxframe dev</code> and opens it as a presentation: full screen,
  stopping at every <code>slide_break</code> and scene end. N opens the speaker notes. Takes
  <code>--port</code>, <code>--no-open</code>, <code>--release</code> and <code>--gpu</code>. See
  <a href="/docs/presentations">Presentations from scenes</a>.
</p>

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
    <tr
      ><td><code>--gpu</code></td><td
        >Draw on the GPU (vello). The CPU (tiny-skia) is the default: faster here and byte-for-byte
        deterministic. <code>--cpu</code> is still accepted and wins.</td
      ></tr
    >
    <tr><td><code>--no-audio</code></td><td>Leave the soundtrack out.</td></tr>
  </tbody>
</table>

<h3><code>oxframe publish</code></h3>
<p>
  Renders the project and uploads the video to oxframe.dev, then prints a link to a page with a
  player. Pasted into Discord or Slack, the link unfolds as a video; X shows its poster. Use it to
  show a draft to someone without sending a file.
</p>
<pre><code
    >{`oxframe publish --title "Launch teaser"
# https://oxframe.dev/s/86sKmiYNNe
oxframe publish out/teaser.mp4           # an MP4 you already rendered
oxframe publish --range 0..30            # the first 30 seconds of a longer video`}</code
  ></pre>
<p>
  Anyone with the link can watch the video, and it is deleted after 30 days. A video can be up to 30
  seconds and 16 MB; a larger render is re-encoded at 720p once. The upload sends the video, a
  poster frame and the title, nothing else (see <a href="/privacy">Privacy</a>). It needs ffmpeg and
  <code>curl</code>, which ships with Linux, macOS and Windows 10 and later. Flags:
  <code>--title</code> (up to 100 characters, shown on the page and in link previews),
  <code>--scene</code>, <code>--range</code> and <code>--gpu</code>, as for <code>render</code>.
  With <code>--json</code> it prints <code>url</code>, <code>id</code> and <code>seconds</code>.
</p>

<h3><code>oxframe check</code></h3>
<p>
  Compiles the project (<code>cargo check</code>), validates every <code>meta.json</code>, compares
  the versions of the CLI, SDK and editor, and then looks at the picture. It writes
  <code>out/check/storyboard.png</code> (a grid of frames at markers and at equal intervals, with
  the time and marker name under each cell) and <code>out/check/report.json</code>.
</p>
<figure>
  <img
    src="/storyboard.png"
    width="1320"
    height="214"
    loading="lazy"
    alt="A storyboard written by oxframe check: four frames at 0, 1, 2 and 2.7 seconds, with the time under each; at 1 and 2 seconds a bullet list is drawn over the title Binary search"
  />
  <figcaption>
    A storyboard of a scene with a mistake: the list sits on top of the title, and
    <code>report.json</code> names the two nodes and the source line.
  </figcaption>
</figure>
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
  An issue on a node also gets a close-up: <code>out/check/issues/01-out_of_frame.png</code> and so
  on, that part of the frame at full resolution with the node outlined in red (up to 24 per check).
  In <code>report.json</code> the issue then has <code>bounds</code>, the node's box at the start of
  the issue in scene units (as in <code>oxframe inspect</code>), and <code>crop</code>, the path of
  the picture relative to <code>out/check/</code>. An agent opens the crop instead of hunting for
  the problem on the storyboard.
</p>
<p>
  The report also lists <code>motion</code>: every node that travels, with its
  <code>file:line</code>, the stretches of time it visibly moves (<code>moves</code>, in seconds),
  where it starts and ends, and the length of its path. Read it to check timing without watching the
  video. <code>out/check/trajectories/&lt;scene&gt;.png</code> draws those paths over the scene's
  last frame, numbered as in <code>motion</code>. A hard cut between scenes shows on the storyboard
  as the last frame of one scene next to the first frame of the next.
</p>
<p>
  To see what an edit changed, keep the frames from before it and compare with
  <code>oxframe check --against &lt;dir&gt;</code>:
</p>
<pre><code
    >{`oxframe check --frames --out out/before
# edit the scene
oxframe check --against out/before`}</code
  ></pre>
<p>
  Each frame that changed is listed with the share of its pixels that moved, and
  <code>out/check/diff/</code> holds the frame dimmed with the changed pixels in red. The report
  gets a <code>comparison</code>: changed, unchanged, added and removed frames. An edit that changed
  frames it should not have shows up at once. The reference frames are read with
  <code>Image::decode_png</code>.
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

<h3><code>oxframe add &lt;block&gt;</code></h3>
<p>
  Copies a ready-made, checked block into <code>src/blocks/</code> and adds
  <code>mod blocks;</code> to <code>src/main.rs</code>. Each block is one call that plays itself in
  and returns its group: <code>blocks::stat_counter(view, 1280.0, "stars").await</code>. With no
  name it lists all eighteen, each passing <code>oxframe check</code>. The copied file is yours to
  edit; <code>--force</code> replaces it.
</p>
<ul>
  <li>
    Titles and endings: <code>logo-reveal</code>, <code>kinetic-title</code>,
    <code>call-to-action</code>, <code>countdown</code> (numbers in a filling ring).
  </li>
  <li>
    Numbers and data: <code>stat-counter</code>, <code>progress-bar</code>, <code>bar-chart</code>,
    <code>comparison</code> (a yes/no table against another product).
  </li>
  <li>
    Product and release: <code>feature-grid</code> (feature cards in a row),
    <code>release-notes</code>, <code>before-after</code>, <code>timeline</code>,
    <code>checklist</code> (items ticked off).
  </li>
  <li>
    Developer stories: <code>terminal</code>, <code>code-change</code>,
    <code>pull-request</code> (a PR card that gets merged), <code>chat-messages</code> (a
    conversation in bubbles), <code>quote-card</code>.
  </li>
</ul>

<h3><code>oxframe doctor</code></h3>
<p>
  Checks what building and rendering need — Rust 1.95 or newer, a C linker, ffmpeg, and inside a
  project whether it is on the SDK your CLI makes — and prints the fix for each missing piece on
  your system. Exits 2 when something required is missing.
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
  The editor server listens on 127.0.0.1 only, checks the <code>Origin</code> of every WebSocket
  connection and requires a one-time token. The CLI runs nothing but cargo, ffmpeg and your own
  project, and uploads nothing unless you run <code>oxframe publish</code>.
</p>

<style>
  figure {
    margin: 0 0 24px;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  figcaption {
    margin-top: 8px;
    font-size: 0.9em;
    opacity: 0.8;
  }
</style>
