<svelte:head><title>The editor — oxframe</title></svelte:head>

<h1>The editor</h1>
<p class="lead">
  A tour of the editor. It is the same app under <code>oxframe dev</code> on your machine and in the playground
  on this site.
</p>

<h2>The four areas</h2>
<dl>
  <dt>Viewport</dt>
  <dd>
    The current frame. Scroll to zoom around the cursor, hold <kbd>Alt</kbd> (or the middle button) and
    drag to pan, double-click to fit. Click a node to select it.
  </dd>
  <dt>Timeline</dt>
  <dd>
    Play, pause and scrub. Shows scene boundaries, markers and the soundtrack's waveform. Drag a
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

<h2>Shortcuts</h2>
<table>
  <tbody>
    <tr><td><kbd>Space</kbd></td><td>Play / pause</td></tr>
    <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>Previous / next frame</td></tr>
    <tr><td><kbd>Shift</kbd>+<kbd>←</kbd> <kbd>→</kbd></td><td>Jump 10 frames</td></tr>
    <tr><td><kbd>Home</kbd> <kbd>End</kbd></td><td>Start / end</td></tr>
    <tr><td><kbd>M</kbd></td><td>Move the selected marker to the playhead</td></tr>
    <tr><td><kbd>Esc</kbd></td><td>Close dialogs, dismiss errors</td></tr>
  </tbody>
</table>

<h2>Small conveniences</h2>
<ul>
  <li>
    The frame, zoom and selection are kept in the URL — a reload or rebuild returns you to the same
    spot.
  </li>
  <li>Several browser tabs can be connected to one <code>oxframe dev</code> at the same time.</li>
  <li>In the playground, <strong>Share</strong> puts the whole source into the link.</li>
</ul>
