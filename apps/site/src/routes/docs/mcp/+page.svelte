<h1>MCP server</h1>
<p class="lead">
  oxframe has two MCP servers. <code>oxframe mcp</code> runs on your machine and lets an agent
  check, inspect and render the video it is writing. <code>https://mcp.oxframe.dev/mcp</code> is hosted
  and needs no install: it serves the documentation, and checks and renders frames of a scene for agents
  that cannot run commands.
</p>

<table>
  <thead>
    <tr><th></th><th>Local: <code>oxframe mcp</code></th><th>Hosted: mcp.oxframe.dev</th></tr>
  </thead>
  <tbody>
    <tr
      ><td>Transport</td><td>stdio</td><td
        >Streamable HTTP, <code>https://mcp.oxframe.dev/mcp</code></td
      ></tr
    >
    <tr><td>Install</td><td>The oxframe CLI, Rust, ffmpeg</td><td>Nothing</td></tr>
    <tr><td>Sign-in</td><td>None</td><td>None</td></tr>
    <tr
      ><td>Tools</td><td>Check, storyboard, frames, inspector, render, docs</td><td
        >Docs search, pages, components, examples; check, a frame and the inspector for one scene
        file</td
      ></tr
    >
    <tr
      ><td>Good for</td><td>Claude Code, Codex, Cursor, VS Code: agents that edit files</td><td
        >ChatGPT, Claude.ai, web IDEs: agents that cannot run commands</td
      ></tr
    >
    <tr><td>MCP Registry</td><td><code>io.github.oxygenframe/oxframe</code></td><td>—</td></tr>
  </tbody>
</table>

<h2 id="local">The local server, from scratch</h2>
<p>
  1. Install the oxframe command (Linux and macOS; Windows and other ways are in
  <a href="/docs/getting-started">Install and first project</a>):
</p>
<pre><code
    >{`curl -fsSL https://github.com/oxygenframe/oxframe-cli/releases/latest/download/install.sh | sh
# or: brew install oxygenframe/tap/oxframe
# or: cargo install oxframe-cli
oxframe doctor   # Rust, ffmpeg and a C linker in place?`}</code
  ></pre>
<p>2. Create a project. The server works on the project in the directory it starts in.</p>
<pre><code>oxframe init my-video && cd my-video</code></pre>
<p>3. Add the server to your client, from inside that directory.</p>

<h3>Claude Code</h3>
<pre><code
    >{`claude mcp add oxframe -- oxframe mcp
# or, shared with everyone who clones the project (writes .mcp.json):
claude mcp add --scope project oxframe -- oxframe mcp`}</code
  ></pre>
<p>
  The <a href="/agents#plugins">oxframe plugin</a> adds the same server together with the skills:
  <code>/plugin marketplace add oxygenframe/oxframe-sdk</code>, then
  <code>/plugin install oxframe@oxframe</code>.
</p>

<h3>Codex</h3>
<pre><code>codex mcp add oxframe -- oxframe mcp</code></pre>
<p>
  Or in <code>~/.codex/config.toml</code>:
</p>
<pre><code
    >{`[mcp_servers.oxframe]
command = "oxframe"
args = ["mcp"]`}</code
  ></pre>

<h3>Cursor</h3>
<p><code>.cursor/mcp.json</code> in the project, then open the project folder in Cursor:</p>
<pre><code
    >{`{
  "mcpServers": {
    "oxframe": { "command": "oxframe", "args": ["mcp"] }
  }
}`}</code
  ></pre>

<h3>VS Code (GitHub Copilot)</h3>
<p><code>.vscode/mcp.json</code> in the project:</p>
<pre><code
    >{`{
  "servers": {
    "oxframe": { "type": "stdio", "command": "oxframe", "args": ["mcp"] }
  }
}`}</code
  ></pre>

<h3>Any other client</h3>
<p>
  The command is <code>oxframe</code> with the argument <code>mcp</code>, started in the project
  directory. A client that starts servers somewhere else can name the project instead:
  <code>oxframe mcp --dir /path/to/my-video</code>. Messages are newline-delimited JSON-RPC on stdin
  and stdout; a
  <code>Content-Length</code> frame is accepted too. Logs go to stderr.
</p>

<h2 id="tools">Tools of the local server</h2>
<table>
  <tbody>
    <tr
      ><td><code>check</code></td><td
        >Compiles the project and runs the visual check. Returns <code>report.json</code> (each
        issue with a rule, a time range, the node and <code>file:line</code>), the storyboard path
        and hints for common compile errors. <code>frames</code> also writes every sampled frame;
        <code>against</code> compares with an earlier check and writes diff images.</td
      ></tr
    >
    <tr
      ><td><code>storyboard</code></td><td
        >The same check, answered with the storyboard path and a short summary.</td
      ></tr
    >
    <tr
      ><td><code>render_frame</code></td><td
        >One frame as a PNG: <code>at</code> in seconds, optional <code>scene</code> and
        <code>size</code> (default 960×540).</td
      ></tr
    >
    <tr
      ><td><code>inspect</code></td><td
        >The scene tree at one time: kind, name, bounds, text and <code>file:line</code> of each node.</td
      ></tr
    >
    <tr
      ><td><code>render_graph</code></td><td
        >The render passes at one time, in order, with the shader of each effect pass.</td
      ></tr
    >
    <tr
      ><td><code>list_components</code></td><td
        >The explainer components (TitleCard, BulletList, CodeExplainer, FlowDiagram and the rest)
        with a one-line example each.</td
      ></tr
    >
    <tr><td><code>docs_search</code></td><td>Searches the docs of the CLI's own version.</td></tr>
    <tr
      ><td><code>render</code></td><td
        >Builds in release mode and renders the video: <code>scene</code>, <code>aspect</code>
        (16:9, 9:16, 1:1 or all), <code>format</code>, <code>size</code>, <code>cpu</code>/<code
          >gpu</code
        >.</td
      ></tr
    >
  </tbody>
