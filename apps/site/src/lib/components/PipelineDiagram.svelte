<script lang="ts">
  // The pipeline on /docs/how-it-works, drawn in the theme colors.
</script>

<figure class="pipeline">
  <svg
    viewBox="0 0 360 470"
    role="img"
    aria-labelledby="pipeline-title pipeline-desc"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title id="pipeline-title">How oxframe turns a scene into frames</title>
    <desc id="pipeline-desc"
      >The scene's async fn is polled once per frame and updates the node tree. The tree is laid out
      and flattened into a display list, which the CPU renderer (tiny-skia) or the GPU renderer
      (vello) draws. The frames go to ffmpeg for an MP4, to the editor over a WebSocket, or to
      oxframe check for a storyboard and report.json.</desc
    >
    <defs>
      <marker
        id="pipeline-arrow"
        viewBox="0 0 8 8"
        refX="7"
        refY="4"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M0 0 L8 4 L0 8 z" class="head" />
      </marker>
    </defs>
    <g class="box">
      <rect x="60" y="8" width="240" height="56" rx="8" />
      <text x="180" y="32" class="strong">Your scene: async fn</text>
      <text x="180" y="52">polled once per frame</text>
    </g>
    <g class="box">
      <rect x="60" y="96" width="240" height="56" rx="8" />
      <text x="180" y="120" class="strong">Node tree and signals</text>
      <text x="180" y="140">animations step the values</text>
    </g>
    <g class="box">
      <rect x="60" y="184" width="240" height="56" rx="8" />
      <text x="180" y="208" class="strong">Layout → display list</text>
      <text x="180" y="228">taffy; fills, strokes, layers</text>
    </g>
    <g class="box">
      <rect x="8" y="280" width="164" height="56" rx="8" />
      <text x="90" y="304" class="strong">CPU: tiny-skia</text>
      <text x="90" y="324">reference, same bytes</text>
    </g>
    <g class="box">
      <rect x="188" y="280" width="164" height="56" rx="8" />
      <text x="270" y="304" class="strong">GPU: vello</text>
      <text x="270" y="324">wgpu, WebGPU</text>
    </g>
    <g class="box out">
      <rect x="8" y="384" width="108" height="76" rx="8" />
      <text x="62" y="410" class="strong">render</text>
      <text x="62" y="430">frames to</text>
      <text x="62" y="446">ffmpeg → MP4</text>
    </g>
    <g class="box out">
      <rect x="126" y="384" width="108" height="76" rx="8" />
      <text x="180" y="410" class="strong">dev</text>
      <text x="180" y="430">editor over</text>
      <text x="180" y="446">a WebSocket</text>
    </g>
    <g class="box out">
      <rect x="244" y="384" width="108" height="76" rx="8" />
      <text x="298" y="410" class="strong">check</text>
      <text x="298" y="430">storyboard +</text>
      <text x="298" y="446">report.json</text>
    </g>
    <g class="edge">
      <path d="M180 64 V94" marker-end="url(#pipeline-arrow)" />
      <path d="M180 152 V182" marker-end="url(#pipeline-arrow)" />
      <path d="M150 240 L100 278" marker-end="url(#pipeline-arrow)" />
      <path d="M210 240 L260 278" marker-end="url(#pipeline-arrow)" />
      <path d="M90 336 V352 M270 336 V352 M62 352 H298" />
      <path d="M62 352 V382" marker-end="url(#pipeline-arrow)" />
      <path d="M180 352 V382" marker-end="url(#pipeline-arrow)" />
      <path d="M298 352 V382" marker-end="url(#pipeline-arrow)" />
    </g>
  </svg>
  <figcaption>
    One frame: the scene steps, the tree becomes a display list, a renderer draws it, and the frame
    goes to a video, the editor or <code>oxframe check</code>.
  </figcaption>
</figure>

<style>
  .pipeline svg {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
    margin: 0 auto;
  }
  .box rect {
    fill: var(--panel);
    stroke: var(--border);
    stroke-width: 1.5;
  }
  .box.out rect {
    stroke: var(--accent);
  }
  text {
    fill: var(--muted);
    font-size: 13px;
    text-anchor: middle;
    font-family: inherit;
  }
  text.strong {
    fill: var(--text);
    font-weight: 600;
    font-size: 14px;
  }
  .edge path {
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.5;
  }
  .head {
    fill: var(--muted);
  }
  figcaption {
    margin-top: 8px;
    font-size: 0.9em;
    opacity: 0.8;
  }
  .pipeline {
    margin: 0 0 24px;
  }
</style>
