<script lang="ts">
  // The SDK's CHANGELOG.md (synced by scripts/sync-changelog.ts), with the
  // video each release got from release-video-action, where there is one.
  import Seo from '$lib/components/Seo.svelte';
  import ExampleVideo from '$lib/components/ExampleVideo.svelte';
  import changelog from '$lib/changelog.json';
  import videos from '$lib/release-media.json';
  import type { MediaItem } from '$lib/media';
  import { SITE } from '$lib/site';

  const media = videos as Record<string, MediaItem>;
  const anchor = (version: string) => `v${version.replace(/\./g, '-')}`;
  // One VideoObject per release video, dated with its release.
  const jsonld = changelog
    .filter((r) => media[r.version])
    .map((r) => {
      const m = media[r.version]!;
      return {
        '@type': 'VideoObject',
        name: `oxframe ${r.version} release notes`,
        description: `What changed in oxframe ${r.version}, made from the release notes by release-video-action.`,
        thumbnailUrl: `${SITE}${m.poster}`,
        contentUrl: `${SITE}${m.mp4}`,
        uploadDate: `${r.date}T00:00:00+00:00`,
        duration: `PT${m.seconds.toFixed(1)}S`,
        width: m.width,
        height: m.height,
      };
    });
  // Published to crates.io before releases were tagged on GitHub.
  const UNTAGGED = new Set(['0.1.0', '0.2.2', '0.2.3', '0.2.4', '0.2.5']);
</script>

<Seo
  title="Changelog: every oxframe release — oxframe"
  description="What changed in each oxframe release, newest first: new APIs, fixes and breaking changes with before and after code, and a video of the newer releases."
  {jsonld}
/>

<article>
  <h1>Changelog</h1>
  <p class="lead">
    The SDK and the <code>oxframe</code> CLI are released together under one version. Before 1.0 a
    breaking change bumps the minor version (0.19 → 0.20) and is listed with a before and after.
    Since 0.20.0 every release also gets a video, made from these notes by the
    <a href="https://github.com/oxygenframe/release-video-action" rel="external"
      >release-video Action</a
    >.
  </p>

  {#each changelog as r (r.version)}
    <section id={anchor(r.version)}>
      <h2>
        <a href="#{anchor(r.version)}">{r.version}</a>
        <time datetime={r.date}>{r.date}</time>
      </h2>
      {#if media[r.version]}
        <div class="video">
          <ExampleVideo media={media[r.version]!} title="oxframe {r.version} release notes" />
        </div>
      {/if}
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- converted at sync time from the SDK's own CHANGELOG.md -->
      {@html r.html}
      <p class="links">
        {#if !UNTAGGED.has(r.version)}
          <a
            href="https://github.com/oxygenframe/oxframe-sdk/releases/tag/v{r.version}"
            rel="external">Release on GitHub</a
          >
          ·
        {/if}
        <a href="https://docs.rs/oxframe/{r.version}/oxframe/" rel="external">API on docs.rs</a>
      </p>
    </section>
  {/each}
</article>

<style>
  article {
    max-width: 760px;
  }
  .lead {
    color: var(--muted);
  }
  section {
    padding-top: 8px;
    border-top: 1px solid var(--border);
    margin-top: 32px;
    scroll-margin-top: 16px;
  }
  h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
  }
  h2 a {
    color: var(--text);
    text-decoration: none;
  }
  time {
    color: var(--muted);
    font-size: 15px;
    font-weight: 400;
  }
  .video {
    max-width: 560px;
    margin: 12px 0;
  }
  .links {
    font-size: 14px;
    color: var(--muted);
  }
</style>
