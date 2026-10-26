<script lang="ts">
  // Search over the current docs (Pagefind index built after the site build).
  // Nothing loads until the box is focused; "/" focuses it.
  import { onDestroy, onMount, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Hit } from './search-worker';

  /**
   * `query`: searches for this at once (the 404 page passes words from the
   * missing URL). `inline`: results are a list in the page, always shown,
   * instead of a dropdown over it.
   */
  let {
    query = '',
    inline = false,
    autofocus = false,
    slashKey = true,
    onchoose,
  }: {
    query?: string;
    inline?: boolean;
    /** Focus the box when it appears (the header's search dialog). */
    autofocus?: boolean;
    /** "/" focuses this box. Off where another handler owns the key. */
    slashKey?: boolean;
    /** Called when a result is chosen, before navigating. */
    onchoose?: () => void;
  } = $props();
  let q = $state(untrack(() => query));
  let hits: Hit[] = $state([]);
  let open = $state(false);
  let active = $state(0);
  let failed = $state(false);
  let input: HTMLInputElement | undefined = $state();
  // The docs menu scrolls, so it would clip the results: they are placed
  // against the window, under the box.
  let at = $state({ top: 0, left: 0 });
  let worker: Worker | undefined;
  let last = 0;

  function start() {
    if (worker) return;
    worker = new Worker(new URL('./search-worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<{ id: number; hits?: Hit[]; error?: string }>) => {
      // Answers to older queries arrive late; only the newest counts.
      if (e.data.id !== last) return;
      failed = !!e.data.error;
      hits = e.data.hits ?? [];
      active = 0;
    };
  }

  function place() {
    if (inline || !input) return;
    const r = input.getBoundingClientRect();
    at = { top: r.bottom + 4, left: r.left };
  }

  function search() {
    start();
    open = true;
    place();
    if (!q.trim()) {
      hits = [];
      return;
    }
    worker!.postMessage({ id: ++last, q });
  }

  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowDown' && hits.length) {
      e.preventDefault();
      active = (active + 1) % hits.length;
    } else if (e.key === 'ArrowUp' && hits.length) {
      e.preventDefault();
      active = (active - 1 + hits.length) % hits.length;
    } else if (e.key === 'Enter' && hits[active]) {
      e.preventDefault();
      choose(hits[active]!.url);
    } else if (e.key === 'Escape' && !inline) {
      open = false;
      input?.blur();
    }
  }

  function choose(url: string) {
    onchoose?.();
    open = false;
    q = '';
    hits = [];
    void goto(url);
  }

  onMount(() => {
    if (autofocus) input?.focus();
    if (q.trim()) search();
  });
  // The header's dialog mounts a new box each time it opens.
  onDestroy(() => worker?.terminate());

  function slash(e: KeyboardEvent) {
    if (!slashKey) return;
    const t = e.target as HTMLElement;
    if (e.key !== '/' || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
    e.preventDefault();
    input?.focus();
  }
</script>

<svelte:window
  onkeydown={slash}
  onscroll={() => open && place()}
  onresize={() => open && place()}
/>

<div class="search" role="search">
  <input
    bind:this={input}
    bind:value={q}
    type="search"
    role="combobox"
    placeholder="Search the docs"
    aria-label="Search the docs"
    aria-controls="search-results"
    aria-autocomplete="list"
    aria-expanded={open && q.trim() !== ''}
    aria-activedescendant={open && hits[active] ? `search-hit-${active}` : undefined}
    autocomplete="off"
    spellcheck="false"
    onfocus={start}
    oninput={search}
    onkeydown={key}
    onblur={() => inline || setTimeout(() => (open = false), 150)}
    data-testid="docs-search"
  />
  {#if !inline}<kbd aria-hidden="true">/</kbd>{/if}
  {#if (open || inline) && q.trim()}
    <ul
      id="search-results"
      class="results"
      class:inline
      role="listbox"
      data-testid="search-results"
      style:top="{at.top}px"
      style:left="{at.left}px"
    >
      {#each inline ? hits.slice(0, 6) : hits as h, i (h.url)}
        <li id="search-hit-{i}" role="option" aria-selected={i === active}>
          <a
            href={h.url}
            class:active={i === active}
            onmousedown={(e) => {
              e.preventDefault();
              choose(h.url);
            }}
          >
            <strong>{h.title}</strong>
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- Pagefind escapes the text; only <mark> is markup -->
            <span>{@html h.excerpt}</span>
          </a>
        </li>
      {:else}
        <li class="none" role="option" aria-selected="false" aria-disabled="true">
          {failed ? 'Search is not available here.' : 'Nothing found.'}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .search {
    position: relative;
    margin-bottom: 12px;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    padding: 7px 28px 7px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--bg);
    color: var(--text);
    font: inherit;
    font-size: 14px;
  }
  input:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
  kbd {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    padding: 0 5px;
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--muted);
    font-size: 12px;
    pointer-events: none;
  }
  input:focus + kbd {
    display: none;
  }
  .results {
    position: fixed;
    z-index: 20;
    width: min(440px, calc(100vw - 32px));
    max-height: 70vh;
    overflow-y: auto;
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--panel);
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.35);
  }
  .results.inline {
    position: static;
    width: auto;
    max-height: none;
    margin-top: 8px;
    box-shadow: none;
  }
  .results a {
    display: block;
    padding: 8px 10px;
    border-radius: 6px;
    color: var(--text);
    text-decoration: none;
  }
  .results a.active,
  .results a:hover {
    background: var(--code);
  }
  .results strong {
    display: block;
    font-size: 14px;
  }
  .results span {
    display: block;
    margin-top: 2px;
    color: var(--muted);
    font-size: 13px;
    line-height: 1.45;
  }
  .results :global(mark) {
    background: none;
    color: var(--accent);
    font-weight: 600;
  }
  .none {
    padding: 8px 10px;
    color: var(--muted);
    font-size: 14px;
  }
</style>
