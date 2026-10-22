<script lang="ts">
  // One scene in the other tool and in oxframe, one under the other, with
  // the oxframe version one click from the playground.
  import { code, playground } from './index';

  interface Props {
    /** The other tool, as it is written ("Motion Canvas"). */
    tool: string;
    /** Its code: a file in this folder (`remotion.tsx.txt`). */
    theirs: string;
    /** The oxframe port: `<name>.rs` in this folder. */
    name: string;
  }
  let { tool, theirs, name }: Props = $props();
</script>

<div class="port">
  <p class="label">{tool}</p>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time from files in src/lib/migrate -->
  {@html code(theirs)}
  <p class="label">
    oxframe <a href={playground(name)}>open it in the playground</a>
  </p>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- highlighted at build time from files in src/lib/migrate -->
  {@html code(`${name}.rs`)}
</div>

<style>
  .port {
    margin: 16px 0 24px;
  }
  .label {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    align-items: baseline;
    margin: 18px 0 6px;
    font-weight: 600;
  }
  .label a {
    font-weight: 400;
    font-size: 14px;
  }
</style>
