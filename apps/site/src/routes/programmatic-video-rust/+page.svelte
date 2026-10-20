<script lang="ts">
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="Programmatic video in Rust — oxframe"
  description="Write a video as a Rust scene: shapes, text, a camera and a theme. Preview it in the editor, check it from the command line, and render MP4 on the CPU or GPU."
/>

<h1>Programmatic video in Rust</h1>
<p>
  A scene is a Rust function. You add nodes, animate their properties, and await the beats. The
  editor scrubs the result. <code>oxframe render</code> writes MP4, WebM, ProRes or a PNG sequence.
  Install the CLI with <code>cargo install oxframe-cli</code>, then follow
  <a href="/docs/getting-started">getting started</a>.
</p>
