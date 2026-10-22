<script lang="ts">
  // The rendered video of a gallery example (served from R2 at /media/).
  import type { MediaItem } from '$lib/media';

  let { media, title }: { media: MediaItem; title: string } = $props();
</script>

{#if media.captions}
  <video
    src={media.mp4}
    poster={media.poster}
    width={media.width}
    height={media.height}
    controls
    playsinline
    preload="none"
    aria-label="{title}, rendered by oxframe"
  >
    <track kind="captions" src={media.captions} srclang="en" label="English" />
  </video>
{:else}
  <!-- No sound track: muted says so, and there is nothing to caption. -->
  <video
    src={media.mp4}
    poster={media.poster}
    width={media.width}
    height={media.height}
    controls
    muted
    playsinline
    preload="none"
    aria-label="{title}, rendered by oxframe"
  ></video>
{/if}

<style>
  video {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: #000;
  }
</style>
