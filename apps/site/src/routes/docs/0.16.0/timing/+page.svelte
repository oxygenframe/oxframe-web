<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Markers, eases, tunables</h1>
<p class="lead">
  The full story behind <a href="/docs/0.16.0/guide/editor">lesson 7</a>: values that live outside
  your code so you can adjust them in the editor.
</p>

<h2>The three kinds</h2>
<pre><code
    >{`wait_until("beat").await;                    // marker: a point on the timeline
x.to(300.0, 1.0).ease(ease!("slide")).await;   // named ease: a curve you can bend
let speed = tune!("speed", 1.4);               // tunable: a number with a slider`}</code
  ></pre>
<table>
  <tbody>
    <tr>
      <td><strong>Marker</strong></td>
      <td>
        <code>wait_until(name)</code> pauses the current task until the marker's time. The first time
        it runs, the marker is placed where the code reached it — so nothing changes until you drag it.
      </td>
    </tr>
    <tr>
      <td><strong>Ease</strong></td>
      <td>
        <code>ease!(name)</code> is a cubic Bézier curve, like CSS <code>cubic-bezier()</code>. It
        starts as a smooth in-out; edit it in the curve editor or pick a preset there.
      </td>
    </tr>
    <tr>
      <td><strong>Tunable</strong></td>
      <td>
        <code>tune!(name, default)</code> returns a number. Use it for anything you want to dial in by
        eye: sizes, speeds, counts, delays.
      </td>
    </tr>
  </tbody>
</table>

<LiveExample name="chart" />

<h2>The meta file</h2>
<p>
  Each scene has a <code>src/&lt;scene&gt;.meta.json</code> next to its source. Code provides defaults;
  the file stores what you changed. Names missing from the file are added with their defaults the first
  time the scene runs.
</p>
<pre><code
    >{`{
  "eases": { "slide": [0.65, 0.0, 0.35, 1.0] },
  "markers": { "beat": 1.25 },
  "tunables": { "speed": 1.4 },
  "version": 1
}`}</code
  ></pre>
<p>
  Keys are sorted and unknown keys are preserved, so the file is safe to edit by hand and gives
  clean diffs. Commit it together with the code.
</p>

<h2>Good to know</h2>
<ul>
  <li>
    Changing a value in the editor does <em>not</em> recompile — the preview updates instantly.
  </li>
  <li>Names are per scene. Two scenes can each have their own <code>"speed"</code>.</li>
  <li>
    Renaming a marker in code creates a new one at its default position; the old entry stays in the
    file until you delete it.
  </li>
  <li><code>oxframe check</code> validates all meta files.</li>
</ul>

<h2>A bigger example</h2>
<p>
  The player above is that chart. It uses a marker to sync the bars with a beat and named eases for
  their motion.
</p>
