import type { Command, Event, Meta } from '@oxframe/protocol';
import { PROTOCOL_VERSION } from '@oxframe/protocol';
import type { Backend, BackendHandlers, Frame } from './types';

/**
 * An in-browser fake engine for editor tests and demos: 2 scenes, 4 s at
 * 30 fps, a moving square, markers, eases and tunables. Frames are drawn on
 * an OffscreenCanvas showing the frame number.
 */
export class MockBackend implements Backend {
  readonly kind = 'mock' as const;
  private h: BackendHandlers | null = null;
  private frame = 0;
  private playing: number | null = null;
  private viewport = { w: 640, h: 360 };
  private selected: number | null = null;
  readonly sent: Command[] = [];
  /** Review notes, as `oxframe dev` keeps them (out/notes/notes.json). */
  notes: Record<string, unknown>[] = [];
  readonly fps = 30;
  readonly size: [number, number] = [1920, 1080];
  readonly scenes = [
    { name: 'intro', start: 0, frames: 60, transition: 0, transition_at: 0 },
    { name: 'outro', start: 60, frames: 60, transition: 0, transition_at: 0 },
  ];
  metas: Record<string, Meta> = {
    intro: {
      version: 1,
      markers: { beat: 1.0 },
      eases: { slide: [0.65, 0, 0.35, 1] },
      tunables: { speed: 1.5 },
    },
    outro: { version: 1, markers: { fade: 0.5 }, eases: {}, tunables: {} },
  };

  get total(): number {
    return 120;
  }

  connect(h: BackendHandlers): void {
    this.h = h;
    h.status({ state: 'connecting' });
    queueMicrotask(() => {
      h.status({ state: 'open' });
      this.emitNotes();
    });
  }

  private emit(e: Event): void {
    this.h?.event(e);
  }

  /** The CLI's handling of the editor's review notes. */
  private noteEdit(m: Record<string, unknown>): boolean {
    if (m.type === 'NoteAdd') {
      const id = this.notes.reduce((a, n) => Math.max(a, n.id as number), 0) + 1;
      const { crop_png, ...rest } = m;
      delete rest.type;
      this.notes.push({
        ...rest,
        id,
        status: 'open',
        crop: crop_png ? `${id}.png` : undefined,
        created: 0,
      });
    } else if (m.type === 'NoteSet') {
      const n = this.notes.find((n) => n.id === m.id);
      if (n && m.status) {
        n.status = m.status;
        delete n.taken;
      }
    } else if (m.type === 'NoteDelete') {
      this.notes = this.notes.filter((n) => n.id !== m.id);
    } else {
      return false;
    }
    this.emitNotes();
    return true;
  }

  private emitNotes(): void {
    this.emit({ type: 'Notes', notes: this.notes } as unknown as Event);
  }

  /** Simulate CLI-side events (Building, Error, Reloaded) in tests. */
  inject(e: Event): void {
    this.emit(e);
  }

  private markers() {
    return Object.entries(this.metas).flatMap(([scene, m]) =>
      Object.entries(m.markers ?? {}).map(([name, time]) => ({
        scene,
        name,
        time: time as number,
      })),
    );
  }

  private timeline(): void {
    this.emit({
      type: 'Timeline',
      frames: this.total,
      markers: this.markers(),
      scenes: this.scenes,
      audio_waveform: Array.from({ length: 240 }, (_, i) => Math.abs(Math.sin(i / 7)) * 0.8),
      // A slide_break at 1 s in intro, then the end of each scene.
      slides: [
        { scene: 'intro', frame: 30, notes: 'Say hello.' },
        { scene: 'intro', frame: 59, notes: 'The square moves.' },
        { scene: 'outro', frame: 119, notes: '' },
      ],
    });
  }

  private squareX(f: number): number {
    return 200 + (f / this.total) * 1400;
  }

  private async show(): Promise<void> {
    const f = this.frame;
    this.emit({ type: 'Frame', index: f });
    const [W, H] = this.size;
    const k = Math.min(this.viewport.w / W, this.viewport.h / H, 1);
    const w = Math.max(1, Math.round(W * k));
    const hh = Math.max(1, Math.round(H * k));
    let image: ImageBitmap | null = null;
    if (typeof OffscreenCanvas !== 'undefined') {
      const c = new OffscreenCanvas(w, hh);
      const g = c.getContext('2d')!;
      g.fillStyle = '#141414';
      g.fillRect(0, 0, w, hh);
      g.fillStyle = '#e13238';
      g.fillRect((this.squareX(f) - 100) * k, (540 - 100) * k, 200 * k, 200 * k);
      g.fillStyle = '#fff';
      g.font = `${Math.round(48 * k)}px sans-serif`;
      g.fillText(`frame ${f}`, 40 * k, 80 * k);
      image = c.transferToImageBitmap();
    }
    if (image) {
      const frame: Frame = {
        header: { frame: f, width: w, height: hh, format: 3, len: w * hh * 4 },
        image,
      };
      this.h?.frame(frame);
    }
    if (this.selected !== null) {
      const x = this.squareX(f);
      this.emit({
        type: 'Signals',
        node_id: this.selected,
        values: [
          { name: 'x', value: (x - 960).toFixed(3) },
          { name: 'y', value: '0.000' },
          { name: 'fill', value: '#e13238ff' },
        ],
        bounds: [x - 100, 440, x + 100, 440, x + 100, 640, x - 100, 640],
      });
    }
  }

