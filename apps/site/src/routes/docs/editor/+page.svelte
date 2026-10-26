<h1>The editor</h1>
<p class="lead">
  A tour of the editor. It is the same app under <code>oxframe dev</code> on your machine and in the playground
  on this site.
</p>

<figure>
  <img
    src="/images/editor.png"
    width="1440"
    height="900"
    alt="The oxframe editor on a new project: the frame with a blue circle and the text Hello, hello in the middle, the selected Txt node's signals in the inspector on the right, and the timeline with the hello marker at the bottom"
  />
  <figcaption>
    The viewport, the inspector on the right and the timeline below, on the project <code
      >oxframe init</code
    > creates.
  </figcaption>
</figure>

<h2>The four areas</h2>
<dl>
  <dt>Viewport</dt>
  <dd>
    The current frame. Scroll to zoom around the cursor, hold <kbd>Alt</kbd> (or the middle button) and
    drag to pan, double-click to fit. Click a node to select it. The round button in the middle plays
    and pauses.
  </dd>
  <dt>Timeline</dt>
  <dd>
    Play, pause and scrub: dragging the playhead during playback holds it until you let go, then it
    plays on from there. Shows scene boundaries, markers and the soundtrack's waveform. Drag a
    marker to retime everything that waits for it.
  </dd>
  <dt>Inspector</dt>
  <dd>
    The node tree, the live values of the selected node's signals, sliders for <code>tune!</code>
    values and the list of named eases.
  </dd>
  <dt>Curve editor</dt>
  <dd>
    Opens when you click an ease. Drag the two handles or pick a preset; a dot previews the motion.
  </dd>
</dl>

<h2>When code does not compile</h2>
<p>
  The compiler's message appears over the viewport with the file and line. The last build that
  worked keeps playing, so you never lose your place. Fix the code and save — the error goes away by
  itself.
</p>
<p>
  In the <a href="/playground">playground</a> there is no saving: it rebuilds half a second after
  you stop typing (or at once with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd>), and compile
  errors are listed under the code and underlined in it.
</p>

<h2 id="review-notes">Notes for the agent</h2>
<p>
  Under <code>oxframe dev</code>, press <strong>Comment</strong> (or <kbd>C</kbd>) to tell your
  coding agent what to change, in the frame where you see it. Click a node to mark it, or drag out
  an area; write what should change and press <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd>. A note
  belongs to the time of the playhead; <strong>Until playhead</strong> stretches it to a span (move the
  playhead first).
</p>
<p>
  The notes are saved in <code>out/notes/</code> with a close-up of the marked area. An agent that
  keeps <code>oxframe notes wait</code> running in the background (the generated
  <code>AGENTS.md</code> asks it to) gets each new note at once; the note then says
  <strong>agent is on it</strong>. If the agent asks a question in its reply, answer by editing the
  scene or writing a new note, or press <strong>Send back</strong>. In Claude Code, open notes are
  also shown with every prompt you send (a hook from <code>oxframe init</code>). The next
  <code>oxframe check</code> reports each open note first, as a <code>review_note</code> error with
  your words, the time, the node and its <code>file:line</code>, so the agent sees it with the rest
  of the report and the check fails until it is dealt with. The agent closes a note with
  <code>oxframe notes done 3 --reply "Title is 128 px now"</code> (or the MCP tool
  <code>note_done</code>; <code>take</code> and <code>note_take</code> mark it as being worked on);
  the reply shows under the note in the editor, which you can reopen.
  <code>oxframe notes</code> lists the open ones.
</p>
<pre><code
    >error[review_note] #3 at 4.20s title src/main.rs:18: The title should stay a second longer</code
  ></pre>
<p>
  The node's <code>file:line</code> is the call that added it, which the engine sends with the scene
  tree (<code>NodeInfo::source</code> in the protocol, so another editor can use it too). The playground
  has no notes: there is no project on disk to keep them in.
</p>

<h2>Shortcuts</h2>
<table>
  <tbody>
    <tr><td><kbd>Space</kbd></td><td>Play / pause</td></tr>
    <tr
      ><td><kbd>←</kbd> <kbd>→</kbd></td><td
        >Back / forward 5 seconds (<kbd>Shift</kbd>: 1 second); playback goes on</td
      ></tr
    >
    <tr
      ><td><kbd>,</kbd> <kbd>.</kbd></td><td
        >Previous / next frame (<kbd>&lt;</kbd> <kbd>&gt;</kbd>: 10 frames); pauses</td
      ></tr
    >
    <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>Start / end</td></tr>
    <tr
      ><td><kbd>C</kbd></td><td
        >Comment mode: mark a node or an area and write a note for the agent (<code
          >oxframe dev</code
        >)</td
      ></tr
    >
    <tr
      ><td><kbd>M</kbd></td><td
        >Move the selected marker to the playhead, or add a new marker there</td
      ></tr
    >
    <tr
      ><td><kbd>←</kbd> <kbd>→</kbd> on a focused marker</td><td
        >Move the marker a frame (<kbd>Shift</kbd>: 10 frames); <kbd>Enter</kbd> jumps to it</td
      ></tr
    >
    <tr
      ><td><kbd>Esc</kbd></td><td
        >Drop the note being written, leave comment mode, close the curve editor, dismiss an error,
        deselect the marker</td
      ></tr
    >
    <tr><td><kbd>Ctrl</kbd>/<kbd>⌘</kbd>+<kbd>Enter</kbd></td><td>Build now (playground)</td></tr>
  </tbody>
</table>

<h2>Small conveniences</h2>
<ul>
  <li>
    The frame, zoom and selection are kept in the URL, so a link opens at the same spot. Reloading
    the page starts from the beginning, and so does a rebuild, at most every 15 seconds: while you
    edit quickly, the playhead stays where it is.
  </li>
  <li>Several browser tabs can be connected to one <code>oxframe dev</code> at the same time.</li>
  <li>In the playground, <strong>Share</strong> puts the whole source into the link.</li>
</ul>

<style>
  figure {
    margin: 0 0 24px;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;
  }
  figcaption {
    margin-top: 8px;
    font-size: 0.9em;
    opacity: 0.8;
  }
</style>
