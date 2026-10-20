<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>7. Tweak timing in the editor</h1>
<p class="lead">
  Some things are easier to adjust by eye than by number. oxframe lets you do that without touching
  code.
</p>

<LiveExample name="learn_07_editor" open />

<p>
  When an animation should start "on the beat" or a size "looks right", guessing numbers and
  recompiling is slow. These three helpers move the decision into the editor:
</p>
<table>
  <tbody>
    <tr
      ><td><code>wait_until("go").await</code></td><td
        >A <strong>marker</strong> on the timeline. Drag it, and everything after it moves.</td
      ></tr
    >
    <tr
      ><td><code>tune!("size", 160.0)</code></td><td
        >A number with a <strong>slider</strong> in the inspector; 160 is the starting value.</td
      ></tr
    >
    <tr
      ><td><code>.ease(ease!("move"))</code></td><td
        >An easing curve you shape in the <strong>curve editor</strong>.</td
      ></tr
    >
  </tbody>
</table>

<h2>Where the values live</h2>
<p>
  The first time your scene runs, oxframe writes these names and their starting values into a file
  next to your code,
  <code>src/&lt;scene&gt;.meta.json</code>. From then on the file wins: the editor changes the file,
  the code only provides defaults. Commit the file — it is part of your animation.
</p>
<pre><code
    >{`{
  "eases": { "move": [0.65, 0.0, 0.35, 1.0] },
  "markers": { "fade": 1.0, "go": 0.0 },
  "tunables": { "size": 160.0 },
  "version": 1
}`}</code
  ></pre>

<Try>
  <ul>
    <li>
      Open the lesson in the playground. Drag the <code>go</code> marker to the right on the timeline.
    </li>
    <li>Move the <code>size</code> slider in the inspector.</li>
    <li>Click the <code>move</code> ease in the inspector and bend the curve.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>Markers, tunables and named eases are values you adjust in the editor.</li>
    <li>They are saved in <code>meta.json</code>; the code only sets defaults.</li>
  </ul>
</Recap>
