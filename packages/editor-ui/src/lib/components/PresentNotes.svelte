<script lang="ts">
  import { onMount } from 'svelte';
  import {
    PRESENT_CHANNEL,
    presentKey,
    type PresentMessage,
    type PresentStatus,
  } from '../present.svelte';

  let status = $state<PresentStatus | null>(null);
  let startedAt = $state<number | null>(null);
  let now = $state(Date.now());
  let channel: BroadcastChannel | null = null;

  onMount(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    channel = new BroadcastChannel(PRESENT_CHANNEL);
    channel.onmessage = (e: MessageEvent<PresentMessage>) => {
      if (e.data.type === 'status') {
        status = e.data.status;
        if (startedAt === null && status.index >= 0) startedAt = Date.now();
      }
    };
    send({ type: 'hello' });
    const tick = setInterval(() => (now = Date.now()), 500);
    return () => {
      clearInterval(tick);
      channel?.close();
    };
  });

  function send(m: PresentMessage) {
    channel?.postMessage(m);
  }

  function onKey(e: KeyboardEvent) {
    const action = presentKey(e.key);
    if (!action) return;
    send({ type: action });
    e.preventDefault();
  }

  const elapsed = $derived.by(() => {
    if (startedAt === null) return '0:00';
    const s = Math.floor((now - startedAt) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });
</script>

<svelte:window onkeydown={onKey} />

<div class="notes" data-testid="present-notes">
  <header>
    <span class="slide" data-testid="present-notes-counter">
      {#if status}Stop {status.index + 1} of {status.total}{:else}Waiting for the presentation…{/if}
    </span>
    <span class="timer" data-testid="present-timer">{elapsed}</span>
    <button type="button" onclick={() => (startedAt = Date.now())}>Reset timer</button>
  </header>
  <section>
    <h2>Now</h2>
    <p class="text" data-testid="present-notes-now">{status?.notes || '—'}</p>
  </section>
  <section class="next">
    <h2>Next</h2>
    <p class="text">{status?.nextNotes || '—'}</p>
  </section>
  <footer>
    <button type="button" onclick={() => send({ type: 'prev' })}>← Back</button>
    <button type="button" onclick={() => send({ type: 'next' })}>Next →</button>
  </footer>
</div>

<style>
  .notes {
    position: fixed;
    inset: 0;
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    gap: 16px;
    padding: 20px 24px;
    background: #111;
    color: #eee;
    font:
      16px/1.5 system-ui,
      sans-serif;
  }
  header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .slide {
    flex: 1;
    color: #aaa;
  }
  .timer {
    font-variant-numeric: tabular-nums;
    font-size: 28px;
  }
  h2 {
    margin: 0 0 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #888;
  }
  .text {
    margin: 0;
    white-space: pre-wrap;
    font-size: 24px;
  }
  .next .text {
    font-size: 16px;
    color: #aaa;
  }
  footer {
    display: flex;
    gap: 12px;
  }
  button {
    padding: 8px 14px;
    border: 1px solid #444;
    border-radius: 8px;
    background: #222;
    color: #eee;
    font: inherit;
    cursor: pointer;
  }
</style>
