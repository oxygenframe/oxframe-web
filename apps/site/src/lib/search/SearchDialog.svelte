<script lang="ts">
  // The header's search: a button that opens a dialog with the docs search.
  // "/" (except on docs pages, whose sidebar box owns it) and Ctrl/⌘+K open it.
  import { onMount, tick } from 'svelte';
  import DocsSearch from './DocsSearch.svelte';

  let { slashKey = true }: { slashKey?: boolean } = $props();
  let dialog: HTMLDialogElement | undefined = $state();
  let open = $state(false);
  let mac = $state(false);

  onMount(() => {
    mac = /Mac|iPhone|iPad/.test(navigator.platform);
  });

  // The box is mounted first, so showModal() focuses it. The close event of
  // an earlier Escape can arrive after a quick reopen: onclose keeps `open`
  // in step with the dialog rather than clearing it.
  async function show() {
    if (!dialog || dialog.open) return;
    open = true;
    await tick();
    if (!dialog.open) dialog.showModal();
  }
  function close() {
    dialog?.close();
  }

  function key(e: KeyboardEvent) {
    const t = e.target as HTMLElement;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      // dialog.open, not `open`: the close event (which resets `open`)
      // comes a task after Escape closes the dialog.
      if (dialog?.open) close();
      else void show();
    } else if (slashKey && e.key === '/' && !typing && !dialog?.open) {
      e.preventDefault();
      void show();
    }
  }
</script>

<svelte:window onkeydown={key} />

<button
  class="search-open"
  type="button"
  onclick={show}
  aria-label="Search the docs"
  aria-keyshortcuts={mac ? 'Meta+K' : 'Control+K'}
  data-testid="header-search"
>
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
    ><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg
  >
  <span class="label">Search</span>
  <kbd>{mac ? '⌘' : 'Ctrl'} K</kbd>
</button>

<dialog
  bind:this={dialog}
  onclose={() => (open = dialog?.open ?? false)}
  onclick={(e) => e.target === dialog && close()}
  aria-label="Search the docs"
  data-testid="search-dialog"
>
  {#if open}
    <div class="box">
      <DocsSearch inline autofocus slashKey={false} onchoose={close} />
    </div>
  {/if}
</dialog>

<style>
  .search-open {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    margin-left: auto;
    padding: 0 8px 0 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--muted);
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    white-space: nowrap;
  }
  .search-open:hover {
    color: var(--text);
    border-color: var(--muted);
  }
  svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
  }
  kbd {
    padding: 0 5px;
    border: 1px solid var(--border);
    border-radius: 4px;
    font: inherit;
    font-size: 11px;
  }
  /* Narrow screens: the icon is enough. */
  @media (max-width: 1000px) {
    .search-open {
      width: 30px;
      padding: 0;
      justify-content: center;
    }
    .label,
    kbd {
      display: none;
    }
  }
  dialog {
    width: min(600px, calc(100vw - 32px));
    max-height: min(640px, calc(100dvh - 96px));
    margin: 64px auto auto;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    color: var(--text);
    box-shadow: 0 24px 64px rgb(0 0 0 / 0.45);
    overflow-y: auto;
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
    backdrop-filter: blur(2px);
  }
  .box :global(.search) {
    margin: 0;
  }
  .box :global(input) {
    padding: 10px 12px;
    font-size: 16px;
  }
  @media (max-width: 520px) {
    dialog {
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      margin: 0;
      border-radius: 0;
    }
  }
</style>
