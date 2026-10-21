import type { SlideInfo } from '@oxframe/protocol';
import type { EditorState } from './state.svelte';

/** What the presenter window needs, sent over a BroadcastChannel. */
export interface PresentStatus {
  /** Stop the presentation is at or heading to; -1 before the first. */
  index: number;
  total: number;
  /** Notes of the part that ends at the next stop. */
  notes: string;
  /** Notes of the part after that. */
  nextNotes: string;
  playing: boolean;
}

export type PresentMessage =
  | { type: 'status'; status: PresentStatus }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'first' }
  | { type: 'hello' };

export const PRESENT_CHANNEL = 'oxframe-present';

/**
 * Presentation mode over an editor: `next` plays to the following stop and
 * pauses there, `prev` goes back to the previous stop. Stops come from the
 * engine (`slide_break` and the end of every scene). The scene's state is a
 * function of the frame, so going back never leaves stale state.
 */
export class Presentation {
  /** Index of the stop shown, or -1 at the start before the first stop. */
  index = $state(-1);
  /** Frame the playback stops at, while playing to a stop. */
  private target: number | null = null;
  private channel: BroadcastChannel | null = null;

  constructor(readonly editor: EditorState) {}

  /**
   * The engine's stops. An engine older than slide support sends none; the
   * end of every scene is a stop then.
   */
  get stops(): SlideInfo[] {
    if (this.editor.slides.length > 0) return this.editor.slides;
    return this.editor.scenes
      .filter((s) => s.frames > 0)
      .map((s) => ({ scene: s.name, frame: s.start + s.frames - 1, notes: '' }));
  }

  get total(): number {
    return this.stops.length;
  }

  /** Frame of stop `i`; frame 0 before the first. */
  private frameOf(i: number): number {
    return i < 0 ? 0 : (this.stops[i]?.frame ?? this.editor.lastFrame);
  }

  /** Plays to the next stop, or lands on it at once if already playing. */
  next(): void {
    if (this.target !== null) {
      this.land(this.target);
      return;
    }
    if (this.index + 1 >= this.total) return;
    this.index += 1;
    const frame = this.frameOf(this.index);
    if (frame <= this.editor.frame) {
      this.land(frame);
      return;
    }
    this.target = frame;
    this.editor.play();
    this.broadcast();
  }

  /** Back to the previous stop, without playing. */
  prev(): void {
    this.target = null;
    this.index = Math.max(-1, this.index - 1);
    this.editor.pause();
    this.editor.seek(this.frameOf(this.index));
    this.broadcast();
  }

  /** Back to the beginning. */
  first(): void {
    this.target = null;
    this.index = -1;
    this.editor.pause();
    this.editor.seek(0);
    this.broadcast();
  }

  /** Called for every frame shown: stops playback at the target stop. */
  onFrame(frame: number): void {
    if (this.target !== null && frame >= this.target) this.land(this.target);
  }

  private land(frame: number): void {
    this.target = null;
    this.editor.pause();
    this.editor.seek(frame);
    this.broadcast();
  }

  status(): PresentStatus {
    const notesOf = (i: number) => this.stops[i]?.notes ?? '';
    // While at stop i, the part being presented next ends at stop i + 1.
    const upcoming = this.target !== null ? this.index : this.index + 1;
    return {
      index: this.index,
      total: this.total,
      notes: notesOf(upcoming),
      nextNotes: notesOf(upcoming + 1),
      playing: this.target !== null,
    };
  }

  /** Listens for the presenter window and answers it with the status. */
  connect(): () => void {
    if (typeof BroadcastChannel === 'undefined') return () => {};
    const channel = new BroadcastChannel(PRESENT_CHANNEL);
    this.channel = channel;
    channel.onmessage = (e: MessageEvent<PresentMessage>) => {
      const m = e.data;
      if (m.type === 'next') this.next();
      else if (m.type === 'prev') this.prev();
      else if (m.type === 'first') this.first();
      else if (m.type === 'hello') this.broadcast();
    };
    return () => {
      channel.close();
      this.channel = null;
    };
  }

  broadcast(): void {
    this.channel?.postMessage({ type: 'status', status: this.status() } satisfies PresentMessage);
  }
}

/** Keys a slide clicker or a keyboard sends, mapped to an action. */
export function presentKey(key: string): 'next' | 'prev' | 'first' | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
    case 'Enter':
      return 'next';
    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
    case 'Backspace':
      return 'prev';
    case 'Home':
      return 'first';
    default:
      return null;
  }
}
