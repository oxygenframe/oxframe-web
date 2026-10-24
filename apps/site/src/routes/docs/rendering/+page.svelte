<script lang="ts">
  import ExampleVideo from '$lib/components/ExampleVideo.svelte';
  import LiveExample from '$lib/components/LiveExample.svelte';
  import { mediaFor } from '$lib/media';
  import { SDK_VERSION } from '$lib/sdk';

  const magnifier = mediaFor('magnifier');
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
oxframe render --gpu                       # draw on the GPU (vello); the CPU is the default
oxframe render --jobs 4                    # four segments at once`}</code
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
  places the two layers itself with opacity, offset, scale and a wipe.
  <code>Transition::shader(shaders::water_wipe())</code> raises a wavy waterline over the frame;
  below it is the next scene, rippled near the line, and <code>.wave()</code> sets the wave height
  (see <a href="#shaders-that-read-pixels">shaders that read pixels</a>). The first scene has
  nothing to blend from, so the call does nothing there.
</p>
<p>
  <code>oxframe render</code> includes every transition. <code>oxframe render --scene outro</code>
  draws that scene on its own, without the blend into it. <code>oxframe check</code> puts a frame
  from each blend on the storyboard, and <code>oxframe inspect</code> reports the type and progress. The
  same blend keeps its alpha on a transparent background, in 16:9, 9:16 and 1:1.
</p>

<h2>Shaders</h2>
<p>
  <code>shaders::waves()</code> is a node: a crest of foam over deeper water, painted inside its
  box.
  <code>.amp()</code> is the height of that crest and a signal, so it can move.
  <code>.deep()</code> and <code>.foam()</code> take a color or a theme role such as
  <code>Accent</code>. The node has no children. A title goes on the view, above the water.
</p>
<pre><code
    >{`let sea = view.add(shaders::waves().amp(0.05).deep(Accent).foam(Surface)
    .width(pct(100)).height(pct(40)).to_edge(Edge::Bottom));
sea.amp().to(0.12, 1.2).await;`}</code
  ></pre>
<LiveExample name="waves" />
<p>
  The preset is rasterized first and then drawn by the CPU or the GPU, so a check with no GPU still
  shows it. Draft checks paint the layer at half resolution. That does not move the box or change
  the timing.
</p>
<p>
  Your own shader is WGSL. It defines <code>struct Params</code>, the uniform <code>p</code>, and
  <code>fn shade</code>. oxframe adds <code>ox</code> (time, frame, resolution, the box size, seed,
  the camera matrix, and progress) and <code>ShadeIn</code> (uv, local, world, and screen).
  <code>Shader::source</code> keeps the text in the scene.
  <code>Shader::file</code> reads a <code>.wgsl</code> file on every draw, so saving it updates the
  picture without a rebuild. <code>.uniform()</code> sets a number. A name or a type that is not in
  <code>Params</code> fails the check, and the message lists the fields. WGSL that does not compile
  fails it too, with the line in your source. Your <code>shade</code> runs on the CPU, a tile of
  pixels at a time, with the same bytes on every OS (about 0.13 s for a 1080p frame), in
  <code>oxframe dev</code>, <code>check</code> and <code>render</code>. It cannot use textures,
  samplers or derivatives; it reads its inputs with functions instead (below). The playground does
  not paint a custom shader yet.
</p>

<h3 id="wgsl-inputs">Your own WGSL: reading the frame, an image or a node</h3>
<p>
  An input is a function in your WGSL. <code>.input("scene", Input::frame())</code> gives
  <code>sample_scene(uv)</code>, the pixels drawn before the shader; the shader is then painted over
  them inside its box. This magnifying glass bends the frame inside a moving circle, and its center,
  radius and zoom are uniforms, so <code>.to()</code> animates them:
</p>
<p><code>lens.wgsl</code>:</p>
<!-- snippet-skip: WGSL, not Rust -->
<pre><code
    >{`struct Params { cx: f32, cy: f32, radius: f32, zoom: f32 }
@group(1) @binding(0) var<uniform> p: Params;

fn shade(i: ShadeIn) -> vec4<f32> {
    let res = ox.resolution;
    let center = vec2<f32>(p.cx, p.cy) * res;
    let d = i.screen - center;
    let r = length(d) / p.radius;
    if (r > 1.0) {
        return sample_scene(i.screen / res);
    }
    let at = center + d * mix(1.0 / p.zoom, 1.0, r * r);
    let rim = smoothstep(0.9, 1.0, r);
    return vec4<f32>(mix(sample_scene(at / res).rgb, vec3<f32>(1.0), rim * 0.7), 1.0);
}`}</code
  ></pre>
