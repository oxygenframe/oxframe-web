<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
  import Try from '$lib/components/Try.svelte';
  import Recap from '$lib/components/Recap.svelte';
</script>

<h1>4. Easing</h1>
<p class="lead">Why some animations feel natural and others feel robotic — and how to choose.</p>

<LiveExample name="learn_04_easing" open />

<p>
  All three balls travel the same distance in the same time. The difference is <strong
    >easing</strong
  >: how the speed changes along the way.
</p>
<ul>
  <li><code>LINEAR</code> moves at a constant speed. It looks mechanical.</li>
  <li>
    The <strong>default</strong> starts slowly, speeds up, and settles in. Real objects move like this,
    which is why it is the default.
  </li>
  <li>
    <code>OUT_BACK</code> overshoots a little and comes back — playful, good for things popping in.
  </li>
</ul>
<pre><code>ball.x().to(500.0, 1.5).ease(presets::OUT_BACK).await;</code></pre>
<p>
  <code>presets</code> has the common curves (<code>IN_OUT_CUBIC</code>, <code>OUT_EXPO</code>,
  <code>IN_OUT_SINE</code>, …). There are also bouncy ones: <code>.ease(oxframe::bounce_out)</code>
  and <code>.ease(oxframe::elastic_out)</code>.
</p>

<Try>
  <ul>
    <li>Try <code>presets::IN_OUT_EXPO</code> on the middle ball.</li>
    <li>Give the last ball <code>oxframe::bounce_out</code>.</li>
  </ul>
</Try>

<Recap>
  <ul>
    <li>
      <code>.ease(...)</code> after <code>.to(...)</code> picks the curve; the default is a smooth in-and-out.
    </li>
    <li>In lesson 7 you will edit curves visually instead of picking presets.</li>
  </ul>
</Recap>
