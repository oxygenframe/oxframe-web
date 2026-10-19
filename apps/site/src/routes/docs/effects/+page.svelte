<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<svelte:head><title>Effects — oxframe</title></svelte:head>

<h1>Effects</h1>
<p class="lead">
  Gradients, dashes, shadows, blur, blend modes and clipping. Every effect is a signal, so it
  animates like any other property — <code>.to()</code>, <code>.ease()</code> and
  <code>.bind()</code>
  all work.
</p>

<h2>Paint</h2>
<pre><code
    >{`Rect::new()
    .fill_gradient(Gradient::linear((-100.0, 0.0), (100.0, 0.0)).stops([color!("#e13238"), color!("#f5c242")]))
    .stroke(Color::WHITE).line_width(4.0)
    .dash(vec![12.0, 8.0])          // animate dash_offset for marching ants
    .line_cap(LineCap::Butt)`}</code
  ></pre>
<p>
  Gradients are in the node's own coordinates (origin at its center). <code
    >Gradient::radial(center, radius)</code
  > works the same way. Two gradients with the same number of stops interpolate.
</p>

<h2>Layers</h2>
<p>
  A node is drawn into its own layer when its effect must apply to the node and its children as a
  whole: group opacity (overlaps do not get darker), blend modes, blur and shadows. Plain shapes
  skip the layer and stay fast.
</p>
<pre><code
    >{`Group::new().opacity(0.5)                         // group opacity
Circle::new().clip(true).child(...)              // children clipped to the circle
Circle::new().blend(BlendMode::Multiply)         // Multiply, Screen, Overlay, …
Txt::new().blur(12.0)                            // Gaussian blur (σ, node units)
Rect::new().shadow(Color::BLACK.with_alpha(0.6), 16.0, (0.0, 12.0))
Circle::new().glow(color!("#68abdf"), 20.0)      // shadow without offset`}</code
  ></pre>

<h2>Order and pivot</h2>
<pre><code
    >{`Rect::new().z_index(-1.0)            // drawn below its siblings
Rect::new().anchor((-1.0, -1.0))     // (x, y) is the top-left corner and the rotation pivot`}</code
  ></pre>

<LiveExample name="effects" />

<p>
  Blur and shadows are rasterized by the same code on both renderers (tiny-skia), so CPU and GPU
  output match; only the area a layer can touch is processed.
</p>
