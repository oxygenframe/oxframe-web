<svelte:head><title>Working with AI agents — oxframe</title></svelte:head>

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
  the agent to check itself with snapshots:
</p>
<pre><code
    >{`oxframe check                          # does it compile?
oxframe snapshot --at 0.5 --at 2       # render those moments as PNG
cargo run -q -- info                   # scene lengths and marker times as JSON`}</code
  ></pre>
<p>
  <code>snapshot</code> prints one path per image, the agent opens the PNGs and compares them with
  what you asked for. No editor, no ffmpeg, nothing that keeps running — <code>oxframe dev</code> is for
  you, not for the agent.
</p>

<h2>A good way to work together</h2>
<ol>
  <li>Keep <code>oxframe dev</code> open in your browser.</li>
  <li>
    Ask the agent for a change in plain words: <em
      >"after the title, slide three cards in from the left, one after another"</em
    >.
  </li>
  <li>The agent edits the code and checks it with snapshots; your preview reloads by itself.</li>
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

<h2>For tools that read the web</h2>
<p>
  This documentation is also available as plain text for language models at
  <a href="/llms.txt"><code>/llms.txt</code></a>.
</p>
