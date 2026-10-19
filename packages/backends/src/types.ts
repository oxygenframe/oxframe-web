import type { Command, Event, FrameHeader } from '@oxframe/protocol';

export type ConnectionStatus =
  | { state: 'connecting' }
  | { state: 'open' }
  | { state: 'reconnecting'; attempt: number; delayMs: number }
  | { state: 'closed'; reason: string };

export interface Frame {
  header: FrameHeader;
  /** Decoded, ready to draw. */
  image: ImageBitmap;
}

export interface BackendHandlers {
  event(e: Event): void;
  frame(f: Frame): void;
  status(s: ConnectionStatus): void;
}

/**
 * A transport to an engine. The editor does not know which one it talks to:
 * the protocol is identical for `oxframe dev` (WebSocket) and the playground
 * (wasm in a Worker).
 */
export interface Backend {
  readonly kind: 'ws' | 'wasm' | 'mock';
  connect(h: BackendHandlers): void;
  send(cmd: Command): void;
  close(): void;
}
