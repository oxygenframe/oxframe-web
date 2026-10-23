<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { agents, INSTALL_CLI, INSTALL_SKILLS, skills } from '$lib/agents';
</script>

<Seo
  title="Video skills and MCP for AI coding agents — oxframe"
  description="Make videos with Claude Code, Codex, Cursor or Copilot: oxframe skills, an MCP server, and oxframe check, which shows the agent its own frames."
/>

<h1>oxframe for AI coding agents</h1>
<p class="lead">
  You describe the video. Your agent writes it as Rust scenes, runs <code>oxframe check</code>,
  looks at the storyboard and the report, and fixes what they name before anything is rendered. You
  don't need to know Rust. Your agent does.
</p>

<h2>Start here</h2>
<pre><code
    >{`${INSTALL_CLI}            # the oxframe CLI
oxframe init my-video
cd my-video                         # open this folder in your agent`}</code
  ></pre>
<p>
  That is the whole setup. <code>oxframe init</code> writes <code>AGENTS.md</code>, which Codex,
  Cursor, GitHub Copilot and most other agents read on their own, and a Claude Code skill in
  <code>.claude/skills/oxframe</code>. Ask for the video in that folder; the agent writes the scene,
  runs <code>oxframe check</code> and fixes what it reports. Rendering needs ffmpeg; a project needs Rust,
  which the agent drives.
</p>

<h2 id="which-setup">Which setup to choose</h2>
<div class="scroll">
  <table>
    <thead><tr><th>You want</th><th>Use</th><th>What the agent gets</th></tr></thead>
    <tbody>
      <tr
        ><td>To make a video now, with any agent</td><td
          ><code>oxframe init</code> (above) — <strong>recommended</strong></td
        ><td>Instructions and the API cheat sheet in the project; checks through the shell</td></tr
      >
      <tr
        ><td>oxframe in every project, in Claude Code or Codex</td><td
          ><a href="#plugins">The plugin</a></td
        ><td
          >The skills everywhere, plus <code>oxframe mcp</code>: check, frames and docs as tools</td
        ></tr
      >
      <tr
        ><td>The skills in another agent, outside an oxframe project</td><td
          ><code>{INSTALL_SKILLS}</code></td
        ><td>The <a href="#skills">skills</a>, installed into about twenty agents</td></tr
      >
      <tr
        ><td>An agent that cannot run commands (ChatGPT, a web IDE)</td><td
          ><a href="#remote-mcp">mcp.oxframe.dev</a></td
        ><td>The docs only: search, pages, components, examples</td></tr
      >
    </tbody>
  </table>
</div>

<h2>Your agent</h2>
<ul class="cards">
  {#each agents as a (a.slug)}
    <li><a href="/agents/{a.slug}">{a.name}</a></li>
  {/each}
</ul>

<h2>How the agent sees its work</h2>
<p>
  <code>oxframe check</code> compiles the project, plays every scene and writes
  <code>out/check/storyboard.png</code> and <code>report.json</code>. Each issue names a rule (text
  that leaves the frame, type too small to read, a shot that stands still), a time range, the node
  and the line of code. The agent fixes them and checks again; the
  <a href="/agents/skills/oxframe-check">oxframe-check skill</a> lists every rule and its fix, and
  <a href="/docs/check-rules">Check rules</a> shows each one before and after. With the MCP server (<code
    >oxframe mcp</code
  >) the same check, an inspector, single frames and a docs search are tools the agent calls
  directly.
</p>

<h2 id="plugins">Plugins</h2>
<p>
  A plugin brings the skills and the MCP server together. In Claude Code:
  <code>/plugin marketplace add oxygenframe/oxframe-sdk</code>, then
  <code>/plugin install oxframe@oxframe</code>. In Codex:
  <code>codex plugin marketplace add oxygenframe/oxframe-sdk</code>, then
  <code>codex plugin add oxframe@oxframe</code>. The same plugin works in Cursor; until it is in the
  Cursor Marketplace, copy <code>plugins/oxframe</code> from the repository to
  <code>~/.cursor/plugins/local/oxframe</code>.
</p>

<h2 id="remote-mcp">The docs over MCP, without the CLI</h2>
<p>
  Agents that cannot run commands on your machine, such as ChatGPT or a web IDE, can still read the
  docs: add <code>https://mcp.oxframe.dev/mcp</code> as a remote MCP server (Streamable HTTP, no
  sign-in). Its tools search the docs, read a page, list the components and fetch an example's
  source. Checking and rendering need the local <code>oxframe mcp</code>.
</p>

<h2 id="skills">Skills</h2>
<p>One command installs all of them; each is a page of its own.</p>
<ul class="skills">
  {#each skills as s (s.name)}
    <li>
      <a href="/agents/skills/{s.name}"><code>{s.name}</code></a>
      <span>{s.description.split('. ')[0]}.</span>
    </li>
  {/each}
</ul>

<p>
  Details on the files <code>oxframe init</code> writes, keeping them current and connecting MCP
  clients are in <a href="/docs/agents">Working with AI agents</a>.
</p>

<style>
  /* The setup table scrolls on its own on a phone. */
  .scroll {
    overflow-x: auto;
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 0;
    list-style: none;
  }
  .cards a {
    display: block;
    padding: 12px 18px;
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
  }
  .skills {
    padding: 0;
    list-style: none;
  }
  .skills li {
    margin: 0 0 10px;
  }
  .skills span {
    color: var(--muted);
  }
</style>
