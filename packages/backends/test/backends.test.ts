import { describe, expect, it, vi } from 'vitest';
import { decodeFrameHeader, encodeFrameHeader, FrameFormat } from '@oxframe/protocol';
import {
  backoff,
  CLOSE_UNAUTHORIZED,
  LocalWs,
  resolveWsUrl,
  UNAUTHORIZED_REASON,
} from '../src/local-ws';

describe('frame header', () => {
  it('round-trips', () => {
    const h = { frame: 1234, width: 960, height: 540, format: FrameFormat.Jpeg, len: 65000 };
    const bytes = encodeFrameHeader(h);
    expect(bytes.byteLength).toBe(16);
    expect(decodeFrameHeader(bytes.buffer as ArrayBuffer)).toEqual(h);
  });

  it('matches the Rust layout', () => {
    // Bytes produced by oxframe_protocol::FrameHeader::encode for
    // { frame: 1, width: 2, height: 3, format: Jpeg, len: 4 }.
    const rust = new Uint8Array([1, 0, 0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 4, 0, 0, 0]);
    expect(decodeFrameHeader(rust.buffer)).toEqual({
      frame: 1,
      width: 2,
      height: 3,
      format: 2,
      len: 4,
    });
  });

  it('rejects short or unknown frames', () => {
    expect(decodeFrameHeader(new ArrayBuffer(8))).toBeNull();
    const bad = new Uint8Array(16);
    bad[8] = 9;
    expect(decodeFrameHeader(bad.buffer)).toBeNull();
  });
});

describe('LocalWs', () => {
  it('builds ws URLs with the token', () => {
    expect(resolveWsUrl('/ws', 'abc', 'http://127.0.0.1:3000/?token=abc')).toBe(
      'ws://127.0.0.1:3000/ws?token=abc',
    );
    expect(resolveWsUrl('/ws', undefined, 'https://x.dev/p')).toBe('wss://x.dev/ws');
  });

  it('backs off exponentially up to a cap', () => {
    expect([1, 2, 3, 4, 10].map((a) => backoff(a, 250, 5000))).toEqual([
      250, 500, 1000, 2000, 5000,
    ]);
  });

  it('reconnects after close and sends JSON commands when open', async () => {
    vi.useFakeTimers();
    const sockets: FakeWs[] = [];
    class FakeWs {
      readyState = 0;
      binaryType = '';
      sent: string[] = [];
      onopen: (() => void) | null = null;
      onclose: (() => void) | null = null;
      onmessage: ((m: { data: unknown }) => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public url: string) {
        sockets.push(this);
      }
      send(s: string) {
        this.sent.push(s);
      }
      close() {
        this.readyState = 3;
        this.onclose?.();
      }
    }
    const statuses: string[] = [];
    const ws = new LocalWs({
      url: 'ws://127.0.0.1:1/ws',
      token: 't',
      WebSocketImpl: FakeWs as unknown as typeof WebSocket,
    });
    ws.connect({ event: () => {}, frame: () => {}, status: (s) => statuses.push(s.state) });
    expect(sockets).toHaveLength(1);
    sockets[0]!.readyState = 1;
    sockets[0]!.onopen?.();
    ws.send({ type: 'Play' });
    expect(sockets[0]!.sent).toEqual(['{"type":"Play"}']);
    sockets[0]!.close();
    expect(statuses).toContain('reconnecting');
    vi.advanceTimersByTime(300);
    expect(sockets).toHaveLength(2);
    expect(sockets[1]!.url).toBe('ws://127.0.0.1:1/ws?token=t');
    ws.close();
    vi.useRealTimers();
  });

  it('stops retrying when the server rejects the token', () => {
    vi.useFakeTimers();
    const sockets: Array<{ onclose: ((e: { code: number }) => void) | null }> = [];
    class FakeWs {
      binaryType = '';
      onclose: ((e: { code: number }) => void) | null = null;
      constructor() {
        sockets.push(this);
      }
      close() {}
    }
    const statuses: unknown[] = [];
    const ws = new LocalWs({
      url: 'ws://127.0.0.1:1/ws',
      token: 'stale',
      WebSocketImpl: FakeWs as unknown as typeof WebSocket,
    });
    ws.connect({ event: () => {}, frame: () => {}, status: (s) => statuses.push(s) });
    sockets[0]!.onclose?.({ code: CLOSE_UNAUTHORIZED });
    vi.advanceTimersByTime(10_000);
    expect(sockets).toHaveLength(1);
    expect(statuses.at(-1)).toEqual({ state: 'closed', reason: UNAUTHORIZED_REASON });
    vi.useRealTimers();
  });
});
