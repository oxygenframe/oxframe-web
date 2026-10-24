<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
  import { AUTHOR_X_URL, CONTACT_EMAIL, ORGANIZATION, SITE, X_URL } from '$lib/site';

  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      url: `${SITE}/about`,
      name: 'About oxframe',
      about: { '@id': ORGANIZATION['@id'] },
    },
    { '@context': 'https://schema.org', ...ORGANIZATION },
  ];
</script>

<Seo
  title="About oxframe: who makes it and how to get in touch — oxframe"
  description="oxframe is an open-source Rust library for motion graphics that AI coding agents can check. Who makes it, where it lives, and how to reach the team."
  {jsonld}
/>

<article>
  <h1>About oxframe</h1>
  <p class="lead">
    oxframe is an open-source library for motion graphics in Rust. A video is ordinary code: scenes,
    nodes and animations you write, review and keep in git like the rest of a project. It is built
    so an AI coding agent can write a scene and then see and check it: <code>oxframe check</code> renders
    a storyboard and reports overlaps, text that runs off screen and other mistakes before anyone watches
    the video.
  </p>

  <h2>Why it exists</h2>
  <p>
    Explainer videos, release notes and product demos go out of date as fast as the code they show.
    When the video is code, it is updated in the same pull request, rendered in CI, and the same
    input gives the same frames on every machine. oxframe renders on the CPU, needs no browser and
    no account, and is free for any use under MIT or Apache-2.0.
  </p>

  <h2>Who makes it</h2>
  <p>
    oxframe is made by <a href={AUTHOR_X_URL} rel="external">@hovs_io</a>. It is developed in the
    open in the <a href="https://github.com/oxygenframe" rel="external">oxygenframe</a>
    organization on GitHub. Before 1.0 the API still changes; every version is in the
    <a href="/changelog">changelog</a>.
  </p>

  <h2>Contact</h2>
  <ul>
    <li>
      Email: <a href="mailto:{CONTACT_EMAIL}">{CONTACT_EMAIL}</a> — questions, partnerships, press, removing
      a shared video, and security reports (please do not file those as public issues).
    </li>
    <li>
      Bugs and feature requests:
      <a href="https://github.com/oxygenframe/oxframe-sdk/issues" rel="external"
        >issues on oxframe-sdk</a
      >.
    </li>
    <li>News: <a href={X_URL} rel="external">@oxframe on X</a>.</li>
    <li>The author: <a href={AUTHOR_X_URL} rel="external">@hovs_io on X</a>.</li>
  </ul>

  <h2>Where it lives</h2>
  <ul>
    <li>
      <a href="https://github.com/oxygenframe/oxframe-sdk" rel="external">oxframe-sdk</a>: the
      library, published as
      <a href="https://crates.io/crates/oxframe" rel="external">oxframe on crates.io</a>
    </li>
    <li>
      <a href="https://github.com/oxygenframe/oxframe-cli" rel="external">oxframe-cli</a>: the
      <code>oxframe</code> command (<a href="/docs/cli">CLI reference</a>)
    </li>
    <li>
      <a href="https://github.com/oxygenframe/release-video-action" rel="external"
        >release-video-action</a
      >: a release video from your changelog in GitHub Actions
    </li>
  </ul>
  <p>
    See also the <a href="/license">license</a>, the <a href="/privacy">privacy page</a> and the
    <a href="/terms">terms of use</a>.
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
