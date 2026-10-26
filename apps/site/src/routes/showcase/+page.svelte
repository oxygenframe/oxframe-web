<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="Showcase and the made-with badge — oxframe"
  description="Send a video made by Oxframe and use the badge in a README or a video description. The gallery on this site is the starting set."
/>

<h1>Showcase</h1>
<p class="lead">
  The videos in the <a href="/gallery">gallery</a> are the examples that ship with oxframe. Work from
  other people is not listed yet.
</p>

<h2>Into the wave</h2>
<p>
  Made by the oxframe team to show shaders rendering on the CPU: waves under a camera, a swell and a
  splash on markers you can drag, drops on the lens, a dive into the water, and the sea washing into
  the last scene. It is ordinary scene code with presets, and every shader in it runs on the CPU.
</p>
<LiveExample name="ocean" />

<h2>Send yours</h2>
<p>
  Open an issue on
  <a href="https://github.com/oxygenframe/oxframe-sdk/issues" rel="external">oxframe-sdk</a>
  with the title “Showcase”, a link to the video, the oxframe version, and whether the description may
  name you. A maintainer adds it here.
</p>

<h2>Badge</h2>
<p>For a README or the description of a video:</p>
<img src="/badge.svg" alt="made by Oxframe" width="150" height="28" />
<pre><code>[![made by Oxframe](https://oxframe.dev/badge.svg)](https://oxframe.dev)</code></pre>

<style>
  .lead {
    color: var(--muted);
    max-width: 68ch;
  }
</style>
