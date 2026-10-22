<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { CompileError } from '../compile';
  import { currentTheme, THEME_EVENT } from '../theme';

  interface Props {
    value: string;
    errors?: CompileError[];
    onchange?: (v: string) => void;
    onsubmit?: () => void;
    readonly?: boolean;
  }
  let { value, errors = [], onchange, onsubmit, readonly = false }: Props = $props();

  let host = $state<HTMLDivElement>();
  let editor = $state.raw<import('monaco-editor').editor.IStandaloneCodeEditor>();
  let monaco = $state.raw<typeof import('monaco-editor')>();
  let fallback = $state(false);

  onMount(async () => {
    try {
      // Monaco is large; load it only on pages that need it.
      const [m, worker] = await Promise.all([
        import('monaco-editor/esm/vs/editor/editor.api'),
        import('monaco-editor/esm/vs/editor/editor.worker?worker'),
        import('monaco-editor/esm/vs/basic-languages/rust/rust.contribution'),
      ]);
      (self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
        getWorker: () => new worker.default(),
      };
      monaco = m as unknown as typeof import('monaco-editor');
      editor = monaco!.editor.create(host!, {
        value,
        language: 'rust',
        theme: currentTheme() === 'dark' ? 'vs-dark' : 'vs',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        tabSize: 4,
        scrollBeyondLastLine: false,
        readOnly: readonly,
      });
      editor.onDidChangeModelContent(() => onchange?.(editor!.getValue()));
      editor.addCommand(monaco!.KeyMod.CtrlCmd | monaco!.KeyCode.Enter, () => onsubmit?.());
    } catch (e) {
      console.error('Monaco failed to load, using a plain textarea', e);
      fallback = true;
    }
  });

  // External value changes (example switch, shared link). Props are read
  // before the early return so the effect tracks them.
  $effect(() => {
    const v = value;
    if (editor && editor.getValue() !== v) editor.setValue(v);
  });

  $effect(() => {
    const list = errors;
    const m = monaco;
    const model = editor?.getModel();
    if (!m || !model) return;
    m.editor.setModelMarkers(
      model,
      'rustc',
      list.map((e) => ({
        severity: m.MarkerSeverity.Error,
        message: e.message,
        startLineNumber: e.line,
        startColumn: e.column,
        endLineNumber: e.line,
        endColumn: e.column + 1,
      })),
    );
  });

  // The header's light/dark switch.
  const retheme = (e: Event) =>
    monaco?.editor.setTheme((e as CustomEvent).detail === 'dark' ? 'vs-dark' : 'vs');
  onMount(() => window.addEventListener(THEME_EVENT, retheme));
  onDestroy(() => {
    window.removeEventListener(THEME_EVENT, retheme);
    editor?.dispose();
  });
</script>

{#if fallback}
  <textarea
    class="fallback"
    {value}
    {readonly}
    spellcheck="false"
    oninput={(e) => onchange?.(e.currentTarget.value)}
    onkeydown={(e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onsubmit?.();
    }}
  ></textarea>
{:else}
  <div class="host" bind:this={host} data-testid="code-editor"></div>
{/if}

<style>
  .host,
  .fallback {
    width: 100%;
    height: 100%;
    min-height: 200px;
  }
  .fallback {
    font:
      13px/1.5 ui-monospace,
      monospace;
    background: var(--panel);
    color: var(--text);
    border: 1px solid var(--border);
    padding: 8px;
    box-sizing: border-box;
    resize: none;
  }
</style>
