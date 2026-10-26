<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { INSTALL_CLI, INSTALL_SKILLS, skills } from '$lib/agents';
  import { SITE } from '$lib/site';
  let { data } = $props();
  const a = $derived(data.page);
  const jsonld = $derived([
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Agents', item: `${SITE}/agents` },
        { '@type': 'ListItem', position: 2, name: a.name, item: `${SITE}/agents/${a.slug}` },
      ],
    },
  ]);
</script>

<Seo title="{a.title} — oxframe" description={a.description} type="article" {jsonld} />

<p class="crumb"><a href="/agents">Agents</a> / {a.name}</p>
<h1>oxframe in {a.name}</h1>
<p class="lead">
  {a.name} writes the scenes, runs <code>oxframe check</code> and fixes what the report names, then renders
  the video. Three steps set it up.
</p>
<p>
  <strong>Quickest start:</strong> install the CLI, run <code>oxframe init my-video</code> and open
  that folder in {a.name}. The project carries its own instructions for the agent, so that alone is
  enough to make a video. The steps below add the skills to every project and the check as a tool (<a
    href="/agents#which-setup">which setup to choose</a
  >).
</p>

<h2>1. Install the CLI and the skills</h2>
<pre><code>{`${INSTALL_CLI}\n${INSTALL_SKILLS}`}</code></pre>
<p>
  {a.instructions} The skills add workflows for {skills.length - 1} kinds of video on top of the main
  <code>oxframe</code> skill.
</p>

<h2>2. Connect the MCP server</h2>
<p>{a.mcp.label}:</p>
<pre><code>{a.mcp.code}</code></pre>
<p>
  The server gives {a.name} <code>check</code>, <code>inspect</code>, <code>render_frame</code>,
  <code>render_graph</code>, <code>render</code>, <code>list_components</code> and
  <code>docs_search</code> as tools.
</p>
{#if a.extra}
  <p>{a.extra.label}:</p>
  <pre><code>{a.extra.code}</code></pre>
{/if}

<h2>3. Ask for a video</h2>
<pre><code
    >{`Make a 20-second explainer of binary search: a title, a sorted array where
the search narrows to the middle step by step, and an end card. Run oxframe
check until it is clean, then render it.`}</code
  ></pre>
<p>
  Start in an empty folder: the agent runs <code>oxframe init</code>. For other kinds of video see
  the
  <a href="/agents">skills</a>; the <a href="/gallery">gallery</a> has a brief for every example.
</p>

<h2>When it goes wrong</h2>
<ul>
  <li>
    <strong>A compile error the agent loops on.</strong> The project notes list the usual ones: a
    <code>bind</code> closure that needs <code>move</code> and cloned signals, a closure ending in
    <code>;</code> that returns no animation, <code>all((a, b))</code> with double parentheses.
  </li>
  <li>
    <strong>The report is clean but the picture is wrong.</strong> Ask the agent to open
    <code>out/check/storyboard.png</code>, or to render one frame with
    <code>oxframe snapshot --at 2.5</code>.
  </li>
  <li>
    <strong>The agent starts <code>oxframe dev</code>.</strong> That is a server for you, not for
    the agent; the project notes tell it to use <code>check</code> instead.
  </li>
</ul>

<style>
  .crumb {
    color: var(--muted);
    font-size: 14px;
  }
  pre {
    max-width: 100%;
    overflow-x: auto;
  }
</style>
