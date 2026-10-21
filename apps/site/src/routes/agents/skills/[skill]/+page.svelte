<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { INSTALL_SKILLS } from '$lib/agents';
  let { data } = $props();
  const s = $derived(data.page);
  // Search results show about 160 characters.
  const description = $derived(
    s.description.length > 165
      ? s.description.slice(0, 160).replace(/\s+\S*$/, '') + '…'
      : s.description,
  );
</script>

<Seo title="{s.name} skill for agents — oxframe" {description} type="article" />

<p class="crumb"><a href="/agents">Agents</a> / skills / {s.name}</p>
<h1><code>{s.name}</code> skill</h1>
<p class="lead">{s.description}</p>
<pre><code>{INSTALL_SKILLS}</code></pre>
<p>
  Installs every oxframe skill into Claude Code, Codex, Cursor, Copilot and other agents. The source
  is
  <a href="https://github.com/oxygenframe/oxframe-sdk/tree/main/skills/{s.name}" rel="external"
    >skills/{s.name}</a
  > in oxframe-sdk.
</p>

<article class="skill">
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- built from oxframe-sdk/skills by scripts/sync-skills.ts -->
  {@html s.html}
</article>

<style>
  .skill :global(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
  }
  .skill :global(th),
  .skill :global(td) {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
  }
  .skill :global(pre) {
    max-width: 100%;
    overflow-x: auto;
  }
  .crumb {
    color: var(--muted);
    font-size: 14px;
  }
</style>