<p>The scene:</p>
<pre><code
    >{`#[oxframe::scene]
async fn magnifier(view: View) {
    view.add(Txt::new().text("Read the fine print").h1().y(-330.0));
    // ... the text to read ...
    let lens = view.add(
        Shader::file("lens.wgsl")
            .uniform("cx", 0.27).uniform("cy", 0.53)
            .uniform("radius", 0.0).uniform("zoom", 2.2)
            .input("scene", Input::frame())
            .fullscreen(), // added last: it reads everything above
    );
    lens.uniform("radius").to(170.0, 0.5).await;
    lens.uniform("cx").to(0.73, 3.0).await;
}`}</code
  ></pre>
{#if magnifier}
  <ExampleVideo media={magnifier} title="A magnifying glass written in WGSL" />
{/if}
<p>
  The whole scene, with a color fringe at the rim, is the
  <a href="/gallery/magnifier">magnifier example in the gallery</a>. A frame shader inside the box
  sees screen pixels: <code>sample_scene(i.screen / ox.resolution)</code> reads the pixel under the one
  being shaded.
</p>
<p>
  The other inputs work the same way, each read with <code>sample_&lt;name&gt;(uv)</code>, where
  <code>uv</code> runs from 0 to 1 across the input:
</p>
<ul>
  <li>
    <code>.input("photo", Input::file("photo.png"))</code> reads a PNG or JPEG from the project and
    gives <code>sample_photo(uv)</code>. <code>Input::image(include_bytes!(..))</code> builds the file
    into the binary instead.
  </li>
  <li>
    <code>Input::node(handle)</code> reads another node, children included, across its box. Add that
    node with <code>.offscreen()</code> and it is drawn only for the shader: never on screen, and
    <code>oxframe check</code> skips it. That is how a shader distorts a logo or a title.
  </li>
</ul>
<p>
  Calling <code>sample_x</code> with no input named <code>x</code> fails the check, and the message
  says how to add it. <code>Shader::size(width, height)</code> sets the box in one call, like
  <code>Rect</code>.
</p>

<h3 id="shaders-that-read-pixels">Shaders that read pixels</h3>
<p>
  Three presets work on what is already drawn: drops on the lens, rings on a node, and water that
  rises into the next scene.
</p>
<pre><code
    >{`#[oxframe::scene]
async fn sea(view: View) {
    let water = view.add(shaders::waves().deep(Accent).foam(Surface)
        .width(pct(100)).height(pct(45)).to_edge(Edge::Bottom));
    let lens = view.add(shaders::lens_drops().wetness(0.0).seed(7).fullscreen()); // last

    let rings = water.effect(shaders::ripple().strength(0.0));
    rings.strength().to(1.0, 0.4).await;
    lens.wetness().to(1.0, 0.4).await;
}

#[oxframe::scene]
async fn shore(view: View) {
    view.add(shaders::waves().amp(0.02).width(pct(100)).height(pct(20)).to_edge(Edge::Bottom));
    transition(Transition::shader(shaders::water_wipe())).await;
    view.add(EndCard::new("Made with oxframe")).enter().await;
}`}</code
  ></pre>
<LiveExample name="splash" />
<p>
  <code>shaders::lens_drops()</code> bends everything drawn before it, inside its box, so add it
  last and make it <code>.fullscreen()</code>. <code>.wetness()</code> runs from 0 (dry) to 1 and is
  a signal: <code>lens.wetness().to(1.0, 0.4)</code> is a splash. <code>.seed()</code> places the
  drops and <code>.drop_size()</code> scales them. <code>.input("scene", Input::frame())</code>
  names what the shader reads, and outside a layer <code>Input::backdrop()</code> is the same thing.
</p>
<p>
  <code>Node::effect</code> runs a shader on one node's pixels, children included, and returns an
  <code>Effect</code>. <code>shaders::ripple()</code> sends rings out from the node's center;
  <code>.strength()</code> and <code>.speed()</code> are signals. The colors move and the outline stays,
  so use it on water, text, a gradient or an image: a flat fill shows no rings. A node has one effect.
</p>
<p>
  <code>lens_drops</code>, <code>node.effect(..)</code> or a frame-reading shader of your own also
  works inside a group with opacity below 1, a blur, a clip, a blend, a shadow or another effect.
  The group is drawn on its own first, so a shader in it reads what the group drew before it; then
  the group fades, blurs or clips as a whole. <code>oxframe inspect --graph</code> lists these
  shaders as <code>effect</code> passes, and a <code>Shader</code> handle works wherever a
  <code>Node</code> does, for example in <code>Camera::center_on</code>.
</p>

<h2>Sound</h2>
<p>
  A soundtrack plays for the whole video. <code>Project::audio("music.mp3")</code> still works, and
  it is the same as <code>Audio::track</code>:
</p>
<!-- snippet-setup: #[oxframe::scene] async fn intro(view: View) {} -->
<pre><code
    >{`Project::new("explainer")
    .audio(Audio::track("assets/music.mp3").duck_under_voice().volume(0.8))
    .scene(intro())`}</code
  ></pre>
<p>
  <code>.duck_under_voice()</code> lowers the music while a sound marked <code>.priority()</code> is
  playing. <code>.volume()</code>, <code>.fade_in()</code> and <code>.fade_out()</code> shape the
  track. <code>.master_fade()</code> fades the whole mix, including the effects.
</p>
<p>
  <code>sound("click.wav")</code> starts at the current frame. <code>.play()</code> does not wait.
  Awaiting the sound waits until it ends, and <code>.trim()</code> plays a slice of the file (that slice
  is also how long the wait is):
</p>
<pre><code
    >{`sound("assets/whoosh.wav").volume(0.6).fade_in(0.05).play();
sound("assets/click.wav").trim(0.0, 0.2).priority().await;`}</code
  ></pre>
<LiveExample name="sounds" />
<p>
  Effects show up as clips on the timeline and play with the picture, including after a seek. The
  mix is written before ffmpeg encodes it, so two renders of the same scene match.
  <code>--no-audio</code> leaves the soundtrack and the effects out. <code>--range</code> keeps only
  the part of them that falls inside that span. Drag the waveform to shift the soundtrack; the
  offset is saved in <code>meta.json</code>.
</p>

<h2 id="voice">Voice</h2>
<p>
  <code>voice("one two").start()</code> speaks the line and keeps going. <code>.at_word()</code>
  waits until that word. Awaiting the line waits until the end. A line is <code>.priority()</code>,
  so it ducks a soundtrack built with <code>.duck_under_voice()</code>.
</p>
<!-- snippet-setup: let square = view.add(Rect::new()); -->
<pre><code
    >{`let line = voice("First draw a square, then rotate it").start();
line.at_word("square").await;
square.draw_on().await;
line.at_word("rotate").await;
square.rotation().to(90.0, 0.8).await;
line.await;`}</code
  ></pre>
<p>
  oxframe does not call a speech service itself. To get real audio, implement
  <code>TtsProvider</code> and pass it to <code>Project::tts</code>. <code>synthesize</code>
  receives the line and the voice name and returns mono <code>i16</code> samples plus one
  <code>TimedWord</code> per word. <code>.at_word()</code> waits on those times, not on a guess. The
  key stays inside the provider, read from the environment. <code>speak</code> below is your function:
  the HTTP call and the decode.
</p>
<!-- snippet-setup: #[oxframe::scene] async fn intro(view: View) {}
fn speak(key: &str, voice: &str, text: &str) -> Result<(u32, Vec<i16>, Vec<TimedWord>), String> { unimplemented!() } -->
<pre><code
    >{`use oxframe::{Synthesis, TimedWord, TtsProvider, TtsRequest};

struct ElevenLabs;

impl TtsProvider for ElevenLabs {
    fn id(&self) -> &str {
        "elevenlabs"
    }

    fn synthesize(&self, req: &TtsRequest) -> Result<Synthesis, String> {
        let key = std::env::var("ELEVENLABS_API_KEY")
            .map_err(|_| "set ELEVENLABS_API_KEY".to_string())?;
        // Send req.text and req.voice to ElevenLabs with key.
        // Decode the body into mono i16 samples and one TimedWord per word.
        let (rate, samples, words) = speak(&key, req.voice, req.text)?;
        Ok(Synthesis { rate, samples, words })
    }
}

Project::new("explainer")
    .tts(ElevenLabs)
    .speaker("Rachel")
    .audio(Audio::track("assets/music.mp3").duck_under_voice())
    .scene(intro())`}</code
  ></pre>
<p>
  The first render calls <code>synthesize</code> and saves <code>tts/&#123;hash&#125;.wav</code> and
  <code>tts/&#123;hash&#125;.json</code>. The next render plays that file. Commit the folder to
  render in CI without a key. A missing key or a failed call does not fail the scene: oxframe
  estimates the length (2.5 words per second, at least 0.3s) and there is no speech audio. An
  estimate is not cached. With no provider, a committed cache is still used when the text and voice
  match. The playground always estimates.
</p>
<LiveExample name="voice" />
<p>
  <code>oxframe render --subtitles out.srt</code> writes the lines. A path ending in
  <code>.vtt</code>
  writes WebVTT. <code>--no-audio</code> still writes them, and <code>--range</code> shifts the cues into
  that part of the video. A line that runs past the scene is an error; two lines that overlap are a warning.
</p>

<h2>Transparent backgrounds</h2>
<p>
  Make the background transparent with <code>.background(Color::TRANSPARENT)</code> on the project
  and render to <code>webm</code>, <code>prores</code> or <code>png</code>: those keep the alpha
  channel, so you can lay the animation over footage in a video editor. MP4 (H.264) has no
  transparency.
</p>

<h2>Parallel rendering</h2>
<p>
  A video longer than two seconds renders in 2-second segments, several at once: each one runs in
  its own process, is encoded on its own, and the segments are joined without encoding them again.
  The soundtrack is added once at the end. <code>--jobs 4</code> sets how many run at a time; the default
  is one per core, at most eight.
</p>
<p>
  The segments are the same whatever <code>--jobs</code> is, so <code>--jobs 1</code> and
  <code>--jobs 8</code> write the same bytes: a render on your laptop and one in CI match. Scenes
  that take long to draw gain the most — a 7-second 3D scene on 8 cores renders 2.7 times faster —
  while a short or simple one gains little, because every segment first runs the scene up to where
  it starts. Each process holds one frame at a time, so memory does not grow with the length of the
  video. A PNG sequence is split the same way. A tool of your own that encodes segments can join
  them the same way with <code>oxframe_export::concat</code>.
</p>

<h2>GPU or CPU?</h2>
<p>
  Frames are drawn on the CPU (tiny-skia) by default. It is faster than the GPU on every scene we
  benchmark, and it needs no graphics driver, so CI and servers just work. Pass
  <code>--gpu</code> to <code>oxframe render</code>, <code>oxframe dev</code> or
  <code>oxframe present</code> to draw with vello; it falls back to the CPU when no GPU is
  available. Before 0.21 the GPU was the default and <code>--cpu</code> opted out;
  <code>--cpu</code>
  still works and wins over <code>--gpu</code>. Vector scenes match across the two: they pass the
  same reference-frame tests within a color difference of ΔE 1, which you cannot see. The CPU
  renderer is also byte-for-byte identical between runs, which is what you want in automated tests.
  A <code>shaders::waves()</code> node is painted into an image before either backend, so the two
  show the same crest. The same goes for
  <code>lens_drops</code>, <code>ripple</code> and <code>water_wipe</code>: both renderers draw the
  vectors, and the shader runs on those pixels on the CPU. A layer whose vectors did not change is
  reused on the next frame. A scene with no effects is one vector pass;
  <code>oxframe inspect --graph</code> lists the passes.
</p>

<h2 id="container">In a container or CI</h2>
<p>
  <code>ghcr.io/oxygenframe/oxframe</code> has the oxframe command, Rust and ffmpeg, with the SDK
  already compiled, so a project's first <code>oxframe check</code> or <code>oxframe render</code>
  inside it takes seconds instead of compiling the engine. Use the tag of your project's SDK version:
</p>
<pre><code
    >{`docker run --rm -v "$PWD:/work" ghcr.io/oxygenframe/oxframe:${SDK_VERSION} oxframe render`}</code
  ></pre>
<p>In GitHub Actions, run the job in it:</p>
<pre><code
    >{`jobs:
  video:
    runs-on: ubuntu-latest
    container: ghcr.io/oxygenframe/oxframe:${SDK_VERSION}
    steps:
      - uses: actions/checkout@v4
      - run: oxframe check
      - run: oxframe render`}</code
  ></pre>

<h2>In the browser</h2>
<p>
  The playground can export MP4 too (the <strong>Export</strong> button). It encodes with your browser's
  WebCodecs, so it works offline but is limited to what the browser supports — use the CLI for ProRes,
  4K or long videos.
</p>
