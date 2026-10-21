import { describe, expect, it } from 'vitest';
import { decodeWav, fileName, hostedAudioUrl, mixHosted, MIX_RATE } from '../src/lib/audio';

function wav(samples: number[], rate = MIX_RATE): ArrayBuffer {
  const data = samples.length * 2;
  const buf = new ArrayBuffer(44 + data);
  const view = new DataView(buf);
  const write = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + data, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, data, true);
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, Math.round(sample * 32767), true));
  return buf;
}

describe('hosted example audio', () => {
  it('names a file the same way a sandbox path does', () => {
    expect(fileName('/tmp/proj/assets/click.wav')).toBe('click.wav');
    expect(hostedAudioUrl('C:\\proj\\tone.wav')).toBe('/audio/tone.wav');
    expect(hostedAudioUrl('not a file')).toBeNull();
  });

  it('decodes a 16-bit mono wav', () => {
    const decoded = decodeWav(wav([0, 0.5, -0.5]));
    expect(decoded?.rate).toBe(MIX_RATE);
    expect(decoded?.samples.length).toBe(3);
    expect(decoded?.samples[1]).toBeCloseTo(0.5, 3);
  });

  it('places a click and ducks the soundtrack under a priority clip', () => {
    const music = new Float32Array(MIX_RATE).fill(1);
    const click = new Float32Array([1, 1, 1, 1]);
    const mixed = mixHosted(
      [
        { samples: music, rate: MIX_RATE, start: 0, seconds: 1, music: true, priority: false },
        {
          samples: click,
          rate: MIX_RATE,
          start: 0.5,
          seconds: 4 / MIX_RATE,
          music: false,
          priority: true,
        },
      ],
      1,
    );
    const at = Math.round(0.5 * MIX_RATE);
    const bed = mixed[at - 1] ?? 0;
    expect(bed).toBeGreaterThan(0.2);
    expect(mixed[at + 8]).toBeCloseTo(bed, 2);
    expect(mixed[at] ?? 0).toBeGreaterThan(bed * 2);
    expect(mixed[at] ?? 0).toBeLessThanOrEqual(0.89 + 1e-6);
  });
});
