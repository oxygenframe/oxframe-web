<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { agents, INSTALL_CLI, INSTALL_SKILLS, skills } from '$lib/agents';
</script>

<Seo
  title="oxframe for AI coding agents — oxframe"
  description="Make videos with Claude Code, Codex, Cursor or Copilot: oxframe skills, an MCP server, and oxframe check, which shows the agent its own frames."
/>

<h1>oxframe for AI coding agents</h1>
<p class="lead">
  You describe the video. Your agent writes it as Rust scenes, runs <code>oxframe check</code>,
  looks at the storyboard and the report, and fixes what they name before anything is rendered. You
  don't need to know Rust. Your agent does.
</p>

<h2>Set it up in two commands</h2>
<pre><code
    >{`${INSTALL_CLI}            # the oxframe CLI
${INSTALL_SKILLS}   # skills for your agent`}</code
  ></pre>
<p>
  The skills install into Claude Code, Codex, Cursor, GitHub Copilot and about twenty other agents.
  Rendering needs ffmpeg; a project needs Rust, which the agent drives.
</p>

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

<h2>Skills</h2>
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
