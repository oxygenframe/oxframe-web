<script lang="ts">
  import { onMount } from 'svelte';
  import type { EditorState } from '../state.svelte';
  import { toFrame, toScreen, viewTransform, zoomAround } from '../view';
  import { rectOf, showsAt, toPixels } from '../notes';

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
  /** Comment mode: the area being dragged out, in frame pixels. */
  let marking = $state<[number, number, number, number] | null>(null);

  /** A frame-pixel rectangle on screen, as CSS. */
  function box4(r: [number, number, number, number]) {
    const [x0, y0] = toScreen(view, r[0], r[1]);
    const [x1, y1] = toScreen(view, r[2], r[3]);
    return { left: x0, top: y0, width: Math.max(2, x1 - x0), height: Math.max(2, y1 - y0) };
  }

  const shownNotes = $derived(
    (editor.notes ?? []).filter(
      (n) => n.status === 'open' && n.bounds && showsAt(n, editor.time, editor.fps),
    ),
  );

  let noteInput = $state<HTMLTextAreaElement | null>(null);
  $effect(() => {
    if (editor.draft) noteInput?.focus();
  });

  function onNoteKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void editor.saveDraft();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      editor.draft = null;
    }
  }

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
    const pan = e.altKey || e.buttons === 4 || e.buttons === 2;
    if (drag.moved && pan) {
      editor.setZoom(editor.zoom, drag.px + dx, drag.py + dy);
    } else if (drag.moved && editor.commenting) {
      const r = canvas.getBoundingClientRect();
      const [ax, ay] = toFrame(view, drag.x - r.left, drag.y - r.top);
      const [bx, by] = toFrame(view, e.clientX - r.left, e.clientY - r.top);
      const [W, H] = editor.size;
      const c = (v: number, m: number) => Math.max(0, Math.min(m, v));
      marking = rectOf(c(ax, W), c(ay, H), c(bx, W), c(by, H));
    }
  }

  function onPointerUp(e: PointerEvent) {
    const d = drag;
    drag = null;
    const area = marking;
    marking = null;
    if (editor.commenting && area && e.button === 0) {
      if (area[2] - area[0] > 8 && area[3] - area[1] > 8) editor.startDraft(area);
      return;
    }
    if (!d || d.moved || e.button !== 0) return;
    const [sx, sy] = local(e);
    const [fx, fy] = toFrame(view, sx, sy);
    const [W, H] = editor.size;
    if (fx < 0 || fy < 0 || fx > W || fy > H) {
      editor.select(null);
      return;
    }
    if (editor.commenting) editor.startDraftAt(fx, fy);
    else editor.pick(fx, fy);
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

<div class="viewport" class:commenting={editor.commenting} bind:this={box} data-testid="viewport">
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
  {#each shownNotes as n (n.id)}
    {@const r = box4(toPixels(n.bounds!, editor.size))}
    <div
      class="note-area"
      style:left="{r.left}px"
      style:top="{r.top}px"
      style:width="{r.width}px"
      style:height="{r.height}px"
      data-testid="note-area-{n.id}"
    >
      <span class="note-badge" title={n.text}>{n.id}</span>
    </div>
  {/each}
  {#if marking}
    {@const r = box4(marking)}
    <div
      class="note-area drafting"
      style:left="{r.left}px"
      style:top="{r.top}px"
      style:width="{r.width}px"
      style:height="{r.height}px"
    ></div>
  {/if}
  {#if editor.draft}
    {@const d = editor.draft}
    {@const r = box4(d.rect)}
    <div
      class="note-area drafting"
      style:left="{r.left}px"
      style:top="{r.top}px"
      style:width="{r.width}px"
      style:height="{r.height}px"
    ></div>
    <form
      class="note-form"
      style:left="{Math.max(8, Math.min(container.w - 328, r.left))}px"
      style:top="{Math.min(container.h - 170, r.top + r.height + 8)}px"
      data-testid="note-form"
      onsubmit={(e) => {
        e.preventDefault();
        void editor.saveDraft();
      }}
    >
      <div class="note-meta">
        {d.node ? d.node.label : 'Area'} · {d.time[0].toFixed(2)}{d.time[1] > d.time[0]
          ? `–${d.time[1].toFixed(2)}`
          : ''} s
        {#if d.node?.source}<span class="dim">{d.node.source}</span>{/if}
      </div>
      <textarea
        bind:this={noteInput}
        bind:value={d.text}
        onkeydown={onNoteKey}
        rows="3"
        placeholder="What should change? (Ctrl+Enter to send)"
        aria-label="Note for the agent"
        data-testid="note-text"
      ></textarea>
      <div class="note-actions">
        <button
          type="button"
          onclick={() => editor.draftUntilPlayhead()}
          title="Move the playhead, then press to cover the time up to it">Until playhead</button
        >
        <span class="spacer"></span>
        <button type="button" onclick={() => (editor.draft = null)}>Cancel</button>
        <button type="submit" class="primary" disabled={!d.text.trim()} data-testid="note-save"
          >Add note</button
        >
      </div>
    </form>
  {/if}
  {#if editor.ready && editor.frames > 0 && !editor.commenting}
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
  .viewport.commenting canvas {
    cursor: cell;
  }
  .note-area {
    position: absolute;
    border: 2px solid #ff3b6b;
    border-radius: 3px;
    pointer-events: none;
  }
  .note-area.drafting {
    border-style: dashed;
  }
  .note-badge {
    position: absolute;
    top: -11px;
    left: -11px;
    min-width: 20px;
    height: 20px;
    padding: 0 4px;
    border-radius: 10px;
    background: #ff3b6b;
    color: #fff;
    font-size: 12px;
    line-height: 20px;
    text-align: center;
    pointer-events: auto;
  }
  .note-form {
    position: absolute;
    width: 320px;
    display: grid;
    gap: 6px;
    padding: 8px;
    border-radius: 8px;
    background: var(--m-panel);
    color: var(--m-text);
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.35);
    z-index: 2;
  }
  .note-form textarea {
    width: 100%;
    box-sizing: border-box;
    resize: vertical;
    font: inherit;
  }
  .note-meta {
    font-size: 12px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .note-meta .dim {
    color: var(--m-text-dim);
  }
  .note-actions {
    display: flex;
    gap: 6px;
  }
  .note-actions .spacer {
    flex: 1;
  }
  .note-actions .primary {
    background: #ff3b6b;
    color: #fff;
    border-color: transparent;
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
