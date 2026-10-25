<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { CONTACT_EMAIL } from '$lib/site';
</script>

<Seo
  title="Privacy: what oxframe and oxframe.dev collect — oxframe"
  description="What leaves your machine with oxframe: nothing from the SDK and CLI, cookie-free visit counts on oxframe.dev, and playground code sent only when you run or share it."
/>

<article>
  <h1>Privacy</h1>
  <p class="lead">
    oxframe is a library you run yourself. The SDK and the <code>oxframe</code> CLI collect nothing and
    send nothing to us unless you publish a video. This page lists everything that does reach a server:
    the website, the playground and the documentation server for agents. Last updated 25 October 2026.
  </p>

  <h2>The SDK and the CLI</h2>
  <p>
    No telemetry, no account, no license check. Rendering happens on your machine or your CI. The
    network is used only by things you start: <code>cargo</code> downloading crates, the install script
    downloading the CLI from GitHub, and a speech provider you add yourself (such as ElevenLabs), which
    receives the text you ask it to speak under its own privacy policy.
  </p>
  <p>
    <code>oxframe publish</code> uploads the video you rendered, a poster frame and the title you
    gave it, and returns a public <code>/s/…</code> link. It is kept and deleted like a video shared from
    the playground (below), without any code.
  </p>

  <h2>This website</h2>
  <ul>
    <li>
      <strong>Visit counts.</strong> oxframe.dev counts page views with
      <a href="https://plausible.io/data-policy" rel="external">Plausible Analytics</a>: the page,
      the referrer, the browser, the operating system and the country. Plausible sets no cookies,
      keeps no IP addresses and builds no profile of a visitor. A few actions are counted the same
      way, with no details about you: opening the playground, the first build, sharing, exporting an
      MP4 and copying the install command. Cloudflare Web Analytics measures page load speed the
      same way, also with no cookies and no profile.
    </li>
    <li>
      <strong>No cookies.</strong> The site sets none, so there is no cookie banner. Your browser keeps
      one setting in local storage, the light or dark theme you picked, and it never leaves the browser.
    </li>
    <li>
      <strong>Hosting.</strong> The site runs on Cloudflare, which processes each request (including
      your IP address) to serve and protect it, under the
      <a href="https://www.cloudflare.com/privacypolicy/" rel="external"
        >Cloudflare privacy policy</a
      >.
    </li>
  </ul>

  <h2>The playground</h2>
  <ul>
    <li>
      <strong>Running a scene</strong> sends its code to <code>compile.oxframe.dev</code>. The
      service builds it and keeps the result (the compiled scene, or the compile errors) so the same
      code is not built twice. The result is stored under a hash of the code, not under anything
      about you. Your IP address is used to limit how often one visitor can start a build, and is
      not stored.
    </li>
    <li>
      <strong>“Share video”</strong> uploads the video you rendered, a poster image and the scene's
      code, and returns a public <code>/s/…</code> link. Anyone with the link can watch it. The
      files are deleted after 30 days. Your IP address limits uploads to a few a minute and is not
      stored. To remove a shared video sooner, write to
      <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a> with its link.
    </li>
    <li>
      Your code in the editor stays in your browser until you run or share it. A link to the code
      itself (“Share link”) keeps the code after <code>#</code> in the URL, a part browsers never send
      to a server; we never see it until the person who opens it runs it.
    </li>
  </ul>

  <h2>mcp.oxframe.dev</h2>
  <p>
    The server for agents answers searches over the public docs and keeps nothing about you. Its
    scene tools (<code>check_scene</code>, <code>render_frame</code>, <code>inspect_scene</code>)
    send the scene's code to <code>compile.oxframe.dev</code>, which builds and keeps it as it does
    for the playground, together with the answer (the check report and images). Requests are logged
    by Cloudflare like any other.
  </p>

  <h2>Logs</h2>
  <p>
    The playground's compile service and the documentation server write request logs (the time, the
    path, errors) to Cloudflare to keep them running. These logs are deleted automatically within a
    few days and are not used for anything else.
  </p>

  <h2>What we never do</h2>
  <ul>
    <li>Sell or share data with advertisers. There is no advertising.</li>
    <li>Use your code, videos or prompts to train models.</li>
    <li>Track you across other websites.</li>
  </ul>

  <h2>Your rights and questions</h2>
  <p>
    Because we keep almost nothing that identifies a person, there is usually nothing to look up. If
    you want a shared video removed, want to know what we hold, or have any other question, write to
    <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>. Changes to this page are listed in the
    site's history on GitHub. See also the <a href="/terms">terms of use</a>.
  </p>
</article>

<style>
  article {
    max-width: 760px;
  }
  .lead {
    color: var(--muted);
  }
</style>
