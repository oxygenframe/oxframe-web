<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<aside class="try" aria-label="Try it">
  <p><strong>Try it</strong></p>
  {@render children()}
</aside>
