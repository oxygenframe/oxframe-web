// Types are generated from the Rust crate `oxframe-protocol` by ts-rs.
export type { Command } from './generated/Command';
export type { Event } from './generated/Event';
export type { ErrorKind } from './generated/ErrorKind';
export type { Span } from './generated/Span';
export type { SceneInfo } from './generated/SceneInfo';
export type { MarkerInfo } from './generated/MarkerInfo';
export type { AudioClipInfo } from './generated/AudioClipInfo';
export type { SlideInfo } from './generated/SlideInfo';
export type { NodeInfo } from './generated/NodeInfo';
export type { SignalValue } from './generated/SignalValue';
export type { Meta } from './generated/Meta';
export type { AudioMeta } from './generated/AudioMeta';
export type { TransitionMeta } from './generated/TransitionMeta';

/** Must equal `PROTOCOL_VERSION` in oxframe-protocol. */
export const PROTOCOL_VERSION = 1;

export const FrameFormat = { Webp: 1, Jpeg: 2, Rgba: 3, Surface: 4, Pcm: 5 } as const;
export type FrameFormat = (typeof FrameFormat)[keyof typeof FrameFormat];

/** 16-byte little-endian header of binary frame messages. */
export interface FrameHeader {
  frame: number;
  width: number;
  height: number;
  format: FrameFormat;
  len: number;
}

export const FRAME_HEADER_SIZE = 16;

export function decodeFrameHeader(buf: ArrayBuffer): FrameHeader | null {
  if (buf.byteLength < FRAME_HEADER_SIZE) return null;
  const dv = new DataView(buf);
  const format = dv.getUint8(8);
  if (format < 1 || format > 5) return null;
  return {
    frame: dv.getUint32(0, true),
    width: dv.getUint16(4, true),
    height: dv.getUint16(6, true),
    format: format as FrameFormat,
    len: dv.getUint32(12, true),
  };
}

export function encodeFrameHeader(h: FrameHeader): Uint8Array {
  const out = new Uint8Array(FRAME_HEADER_SIZE);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, h.frame, true);
  dv.setUint16(4, h.width, true);
  dv.setUint16(6, h.height, true);
  dv.setUint8(8, h.format);
  dv.setUint32(12, h.len, true);
  return out;
}
