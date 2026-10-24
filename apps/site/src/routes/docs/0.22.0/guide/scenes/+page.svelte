<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>11. Scenes and transitions</h1>
<p class="lead">
  A video is several scenes in a row. One render plays them in order and blends one into the next.
</p>

<LiveExample name="learn_11_scenes" open />

<h2>A project is a list of scenes</h2>
<p>
  Each <code>#[oxframe::scene]</code> function is one scene. <code>Project::new(..)</code> takes
  them with <code>.scene(first()).scene(second())</code> and plays them in that order. Every scene
  starts with an empty view, so it only holds what it needs.
  <code>oxframe render --scene second</code>
  renders one scene on its own.
</p>

<h2>Blend into the next one</h2>
<p>
  <code>transition(Transition::slide(Dir::Left)).await</code> at the start of a scene blends it in
  over the one before. The call waits out the blend: nodes added before it are on screen while it
  runs, nodes added after appear when it ends. Without <code>.duration(..)</code> the length comes from
  the theme, and the editor can drag it afterwards.
</p>
<p>
  The built-ins are <code>fade</code>, <code>slide(dir)</code>, <code>wipe(dir)</code>,
  <code>zoom_in</code> and <code>zoom_out</code>. The previous scene holds its last frame;
  <code>.overlap()</code> lets it keep playing. Lesson 13 adds one painted by a shader.
</p>

<Try>
  <ul>
    <li>Change the slide to <code>Transition::wipe(Dir::Up)</code>.</li>
    <li>Give the fade <code>.duration(2.0)</code> and watch the timeline.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>Scenes play in the order you add them with <code>.scene(..)</code>.</li>
    <li>
      <code>transition(..)</code> first thing in a scene blends it in; nodes added before it show during
      the blend.
    </li>
  </ul>
</Recap>
