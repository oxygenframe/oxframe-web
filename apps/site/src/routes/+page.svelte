<script lang="ts">
  const sample = `use oxframe::prelude::*;

#[oxframe::scene]
async fn intro(view: View) {
    let square = view.add(Rect::new().size(200.0).x(-300.0).fill(color!("#e13238")));
    all((
        square.x().to(300.0, 1.0),
        square.radius().to(100.0, 1.0),
    ))
    .await;
}

fn main() {
    Project::new("intro").scene(intro()).main();
}`;
  const features = [
    [
      'Scenes are coroutines',
      'An animation is an async fn; every .await is a frame boundary. all, sequence, spawn and wait_until compose timing.',
    ],
    [
      'Deterministic',
      'Fixed dt, a single-threaded executor and seeded randomness: the same code renders byte-identical frames anywhere.',
    ],
    [
      'Edit timing without recompiling',
      'Markers, eases and tunables live in meta.json. Drag them in the editor; the code keeps only defaults.',
    ],
    [
      'Fast preview',
      'oxframe dev rebuilds on save and reconnects the editor in about a second; scrubbing re-simulates without rendering.',
    ],
    [
      'GPU and CPU renderers',
      'vello on wgpu for speed, tiny-skia as a byte-exact reference and for CI without a GPU.',
    ],
    [
      'Video out',
      'mp4, webm with alpha, ProRes 4444 or PNG sequences through ffmpeg, with your soundtrack muxed in.',
    ],
  ];
</script>

<section class="hero">
  <h1>Procedural animation in Rust</h1>
  <p class="lead">
    Motion Canvas’ model — animations as coroutines, frames as <code>await</code> points — with Rust’s
    speed and a live editor.
  </p>
  <p class="cta">
    <a class="btn primary" href="/playground">Open the playground</a>
    <a class="btn" href="/docs/getting-started">Get started</a>
    <a class="btn" href="/playground?ex=quicksort">See the showcase</a>
  </p>
</section>

<pre><code>{sample}</code></pre>

<section class="grid">
  {#each features as [title, text] (title)}
    <article>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  {/each}
</section>

<style>
  .hero {
    padding: 40px 0 20px;
  }
  h1 {
    font-size: 44px;
    margin: 0 0 12px;
  }
  .lead {
    font-size: 19px;
    color: var(--muted);
    max-width: 640px;
  }
  .cta {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    margin-top: 32px;
  }
  article {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px 16px;
    background: var(--panel);
  }
  article p {
    color: var(--muted);
  }
</style>
