<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>3D scenes</h1>
<p class="lead">
  Lit 3D models inside a 2D animation: every position, rotation, color and the camera are signals,
  and the 3D view is a node like any other.
</p>

<LiveExample name="cube_3d" />

<h2>A world and a view</h2>
<p>Turn on the <code>3d</code> feature of <code>oxframe</code>:</p>
<pre><code>{`oxframe = { version = "…", features = ["3d"] }`}</code></pre>
<pre><code
    >{`let world = Scene3d::new();
let cube = world.add(Mesh::cube().color(Accent).roughness(0.35));
view.add(View3d::new(&world).size(640.0, 400.0));
cube.rotation().to(Vec3::new(0.0, 360.0, 0.0), 6.0).await;`}</code
  ></pre>
<p>
  <code>Scene3d::new()</code> is an empty world with a camera looking at the origin.
  <code>scene.add(mesh)</code> puts a mesh in it and returns an <code>Object3d</code>.
  <code>View3d::new(&scene).size(640.0, 400.0)</code> shows the world in the 2D scene: it is a picture
  there, so position, opacity, effects, the 2D camera and layout work as for any node. Y is up and a cube
  is 1 unit wide.
</p>

<h2>Meshes and materials</h2>
<p>
  <code>Mesh::cube()</code>, <code>Mesh::sphere()</code>, <code>Mesh::plane()</code> (a floor facing
  up) and <code>Mesh::cylinder()</code> are 1 unit across. <code>Mesh::glb_file</code> reads a
  binary glTF model and fits it into the same 1-unit box; its base color is kept, textures are not
  read yet.
  <code>Mesh::group()</code> draws nothing and holds children: <code>object.add(mesh)</code> adds one
  that moves, turns and scales with its parent.
</p>
<p>
  The material follows glTF: <code>.color()</code> takes a color or a theme role,
  <code>.metallic()</code> goes from paint (0) to metal (1), <code>.roughness()</code> from mirror
  (0) to matte (1), <code>.emissive()</code> makes a surface glow and <code>.opacity()</code> makes
  it see-through.
  <code>.position()</code>, <code>.rotation()</code> in degrees and <code>.scale()</code> place it.
</p>

<h2>Everything is a signal</h2>
<pre><code
    >{`cube.position().to(Vec3::new(1.0, 0.0, 0.0), 1.0).await;
cube.color().to(Success, 0.5).await;
world.camera().position().to(Vec3::new(2.2, 1.8, 3.0), 2.0).await;
let sun = world.light(Light::directional((-2.0, -4.0, -1.0)));
sun.intensity().to(0.3, 1.0).await;`}</code
  ></pre>
<p>
  An <code>Object3d</code> has position, rotation (degrees around X, then Y, then Z — animate past
  360 for more turns), orientation (a <code>Quat</code>), scale, color, metallic, roughness,
  emissive and opacity as signals. <code>scene.camera()</code> has position, target and field of
  view.
  <code>scene.light(Light::directional(..))</code> adds sunlight and <code>Light::point(..)</code> a bulb;
  with no light added, a default sunlight gives each face of a box its own shade.
</p>

<h2>2D labels on 3D points</h2>
<pre><code
    >{`let frame = view.add(View3d::new(&world).size(760.0, 520.0));
let to_view = frame.projector();
let label = frame.add(Txt::new().text("top").caption());
let (w, c) = (world.clone(), cube.clone());
label.x().bind(move || to_view(w.world_point(&c, Vec3::new(0.0, 0.5, 0.0))).x);`}</code
  ></pre>
<p>
  <code>view.projector()</code> maps a 3D point into the view's own coordinates, so a label or a
  leader line follows a corner while the model turns. <code>scene.world_point(object, point)</code> gives
  the point of an object after its parents' transforms.
</p>

<h2>How it renders</h2>
<p>
  The renderer is a software rasterizer with a depth buffer and 2 × 2 supersampling for smooth
  edges. The same scene gives the same pixels in a render, in <code>oxframe check</code>, in CI
  without a GPU and in the browser playground. A frame is redrawn only when something in the scene
  changed.
  <code>.samples(1)</code> renders faster, <code>.resolution(2.0)</code> keeps the view sharp when it
  is scaled up. Shadows are not drawn yet.
</p>
<p>
  The same picture path is open to nodes of your own: <code>DrawCtx::image</code> draws a picture in
  a
  <a href="/docs/custom-nodes">node you write</a>.
</p>
