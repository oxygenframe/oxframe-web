<script lang="ts">
  // The playground app. Browser-only (Monaco, the engine Worker, location.hash):
  // routes/playground mounts it on the client.
  import { onMount, untrack } from 'svelte';
  import { page } from '$app/state';
  import type { Meta } from '@oxframe/protocol';
  import CodeEditor from '$lib/components/CodeEditor.svelte';
  import Player from '$lib/components/Player.svelte';
  import { compile, type CompileError } from '$lib/compile';
  import { COMPILE_URL, SDK_VERSION } from '$lib/config';
  import { CURRENT } from '$lib/versions';
  import { exampleByName, lessonExamples, localExamples, showcaseExamples } from '$lib/examples';
  import { decodeShare, encodeShare } from '$lib/share';
  import { MAX_SHARE_SECONDS, posterOf, SHARE_BITRATE, uploadShare } from '$lib/share-video';
  import { track, trackOnce } from '$lib/track';

  const initialName = page.url.searchParams.get('ex') ?? 'intro';
  // Examples linked from archived docs carry their version (`?v=0.1`); the
  // playground builds with one SDK only, so say when they differ.
  const fromVersion = page.url.searchParams.get('v');
  const otherVersion = fromVersion && fromVersion !== CURRENT ? fromVersion : null;
  let source = $state(
    decodeShare(location.hash) ?? exampleByName(initialName)?.source ?? localExamples[0]!.source,
  );
  let example = $state(decodeShare(location.hash) ? '' : initialName);
  // The code as loaded (an example or a shared link): changing it is an edit.
  let loaded = untrack(() => source);
  let errors = $state<CompileError[]>([]);
  let log = $state('');
  let status = $state<'idle' | 'compiling' | 'ok' | 'error'>('idle');
  let message = $state('');
  let artifact = $state<{ wasm: string; js: string } | null>(null);
  let metas = $state<Record<string, Meta>>({});
  let firstFrameMs = $state<number | null>(null);
  let compileMs = $state<number | null>(null);
  let copied = $state(false);
  let buildId = $state<string | null>(null);
  let embedCopied = $state(false);
  let player = $state<{
    exportMp4: (p?: (d: number, t: number) => void, bitrate?: number) => Promise<Blob>;
    restart: () => void;
  }>();
  let exportState = $state<{ done: number; total: number } | null>(null);
  let download = $state<{ url: string; name: string } | null>(null);

  async function exportVideo() {
    if (!player) return;
    exportState = { done: 0, total: 1 };
    message = '';
    try {
      const blob = await player.exportMp4((done, total) => (exportState = { done, total }));
      if (download) URL.revokeObjectURL(download.url);
      download = { url: URL.createObjectURL(blob), name: `${example || 'scene'}.mp4` };
      track('Export MP4', { example: example || 'shared' });
    } catch (e) {
      message = (e as Error).message;
      status = 'error';
    } finally {
      exportState = null;
    }
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let inflight: AbortController | undefined;

  async function run() {
    clearTimeout(timer);
    inflight?.abort();
    const ctl = new AbortController();
    inflight = ctl;
    status = 'compiling';
    message = '';
    const t0 = performance.now();
    try {
      const r = await compile(source, ctl.signal);
      if (ctl.signal.aborted) return;
      compileMs = Math.round(performance.now() - t0);
      errors = r.errors;
      log = r.log ?? '';
      if (r.status === 'done' && r.wasm_url && r.js_url) {
        status = 'ok';
        artifact = { wasm: r.wasm_url, js: r.js_url };
        buildId = r.id;
        trackOnce('Playground compiled', { example: example || 'shared' });
      } else {
        status = 'error';
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      status = 'error';
      message = (e as Error).message.includes('fetch')
        ? 'Cannot reach the compile service. Is it running?'
        : (e as Error).message;
    }
  }

  function onchange(v: string) {
    source = v;
    if (v !== loaded) trackOnce('Playground edited', { example: example || 'shared' });
    clearTimeout(timer);
    // Compile 500 ms after typing stops; Ctrl+Enter compiles at once.
    timer = setTimeout(run, 500);
  }

  function pick(name: string) {
    const ex = exampleByName(name);
    if (!ex) return;
    example = name;
    source = ex.source;
    loaded = ex.source;
    metas = {};
    history.replaceState(history.state, '', `?ex=${name}`);
    player?.restart();
    void run();
  }

  // Share with video: render, take a poster, upload, copy the /s/<id> link.
  let sharing = $state<{ done: number; total: number } | 'upload' | null>(null);
  let sharedUrl = $state<string | null>(null);
  async function shareVideo() {
    if (!player || sharing) return;
    sharing = { done: 0, total: 1 };
    message = '';
    try {
      const video = await player.exportMp4(
        (done, total) => (sharing = { done, total }),
        SHARE_BITRATE,
      );
      const { poster, seconds } = await posterOf(video);
      if (seconds > MAX_SHARE_SECONDS + 0.5) {
        throw new Error(
          `Videos up to ${MAX_SHARE_SECONDS} s can be shared; this one is ${Math.round(seconds)} s. Export mp4 instead.`,
        );
      }
      sharing = 'upload';
      sharedUrl = await uploadShare(video, poster, encodeShare(source));
      track('Share video', { example: example || 'shared' });
      await navigator.clipboard.writeText(sharedUrl).catch(() => {});
    } catch (e) {
      message = (e as Error).message;
      status = 'error';
    } finally {
      sharing = null;
    }
  }

  async function share() {
    const url = `${location.origin}/playground${encodeShare(source)}`;
    history.replaceState(history.state, '', url);
    track('Share link', { example: example || 'shared' });
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard may be blocked; the URL bar has the link anyway.
    }
  }

  /** Copies an `<oxframe-player>` snippet that plays this build on any page. */
  async function embed() {
    if (!buildId) return;
    const compileAttr =
      COMPILE_URL === 'https://compile.oxframe.dev' ? '' : ` compile="${COMPILE_URL}"`;
    // Split so the closing tag does not end this component's own <script>.
    const close = '</' + 'script>';
    const snippet = `<script type="module" src="${location.origin}/player.js">${close}
<oxframe-player build="${buildId}"${compileAttr} controls loop></oxframe-player>`;
    track('Copy embed', { example: example || 'shared' });
    try {
      await navigator.clipboard.writeText(snippet);
      embedCopied = true;
      setTimeout(() => (embedCopied = false), 2000);
    } catch {
      prompt('Copy this snippet:', snippet);
    }
  }

  onMount(() => {
    if (decodeShare(location.hash)) track('Open shared code');
    void run();
  });
</script>

<div class="pg">
  <section class="code">
    {#if otherVersion}
      <p class="version-warning" role="note" data-testid="version-warning">
        This example comes from the oxframe {otherVersion} docs; the playground runs {SDK_VERSION},
        so it may need changes.
      </p>
    {/if}
    <div class="bar">
      <label>
        Example
        <select value={example} onchange={(e) => pick(e.currentTarget.value)} data-testid="example">
          {#if !example}<option value="">shared code</option>{/if}
          <optgroup label="Examples">
            {#each showcaseExamples as ex (ex.name)}
              <option value={ex.name}>{ex.name}</option>
            {/each}
          </optgroup>
          <optgroup label="Guide lessons">
            {#each lessonExamples as ex (ex.name)}
              <option value={ex.name}>{ex.name.replace(/^learn_/, '')}</option>
            {/each}
          </optgroup>
        </select>
      </label>
      <button class="btn primary" onclick={run} title="Ctrl+Enter" data-testid="run">Run</button>
      <button class="btn" onclick={share} title="Anyone with the link can see this code">
        {copied ? 'Link copied' : 'Share'}
      </button>
      <button
        class="btn"
        onclick={embed}
        disabled={!buildId || status !== 'ok'}
        title="Copies HTML that plays this scene on any web page"
        data-testid="embed"
      >
        {embedCopied ? 'Embed copied' : 'Embed'}
      </button>
      <button
        class="btn"
        onclick={exportVideo}
        disabled={!artifact || !!exportState}
        data-testid="export"
      >
        {exportState
          ? `Exporting ${Math.round((100 * exportState.done) / exportState.total)}%`
          : 'Export mp4'}
      </button>
      <button
        class="btn"
        onclick={shareVideo}
        disabled={!artifact || !!sharing || !!exportState}
        title="Renders the video and shares a link that plays it (kept 30 days)"
        data-testid="share-video"
      >
        {sharing === 'upload'
          ? 'Uploading…'
          : sharing
            ? `Rendering ${Math.round((100 * sharing.done) / sharing.total)}%`
            : 'Share video'}
      </button>
      {#if sharedUrl}
        <a class="btn" href={sharedUrl} target="_blank" rel="noopener" data-testid="shared-link"
          >Video link copied</a
        >
      {/if}
      {#if download}
        <a class="btn" href={download.url} download={download.name} data-testid="download"
          >Download</a
        >
      {/if}
      <span class="status {status}" data-testid="compile-status" role="status">
        {#if status === 'compiling'}Compiling…{:else if status === 'ok'}Compiled{compileMs !== null
            ? ` in ${(compileMs / 1000).toFixed(1)} s`
            : ''}{:else if status === 'error'}{message || 'Errors'}{/if}
      </span>
    </div>
    <div class="editor"><CodeEditor value={source} {errors} {onchange} onsubmit={run} /></div>
    {#if errors.length || log}
      <div class="errors" data-testid="compile-errors">
        {#each errors as e, i (i)}
          <div><code>{e.file}:{e.line}:{e.column}</code> {e.message}</div>
        {/each}
        {#if log}<details>
            <summary>compiler output</summary>
            <pre>{log}</pre>
          </details>{/if}
      </div>
    {/if}
    <p class="hint">
      <span class="sdk" data-testid="sdk-version">oxframe {SDK_VERSION}</span> · Share links are public
      by design: the code travels in the URL. Your scene runs in your browser; the server only compiles
      it.
    </p>
  </section>
  <section class="preview">
    {#if artifact}
      <Player
        bind:this={player}
        wasmUrl={artifact.wasm}
        jsUrl={artifact.js}
        bind:metas
        onFirstFrame={(ms) => (firstFrameMs = Math.round(ms))}
      />
      {#if firstFrameMs !== null}<span class="sr-note" data-testid="first-frame"
          >{firstFrameMs}</span
        >{/if}
    {:else}
      <div class="empty">
        {status === 'compiling' ? 'Compiling your scene…' : 'Run the code to see it here.'}
      </div>
    {/if}
  </section>
</div>

<style>
  .pg {
    display: grid;
    grid-template-columns: minmax(360px, 42%) 1fr;
    height: 100%;
  }
  .code {
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    min-height: 0;
    min-width: 0;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
  }
  .status {
    margin-left: auto;
    font-size: 13px;
    color: var(--muted);
  }
  .status.error {
    color: var(--danger);
  }
  .editor {
    flex: 1;
    min-height: 0;
  }
  .errors {
    max-height: 30vh;
    overflow: auto;
    padding: 8px 10px;
    border-top: 1px solid var(--border);
    font-size: 13px;
  }
  .version-warning {
    margin: 0;
    padding: 6px 10px;
    font-size: 13px;
    background: color-mix(in srgb, #f5c242 18%, var(--panel));
    border-bottom: 1px solid var(--border);
  }
  .sdk {
    color: var(--text);
  }
  .hint {
    margin: 0;
    padding: 6px 10px;
    font-size: 12px;
    color: var(--muted);
    border-top: 1px solid var(--border);
  }
  /* Phones: code above, preview below. */
  @media (max-width: 720px) {
    .pg {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: minmax(0, 55%) minmax(0, 45%);
    }
    .code {
      border-right: 0;
      border-bottom: 1px solid var(--border);
    }
  }
  .preview {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    min-height: 0;
    min-width: 0;
  }
  .empty {
    display: grid;
    place-items: center;
    color: var(--muted);
  }
  .sr-note {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  @media (max-width: 900px) {
    .pg {
      grid-template-columns: 1fr;
      grid-template-rows: 50% 50%;
    }
  }
</style>
