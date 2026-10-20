import type { Backend, ConnectionStatus, Frame } from '@oxframe/backends';
import type {
  Command,
  ErrorKind,
  Event,
  MarkerInfo,
  Meta,
  NodeInfo,
  SceneInfo,
  SignalValue,
  Span,
} from '@oxframe/protocol';
import { PROTOCOL_VERSION } from '@oxframe/protocol';
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
        this.frame = e.index;
        this.savePersist();
        break;
      case 'Playback':
        this.playing = e.playing;
        this.frame = e.frame;
        break;
      case 'Timeline':
        this.frames = e.frames;
        this.markers = e.markers;
        this.scenes = e.scenes;
        if (e.audio_waveform) this.waveform = e.audio_waveform;
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
