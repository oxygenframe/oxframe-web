<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="License: MIT or Apache-2.0, no seats or render fees — oxframe"
  description="oxframe is MIT or Apache-2.0: free for any team size and for commercial work, with no seats, no per-render fees, no account and no telemetry."
/>

<article>
  <h1>License</h1>
  <p class="lead">
    oxframe is open source under MIT or Apache-2.0, your choice. Use it at work, in a product, in
    any team size, for as many renders as you like. There are no seats, no per-render fees, no
    account and no telemetry.
  </p>

  <h2>What you can do</h2>
  <ul>
    <li>Make videos for any purpose, commercial ones included, and keep everything you render.</li>
    <li>Build oxframe into your own product, service or render farm.</li>
    <li>Change the code and share your changes; keep the license notice with the code.</li>
    <li>
      Pick either license. Apache-2.0 adds an explicit patent grant; MIT is the shortest. Both cover
      the SDK, the <code>oxframe</code> CLI and the release-video Action.
    </li>
  </ul>

  <h2>What it costs</h2>
  <p>
    Nothing. There is no paid tier and no limit on team size or company size. Rendering happens on
    your machines or your CI; nothing is metered.
  </p>

  <h2>The videos you make</h2>
  <p>
    They are yours. oxframe adds no watermark. The release-video Action ends with a “made with
    oxframe” card, which <code>credit: false</code> turns off.
  </p>

  <h2>What comes bundled</h2>
  <table>
    <thead><tr><th>Part</th><th>License</th></tr></thead>
    <tbody>
      <tr><td>Inter and JetBrains Mono fonts</td><td>SIL Open Font License 1.1</td></tr>
      <tr><td>Lucide icons (<code>lucide:</code>)</td><td>ISC</td></tr>
      <tr><td>Tabler icons (<code>tabler:</code>)</td><td>MIT</td></tr>
      <tr
        ><td>Simple Icons brand logos (<code>simple:</code>)</td><td
          >CC0; the brands are trademarks of their owners</td
        ></tr
      >
    </tbody>
  </table>
  <p>The fonts may be used in the videos you render, commercial ones included.</p>

  <h2>Your data</h2>
  <p>
    The SDK and the CLI carry no telemetry and no license check. What leaves your machine (the
    details are on the <a href="/privacy">privacy page</a>):
  </p>
  <ul>
    <li>
      <strong>Building.</strong> <code>cargo</code> downloads crates, and the install script fetches the
      CLI binary from GitHub releases.
    </li>
    <li>
      <strong>A network voice.</strong> A scene sends nothing on its own. If you add a network
      <code>TtsProvider</code> (such as ElevenLabs), the text you ask it to speak goes to that provider;
      without one, oxframe estimates the length offline and sends nothing.
    </li>
    <li>
      <strong>The <a href="/playground">playground</a></strong> sends the code you run to
      <code>compile.oxframe.dev</code>, which builds it and caches the build. “Share video” uploads
      the rendered MP4 and a poster to oxframe's storage and returns a <code>/s/…</code> link kept 30
      days.
    </li>
    <li>
      <strong>This site</strong> counts visits with Plausible, which sets no cookies.
      <code>mcp.oxframe.dev</code> is a server for agents: it serves the docs, and its scene tools send
      a scene to the compile service like the playground does.
    </li>
  </ul>

  <h2>The license texts</h2>
  <ul>
    <li>
      <a href="https://github.com/oxygenframe/oxframe-sdk#license" rel="external"
        >oxframe-sdk: LICENSE-MIT and LICENSE-APACHE</a
      >
    </li>
    <li>
      <a href="https://github.com/oxygenframe/oxframe-cli" rel="external">oxframe-cli</a> and
      <a href="https://github.com/oxygenframe/release-video-action" rel="external"
        >release-video-action</a
      >: the same two
    </li>
  </ul>
</article>

<style>
  article {
    max-width: 760px;
  }
  .lead {
    color: var(--muted);
  }
</style>
