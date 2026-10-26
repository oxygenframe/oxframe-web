<script lang="ts">
  import { onMount } from 'svelte';
  import type { EditorState } from '../state.svelte';
  import { toFrame, toScreen, viewTransform, zoomAround } from '../view';

  let { editor }: { editor: EditorState } = $props();

  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let container = $state({ w: 0, h: 0 });
  const view = $derived(
    viewTransform(editor.size, container, editor.zoom, editor.panX, editor.panY),
  );

  onMount(() => {
    const ro = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      container = { w: Math.round(width), h: Math.round(height) };
      editor.setViewport(container.w, container.h);
    });
    ro.observe(box);
    return () => ro.disconnect();
  });

  // Redraw whenever the frame, view or overlays change.
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
    ctx.clearRect(0, 0, w, h);
    const [W, H] = editor.size;
    const v = view;
    const img = editor.image;
    ctx.fillStyle = '#000';
    ctx.fillRect(v.ox, v.oy, W * v.scale, H * v.scale);
    if (img) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, v.ox, v.oy, W * v.scale, H * v.scale);
    }
    const accent = getComputedStyle(box).getPropertyValue('--m-accent') || '#6cb2eb';
    if (editor.showAxes) {
      const [cx, cy] = toScreen(v, W / 2, H / 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(v.ox, cy + 0.5);
      ctx.lineTo(v.ox + W * v.scale, cy + 0.5);
      ctx.moveTo(cx + 0.5, v.oy);
      ctx.lineTo(cx + 0.5, v.oy + H * v.scale);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const b = editor.bounds;
    if (b && editor.selected !== null) {
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const [x, y] = toScreen(v, b[2 * i]!, b[2 * i + 1]!);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  });

  // The play button in the middle of the frame: always there while paused,
  // shown for a moment by the pointer while playing.
  const center = $derived(toScreen(view, editor.size[0] / 2, editor.size[1] / 2));
  let stirred = $state(false);
  let calm: ReturnType<typeof setTimeout> | undefined;
  function stir() {
    stirred = true;
    clearTimeout(calm);
    calm = setTimeout(() => (stirred = false), 1500);
  }

  // --- interaction: click = pick, wheel = zoom, alt/middle drag = pan ---
  let drag: { x: number; y: number; px: number; py: number; moved: boolean } | null = null;

  function local(e: MouseEvent): [number, number] {
    const r = canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }

  function onPointerDown(e: PointerEvent) {
    canvas.setPointerCapture(e.pointerId);
    drag = { x: e.clientX, y: e.clientY, px: editor.panX, py: editor.panY, moved: false };
  }

  function onPointerMove(e: PointerEvent) {
    stir();
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    if (drag.moved && (e.altKey || e.buttons === 4 || e.buttons === 2)) {
      editor.setZoom(editor.zoom, drag.px + dx, drag.py + dy);
    }
  }

  function onPointerUp(e: PointerEvent) {
    const d = drag;
    drag = null;
    if (!d || d.moved || e.button !== 0) return;
    const [sx, sy] = local(e);
    const [fx, fy] = toFrame(view, sx, sy);
    const [W, H] = editor.size;
    if (fx < 0 || fy < 0 || fx > W || fy > H) {
      editor.select(null);
      return;
    }
    editor.pick(fx, fy);
  }

  function onWheel(e: WheelEvent) {
    e.preventDefault();
    const [sx, sy] = local(e);
    const factor = Math.exp(-e.deltaY * 0.0015);
    const z = Math.max(0.1, Math.min(16, editor.zoom * factor));
    const p = zoomAround(editor.size, container, editor.zoom, editor.panX, editor.panY, z, sx, sy);
    editor.setZoom(z, p.panX, p.panY);
  }
</script>

<div class="viewport" bind:this={box} data-testid="viewport">
  <canvas
    bind:this={canvas}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    onwheel={onWheel}
    ondblclick={() => editor.resetView()}
    oncontextmenu={(e) => e.preventDefault()}
    data-frame={editor.imageFrame}
    aria-label="frame {editor.imageFrame}"
  ></canvas>
  {#if editor.ready && editor.frames > 0}
    <button
      class="center-play"
      class:shown={!editor.playing || stirred}
      style:left="{center[0]}px"
      style:top="{center[1]}px"
      onclick={() => editor.togglePlay()}
      onpointermove={stir}
      ondblclick={(e) => e.stopPropagation()}
      aria-label={editor.playing ? 'Pause' : 'Play'}
      title="{editor.playing ? 'Pause' : 'Play'} (Space)"
      data-testid="center-play"
    >
      {#if editor.playing}
        <svg viewBox="0 0 24 24" aria-hidden="true"
          ><rect x="6" y="5" width="4" height="14" rx="1" /><rect
            x="14"
            y="5"
            width="4"
            height="14"
            rx="1"
          /></svg
        >
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>
      {/if}
    </button>
  {/if}
  <span class="zoom" aria-live="off">{Math.round(editor.zoom * 100)}%</span>
</div>

<style>
  .viewport {
    position: absolute;
    inset: 0;
    background: repeating-conic-gradient(var(--m-panel-2) 0 25%, var(--m-bg) 0 50%) 0 0 / 24px 24px;
    overflow: hidden;
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: crosshair;
  }
  .center-play {
    position: absolute;
    width: 64px;
    height: 64px;
    margin: -32px 0 0 -32px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: rgb(0 0 0 / 0.5);
    color: #fff;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .center-play.shown,
  .center-play:focus-visible {
    opacity: 1;
  }
  .center-play:hover {
    background: rgb(0 0 0 / 0.7);
  }
  .center-play svg {
    width: 30px;
    height: 30px;
    fill: currentColor;
  }
  .zoom {
    position: absolute;
    right: 8px;
    bottom: 6px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--m-panel);
    color: var(--m-text-dim);
    font-variant-numeric: tabular-nums;
  }
</style>