  send(cmd: Command): void {
    this.sent.push(cmd);
    if (this.noteEdit(cmd as unknown as Record<string, unknown>)) return;
    switch (cmd.type) {
      case 'Hello':
        if (cmd.protocol_version !== PROTOCOL_VERSION) {
          this.emit({
            type: 'Error',
            kind: 'Incompatible',
            message: 'protocol mismatch',
            spans: [],
          });
          return;
        }
        this.emit({
          type: 'Ready',
          protocol_version: PROTOCOL_VERSION,
          engine_version: 'mock',
          fps: this.fps,
          size: this.size,
          scenes: this.scenes,
        });
        for (const [scene, meta] of Object.entries(this.metas))
          this.emit({ type: 'MetaChanged', scene, meta });
        this.timeline();
        this.emit({
          type: 'Tree',
          nodes: [
            { id: 0, parent: null, kind: 'Group', name: 'view' },
            { id: 1, parent: 0, kind: 'Rect', name: 'square' },
          ],
        });
        void this.show();
        break;
      case 'Seek':
        this.frame = Math.max(0, Math.min(this.total - 1, cmd.frame));
        void this.show();
        break;
      case 'Step':
        this.stopPlayback();
        this.frame = Math.max(0, Math.min(this.total - 1, this.frame + cmd.delta));
        this.emit({ type: 'Playback', playing: false, frame: this.frame });
        void this.show();
        break;
      case 'Play':
        this.stopPlayback();
        this.emit({ type: 'Playback', playing: true, frame: this.frame });
        this.playing = setInterval(() => {
          this.frame = (this.frame + 1) % this.total;
          void this.show();
        }, 1000 / this.fps) as unknown as number;
        break;
      case 'Pause':
        this.stopPlayback();
        this.emit({ type: 'Playback', playing: false, frame: this.frame });
        break;
      case 'SetViewport':
        this.viewport = { w: cmd.w * cmd.dpr, h: cmd.h * cmd.dpr };
        void this.show();
        break;
      case 'SetMarker': {
        const scene =
          cmd.scene ??
          Object.keys(this.metas).find((s) => cmd.name in (this.metas[s]?.markers ?? {}));
        const meta = scene ? this.metas[scene] : undefined;
        if (!scene || !meta) {
          this.emit({
            type: 'Error',
            kind: 'Meta',
            message: `no marker named \`${cmd.name}\``,
            spans: [],
          });
          return;
        }
        meta.markers = { ...meta.markers, [cmd.name]: cmd.time };
        this.emit({ type: 'MetaChanged', scene, meta });
        this.timeline();
        void this.show();
        break;
      }
      case 'SetEase':
      case 'SetTunable': {
        const meta = this.metas.intro!;
        if (cmd.type === 'SetEase') meta.eases = { ...meta.eases, [cmd.name]: cmd.value };
        else meta.tunables = { ...meta.tunables, [cmd.name]: cmd.value };
        this.emit({ type: 'MetaChanged', scene: 'intro', meta });
        void this.show();
        break;
      }
      case 'Pick': {
        const x = this.squareX(this.frame);
        const hit = Math.abs(cmd.x - x) <= 100 && Math.abs(cmd.y - 540) <= 100;
        this.selected = hit ? 1 : null;
        this.emit({ type: 'Selected', node_id: this.selected });
        void this.show();
        break;
      }
      case 'Select':
        this.selected = cmd.node_id ?? null;
        this.emit({ type: 'Selected', node_id: this.selected });
        void this.show();
        break;
      case 'SetTransition': {
        const scene = this.scenes.find((s) => s.name === cmd.scene);
        if (!scene) {
          this.emit({
            type: 'Error',
            kind: 'Meta',
            message: `no scene named \`${cmd.scene}\``,
            spans: [],
          });
          return;
        }
        scene.transition = Math.max(0, Math.round(cmd.seconds * this.fps));
        this.timeline();
        void this.show();
        break;
      }
      case 'Shutdown':
        break;
    }
  }

  private stopPlayback(): void {
    if (this.playing !== null) clearInterval(this.playing);
    this.playing = null;
  }

  close(): void {
    this.stopPlayback();
    this.h?.status({ state: 'closed', reason: 'closed' });
  }
}
