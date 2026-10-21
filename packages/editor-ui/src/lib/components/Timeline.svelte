<script lang="ts">
  import type { MarkerInfo, SceneInfo } from '@oxframe/protocol';
  import { fileName } from '../audio';
  import { formatTime, type EditorState } from '../state.svelte';
  import { t } from '../i18n';

  let { editor }: { editor: EditorState } = $props();

  let track: HTMLDivElement;
  let wave: HTMLCanvasElement;
  let width = $state(0);

  const total = $derived(Math.max(1, editor.frames));
  const tracks = $derived.by(() => {
    const rows: { name: string; file: string; start: number }[] = [];
    const seen = new Set<string>();
    for (const meta of Object.values(editor.metas)) {
      const file = meta.audio?.file;
      if (!file) continue;
      const name = fileName(file);
      if (seen.has(name)) continue;
      seen.add(name);
      rows.push({ name, file, start: meta.audio?.offset ?? 0 });
    }
    return rows;
  });
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
    const el = e.target as HTMLElement;
    if (el.dataset.marker || el.closest('[data-transition]')) return;
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

  // --- transition length ---
  let trimming = $state<{ name: string; frames: number } | null>(null);
  const blendFrames = (s: SceneInfo) =>
    trimming && trimming.name === s.name ? trimming.frames : (s.transition ?? 0);
  function onTrimDown(e: PointerEvent, s: SceneInfo) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    trimming = { name: s.name, frames: s.transition ?? 0 };
  }
  function onTrimMove(e: PointerEvent, s: SceneInfo) {
    if (!trimming || trimming.name !== s.name) return;
    const start = s.start + (s.transition_at ?? 0);
    trimming = { name: s.name, frames: Math.max(0, frameAt(e.clientX) - start) };
  }
  function onTrimUp(s: SceneInfo) {
    if (!trimming || trimming.name !== s.name) return;
    const frames = trimming.frames;
    trimming = null;
    if (frames !== (s.transition ?? 0)) editor.setTransition(s.name, frames / editor.fps);
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
      // A quiet bed (the example tone) would otherwise be a hairline.
      const bar = Math.max(v > 0.02 ? 2 : 1, Math.pow(v, 0.55) * h);
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
    class:with-music={tracks.length > 0}
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
        {#if blendFrames(s) > 0}
          <div
            class="transition"
            style:left="{x(s.start + (s.transition_at ?? 0))}px"
            style:width="{Math.max(
              8,
              x(s.start + (s.transition_at ?? 0) + blendFrames(s)) -
                x(s.start + (s.transition_at ?? 0)),
            )}px"
            data-transition={s.name}
            data-testid="transition-{s.name}"
            title={t('timeline.transition', {
              name: s.name,
              seconds: (blendFrames(s) / editor.fps).toFixed(2),
            })}
          >
            <button
              class="trim"
              data-transition={s.name}
              aria-label={t('timeline.transition', {
                name: s.name,
                seconds: (blendFrames(s) / editor.fps).toFixed(2),
              })}
              onpointerdown={(e) => onTrimDown(e, s)}
              onpointermove={(e) => onTrimMove(e, s)}
              onpointerup={() => onTrimUp(s)}
            ></button>
          </div>
        {/if}
      {/each}
    </div>
    {#each tracks as track (track.name)}
      <div
        class="clip music"
        style:left="{x(track.start * editor.fps)}px"
        style:width="{Math.max(2, width - x(track.start * editor.fps))}px"
        title={t('timeline.soundtrack', { name: track.file })}
        data-testid="audio-track"
      >
        <span>{track.name}</span>
      </div>
    {/each}
    {#each editor.clips as c, i (c.name + ':' + i)}
      <div
        class="clip"
        class:effect={tracks.length > 0}
        class:priority={c.priority}
        style:left="{x(c.start * editor.fps)}px"
        style:width="{Math.max(
          2,
          x((c.start + c.seconds) * editor.fps) - x(c.start * editor.fps),
        )}px"
        title={c.text ?? c.name}
        data-testid="audio-clip"
      >
        <span>{c.text ?? fileName(c.name)}</span>
      </div>
    {/each}
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
  .track.with-music {
    height: 96px;
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
  .transition {
    position: absolute;
    top: 2px;
    height: 16px;
    background: var(--m-accent);
    opacity: 0.85;
    border-radius: 2px;
    z-index: 1;
    pointer-events: none;
  }
  .trim {
    position: absolute;
    top: 0;
    right: 0;
    width: 8px;
    height: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: ew-resize;
    pointer-events: auto;
  }
  .clip {
    position: absolute;
    top: 22px;
    height: 16px;
    overflow: visible;
    background: var(--m-accent);
    opacity: 0.82;
    border-radius: 2px;
    pointer-events: none;
    color: #fff;
    font-size: 10px;
    line-height: 16px;
    white-space: nowrap;
    z-index: 2;
  }
  .clip span {
    display: inline-block;
    padding: 0 4px;
  }
  .clip.priority {
    opacity: 1;
    outline: 1px solid #fff;
  }
  .clip.music {
    opacity: 0.72;
  }
  .track.with-music .clip.effect {
    top: 42px;
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
