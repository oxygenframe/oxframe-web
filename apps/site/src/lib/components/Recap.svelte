<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children }: { children: Snippet } = $props();
</script>

<aside class="recap" aria-label="Recap">
  <p><strong>Recap</strong></p>
  {@render children()}
</aside>
