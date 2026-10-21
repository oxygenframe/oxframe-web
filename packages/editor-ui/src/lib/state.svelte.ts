import type { Backend, ConnectionStatus, Frame } from '@oxframe/backends';
import type {
  AudioClipInfo,
  Command,
  ErrorKind,
  Event,
  MarkerInfo,
  Meta,
  NodeInfo,
  SceneInfo,
  SignalValue,
  SlideInfo,
  Span,
} from '@oxframe/protocol';
import { PROTOCOL_VERSION } from '@oxframe/protocol';
import {
  fileName,
  hostedAudioUrl,
  loadHostedWav,
  mixHosted,
  waveformPeaks,
  MIX_RATE,
  type MixClip,
} from './audio';
import * as persist from './persist';

export interface EditorError {
  kind: ErrorKind;
  message: string;
  spans: Span[];
}

export interface EditorOptions {
  /** Persist view state in the URL hash and sessionStorage (default true). */
  persist?: boolean;
  uiVersion?: string;
}

/**
 * All editor state, driven by protocol events. Components read it and call
 * its actions; nothing else talks to the backend.
 */
export class EditorState {
  connection = $state<ConnectionStatus>({ state: 'connecting' });
  ready = $state(false);
  engineVersion = $state('');
  fps = $state(60);
  size = $state<[number, number]>([1920, 1080]);
  frames = $state(0);
  frame = $state(0);
  playing = $state(false);
  scenes = $state<SceneInfo[]>([]);
  markers = $state<MarkerInfo[]>([]);
  waveform = $state.raw<number[] | null>(null);
  clips = $state<AudioClipInfo[]>([]);
  /** Stops for presentation mode (`slide_break` and scene ends). */
  slides = $state<SlideInfo[]>([]);
  metas = $state<Record<string, Meta>>({});
  tree = $state<NodeInfo[]>([]);
  selected = $state<number | null>(null);
  signals = $state<SignalValue[]>([]);
  bounds = $state<number[] | null>(null);
  building = $state(false);
  reloadedAt = $state(0);
  error = $state<EditorError | null>(null);
  image = $state.raw<ImageBitmap | null>(null);
  imageFrame = $state(-1);

  // View
  zoom = $state(1);
  panX = $state(0);
  panY = $state(0);
  showAxes = $state(true);
  viewport = { w: 0, h: 0 };
  selectedMarker = $state<{ scene: string; name: string } | null>(null);
  editingEase = $state<{ scene: string; name: string } | null>(null);

  private restoredFrame: number | null = null;
  private readonly persistEnabled: boolean;
  private readonly uiVersion: string;
  private pcm: { rate: number; samples: Float32Array } | null = null;
  /** True once the engine streamed a mix. Hosted files must not play over it. */
  private pcmFromEngine = false;
  private audioGen = 0;
  private audioCtx: AudioContext | null = null;
  private audioNode: AudioBufferSourceNode | null = null;

  constructor(
    readonly backend: Backend,
    opts: EditorOptions = {},
  ) {
    this.persistEnabled = opts.persist ?? true;
    this.uiVersion = opts.uiVersion ?? '0.1.0';
    if (this.persistEnabled) {
      const v = persist.load();
      this.restoredFrame = v.frame ?? null;
      this.zoom = v.zoom ?? 1;
      this.panX = v.panX ?? 0;
      this.panY = v.panY ?? 0;
      this.selected = v.selected ?? null;
    }
  }

  start(): void {
    this.backend.connect({
      event: (e) => this.handle(e),
      frame: (f) => this.onFrame(f),
      status: (s) => this.onStatus(s),
      audio: (clip) => this.onPcm(clip),
    });
  }

  stop(): void {
    this.backend.close();
  }

  send(cmd: Command): void {
    this.backend.send(cmd);
  }

  // ------------------------------------------------------------- events

  private onStatus(s: ConnectionStatus): void {
    this.connection = s;
    if (s.state === 'open') {
      this.send({ type: 'Hello', protocol_version: PROTOCOL_VERSION, ui_version: this.uiVersion });
    } else {
      this.ready = false;
      this.playing = false;
      this.stopAudio();
    }
  }

  private onFrame(f: Frame): void {
    this.image?.close?.();
    this.image = f.image;
    this.imageFrame = f.header.frame;
  }

