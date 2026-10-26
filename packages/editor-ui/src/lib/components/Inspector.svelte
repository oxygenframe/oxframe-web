<script lang="ts">
  import type { NodeInfo } from '@oxframe/protocol';
  import type { EditorState } from '../state.svelte';
  import { t } from '../i18n';

  let { editor }: { editor: EditorState } = $props();

  // Depth of each node for indentation.
  const rows = $derived.by(() => {
    const byId = new Map<number, NodeInfo>(editor.tree.map((n) => [n.id, n]));
    const depth = (n: NodeInfo): number => {
      let d = 0;
      let p = n.parent;
      while (p !== null && p !== undefined && d < 64) {
        d += 1;
        p = byId.get(p)?.parent ?? null;
      }
      return d;
    };
    return editor.tree.map((n) => ({ n, depth: depth(n) }));
  });

  const tunables = $derived(
    Object.entries(editor.metas).flatMap(([scene, m]) =>
      Object.entries(m.tunables ?? {}).map(([name, value]) => ({
        scene,
        name,
        value: value as number,
      })),
    ),
  );
  const eases = $derived(
    Object.entries(editor.metas).flatMap(([scene, m]) =>
      Object.entries(m.eases ?? {}).map(([name, value]) => ({
        scene,
        name,
        value: value as number[],
      })),
    ),
  );

  // Slider range around the current value.
  function range(v: number): [number, number, number] {
    const span = v === 0 ? 10 : Math.abs(v) * 2;
    const min = v >= 0 ? 0 : v - span;
    const max = v >= 0 ? Math.max(v * 2, 1) : v + span;
    return [min, max, (max - min) / 200];
  }

  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  function setTunable(name: string, value: number) {
    clearTimeout(timers.get(name));
    timers.set(
      name,
      setTimeout(() => editor.setTunable(name, value), 60),
    );
  }
  // Ranges are fixed when dragging starts, so the slider does not rescale
  // under the pointer.
  const ranges = new Map<string, [number, number, number]>();
  function rangeFor(name: string, v: number) {
    if (!ranges.has(name)) ranges.set(name, range(v));
    return ranges.get(name)!;
  }

  function curvePath(v: number[]): string {
    const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = v;
    const s = 24;
    return `M0 ${s} C${x1 * s} ${s - y1 * s} ${x2 * s} ${s - y2 * s} ${s} 0`;
  }
</script>

