<h1>Working with AI agents</h1>
<p class="lead">
  Coding agents like Claude Code, Codex or Cursor can write oxframe scenes for you. Every new
  project comes with instructions that teach them how — and a way for them to see what they made.
</p>

<h2>What <code>oxframe init</code> adds</h2>
<table>
  <tbody>
    <tr>
      <td><code>AGENTS.md</code></td>
      <td>
        The project's rules for any agent: how scenes work, which commands to run, what never to do
        (non-deterministic code, editing <code>meta.json</code> by hand) and fixes for the most common
        compile errors.
      </td>
    </tr>
    <tr>
      <td><code>CLAUDE.md</code></td>
      <td>One line, <code>@AGENTS.md</code>, so Claude Code reads the same file.</td>
    </tr>
    <tr>
      <td><code>.claude/skills/oxframe/</code></td>
      <td>
        A skill with a step-by-step workflow (<code>SKILL.md</code>) and an API cheat sheet (<code
          >reference.md</code
        >). Agents that support skills load it whenever you ask for a change to a scene.
      </td>
    </tr>
  </tbody>
</table>
<p>The files are plain Markdown. Read them, edit them, add your own project conventions.</p>

<h2>Letting the agent see its work</h2>
<p>
  Animation is visual, so compiling is not enough to know a change is right. The instructions tell
  the agent to look at the picture after every change:
</p>
<pre><code
    >{`oxframe check                 # storyboard.png + report.json; exit 1 on errors
# open out/check/storyboard.png and out/check/report.json, fix, run again
oxframe inspect --at 2.5      # scene tree at that time, when a frame looks wrong`}</code
  ></pre>
<p>
  The storyboard is a grid of frames with the time under each cell. The report names the rule, the
  node and the source line. <code>oxframe snapshot</code> is still there for one full-size still.
  Nothing keeps running — <code>oxframe dev</code> is for you, not for the agent.
</p>

<h2>A good way to work together</h2>
<ol>
  <li>Keep <code>oxframe dev</code> open in your browser.</li>
  <li>
    Ask the agent for a change in plain words: <em
      >"after the title, slide three cards in from the left, one after another"</em
    >.
  </li>
  <li>The agent edits the code and checks it with <code>oxframe check</code>; your preview reloads by itself.</li>
  <li>
    Fine-tune timing yourself with markers and sliders. The agent is told to keep your
    <code>meta.json</code> values, so your adjustments survive its next edit.
  </li>
</ol>

<h2>Keeping the files up to date</h2>
<p>After upgrading oxframe, refresh the instructions:</p>
<pre><code
    >{`oxframe agents          # refreshes the generated files
oxframe agents --force  # also replaces files you made your own`}</code
  ></pre>
<p>
  Generated files carry an <code>oxframe-agents</code> marker comment. To keep your own version of a file,
  delete that comment — files without it are left alone. Projects created with an older CLI can get the
  files the same way.
</p>

<h2>Connecting an MCP client</h2>
<p>
  <code>oxframe mcp</code> speaks MCP over stdin and stdout. Point Claude Code, or any other client,
  at that command with the project directory as its working directory. The tools are
  <code>check</code>, <code>storyboard</code>, <code>render_frame</code>, <code>inspect</code>,
  <code>list_components</code>, <code>docs_search</code> and <code>render</code>.
  <code>docs_search</code> looks through the docs of the CLI's own version.
</p>
<pre><code
    >{`{
  "mcpServers": {
    "oxframe": { "command": "oxframe", "args": ["mcp"] }
  }
}`}</code
  ></pre>
<p>
  Every command also takes <code>--json</code> and then prints a single JSON object on stdout.
  A compile error includes the compiler text and a <code>hints</code> array for the mistakes agents
  make most often (a forgotten <code>.await</code>, a builder never passed to <code>add</code>, a
  theme token used as a number, and the rest).
</p>

<h2>For tools that read the web</h2>
<p>
  Each docs version has a plain-text index and a full dump, generated from the pages when the site
  is built. The current version is <a href="/llms.txt"><code>/llms.txt</code></a> and
  <a href="/llms-full.txt"><code>/llms-full.txt</code></a>. A pinned version is
  <code>/docs/&lt;series&gt;/llms.txt</code> (for example <a href="/docs/0.1/llms.txt"><code>/docs/0.1/llms.txt</code></a>).
  The current series redirects to the unversioned files, so a link written for today's version keeps
  working after that series is archived.
</p>
