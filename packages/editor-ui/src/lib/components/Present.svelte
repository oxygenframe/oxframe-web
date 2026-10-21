<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import type { EditorState } from '../state.svelte';
  import { Presentation, presentKey } from '../present.svelte';

  interface Props {
    editor: EditorState;
    /** Start the backend on mount (default true). */
    autostart?: boolean;
  }
  let { editor, autostart = true }: Props = $props();
  // The editor is fixed for the component's life.
  const show = new Presentation(untrack(() => editor));

  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let container = $state({ w: 0, h: 0 });
  let hint = $state(true);

  onMount(() => {
    if (autostart) editor.start();
    const disconnect = show.connect();
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      container = { w: Math.round(width), h: Math.round(height) };
      editor.setViewport(container.w, container.h);
    });
    ro.observe(box);
    const timer = setTimeout(() => (hint = false), 4000);
    return () => {
      ro.disconnect();
      disconnect();
      clearTimeout(timer);
    };
  });
  onDestroy(() => {
    if (autostart) editor.stop();
  });

  // Stop at the target stop; keep the presenter window in step.
  $effect(() => {
    show.onFrame(editor.frame);
  });
  $effect(() => {
    void editor.slides;
    show.broadcast();
  });

  $effect(() => {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    const { w, h } = container;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const [W, H] = editor.size;
    const scale = Math.min(w / W, h / H);
    const [dw, dh] = [W * scale, H * scale];
    const img = editor.image;
    if (img) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === 'f' || e.key === 'F') {
      void toggleFullscreen();
    } else if (e.key === 'n' || e.key === 'N') {
      openNotes();
    } else {
      const action = presentKey(e.key);
      if (!action) return;
      show[action]();
    }
    e.preventDefault();
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await box.requestFullscreen?.();
  }

  function openNotes() {
    const url = new URL(location.href);
    url.searchParams.set('present', 'notes');
    window.open(url.toString(), 'oxframe-notes', 'width=720,height=520');
  }
</script>

<svelte:window onkeydown={onKey} />

<div
  class="present"
  data-testid="present"
  bind:this={box}
  role="presentation"
  onclick={() => show.next()}
>
  <canvas bind:this={canvas}></canvas>
  <div class="counter" data-testid="present-counter">
    {show.index + 1} / {show.total}
  </div>
  {#if hint}
    <p class="hint">→ next · ← back · F full screen · N notes</p>
  {/if}
  {#if editor.error}
    <p class="error" role="alert">{editor.error.message}</p>
  {/if}
</div>

<style>
  .present {
    position: fixed;
    inset: 0;
    background: #000;
    cursor: none;
  }
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .counter {
    position: absolute;
    right: 16px;
    bottom: 12px;
    color: rgba(255, 255, 255, 0.35);
    font:
      13px/1 system-ui,
      sans-serif;
  }
  .hint,
  .error {
    position: absolute;
    left: 50%;
    bottom: 32px;
    transform: translateX(-50%);
    margin: 0;
    padding: 8px 14px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font:
      14px/1.3 system-ui,
      sans-serif;
  }
  .error {
    top: 32px;
    bottom: auto;
    color: #ffb4b4;
  }
</style>
