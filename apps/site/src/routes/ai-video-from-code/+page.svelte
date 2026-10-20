<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="AI video generation from code — oxframe"
  description="oxframe does not invent frames from a prompt. An agent writes a Rust scene, oxframe check shows the picture, and the agent fixes what the report names."
/>

<h1>AI video generation from code</h1>
<p>
  The agent writes the scene. oxframe compiles it, samples the frames and reports problems a person
  would see: text that overflows, type that overlaps, a shot that sits still. The agent reads
  <code>report.json</code> and the storyboard, edits, and checks again. Rendering is deterministic,
  so the file it produces is the file you previewed. The
  <a href="/docs/agents">agents page</a> is the setup for Claude Code, Cursor and MCP.
</p>
