<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import type { EditorState } from '../state.svelte';
  import { t } from '../i18n';
  import TopBar from './TopBar.svelte';
  import Viewport from './Viewport.svelte';
  import Timeline from './Timeline.svelte';
  import Inspector from './Inspector.svelte';
  import ErrorOverlay from './ErrorOverlay.svelte';
  import CurveEditor from './CurveEditor.svelte';
  import '../styles/theme.css';

  interface Props {
    editor: EditorState;
    /** Start the backend on mount (default true). */
    autostart?: boolean;
    theme?: 'dark' | 'light';
    /** Viewport and timeline only (embedded examples in docs). */
    compact?: boolean;
    /** Ignore global shortcuts unless the editor has focus (embedded use). */
    scopedKeys?: boolean;
  }
  let {
    editor,
    autostart = true,
    theme: initialTheme,
    compact = false,
    scopedKeys = false,
  }: Props = $props();
  let root: HTMLDivElement;

  function preferredTheme(): 'dark' | 'light' {
    try {
      const saved = localStorage.getItem('oxframe-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }

  let theme = $state<'dark' | 'light'>(untrack(() => initialTheme) ?? preferredTheme());
  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('oxframe-theme', theme);
    } catch {
      // ignore
    }
  }

  onMount(() => {
    if (autostart) editor.start();
  });
  onDestroy(() => {
    if (autostart) editor.stop();
  });

  function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (scopedKeys && !root?.contains(document.activeElement)) return;
    if (
      target &&
      (target.closest('input, textarea, select, [contenteditable]') || target.isContentEditable)
    ) {
      return;
    }
    // Focused markers handle their own arrow keys.
    if (target?.dataset.marker && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return;
    const big = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case ' ':
        editor.togglePlay();
        break;
      case 'ArrowLeft':
        editor.step(-big);
        break;
      case 'ArrowRight':
        editor.step(big);
        break;
      case 'Home':
        editor.seek(0);
        break;
      case 'End':
        editor.seek(editor.lastFrame);
        break;
      case 'm':
      case 'M':
        editor.markerAtPlayhead();
        break;
      case 'Escape':
        if (editor.editingEase) editor.editingEase = null;
        else if (editor.error) editor.dismissError();
        else editor.selectedMarker = null;
        break;
      default:
        return;
    }
    e.preventDefault();
  }
</script>

<svelte:window onkeydown={onKey} />

<div
  class="oxframe-editor"
  class:compact
  data-theme={theme}
  data-testid="editor"
  bind:this={root}
  tabindex="-1"
>
  {#if !compact}
    <TopBar {editor} {theme} onToggleTheme={toggleTheme} />
  {/if}
  <main>
    <section class="stage" aria-label={t('viewport.label')}>
      <Viewport {editor} />
      {#if editor.error}
        <ErrorOverlay {editor} />
      {/if}
    </section>
    {#if !compact}
      <Inspector {editor} />
    {/if}
  </main>
  <Timeline {editor} />
  {#if editor.editingEase}
    <CurveEditor {editor} />
  {/if}
</div>

<style>
  .oxframe-editor {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
  main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    min-height: 0;
  }
  .compact {
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .compact main {
    grid-template-columns: 1fr;
  }
  .oxframe-editor:focus {
    outline: none;
  }
  .stage {
    position: relative;
    min-width: 0;
    min-height: 0;
  }
  @media (max-width: 760px) {
    main {
      grid-template-columns: 1fr;
      grid-template-rows: minmax(0, 1fr) 40%;
    }
  }
</style>
