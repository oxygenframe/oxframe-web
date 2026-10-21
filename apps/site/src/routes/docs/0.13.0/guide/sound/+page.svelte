<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>12. Sound and voice</h1>
<p class="lead">
  Sounds start on the frame where the scene starts them, so they stay in sync when the timing
  changes.
</p>

<LiveExample name="learn_12_sound" open />

<h2>A sound on the beat</h2>
<p>
  <code>sound("assets/click.wav").play()</code> starts the file at the current frame.
  <code>.trim(0.0, 0.18)</code> plays only part of it and <code>.volume(..)</code> sets its level. Put
  the call right before the animation it belongs to: if you add a pause earlier in the scene, the click
  moves with the picture.
</p>

<h2>A soundtrack under everything</h2>
<p>
  <code>Project::audio(Audio::track("assets/music.mp3"))</code> plays under the whole project.
  <code>.duck_under_voice()</code> makes it quieter while someone speaks.
</p>

<h2>A spoken line</h2>
<p>
  <code>voice("Sound follows the picture").start()</code> starts a line and returns a handle.
  <code>line.at_word("follows").await</code> waits for that word, and <code>line.await</code> waits
  for the end. Without a speech provider oxframe estimates how long the line takes, which is enough
  to time the picture; <a href="/docs/0.13.0/rendering#voice">Rendering</a> shows how to plug in a real
  voice.
</p>

<Try>
  <ul>
    <li>Wait for the word <code>"picture"</code> instead of <code>"follows"</code>.</li>
    <li>Turn the soundtrack up with <code>.volume(0.8)</code> and listen to it duck.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li><code>sound(..).play()</code> starts at the current frame.</li>
    <li>
      <code>Audio::track(..)</code> is the soundtrack; <code>.duck_under_voice()</code> lowers it.
    </li>
    <li><code>line.at_word(..)</code> times the picture to a word.</li>
  </ul>
</Recap>
