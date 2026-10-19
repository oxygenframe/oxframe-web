<script lang="ts">
  import type { MarkerInfo } from '@oxframe/protocol';
  import { formatTime, type EditorState } from '../state.svelte';
  import { t } from '../i18n';

  let { editor }: { editor: EditorState } = $props();

  let track: HTMLDivElement;
  let wave: HTMLCanvasElement;
  let width = $state(0);

  const total = $derived(Math.max(1, editor.frames));
  const x = (frame: number) => (frame / Math.max(1, total - 1)) * width;
  const frameAt = (clientX: number) => {
    const r = track.getBoundingClientRect();
    const u = Math.min(1, Math.max(0, (clientX - r.left) / Math.max(1, r.width)));
    return Math.round(u * (total - 1));
  };

  // --- scrubbing (rAF-throttled: one Seek per frame of the UI) ---
  let scrubbing = false;
  let pending: number | null = null;
  function scrubTo(f: number) {
    pending = f;
    requestAnimationFrame(() => {
      if (pending !== null) editor.seek(pending);
      pending = null;
    });
  }
  function onTrackDown(e: PointerEvent) {
    if ((e.target as HTMLElement).dataset.marker) return;
    scrubbing = true;
    track.setPointerCapture(e.pointerId);
    if (editor.playing) editor.pause();
    scrubTo(frameAt(e.clientX));
  }
  function onTrackMove(e: PointerEvent) {
    if (scrubbing) scrubTo(frameAt(e.clientX));
  }
  function onTrackUp() {
    scrubbing = false;
  }

  // --- markers ---
  let dragging = $state<{ m: MarkerInfo; frame: number } | null>(null);
  const markerFrame = (m: MarkerInfo) =>
    dragging && dragging.m.name === m.name && dragging.m.scene === m.scene
      ? dragging.frame
      : editor.markerFrame(m);

  function onMarkerDown(e: PointerEvent, m: MarkerInfo) {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    editor.selectedMarker = { scene: m.scene, name: m.name };
    dragging = { m, frame: editor.markerFrame(m) };
  }
  function onMarkerMove(e: PointerEvent) {
    if (dragging) dragging = { ...dragging, frame: frameAt(e.clientX) };
  }
  function onMarkerUp() {
    if (!dragging) return;
    const { m, frame } = dragging;
    dragging = null;
    if (frame !== editor.markerFrame(m)) editor.moveMarker(m.scene, m.name, frame);
  }
  function onMarkerKey(e: KeyboardEvent, m: MarkerInfo) {
    const d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (d) {
      e.preventDefault();
      editor.moveMarker(m.scene, m.name, editor.markerFrame(m) + d * (e.shiftKey ? 10 : 1));
    } else if (e.key === 'Enter') {
      editor.seek(editor.markerFrame(m));
    }
  }

  // --- waveform ---
  $effect(() => {
    const data = editor.waveform;
    const ctx = wave?.getContext('2d');
    if (!ctx) return;
    const dpr = devicePixelRatio || 1;
    const h = 28;
    wave.width = Math.max(1, Math.round(width * dpr));
    wave.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, h);
    if (!data || data.length === 0) return;
    ctx.fillStyle = getComputedStyle(wave).getPropertyValue('--m-wave') || '#4b5563';
    const n = data.length;
    for (let i = 0; i < width; i++) {
      const v = data[Math.min(n - 1, Math.floor((i / width) * n))] ?? 0;
      const bar = Math.max(1, v * h);
      ctx.fillRect(i, (h - bar) / 2, 1, bar);
    }
  });
</script>

