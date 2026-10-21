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
  fails it too, with the line in your source. A custom <code>shade</code> is type-checked on every draw.
  The waves preset is what gets painted.
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
  A shader can only read finished pixels. <code>lens_drops</code> or an effect inside a group with
  opacity below 1, a blur, a clip, a blend, a shadow or another effect fails
  <code>oxframe check</code> with <code>input_cycle</code>, and the shader is skipped. Put the
  effect on that group instead. <code>oxframe inspect --graph</code> lists these shaders as
  <code>effect</code> passes, and a <code>Shader</code> handle works wherever a <code>Node</code>
  does, for example in <code>Camera::center_on</code>.
</p>
<p>
  Not there yet: <code>Input::node</code> (another node as a texture), <code>Input::image</code>
  (a texture file), <code>.offscreen()</code>, and running your own <code>shade</code>, which is
  still only checked.
</p>

<h2>Sound</h2>
<p>
  A soundtrack plays for the whole video. <code>Project::audio("music.mp3")</code> still works, and
  it is the same as <code>Audio::track</code>:
</p>
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

<h2>Voice</h2>
<p>
  <code>voice("one two").start()</code> speaks the line and keeps going. <code>.at_word()</code>
  waits until that word. Awaiting the line waits until the end. A line is <code>.priority()</code>,
  so it ducks a soundtrack built with <code>.duck_under_voice()</code>.
</p>
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

<h2>GPU or CPU?</h2>
<p>
  By default frames are drawn on the GPU (vello) and fall back to the CPU (tiny-skia) when no GPU is
  available. Vector scenes match across the two: they pass the same reference-frame tests within a
  color difference of ΔE 1, which you cannot see. The CPU renderer is also byte-for-byte identical
  between runs, which is what you want in automated tests. A <code>shaders::waves()</code> node is
  painted into an image before either backend, so the two show the same crest. The same goes for
  <code>lens_drops</code>, <code>ripple</code> and <code>water_wipe</code>: both renderers draw the
  vectors, and the shader runs on those pixels on the CPU. A layer whose vectors did not change is
  reused on the next frame. A scene with no effects is one vector pass;
  <code>oxframe inspect --graph</code> lists the passes.
</p>

<h2>In the browser</h2>
<p>
  The playground can export MP4 too (the <strong>Export</strong> button). It encodes with your browser's
  WebCodecs, so it works offline but is limited to what the browser supports — use the CLI for ProRes,
  4K or long videos.
</p>
