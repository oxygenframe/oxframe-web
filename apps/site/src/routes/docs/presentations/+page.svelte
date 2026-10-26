<script lang="ts">
  import LiveExample from '$lib/components/LiveExample.svelte';
</script>

<h1>Presentations</h1>
<p class="lead">
  The same scenes that render to a video become a talk: the presentation stops where you mark it and
  waits for the next click.
</p>

<LiveExample name="slides" />

<h2>Stops and notes</h2>
<pre><code
    >{`#[oxframe::scene]
pub async fn opening(view: View) {
    notes("Introduce yourself.");
    let title = view.add(TitleCard::new("Video as code"));
    title.enter().await;
    wait_for(1.5).await;
    slide_break().await;

    notes("Each point appears on the next click.");
    let points = view.add(BulletList::new(["Scenes are async Rust", "Every value is a signal"]));
    points.enter().await;
    for _ in 0..2 {
        points.next().await;
        wait_for(1.5).await;
        slide_break().await;
    }
}`}</code
  ></pre>
<p>
  <code>slide_break().await</code> marks a stop. A render plays straight through it, so the project
  is still a video; the presentation pauses there. The last frame of every scene is a stop too, and
  a break at the very end of a scene is the same stop. <code>notes("…")</code> are speaker notes for the
  part that ends at the next stop; several calls before one stop are joined.
</p>
<p>
  Hold before each break with <code>wait_for</code>. The video plays straight through the stops, and
  without a hold the text is gone before anyone reads it — <code>oxframe check</code> reports that
  as
  <code>too_fast</code>. In the presentation the hold is a still frame just before the stop, so
  nobody sees it.
</p>

<h2>Presenting</h2>
<pre><code>oxframe present</code></pre>
<p>
  <code>oxframe present</code> builds the project and opens it full screen in the browser, without the
  editor around it. → , space, Page Down and a click go to the next stop: the scene plays up to it and
  stops. Pressed while it plays, the next key jumps straight to the stop. ← and Page Up go back one stop,
  Home to the start. Slide clickers send these keys, so they work as they are. F toggles full screen.
</p>
<p>
  N opens the presenter window: the notes for the current part and the next one, the stop number and
  a timer. Put it on your laptop screen and the presentation on the projector; its keys and buttons
  move the presentation as well. Going back is safe even with <code>spawn</code> and random values: the
  state of a scene depends only on its frame.
</p>
<p>
  The presentation is the live project: saving a source file rebuilds it, as in
  <code>oxframe dev</code>. The playground on this site plays the scenes straight through.
</p>

<h2>Slides as a PDF</h2>
<pre><code>oxframe render --slides talk.pdf</code></pre>
<p>
  <code>render --slides talk.pdf</code> writes one page per stop, the frame the presentation shows
  there, for handouts or a fallback. It needs no ffmpeg; <code>--size</code> and <code>--gpu</code>
  work as for a video.
</p>