  handle(e: Event): void {
    switch (e.type) {
      case 'Ready':
        this.ready = true;
        this.engineVersion = e.engine_version;
        this.fps = e.fps;
        this.size = e.size;
        this.scenes = e.scenes;
        this.building = false;
        if (this.error?.kind === 'Incompatible') this.error = null;
        this.resync();
        break;
      case 'Reloaded':
        this.reloadedAt = Date.now();
        this.building = false;
        this.error = null;
        this.stopAudio();
        this.pcm = null;
        this.pcmFromEngine = false;
        this.audioGen++;
        this.waveform = null;
        this.clips = [];
        this.resync();
        break;
      case 'Building':
        this.building = true;
        break;
      case 'Error':
        this.building = false;
        this.error = { kind: e.kind, message: e.message, spans: e.spans ?? [] };
        break;
      case 'Frame':
        if (this.playing && e.index < this.frame) this.startAudio(e.index);
        this.frame = e.index;
        this.savePersist();
        break;
      case 'Playback':
        this.playing = e.playing;
        this.frame = e.frame;
        if (e.playing) this.startAudio(e.frame);
        else this.stopAudio();
        break;
      case 'Timeline':
        this.frames = e.frames;
        this.markers = e.markers;
        this.scenes = e.scenes;
        this.clips = e.audio_clips ?? [];
        this.slides = e.slides ?? [];
        if (e.audio_waveform) this.waveform = e.audio_waveform;
        void this.loadHostedAudio();
        break;
      case 'Tree':
        this.tree = e.nodes;
        break;
      case 'Signals':
        if (e.node_id === this.selected) {
          this.signals = e.values;
          this.bounds = e.bounds ?? null;
        }
        break;
      case 'Selected':
        this.selected = e.node_id;
        if (e.node_id === null) {
          this.signals = [];
          this.bounds = null;
        }
        this.savePersist();
        break;
      case 'MetaChanged':
        this.metas = { ...this.metas, [e.scene]: e.meta };
        if (this.error?.kind === 'Meta') this.error = null;
        void this.loadHostedAudio();
        break;
    }
  }

  /** After (re)connecting to an engine: restore viewport, frame, selection. */
  private resync(): void {
    if (this.viewport.w > 0) this.sendViewport();
    const target = this.restoredFrame ?? this.frame;
    this.restoredFrame = null;
    this.frame = target;
    this.send({ type: 'Seek', frame: target });
    if (this.selected !== null) this.send({ type: 'Select', node_id: this.selected });
  }

  /**
   * Playhead to the start. A later reconnect (a new example's engine) stays
   * there even if a frame from the previous scene arrives first.
   */
  restart(): void {
    this.pause();
    this.playing = false;
    this.restoredFrame = 0;
    this.seek(0);
    this.savePersist();
  }

  // ------------------------------------------------------------ actions

  get lastFrame(): number {
    return Math.max(0, this.frames - 1);
  }

  seek(frame: number): void {
    const f = Math.max(0, Math.min(this.lastFrame, Math.round(frame)));
    this.frame = f;
    this.send({ type: 'Seek', frame: f });
    if (this.playing) this.startAudio(f);
  }

  private onPcm(clip: { rate: number; pcm: ArrayBuffer }): void {
    const view = new Int16Array(clip.pcm);
    const samples = new Float32Array(view.length);
    for (let i = 0; i < view.length; i++) samples[i] = (view[i] ?? 0) / 32768;
    this.pcmFromEngine = true;
    this.audioGen++;
    this.pcm = { rate: clip.rate, samples };
    if (this.playing) this.startAudio(this.frame);
  }

  /**
   * The wasm preview cannot open example wavs. When the engine sent no mix,
   * fetch `/audio/<filename>` and play those clips (and the soundtrack in
   * scene meta) on the same clock as the timeline.
   */
  private async loadHostedAudio(): Promise<void> {
    if (this.pcmFromEngine || this.frames <= 0 || typeof fetch !== 'function') return;
    const plan = this.hostedPlan();
    if (plan.length === 0) return;
    const gen = ++this.audioGen;
    const decoded = new Map<string, { rate: number; samples: Float32Array }>();
    for (const item of plan) {
      const url = hostedAudioUrl(item.file);
      if (!url || decoded.has(url)) continue;
      const pcm = await loadHostedWav(url);
      if (pcm) decoded.set(url, pcm);
    }
    if (gen !== this.audioGen || this.pcmFromEngine) return;
    const clips: MixClip[] = [];
    for (const item of plan) {
      const pcm = decoded.get(hostedAudioUrl(item.file) ?? '');
      if (!pcm) continue;
      clips.push({
        samples: pcm.samples,
        rate: pcm.rate,
        start: item.start,
        seconds: item.seconds,
        music: item.music,
        priority: item.priority,
      });
    }
    if (clips.length === 0) return;
    const seconds = this.frames / Math.max(1, this.fps);
    const samples = mixHosted(clips, seconds);
    this.pcm = { rate: MIX_RATE, samples };
    if (!this.waveform || this.waveform.length === 0) {
      this.waveform = waveformPeaks(samples, Math.min(this.frames, 4096));
    }
    if (this.playing) this.startAudio(this.frame);
  }

  private hostedPlan(): {
    file: string;
    start: number;
    seconds: number;
    music: boolean;
    priority: boolean;
  }[] {
    const plan: {
      file: string;
      start: number;
      seconds: number;
      music: boolean;
      priority: boolean;
    }[] = [];
    const music = new Set<string>();
    for (const meta of Object.values(this.metas)) {
      const file = meta.audio?.file;
      if (!file) continue;
      const name = fileName(file);
      if (music.has(name)) continue;
      music.add(name);
      plan.push({ file, start: meta.audio?.offset ?? 0, seconds: 0, music: true, priority: false });
    }
    for (const clip of this.clips) {
      if (clip.text) continue;
      plan.push({
        file: clip.name,
        start: clip.start,
        seconds: clip.seconds,
        music: false,
        priority: clip.priority,
      });
    }
    return plan;
  }

