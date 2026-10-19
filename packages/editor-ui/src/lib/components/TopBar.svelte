<script lang="ts">
  import type { EditorState } from '../state.svelte';
  import { t } from '../i18n';

  interface Props {
    editor: EditorState;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
  }
  let { editor, theme, onToggleTheme }: Props = $props();

  const conn = $derived.by(() => {
    const c = editor.connection;
    if (editor.error?.kind === 'Incompatible')
      return { cls: 'bad', text: t('status.incompatible') };
    if (editor.building) return { cls: 'busy', text: t('status.building') };
    switch (c.state) {
      case 'open':
        return { cls: 'ok', text: t('conn.open') };
      case 'connecting':
        return { cls: 'busy', text: t('conn.connecting') };
      case 'reconnecting':
        return { cls: 'busy', text: t('conn.reconnecting') };
      default:
        return { cls: 'bad', text: t('conn.closed') };
    }
  });

  let showReloaded = $state(false);
  $effect(() => {
    if (!editor.reloadedAt) return;
    showReloaded = true;
    const id = setTimeout(() => (showReloaded = false), 1500);
    return () => clearTimeout(id);
  });
</script>

<header>
  <strong class="logo">{t('app.title')}</strong>
  <span class="chip {conn.cls}" role="status" aria-live="polite" data-testid="status">
    <span class="dot" aria-hidden="true"></span>{conn.text}
  </span>
  {#if showReloaded}
    <span class="chip ok" data-testid="reloaded">{t('status.reloaded')}</span>
  {/if}
  <span class="spacer"></span>
  {#if editor.engineVersion}
    <span class="dim"
      >engine {editor.engineVersion} · {editor.size[0]}×{editor.size[1]} · {editor.fps} fps</span
    >
  {/if}
  <button
    aria-pressed={editor.showAxes}
    onclick={() => (editor.showAxes = !editor.showAxes)}
    title={t('viewport.axes')}>{t('viewport.axes')}</button
  >
  <button onclick={() => editor.resetView()} title={t('viewport.fit')}>1:1</button>
  <button onclick={onToggleTheme} title={t('theme.toggle')} aria-label={t('theme.toggle')}>
    {theme === 'dark' ? '☾' : '☀'}
  </button>
  <span class="help" title={t('help.keys')} aria-label={t('help.keys')}>?</span>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    background: var(--m-panel);
    border-bottom: 1px solid var(--m-border);
  }
  .logo {
    letter-spacing: 0.02em;
  }
  .spacer {
    flex: 1;
  }
  .dim {
    color: var(--m-text-dim);
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid var(--m-border);
    color: var(--m-text-dim);
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
  .ok .dot {
    background: #3ecf8e;
  }
  .busy .dot {
    background: var(--m-warn);
    animation: pulse 1s infinite alternate;
  }
  .bad {
    color: var(--m-danger);
  }
  .help {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--m-border);
    color: var(--m-text-dim);
    cursor: help;
  }
  @keyframes pulse {
    to {
      opacity: 0.3;
    }
  }
</style>
