// Review notes: what a person marks in the frame and writes about, for the
// agent. `oxframe dev` (the CLI) keeps them in out/notes/notes.json and
// `oxframe check` reports the open ones; the browser playground has none.

export type NoteStatus = 'open' | 'done';

/** A note as the CLI sends it (`{ type: 'Notes', notes }`). */
export interface ReviewNote {
  id: number;
  text: string;
  /** Seconds from the start of the project, `[from, to]`. */
  time: [number, number];
  scene?: string;
  node?: string;
  source?: string;
  /** `[x0, y0, x1, y1]` in scene units: origin at the frame center, y down. */
  bounds?: [number, number, number, number];
  /** `<id>.png` next to notes.json, served at `/notes/<file>?token=`. */
  crop?: string;
  status: NoteStatus;
  reply?: string;
  created: number;
}

/** A note being written: the marked area in frame pixels. */
export interface NoteDraft {
  rect: [number, number, number, number];
  time: [number, number];
  node?: { id: number; label: string; source?: string };
  text: string;
}

/** Frame pixels (origin top-left) → scene units (origin at the center). */
export function toScene(
  r: [number, number, number, number],
  size: [number, number],
): [number, number, number, number] {
  const [w, h] = size;
  const round = (v: number) => Math.round(v * 10) / 10;
  return [round(r[0] - w / 2), round(r[1] - h / 2), round(r[2] - w / 2), round(r[3] - h / 2)];
}

/** Scene units → frame pixels. */
export function toPixels(
  b: [number, number, number, number],
  size: [number, number],
): [number, number, number, number] {
  const [w, h] = size;
  return [b[0] + w / 2, b[1] + h / 2, b[2] + w / 2, b[3] + h / 2];
}

/** A rectangle from two corners, in order. */
export function rectOf(ax: number, ay: number, bx: number, by: number): NoteDraft['rect'] {
  return [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)];
}

/**
 * PNG (base64, no prefix) of the frame around `rect` with the area outlined:
 * what the agent looks at with the note. `image` is the whole frame at any
 * resolution; `size` is the project's.
 */
export async function cropPng(
  image: CanvasImageSource & { width: number; height: number },
  size: [number, number],
  rect: NoteDraft['rect'],
): Promise<string | undefined> {
  if (typeof OffscreenCanvas === 'undefined') return undefined;
  const [W, H] = size;
  const s = image.width / W;
  const pad = 48;
  const x0 = Math.max(0, rect[0] - pad);
  const y0 = Math.max(0, rect[1] - pad);
  const x1 = Math.min(W, rect[2] + pad);
  const y1 = Math.min(H, rect[3] + pad);
  const w = Math.max(1, Math.round((x1 - x0) * s));
  const h = Math.max(1, Math.round((y1 - y0) * s));
  const c = new OffscreenCanvas(w, h);
  const ctx = c.getContext('2d');
  if (!ctx) return undefined;
  ctx.drawImage(image, x0 * s, y0 * s, w, h, 0, 0, w, h);
  ctx.strokeStyle = '#ff3b6b';
  ctx.lineWidth = Math.max(2, 3 * s);
  ctx.strokeRect(
    (rect[0] - x0) * s,
    (rect[1] - y0) * s,
    (rect[2] - rect[0]) * s,
    (rect[3] - rect[1]) * s,
  );
  const blob = await c.convertToBlob({ type: 'image/png' });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

/** Whether a note belongs on the frame at `t` seconds. */
export function showsAt(n: ReviewNote, t: number, fps: number): boolean {
  const slack = 0.5 / Math.max(1, fps);
  return t >= n.time[0] - slack && t <= n.time[1] + slack;
}
