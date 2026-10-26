<script lang="ts">
  // Share one release: its link, a post for X with the video to attach, the
  // MP4 itself, and the system share sheet (with the video) where there is one.
  import { onMount } from 'svelte';
  import type { MediaItem } from '$lib/media';

  let {
    version,
    url,
    summary,
    media,
  }: { version: string; url: string; summary: string; media?: MediaItem } = $props();

  const post = $derived(`oxframe ${version} is out: ${summary}`);
  const intent = $derived(
    `https://x.com/intent/post?text=${encodeURIComponent(post)}&url=${encodeURIComponent(url)}`,
  );
  const file = $derived(`oxframe-${version}.mp4`);

  let copied = $state<'' | 'link' | 'post'>('');
  let canShare = $state(false);
  onMount(() => {
    canShare = typeof navigator.share === 'function';
  });

  async function copy(what: 'link' | 'post') {
    const text = what === 'link' ? url : `${post}\n\n${url}`;
    try {
      await navigator.clipboard.writeText(text);
      copied = what;
      setTimeout(() => (copied = ''), 1500);
    } catch {
      // No clipboard (insecure context): nothing to do.
    }
  }

  async function share() {
    const data: ShareData = { title: `oxframe ${version}`, text: post, url };
    if (media) {
      try {
        const blob = await (await fetch(media.mp4)).blob();
        const files = [new File([blob], file, { type: 'video/mp4' })];
        if (navigator.canShare?.({ files })) data.files = files;
      } catch {
        // Share the link alone.
      }
    }
    await navigator.share(data).catch(() => {});
  }
</script>

<div class="share" data-testid="share-{version}">
  <button type="button" onclick={() => copy('link')}
    >{copied === 'link' ? 'Copied' : 'Copy link'}</button
  >
  <a href={intent} target="_blank" rel="external noopener">Post on X</a>
  <button
    type="button"
    onclick={() => copy('post')}
    title="The post text with the link, to paste with the video attached"
    >{copied === 'post' ? 'Copied' : 'Copy post text'}</button
  >
  {#if media}
    <a href={media.mp4} download={file}>Download video</a>
  {/if}
  {#if canShare}
    <button type="button" onclick={share}>Share…</button>
  {/if}
</div>

<style>
  .share {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 4px 0 12px;
  }
  .share a,
  .share button {
    font: inherit;
    font-size: 13px;
    padding: 3px 10px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: none;
    color: var(--text);
    text-decoration: none;
    cursor: pointer;
  }
  .share a:hover,
  .share button:hover {
    border-color: var(--muted);
  }
</style>
