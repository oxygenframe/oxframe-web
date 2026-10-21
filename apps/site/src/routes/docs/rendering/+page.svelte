<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Rendering video</h1>
<p class="lead">
  When the animation looks right in the editor, one command turns it into a video file.
</p>

<pre><code>oxframe render</code></pre>
<p>
  That's it: the project is built in release mode and every frame goes to <code
    >out/&lt;project&gt;.mp4</code
  >. You need <a href="https://ffmpeg.org/download.html">ffmpeg</a> installed for video formats; PNG frames
  work without it.
</p>

<h2>Common recipes</h2>
<pre><code
    >{`oxframe render --out film.webm             # VP9 with transparency
oxframe render --format prores --out a.mov # ProRes 4444 with transparency, for video editors
oxframe render --format png --out frames/  # one PNG per frame
oxframe render --size 3840x2160            # 4K
oxframe render --scene outro               # just one scene
oxframe render --range 1..3                # seconds 1 to 3
oxframe render --cpu                       # no GPU available (CI, servers)`}</code
  ></pre>
<p>
  Need just one still? <code>oxframe snapshot --at 2.5</code> writes a PNG of that moment — no ffmpeg,
  no full render.
</p>

<h2>Transitions</h2>
<p>
  A scene can open by blending in over the one before it. The call waits out the blend, so nodes
  added before it are on screen while it runs and nodes added after appear when it finishes. The
  length comes from the theme unless you set one, and the editor can drag it afterwards.
</p>
<pre><code
    >{`#[oxframe::scene]
async fn outro(view: View) {
    transition(Transition::slide(Dir::Left)).await;
    let end = view.add(EndCard::new("Thanks for watching"));
    end.enter().await;
}`}</code
  ></pre>
<LiveExample name="transitions" />
<p>
  <code>fade</code>, <code>slide(Dir::Left)</code> (<code>Right</code>, <code>Up</code>,
  <code>Down</code>), <code>wipe(dir)</code>, <code>zoom_in</code> and <code>zoom_out</code> are
  built in. <code>.ease(...)</code> changes the curve, <code>.overlap()</code> lets the previous
  scene keep playing instead of holding its last frame, and <code>Transition::custom(|t| ...)</code>
  places the two layers itself with opacity, offset, scale and a wipe. The first scene has nothing to
  blend from, so the call does nothing there.
</p>
<p>
  <code>oxframe render</code> includes every transition. <code>oxframe render --scene outro</code>
  draws that scene on its own, without the blend into it. <code>oxframe check</code> puts a frame
  from each blend on the storyboard, and <code>oxframe inspect</code> reports the type and progress. The
  same blend keeps its alpha on a transparent background, in 16:9, 9:16 and 1:1.
</p>

<h2>Sound</h2>
<p>Attach a soundtrack to the project:</p>
<pre><code
    >{`Project::new("my-video")
    .audio("assets/voice.mp3")
    .scene(intro())`}</code
  ></pre>
<p>
  The waveform appears on the editor's timeline; drag it to shift the sound against the picture. The
  offset is saved in <code>meta.json</code> and used by <code>oxframe render</code>. Pass
  <code>--no-audio</code> to leave it out.
</p>

<h2>Transparent backgrounds</h2>
<p>
  Make the background transparent with <code>.background(Color::TRANSPARENT)</code> on the project
  and render to <code>webm</code>, <code>prores</code> or <code>png</code>: those keep the alpha
  channel, so you can lay the animation over footage in a video editor. MP4 (H.264) has no
  transparency.
</p>

<h2>GPU or CPU?</h2>
<p>
  By default frames are drawn on the GPU (vello) and fall back to the CPU (tiny-skia) when no GPU is
  available. Both produce the same picture: they pass the same reference-frame tests within a color
  difference of ΔE 1, which you cannot see. The CPU renderer is also byte-for-byte identical between
  runs, which is what you want in automated tests. A layer whose vectors did not change is reused on
  the next frame. A scene with no effects is one vector pass; <code>oxframe inspect --graph</code>
  lists the passes.
</p>

<h2>In the browser</h2>
<p>
  The playground can export MP4 too (the <strong>Export</strong> button). It encodes with your browser's
  WebCodecs, so it works offline but is limited to what the browser supports — use the CLI for ProRes,
  4K or long videos.
</p>
