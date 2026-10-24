<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { CONTACT_EMAIL } from '$lib/site';
</script>

<Seo
  title="Terms of use for oxframe.dev and the playground — oxframe"
  description="The rules for oxframe.dev, the playground, shared videos and mcp.oxframe.dev: free to use, provided as is, no unlawful content, and how to report a shared video."
/>

<article>
  <h1>Terms of use</h1>
  <p class="lead">
    These terms cover the website oxframe.dev and the free services on it: the playground, its
    compile service, shared videos and the documentation server <code>mcp.oxframe.dev</code>. The
    software itself (the SDK, the CLI and the release-video Action) is covered by its
    <a href="/license">open-source license</a>, not by this page. Last updated 24 October 2026.
  </p>

  <h2>Using the services</h2>
  <p>
    The services are free and need no account. By using them you agree to these terms. Use them to
    try, learn and share oxframe; do not use them to:
  </p>
  <ul>
    <li>
      break the law, or share content that is illegal, infringes someone else's rights, harasses
      someone or contains malware;
    </li>
    <li>
      overload them, get around their limits (build and upload rates, video size and length), or use
      the compile service as general-purpose computing;
    </li>
    <li>probe or attack them, or other people's systems through them.</li>
  </ul>
  <p>We may block traffic that does, and remove what it left behind.</p>

  <h2>Your code and your videos</h2>
  <p>
    What you write and render stays yours. When you share a video, you give oxframe.dev permission
    to store it and show it to anyone with its link for as long as it is kept (30 days), and you
    confirm you have the right to share it. Shared links are public: do not share anything secret.
  </p>

  <h2>Reporting a shared video</h2>
  <p>
    To report a shared video that breaks these terms or your rights, write to
    <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a> with its <code>/s/…</code> link and the reason.
    We remove videos that break the terms.
  </p>

  <h2>No warranty</h2>
  <p>
    The services are provided “as is”, without any warranty, and may change, slow down, stop or lose
    data at any time; keep your own copy of anything that matters. To the extent the law allows,
    oxframe and its contributors are not liable for any loss from using them.
  </p>

  <h2>Changes</h2>
  <p>
    We may update these terms; the date at the top says when. How we handle data is on the
    <a href="/privacy">privacy page</a>. Questions:
    <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a>.
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
