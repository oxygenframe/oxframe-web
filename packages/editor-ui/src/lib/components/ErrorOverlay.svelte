<script lang="ts">
  import type { EditorState } from '../state.svelte';
  import { t } from '../i18n';

  let { editor }: { editor: EditorState } = $props();
  const err = $derived(editor.error!);
  const title = $derived(
    err.kind === 'Build'
      ? t('error.build')
      : err.kind === 'Incompatible'
        ? t('error.incompatible')
        : err.kind === 'Meta'
          ? t('error.meta')
          : t('error.runtime'),
  );
</script>

<div class="overlay" role="alert" data-testid="error-overlay">
  <header>
    <strong>{title}</strong>
    {#if err.kind === 'Build'}<span class="dim">{t('error.previous')}</span>{/if}
    <button onclick={() => editor.dismissError()}>{t('error.dismiss')}</button>
  </header>
  {#if err.spans.length}
    <ul>
      {#each err.spans as s, i (i)}
        <li><code>{s.file}:{s.line}:{s.column}</code> {s.message}</li>
      {/each}
    </ul>
  {/if}
  <pre>{err.message}</pre>
</div>

<style>
  .overlay {
    position: absolute;
    left: 12px;
    right: 12px;
    top: 12px;
    max-height: calc(100% - 24px);
    overflow: auto;
    background: var(--m-danger-bg);
    border: 1px solid var(--m-danger);
    border-radius: 8px;
    color: var(--m-text);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  }
  header {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid var(--m-danger);
  }
  header strong {
    color: var(--m-danger);
  }
  header button {
    margin-left: auto;
  }
  .dim {
    color: var(--m-text-dim);
  }
  ul {
    margin: 8px 12px 0;
    padding-left: 18px;
  }
  pre {
    margin: 0;
    padding: 10px 12px;
    font: 12px/1.45 var(--m-mono);
    white-space: pre-wrap;
  }
</style>
