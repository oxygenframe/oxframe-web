<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Camera</h1>
<p class="lead">
  A camera zooms, pans and turns the view of everything added to it. Show a whole diagram, move in
  on one detail, follow something as it travels — while titles stay put.
</p>

<LiveExample name="camera" />

<h2>World and screen</h2>
<p>
  Add a <code>Camera</code> to the view and build the world inside it. Everything you add to the camera
  is seen through it; everything you add to the view itself stays on screen, which is where titles, captions
  and labels belong.
</p>
<pre><code
    >{`let cam = view.add(Camera::new());
let diagram = cam.add(Group::new());      // the world: seen through the camera
diagram.add(Rect::new().width(360.0).height(160.0));
view.add(Txt::new().text("Title").h2().to_edge(Edge::Top)); // on screen`}</code
  ></pre>

<h2>Moving the camera</h2>
<p>
  A camera has four signals, animated like any other property: <code>x</code> and
  <code>y</code> are the point it looks at, <code>zoom</code> is how close it is (2 = twice as big),
  and <code>rotation</code> turns the view (in degrees, clockwise).
</p>
<!-- snippet-after: 0 -->
<!-- snippet-setup: let api = diagram.add(Rect::new().width(120.0).height(60.0)); -->
<pre><code
    >{`cam.fit(diagram, 120.0, 0.0).await;   // all of it in the frame, 120 px to spare
cam.center_on(api, 1.0).await;         // bring one node to the middle
cam.zoom().to(2.5, 1.0).await;         // move in
cam.rotation().to(15.0, 1.0).await;    // tilt
cam.reset(1.2).await;                  // back to x = y = 0, zoom 1, no rotation`}</code
  ></pre>
<p>
  <code>fit</code> measures the node when it is called, so a layout that has grown is framed at its
  current size. A duration of <code>0.0</code> jumps there at once — handy for the first frame. To
  move and zoom together, run both in <code>all</code>:
</p>
<!-- snippet-after: 0 -->
<!-- snippet-setup: let api = diagram.add(Rect::new().width(120.0).height(60.0)); -->
<pre><code>all((cam.center_on(api, 1.2), cam.zoom().to(1.6, 1.2))).await;</code></pre>

<h2>Following a node</h2>
<p>
  Bind the camera's position to a node and it follows it every frame. The next animation of the
  camera's <code>x</code> or <code>y</code> releases it.
</p>
<!-- snippet-after: 0 -->
<!-- snippet-setup: let packet = diagram.add(Circle::new().size(24.0)); -->
<pre><code
    >{`let (px, py) = (packet.x(), packet.y());
cam.x().bind(move || px.get());
cam.y().bind(move || py.get());
packet.x().to(900.0, 2.0).await;       // the camera rides along
cam.fit(diagram, 120.0, 1.4).await;    // and lets go here`}</code
  ></pre>

<h2>Sharp at any zoom</h2>
<p>
  Nothing is stretched: every frame is drawn again at its final scale. Text and outlines stay crisp
  at ×10, and blurs, shadows and glows grow with the zoom instead of turning to mush — on the GPU
  and the CPU renderer alike.
</p>

<h2>Checking</h2>
<p>
  <a href="/docs/0.21.0/cli"><code>oxframe check</code></a> does not report nodes inside a camera as out
  of frame: when you zoom in on a detail, the rest of the world is supposed to be outside. Text overlap
  and contrast are still checked, and nodes added to the view are checked as usual.
</p>