</table>
<p>
  Everything runs on your machine; the local server sends nothing anywhere. A typical turn: the
  agent edits <code>src/main.rs</code>, calls <code>check</code>, opens the storyboard and the
  close-ups of each issue, fixes them and checks again until the report is clean, then calls
  <code>render</code>. <a href="/docs/check-rules">Check rules</a> lists what the check looks for.
</p>

<h2 id="hosted">The hosted server</h2>
<p>
  <code>https://mcp.oxframe.dev/mcp</code> speaks Streamable HTTP and needs no sign-in. Its docs
  tools follow the current docs on every site deploy. Its scene tools take one scene file, written
  as in the <a href="/playground">playground</a> (<code>pub fn project() -> Project</code>), build
  it on
  <code>compile.oxframe.dev</code> and run it there as WebAssembly: the agent sees the
  <a href="/docs/check-rules">check report</a> and the storyboard without installing anything. The first
  build of a scene takes 15 to 60 seconds; the same source again answers at once. Video clips and formulas
  are not available there, and the video file itself is rendered by the local server.
</p>
<table>
  <tbody>
    <tr
      ><td><code>docs_search</code></td><td
        >Searches the current docs and returns the best sections with their page URLs.</td
      ></tr
    >
    <tr
      ><td><code>get_page</code></td><td
        >The whole text of one docs page as Markdown, by URL or path.</td
      ></tr
    >
    <tr
      ><td><code>list_components</code></td><td
        >The explainer components and a one-line example of each.</td
      ></tr
    >
    <tr
      ><td><code>get_example</code></td><td
        >The Rust source of an example from the <a href="/gallery">gallery</a>, by name.</td
      ></tr
    >
    <tr
      ><td><code>check_scene</code></td><td
        >Builds a scene file and runs <code>oxframe check</code> on it: compile errors with their line,
        or the issues in its frames with hints, and the storyboard as an image.</td
      ></tr
    >
    <tr
      ><td><code>render_frame</code></td><td>One frame at a time in seconds, as a full-size PNG.</td
      ></tr
    >
    <tr
      ><td><code>inspect_scene</code></td><td
        >The scene tree at a time as JSON: each node's kind, name, bounds, text and source line.</td
      ></tr
    >
  </tbody>
</table>
<pre><code
    >{`# Claude Code
claude mcp add --transport http oxframe-docs https://mcp.oxframe.dev/mcp
# Codex
codex mcp add oxframe-docs --url https://mcp.oxframe.dev/mcp
# Cursor, .cursor/mcp.json
{ "mcpServers": { "oxframe-docs": { "url": "https://mcp.oxframe.dev/mcp" } } }
# VS Code, .vscode/mcp.json
{ "servers": { "oxframe-docs": { "type": "http", "url": "https://mcp.oxframe.dev/mcp" } } }`}</code
  ></pre>
<p>
  In ChatGPT and Claude.ai, add it as a custom connector with the URL
  <code>https://mcp.oxframe.dev/mcp</code> and no authentication. It keeps nothing about you; a
  scene sent to the scene tools is built and cached like one run in the playground, and requests are
  logged by Cloudflare like any other (<a href="/privacy">Privacy</a>).
</p>

<h2 id="try">Try it by hand</h2>
<p>Both servers answer a plain request, which is handy to see that a setup works:</p>
<pre><code
    >{`# local, in a project directory
printf '%s\\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' \\
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | oxframe mcp

# hosted
curl -s https://mcp.oxframe.dev/mcp -H 'content-type: application/json' \\
  -H 'accept: application/json, text/event-stream' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</code
  ></pre>

<h2 id="troubleshooting">When a tool fails</h2>
<ul>
  <li>
    <strong>"no Cargo.toml here or above"</strong>: the client started the server outside the
    project. Open the project folder in the editor, start the client from it, or add
    <code>--dir</code> with the project path to the arguments:
    <code>"args": ["mcp", "--dir", "/path/to/my-video"]</code>.
  </li>
  <li>
    <strong>The client cannot find <code>oxframe</code></strong>: GUI apps may not see your shell's
    <code>PATH</code>. Use the full path from <code>which oxframe</code> as the command.
  </li>
  <li>
    <strong>A compile error</strong>: <code>check</code> returns the compiler text and hints; the
    agent fixes the code and calls it again. More in
    <a href="/docs/troubleshooting">Troubleshooting</a>.
  </li>
</ul>
<p>
  How the instructions in each project and the skills fit with the server:
  <a href="/docs/agents">Working with AI agents</a>.
</p>
