<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { InPageWasm } from '@oxframe/backends';
  import EngineWorker from '@oxframe/backends/engine-worker?worker';
  import { Editor, EditorState, persist } from '@oxframe/editor-ui';
  import type { Meta } from '@oxframe/protocol';

  interface Props {
    wasmUrl: string;
    jsUrl: string;
    compact?: boolean;
    /** Open the playhead at this time, in seconds. */
    at?: number;
    /** Metas by scene, kept across recompiles. */
    metas?: Record<string, Meta>;
    onFirstFrame?: (ms: number) => void;
  }
  let {
    wasmUrl,
    jsUrl,
    compact = false,
    at = 0,
    metas = $bindable({}),
    onFirstFrame,
  }: Props = $props();

  // Initial values; later URL changes reload the worker (effect below).
  const initial = untrack(() => ({ wasmUrl, jsUrl, metas: $state.snapshot(metas), compact }));
  const backend = new InPageWasm({
    wasmUrl: initial.wasmUrl,
    jsUrl: initial.jsUrl,
    createWorker: () => new EngineWorker(),
    config: { metas: initial.metas },
  });
  const editor = new EditorState(backend, { persist: !initial.compact });
  editor.start();
  // A fresh example has no `#f=` in the URL. Session storage still holds the
  // playhead of whichever example was open before, and must not carry it over.
  if (!initial.compact && persist.parseHash(location.hash).frame === undefined) {
    editor.restart();
  }

  let loadedAt = performance.now();
  let reported = false;
  $effect(() => {
    if (!reported && editor.image) {
      reported = true;
      onFirstFrame?.(performance.now() - loadedAt);
    }
  });
  // Remember meta edits so a recompile keeps markers, eases and tunables.
  $effect(() => {
    metas = { ...editor.metas };
  });

  let current = { wasmUrl: initial.wasmUrl, jsUrl: initial.jsUrl };
  $effect(() => {
    if (wasmUrl !== current.wasmUrl || jsUrl !== current.jsUrl) {
      current = { wasmUrl, jsUrl };
      loadedAt = performance.now();
      reported = false;
      backend.reload(wasmUrl, jsUrl, { metas: $state.snapshot(editor.metas) });
    }
  });

  // Which renderer the engine picked (known once it is ready).
  let renderer = $state<string | null>(null);
  $effect(() => {
    if (editor.ready) renderer = backend.renderer;
  });

  // Ready seeks to 0. Place the playhead once the timeline length is known.
  let placed = false;
  $effect(() => {
    if (!placed && at > 0 && editor.ready && editor.frames > 0) {
      placed = true;
      editor.seek(Math.round(at * editor.fps));
    }
  });

  onDestroy(() => editor.stop());

  /** Playhead to the start, including after this scene's engine reconnects. */
  export function restart(): void {
    editor.restart();
  }

  /** Renders the whole project to MP4 in the browser (WebCodecs). */
  export function exportMp4(
    onProgress?: (done: number, total: number) => void,
    bitrate?: number,
  ): Promise<Blob> {
    if (editor.playing) editor.pause();
    return backend.exportMp4(onProgress, bitrate);
  }
  const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
</script>

<div class="player" class:compact>
  <Editor {editor} autostart={false} {compact} scopedKeys={compact} />
</div>
{#if !compact}
  <p
    class="note"
    data-testid="renderer"
    data-renderer={renderer ?? ''}
    title={backend.gpuError ?? ''}
  >
    {#if renderer === 'gpu'}
      Rendering with WebGPU (vello) in a Web Worker.
    {:else}
      Rendering on the CPU in a Web Worker{webgpu ? '' : ' (this browser has no WebGPU)'}.
    {/if}
    A hanging scene is stopped after 5 s.
  </p>
{/if}

<style>
  .player {
    height: 100%;
    min-height: 0;
  }
  .player.compact {
    height: 360px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid var(--border);
  }
  .note {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--muted);
  }
</style>
