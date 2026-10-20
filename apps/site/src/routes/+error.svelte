<script lang="ts">
  import { page } from '$app/state';
  import Seo from '$lib/components/Seo.svelte';
</script>

<Seo
  title="{page.status === 404 ? 'Page not found' : 'Error'} — oxframe"
  description="This page does not exist on oxframe.dev."
  noindex
/>

<h1>{page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
<p>
  Try the <a href="/docs">docs</a>, the <a href="/playground">playground</a> or the
  <a href="/">home page</a>.
</p>
