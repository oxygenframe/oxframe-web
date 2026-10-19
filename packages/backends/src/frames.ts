import { decodeFrameHeader, FRAME_HEADER_SIZE, FrameFormat } from '@oxframe/protocol';
import type { Frame } from './types';

const MIME: Record<number, string> = {
  [FrameFormat.Jpeg]: 'image/jpeg',
  [FrameFormat.Webp]: 'image/webp',
};

/** Decodes a binary frame message (header + JPEG/WebP/RGBA body). */
export async function decodeFrame(buf: ArrayBuffer): Promise<Frame | null> {
  const header = decodeFrameHeader(buf);
  if (!header) return null;
  const body = new Uint8Array(buf, FRAME_HEADER_SIZE, header.len);
  let image: ImageBitmap;
  if (header.format === FrameFormat.Rgba) {
    const data = new ImageData(new Uint8ClampedArray(body), header.width, header.height);
    image = await createImageBitmap(data);
  } else {
    image = await createImageBitmap(new Blob([body], { type: MIME[header.format] }));
  }
  return { header, image };
}
