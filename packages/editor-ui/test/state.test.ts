import { describe, expect, it } from 'vitest';
import type { Backend, BackendHandlers } from '@oxframe/backends';
import type { Command, Event } from '@oxframe/protocol';
import { EditorState, formatTime } from '../src/lib/state.svelte';
import { formatHash, parseHash } from '../src/lib/persist';
import { cubicBezier } from '../src/lib/ease';
import { toFrame, toScreen, viewTransform, zoomAround } from '../src/lib/view';

class Fake implements Backend {
  readonly kind = 'mock' as const;
  sent: Command[] = [];
  h!: BackendHandlers;
  connect(h: BackendHandlers) {
    this.h = h;
  }
  send(c: Command) {
    this.sent.push(c);
  }
  close() {}
}

function setup() {
  const b = new Fake();
  const s = new EditorState(b, { persist: false });
  s.start();
  return { b, s, emit: (e: Event) => s.handle(e) };
}

const ready: Event = {
  type: 'Ready',
  protocol_version: 1,
  engine_version: 't',
  fps: 30,
  size: [1920, 1080],
  scenes: [
    { name: 'a', start: 0, frames: 60, transition: 0, transition_at: 0 },
    { name: 'b', start: 60, frames: 30, transition: 12, transition_at: 0 },
  ],
};

describe('EditorState', () => {
  it('says Hello on open and resyncs on Ready/Reloaded', () => {
    const { b, s, emit } = setup();
    b.h.status({ state: 'open' });
    expect(b.sent[0]).toMatchObject({ type: 'Hello', protocol_version: 1 });
    expect(b.sent[1]).toEqual({ type: 'Pause' });
    s.setViewport(800, 450);
    emit(ready);
    expect(s.ready).toBe(true);
    emit({ type: 'Frame', index: 42 });
    b.sent.length = 0;
    emit({ type: 'Reloaded' });
    expect(b.sent.map((c) => c.type)).toEqual(['SetViewport', 'Seek']);
    // The first rebuild starts over…
    expect(b.sent[1]).toEqual({ type: 'Seek', frame: 0 });
    // …and one soon after keeps the frame.
    emit({ type: 'Frame', index: 42 });
    b.sent.length = 0;
    emit({ type: 'Reloaded' });
    expect(b.sent[1]).toEqual({ type: 'Seek', frame: 42 });
  });

  it('tracks build status and errors', () => {
    const { s, emit } = setup();
    emit({ type: 'Building' });
    expect(s.building).toBe(true);
    emit({
      type: 'Error',
      kind: 'Build',
      message: 'boom',
      spans: [{ file: 'src/main.rs', line: 3, column: 5, message: 'x' }],
    });
    expect(s.building).toBe(false);
    expect(s.error?.spans[0]?.line).toBe(3);
    emit({ type: 'Reloaded' });
    expect(s.error).toBeNull();
  });

  it('maps markers to global frames and adds marker at playhead', () => {
    const { b, s, emit } = setup();
    emit(ready);
    emit({
      type: 'Timeline',
      frames: 90,
      markers: [{ scene: 'b', name: 'x', time: 0.5 }],
      scenes: ready.scenes,
    });
    expect(s.markerFrame(s.markers[0]!)).toBe(75);
    s.frame = 70;
    s.markerAtPlayhead();
    expect(b.sent.at(-1)).toEqual({
      type: 'SetMarker',
      name: 'marker-1',
      time: Number((10 / 30).toFixed(6)),
      scene: 'b',
    });
    // With a selected marker, M moves it.
    s.selectedMarker = { scene: 'b', name: 'x' };
    s.frame = 80;
    s.markerAtPlayhead();
    expect(b.sent.at(-1)).toMatchObject({ type: 'SetMarker', name: 'x', scene: 'b' });
  });

  it('sends a new transition length', () => {
    const { b, s, emit } = setup();
    emit(ready);
    s.setTransition('b', 0.4);
    expect(b.sent.at(-1)).toEqual({ type: 'SetTransition', scene: 'b', seconds: 0.4 });
  });

  it('restart opens the next engine at frame 0', () => {
    const { b, s, emit } = setup();
    emit({ type: 'Timeline', frames: 100, markers: [], scenes: [] });
    emit({ type: 'Frame', index: 42 });
    expect(s.frame).toBe(42);
    s.restart();
    expect(s.frame).toBe(0);
    expect(b.sent.at(-1)).toEqual({ type: 'Seek', frame: 0 });
    // A late frame from the scene being left must not stick.
    emit({ type: 'Frame', index: 42 });
    b.sent.length = 0;
    emit({ type: 'Reloaded' });
    expect(s.frame).toBe(0);
    expect(b.sent.at(-1)).toEqual({ type: 'Seek', frame: 0 });
  });

  it('clamps seeks', () => {
    const { b, s, emit } = setup();
    emit({ type: 'Timeline', frames: 10, markers: [], scenes: [] });
    s.seek(99);
    expect(b.sent.at(-1)).toEqual({ type: 'Seek', frame: 9 });
    s.seek(-5);
    expect(b.sent.at(-1)).toEqual({ type: 'Seek', frame: 0 });
  });
});

describe('helpers', () => {
  it('formats time', () => {
    expect(formatTime(0, 60)).toBe('0:00.00');
    expect(formatTime(3725, 60)).toBe('1:02.05');
  });

  it('hash round-trips view state', () => {
    const v = { frame: 120, zoom: 1.5, panX: 10, panY: -4, selected: 3 };
    expect(parseHash(formatHash(v))).toEqual(v);
    expect(parseHash('#f=7')).toEqual({ frame: 7 });
    expect(parseHash('#f=abc&z=-1')).toEqual({});
  });

  it('ease matches endpoints and is monotonic for in-out-cubic', () => {
    const e = cubicBezier(0.65, 0, 0.35, 1);
    expect(e(0)).toBe(0);
    expect(e(1)).toBe(1);
    expect(Math.abs(e(0.5) - 0.5)).toBeLessThan(1e-4);
    let prev = 0;
    for (let i = 1; i <= 100; i++) {
      const v = e(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it('view transform round-trips and zooms around the cursor', () => {
    const v = viewTransform([1920, 1080], { w: 960, h: 600 }, 2, 10, 20);
    const [x, y] = toScreen(v, 300, 400);
    expect(toFrame(v, x, y).map((n) => Math.round(n))).toEqual([300, 400]);
    const p = zoomAround([1920, 1080], { w: 960, h: 600 }, 1, 0, 0, 3, 100, 100);
    const before = toFrame(viewTransform([1920, 1080], { w: 960, h: 600 }, 1, 0, 0), 100, 100);
    const after = toFrame(
      viewTransform([1920, 1080], { w: 960, h: 600 }, 3, p.panX, p.panY),
      100,
      100,
    );
    expect(after[0]).toBeCloseTo(before[0]);
    expect(after[1]).toBeCloseTo(before[1]);
  });
});
