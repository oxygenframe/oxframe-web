/** Sample rate of the buffer the editor plays when the engine sent no PCM. */
export const MIX_RATE = 48_000;

const MUSIC_GAIN = 0.45;
const DUCK = 0.25;
const CEILING = 0.89;

/** One file placed on the project timeline. `seconds` of 0 plays the whole file. */
export interface MixClip {
  samples: Float32Array;
  rate: number;
  start: number;
  seconds: number;
  /** Soundtrack: ducked while a priority clip plays. */
  music: boolean;
  priority: boolean;
}

/** Last path segment, so a sandbox path and `click.wav` name the same file. */
export function fileName(path: string): string {
  const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return cut >= 0 ? path.slice(cut + 1) : path;
}

/**
 * Public URL for an example asset. The playground cannot open a disk path;
 * the site publishes the gallery wavs at `/audio/<name>`.
 */
export function hostedAudioUrl(path: string): string | null {
  const name = fileName(path);
  if (!/^[A-Za-z0-9._-]+\.(wav|mp3|ogg|flac)$/.test(name)) return null;
  return `/audio/${name}`;
}

function fourcc(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/** PCM wav (8- or 16-bit) to mono float samples. Other encodings return null. */
export function decodeWav(buf: ArrayBuffer): { rate: number; samples: Float32Array } | null {
  if (buf.byteLength < 44) return null;
  const view = new DataView(buf);
  if (fourcc(view, 0) !== 'RIFF' || fourcc(view, 8) !== 'WAVE') return null;
  let offset = 12;
  let format = 0;
  let channels = 0;
  let rate = 0;
  let bits = 0;
  let data: ArrayBuffer | null = null;
  while (offset + 8 <= view.byteLength) {
    const id = fourcc(view, offset);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    if (start + size > view.byteLength) break;
    if (id === 'fmt ' && size >= 16) {
      format = view.getUint16(start, true);
      channels = view.getUint16(start + 2, true);
      rate = view.getUint32(start + 4, true);
      bits = view.getUint16(start + 14, true);
    } else if (id === 'data') {
      data = buf.slice(start, start + size);
    }
    offset = start + size + (size % 2);
  }
  if (format !== 1 || !data || channels < 1 || rate < 1 || (bits !== 16 && bits !== 8)) return null;
  const bytes = bits / 8;
  const frames = Math.floor(data.byteLength / (bytes * channels));
  const samples = new Float32Array(frames);
  const pcm = new DataView(data);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (let c = 0; c < channels; c++) {
      const at = (i * channels + c) * bytes;
      sum += bits === 16 ? pcm.getInt16(at, true) / 32768 : (pcm.getUint8(at) - 128) / 128;
    }
    samples[i] = sum / channels;
  }
  return { rate, samples };
}

/** Mix hosted clips into one mono buffer. Music ducks under priority clips. */
export function mixHosted(clips: MixClip[], seconds: number): Float32Array {
  const n = Math.max(1, Math.ceil(Math.max(0, seconds) * MIX_RATE));
  const out = new Float32Array(n);
  const ducked = new Uint8Array(n);
  for (const clip of clips) {
    if (!clip.priority) continue;
    paint(clip, n, (dest) => {
      ducked[dest] = 1;
    });
  }
  for (const clip of clips) {
    paint(clip, n, (dest, sample) => {
      const gain = clip.music ? MUSIC_GAIN * (ducked[dest] ? DUCK : 1) : 1;
      out[dest] = (out[dest] ?? 0) + sample * gain;
    });
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i] ?? 0));
  if (peak > CEILING) {
    const gain = CEILING / peak;
    for (let i = 0; i < n; i++) out[i] = (out[i] ?? 0) * gain;
  }
  return out;
}

function paint(clip: MixClip, n: number, visit: (dest: number, sample: number) => void): void {
  const from = Math.round(clip.start * MIX_RATE);
  const span =
    clip.seconds > 0
      ? Math.round(clip.seconds * MIX_RATE)
      : Math.ceil((clip.samples.length * MIX_RATE) / Math.max(1, clip.rate));
  const ratio = clip.rate / MIX_RATE;
  for (let i = 0; i < span; i++) {
    const dest = from + i;
    if (dest < 0 || dest >= n) continue;
    const src = Math.floor(i * ratio);
    if (src >= clip.samples.length) break;
    visit(dest, clip.samples[src] ?? 0);
  }
}

const loading = new Map<string, Promise<{ rate: number; samples: Float32Array } | null>>();

/** Fetch a hosted wav once, even if the timeline and the meta arrive together. */
export function loadHostedWav(
  url: string,
): Promise<{ rate: number; samples: Float32Array } | null> {
  const pending = loading.get(url);
  if (pending) return pending;
  const next = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return decodeWav(await res.arrayBuffer());
    } catch {
      return null;
    }
  })();
  loading.set(url, next);
  return next;
}

/** Peak amplitude per bucket, in `0..=1`, for the timeline waveform. */
export function waveformPeaks(samples: Float32Array, buckets: number): number[] {
  const n = Math.max(1, buckets);
  const peaks = new Array<number>(n).fill(0);
  if (samples.length === 0) return peaks;
  for (let i = 0; i < n; i++) {
    const a = Math.floor((i * samples.length) / n);
    const b = Math.max(a + 1, Math.floor(((i + 1) * samples.length) / n));
    let peak = 0;
    for (let j = a; j < b && j < samples.length; j++)
      peak = Math.max(peak, Math.abs(samples[j] ?? 0));
    peaks[i] = peak;
  }
  return peaks;
}