<aside class="inspector">
  {#if editor.notes !== null}
    <section data-testid="notes">
      <h2>Notes for the agent</h2>
      {#if editor.notes.length === 0}
        <p class="dim">
          Press <kbd>C</kbd>, then click or drag in the frame. <code>oxframe check</code> gives open notes
          to the agent first.
        </p>
      {:else}
        <ol class="notes">
          {#each editor.notes as n (n.id)}
            {@const crop = editor.noteCropUrl(n)}
            <li class:done={n.status === 'done'} data-testid="note-{n.id}">
              <button class="note-go" onclick={() => editor.goToNote(n)} title="Go to the note">
                <span class="note-id">#{n.id}</span>
                {n.time[0].toFixed(2)}{n.time[1] > n.time[0] ? `–${n.time[1].toFixed(2)}` : ''} s
                {#if n.node}· {n.node}{/if}
              </button>
              <p class="note-text">{n.text}</p>
              {#if crop}<img src={crop} alt="The marked area of note {n.id}" loading="lazy" />{/if}
              {#if n.reply}<p class="note-reply" data-testid="note-reply-{n.id}">
                  ↳ {n.reply}
                </p>{/if}
              <div class="note-row">
                {#if n.status === 'open'}
                  <button onclick={() => editor.setNoteStatus(n.id, 'done')}>Resolve</button>
                {:else}
                  <span class="dim">done</span>
                  <button onclick={() => editor.setNoteStatus(n.id, 'open')}>Reopen</button>
                {/if}
                <button onclick={() => editor.deleteNote(n.id)} aria-label="Delete note {n.id}"
                  >Delete</button
                >
              </div>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  {/if}
  <section>
    <h2>{t('inspector.tree')}</h2>
    <ul class="tree" role="tree" data-testid="tree">
      {#each rows as { n, depth } (n.id)}
        <li role="treeitem" aria-selected={editor.selected === n.id}>
          <button
            class="node"
            class:sel={editor.selected === n.id}
            style:padding-left="{8 + depth * 12}px"
            onclick={() => editor.select(n.id === editor.selected ? null : n.id)}
          >
            <span class="kind">{n.kind}</span>
            {#if n.name}<span class="name">{n.name}</span>{/if}
            <span class="id">#{n.id}</span>
          </button>
        </li>
      {/each}
    </ul>
  </section>

  <section>
    <h2>{t('inspector.signals')}</h2>
    {#if editor.selected === null}
      <p class="dim">{t('inspector.noSelection')}</p>
    {:else}
      <table data-testid="signals">
        <tbody>
          {#each editor.signals as s (s.name)}
            <tr>
              <th scope="row">{s.name}</th>
              <td>
                {#if /^#[0-9a-f]{8}$/i.test(s.value)}
                  <span class="swatch" style:background={s.value}></span>
                {/if}
                {s.value}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>

  <section>
    <h2>{t('inspector.tunables')}</h2>
    {#if tunables.length === 0}
      <p class="dim">{t('inspector.none')}</p>
    {/if}
    {#each tunables as tu (tu.scene + tu.name)}
      {@const [min, max, step] = rangeFor(tu.name, tu.value)}
      <label class="tunable">
        <span>{tu.name}</span>
        <input
          type="range"
          {min}
          {max}
          {step}
          value={tu.value}
          oninput={(e) => setTunable(tu.name, +e.currentTarget.value)}
          data-testid="tunable-{tu.name}"
        />
        <input
          type="number"
          {step}
          value={tu.value}
          onchange={(e) => editor.setTunable(tu.name, +e.currentTarget.value)}
          aria-label="{tu.name} value"
        />
      </label>
    {/each}
  </section>

  <section>
    <h2>{t('inspector.eases')}</h2>
    {#if eases.length === 0}
      <p class="dim">{t('inspector.none')}</p>
    {/if}
    {#each eases as ea (ea.scene + ea.name)}
      <button
        class="ease"
        onclick={() => (editor.editingEase = { scene: ea.scene, name: ea.name })}
        data-testid="ease-{ea.name}"
      >
        <svg viewBox="-2 -2 28 28" width="28" height="28" aria-hidden="true">
          <path d={curvePath(ea.value)} fill="none" stroke="currentColor" stroke-width="2" />
        </svg>
        <span>{ea.name}</span>
        <code>{ea.value.map((v) => v.toFixed(2)).join(', ')}</code>
      </button>
    {/each}
  </section>
</aside>

<style>
  .notes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .notes li {
    border-left: 3px solid #ff3b6b;
    padding-left: 6px;
  }
  .notes li.done {
    border-left-color: var(--m-border);
    opacity: 0.7;
  }
  .note-go {
    all: unset;
    cursor: pointer;
    font-size: 12px;
    color: var(--m-text-dim);
  }
  .note-id {
    color: #ff3b6b;
    font-weight: 600;
  }
  .note-text,
  .note-reply {
    margin: 2px 0;
    white-space: pre-wrap;
  }
  .note-reply {
    color: var(--m-text-dim);
  }
  .notes img {
    max-width: 100%;
    border-radius: 4px;
  }
  .note-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .inspector {
    background: var(--m-panel);
    border-left: 1px solid var(--m-border);
    overflow: auto;
    min-height: 0;
  }
  section {
    padding: 8px 10px;
    border-bottom: 1px solid var(--m-border);
  }
  h2 {
    margin: 0 0 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--m-text-dim);
  }
  .dim {
    color: var(--m-text-dim);
    margin: 0;
  }
  .tree {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .node {
    display: flex;
    gap: 6px;
    width: 100%;
    text-align: left;
    border: none;
    background: none;
    border-radius: 4px;
    padding: 2px 6px;
  }
  .node.sel {
    background: var(--m-accent);
    color: var(--m-accent-text);
  }
  .kind {
    font-weight: 600;
  }
  .id {
    margin-left: auto;
    opacity: 0.7;
    font-family: var(--m-mono);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--m-mono);
    font-size: 12px;
  }
  th {
    text-align: left;
    font-weight: normal;
    color: var(--m-text-dim);
    padding: 1px 6px 1px 0;
    white-space: nowrap;
  }
  td {
    word-break: break-all;
  }
  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 1px solid var(--m-border);
    vertical-align: middle;
  }
  .tunable {
    display: grid;
    grid-template-columns: 70px 1fr 64px;
    gap: 6px;
    align-items: center;
    margin-bottom: 4px;
  }
  .tunable span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ease {
    display: grid;
    grid-template-columns: 28px 1fr;
    grid-template-rows: auto auto;
    column-gap: 8px;
    width: 100%;
    text-align: left;
    margin-bottom: 4px;
  }
  .ease svg {
    grid-row: span 2;
    color: var(--m-accent);
  }
  .ease code {
    font-size: 11px;
    color: var(--m-text-dim);
  }
</style>