<section class="timeline" aria-label={t('timeline.label')}>
  <div class="transport">
    <button
      onclick={() => editor.seek(0)}
      title={t('transport.start')}
      aria-label={t('transport.start')}>⏮</button
    >
    <button
      onclick={() => editor.step(-1)}
      title={t('transport.prev')}
      aria-label={t('transport.prev')}>◀︎</button
    >
    <button
      class="play"
      onclick={() => editor.togglePlay()}
      title={editor.playing ? t('transport.pause') : t('transport.play')}
      aria-label={editor.playing ? t('transport.pause') : t('transport.play')}
      data-testid="play">{editor.playing ? '❚❚' : '▶'}</button
    >
    <button
      onclick={() => editor.step(1)}
      title={t('transport.next')}
      aria-label={t('transport.next')}>▶︎</button
    >
    <button
      onclick={() => editor.seek(editor.lastFrame)}
      title={t('transport.end')}
      aria-label={t('transport.end')}>⏭</button
    >
    <span class="time" data-testid="time">{formatTime(editor.frame, editor.fps)}</span>
    <span class="frame" data-testid="frame">{editor.frame} / {editor.lastFrame}</span>
    <span class="spacer"></span>
    <button onclick={() => editor.markerAtPlayhead()} title={t('timeline.addMarker')}>＋ M</button>
  </div>

  <div
    class="track"
    bind:this={track}
    bind:clientWidth={width}
    onpointerdown={onTrackDown}
    onpointermove={onTrackMove}
    onpointerup={onTrackUp}
    role="slider"
    tabindex="0"
    aria-label={t('timeline.label')}
    aria-valuemin={0}
    aria-valuemax={editor.lastFrame}
    aria-valuenow={editor.frame}
    aria-valuetext={formatTime(editor.frame, editor.fps)}
    data-testid="track"
  >
    <div class="scenes">
      {#each editor.scenes as s (s.name)}
        <div
          class="scene"
          style:left="{x(s.start)}px"
          style:width="{Math.max(0, x(s.start + s.frames - 1) - x(s.start))}px"
          title={s.name}
        >
          <span>{s.name}</span>
        </div>
      {/each}
    </div>
    <canvas class="wave" bind:this={wave} style:width="{width}px" aria-hidden="true"></canvas>
    {#each editor.markers as m (m.scene + '/' + m.name)}
      {@const f = markerFrame(m)}
      {@const sel =
        editor.selectedMarker?.name === m.name && editor.selectedMarker?.scene === m.scene}
      <button
        class="marker"
        class:selected={sel}
        style:left="{x(f)}px"
        data-marker={m.name}
        data-testid="marker-{m.name}"
        aria-label={t('timeline.marker', { name: m.name, time: (f / editor.fps).toFixed(2) })}
        title="{m.name} · {(f / editor.fps).toFixed(2)} s"
        onpointerdown={(e) => onMarkerDown(e, m)}
        onpointermove={onMarkerMove}
        onpointerup={onMarkerUp}
        onkeydown={(e) => onMarkerKey(e, m)}
        onfocus={() => (editor.selectedMarker = { scene: m.scene, name: m.name })}
      >
        <span class="flag">{m.name}</span>
      </button>
    {/each}
    <div class="playhead" style:left="{x(editor.frame)}px" aria-hidden="true"></div>
  </div>
</section>

<style>
  .timeline {
    background: var(--m-panel);
    border-top: 1px solid var(--m-border);
    padding: 6px 10px 10px;
    user-select: none;
  }
  .transport {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
  }
  .play {
    min-width: 40px;
  }
  .time,
  .frame {
    font-family: var(--m-mono);
    font-variant-numeric: tabular-nums;
  }
  .frame {
    color: var(--m-text-dim);
  }
  .spacer {
    flex: 1;
  }
  .track {
    position: relative;
    height: 74px;
    background: var(--m-panel-2);
    border: 1px solid var(--m-border);
    border-radius: 6px;
    cursor: ew-resize;
    touch-action: none;
  }
  .scenes {
    position: absolute;
    inset: 0 0 auto 0;
    height: 20px;
  }
  .scene {
    position: absolute;
    top: 2px;
    height: 16px;
    background: var(--m-scene);
    border-left: 2px solid var(--m-text-dim);
    font-size: 11px;
    color: var(--m-text-dim);
    overflow: hidden;
    white-space: nowrap;
    padding-left: 4px;
  }
  .wave {
    position: absolute;
    left: 0;
    bottom: 4px;
    height: 28px;
  }
  .marker {
    position: absolute;
    top: 20px;
    width: 14px;
    height: 50px;
    margin-left: -7px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: grab;
  }
  .marker::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--m-marker);
  }
  .marker .flag {
    position: absolute;
    left: 8px;
    top: 0;
    padding: 0 4px;
    font-size: 11px;
    line-height: 14px;
    background: var(--m-marker);
    color: #111;
    border-radius: 0 3px 3px 0;
    white-space: nowrap;
  }
  .marker.selected .flag {
    outline: 2px solid var(--m-text);
  }
  .playhead {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    margin-left: -1px;
    background: var(--m-playhead);
    pointer-events: none;
  }
</style>
