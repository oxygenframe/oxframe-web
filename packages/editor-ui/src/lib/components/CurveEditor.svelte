<script lang="ts">
  import { onMount } from 'svelte';
  import type { EditorState } from '../state.svelte';
  import { cubicBezier, PRESETS } from '../ease';
  import { t } from '../i18n';

  let { editor }: { editor: EditorState } = $props();

  const target = $derived(editor.editingEase!);
  const initial = $derived(
    (editor.metas[target.scene]?.eases?.[target.name] as number[] | undefined) ?? [
      0.65, 0, 0.35, 1,
    ],
  );
  // Follows the meta, and is overwritten locally while dragging.
  let value = $derived<[number, number, number, number]>([
    initial[0] ?? 0,
    initial[1] ?? 0,
    initial[2] ?? 1,
    initial[3] ?? 1,
  ]);

  // Plot area: x ∈ [0, 1], y ∈ [-0.5, 1.5] (room for back easings).
  const S = 240;
  const PAD = 20;
  const px = (x: number) => PAD + x * S;
  const py = (y: number) => PAD + (1.5 - y) * (S / 2);
  const fromPx = (X: number, Y: number): [number, number] => [
    Math.min(1, Math.max(0, (X - PAD) / S)),
    Math.min(1.5, Math.max(-0.5, 1.5 - (Y - PAD) / (S / 2))),
  ];

  let svg: SVGSVGElement;
  let drag: 0 | 1 | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function commit() {
    clearTimeout(timer);
    timer = setTimeout(() => editor.setEase(target.name, [...value]), 80);
  }
  function onMove(e: PointerEvent) {
    if (drag === null) return;
    const r = svg.getBoundingClientRect();
    const k = (PAD * 2 + S) / r.width;
    const [x, y] = fromPx((e.clientX - r.left) * k, (e.clientY - r.top) * k);
    const v: [number, number, number, number] = [...value];
    v[drag * 2] = Number(x.toFixed(3));
    v[drag * 2 + 1] = Number(y.toFixed(3));
    value = v;
    commit();
  }
  function onKeyHandle(e: KeyboardEvent, i: 0 | 1) {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const delta = d[e.key];
    if (!delta) return;
    e.preventDefault();
    const v: [number, number, number, number] = [...value];
    v[i * 2] = Math.min(1, Math.max(0, v[i * 2]! + delta[0]));
    v[i * 2 + 1] = Math.min(1.5, Math.max(-0.5, v[i * 2 + 1]! + delta[1]));
    value = v;
    commit();
  }

  const path = $derived(
    `M${px(0)} ${py(0)} C${px(value[0])} ${py(value[1])} ${px(value[2])} ${py(value[3])} ${px(1)} ${py(1)}`,
  );

  // Preview: a dot moving with the eased progress.
  let progress = $state(0);
  onMount(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const u = ((now - start) / 1400) % 1.4;
      progress = cubicBezier(...value)(Math.min(1, u));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="backdrop" role="presentation" onclick={() => (editor.editingEase = null)}></div>
<div
  class="dialog"
  role="dialog"
  aria-modal="true"
  aria-label={t('curve.title', { name: target.name })}
  data-testid="curve-editor"
>
  <header>
    <strong>{t('curve.title', { name: target.name })}</strong>
    <button onclick={() => (editor.editingEase = null)}>{t('curve.close')}</button>
  </header>
  <svg
    bind:this={svg}
    viewBox="0 0 {S + PAD * 2} {S + PAD * 2}"
    onpointermove={onMove}
    onpointerup={() => (drag = null)}
    role="group"
  >
    <rect x={px(0)} y={py(1)} width={S} height={S / 2} class="unit" />
    <line x1={px(0)} y1={py(0)} x2={px(value[0])} y2={py(value[1])} class="arm" />
    <line x1={px(1)} y1={py(1)} x2={px(value[2])} y2={py(value[3])} class="arm" />
    <path d={path} class="curve" />
    <circle cx={px(0)} cy={py(0)} r="4" class="fixed" />
    <circle cx={px(1)} cy={py(1)} r="4" class="fixed" />
    {#each [0, 1] as i (i)}
      <circle
        cx={px(value[i * 2]!)}
        cy={py(value[i * 2 + 1]!)}
        r="8"
        class="handle"
        tabindex="0"
        role="slider"
        aria-label="control point {i + 1}"
        aria-valuetext="{value[i * 2]!.toFixed(2)}, {value[i * 2 + 1]!.toFixed(2)}"
        aria-valuenow={value[i * 2 + 1]}
        data-testid="handle-{i}"
        onpointerdown={(e) => {
          drag = i as 0 | 1;
          svg.setPointerCapture(e.pointerId);
        }}
        onkeydown={(e) => onKeyHandle(e, i as 0 | 1)}
      />
    {/each}
    <circle cx={px(progress)} cy={S + PAD * 2 - 6} r="5" class="dot" />
  </svg>
  <div class="row">
    <label>
      {t('curve.presets')}
      <select
        onchange={(e) => {
          const p = PRESETS[e.currentTarget.value];
          if (p) {
            value = [...p];
            commit();
          }
        }}
      >
        <option value="">—</option>
        {#each Object.keys(PRESETS) as name (name)}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </label>
    <code>[{value.map((v) => v.toFixed(2)).join(', ')}]</code>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
  }
  .dialog {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(360px, 92vw);
    background: var(--m-panel);
    border: 1px solid var(--m-border);
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  svg {
    width: 100%;
    touch-action: none;
  }
  .unit {
    fill: var(--m-panel-2);
    stroke: var(--m-border);
  }
  .arm {
    stroke: var(--m-text-dim);
    stroke-width: 1.5;
  }
  .curve {
    fill: none;
    stroke: var(--m-accent);
    stroke-width: 3;
  }
  .fixed {
    fill: var(--m-text-dim);
  }
  .handle {
    fill: var(--m-panel);
    stroke: var(--m-accent);
    stroke-width: 3;
    cursor: grab;
  }
  .dot {
    fill: var(--m-marker);
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }
  code {
    font-family: var(--m-mono);
    color: var(--m-text-dim);
  }
</style>