  private startAudio(frame: number): void {
    this.stopAudio();
    const pcm = this.pcm;
    if (!pcm || pcm.samples.length === 0 || typeof AudioContext === 'undefined') return;
    this.audioCtx ??= new AudioContext();
    const buffer = this.audioCtx.createBuffer(1, pcm.samples.length, pcm.rate);
    buffer.getChannelData(0).set(pcm.samples);
    const node = this.audioCtx.createBufferSource();
    node.buffer = buffer;
    node.connect(this.audioCtx.destination);
    const offset = Math.max(0, Math.min(buffer.duration, frame / Math.max(1, this.fps)));
    node.start(0, offset);
    this.audioNode = node;
  }

  private stopAudio(): void {
    const node = this.audioNode;
    this.audioNode = null;
    if (!node) return;
    try {
      node.stop();
    } catch {
      // Already stopped.
    }
  }

  play(): void {
    this.send({ type: 'Play' });
  }

  pause(): void {
    this.send({ type: 'Pause' });
  }

  togglePlay(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  step(delta: number): void {
    this.send({ type: 'Step', delta });
  }

  setViewport(w: number, h: number): void {
    this.viewport = { w, h };
    this.sendViewport();
  }

  private sendViewport(): void {
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    // Zooming in requests a sharper frame (the engine caps at project size).
    this.send({
      type: 'SetViewport',
      w: Math.max(1, Math.round(this.viewport.w * this.zoom)),
      h: Math.max(1, Math.round(this.viewport.h * this.zoom)),
      dpr,
    });
  }

  setZoom(zoom: number, panX = this.panX, panY = this.panY): void {
    const z = Math.max(0.1, Math.min(16, zoom));
    const changed = Math.abs(z - this.zoom) > 1e-6;
    this.zoom = z;
    this.panX = panX;
    this.panY = panY;
    if (changed && this.viewport.w > 0) this.sendViewport();
    this.savePersist();
  }

  resetView(): void {
    this.setZoom(1, 0, 0);
  }

  /** Scene start in seconds. */
  sceneStart(scene: string): number {
    const s = this.scenes.find((x) => x.name === scene);
    return s ? s.start / this.fps : 0;
  }

  sceneAt(frame: number): SceneInfo | undefined {
    return [...this.scenes].reverse().find((s) => s.start <= frame) ?? this.scenes[0];
  }

  /** Global frame of a marker. */
  markerFrame(m: MarkerInfo): number {
    return Math.round((this.sceneStart(m.scene) + m.time) * this.fps);
  }

  moveMarker(scene: string, name: string, globalFrame: number): void {
    const local = Math.max(0, globalFrame / this.fps - this.sceneStart(scene));
    this.send({ type: 'SetMarker', name, time: Number(local.toFixed(6)), scene });
  }

  /** M: move the selected marker to the playhead, or add a new one there. */
  markerAtPlayhead(): void {
    const scene = this.sceneAt(this.frame);
    if (!scene) return;
    if (this.selectedMarker) {
      this.moveMarker(this.selectedMarker.scene, this.selectedMarker.name, this.frame);
      return;
    }
    const taken = new Set(this.markers.filter((m) => m.scene === scene.name).map((m) => m.name));
    let i = 1;
    while (taken.has(`marker-${i}`)) i += 1;
    const name = `marker-${i}`;
    this.moveMarker(scene.name, name, this.frame);
    this.selectedMarker = { scene: scene.name, name };
  }

  setEase(name: string, value: [number, number, number, number]): void {
    this.send({ type: 'SetEase', name, value });
  }

  setTunable(name: string, value: number): void {
    this.send({ type: 'SetTunable', name, value });
  }

  /** Blend length into `scene`, in seconds. Zero removes it. */
  setTransition(scene: string, seconds: number): void {
    this.send({ type: 'SetTransition', scene, seconds: Number(Math.max(0, seconds).toFixed(6)) });
  }

  /** Click in the viewport, in frame pixels of the project size. */
  pick(x: number, y: number): void {
    this.send({ type: 'Pick', x, y });
  }

  select(id: number | null): void {
    this.selected = id;
    this.send({ type: 'Select', node_id: id });
  }

  dismissError(): void {
    this.error = null;
  }

  private savePersist(): void {
    if (!this.persistEnabled) return;
    persist.save({
      frame: this.frame,
      zoom: this.zoom,
      panX: this.panX,
      panY: this.panY,
      selected: this.selected,
    });
  }
}

export function formatTime(frame: number, fps: number): string {
  const total = frame / Math.max(1, fps);
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const f = frame % Math.max(1, fps);
  return `${m}:${String(s).padStart(2, '0')}.${String(f).padStart(2, '0')}`;
}
