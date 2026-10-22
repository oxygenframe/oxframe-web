import { describe, expect, it } from 'vitest';
import { foreignHash, formatHash, parseHash } from '../src/lib/persist';

const view = { frame: 12, zoom: 1, panX: 0, panY: 0, selected: null };

describe('the view state in the URL hash', () => {
  it('keeps what the page put there, as it is', () => {
    // A playground share link: lz-string output can hold `+`.
    const hash = '#code=N4Ig+bW-x&f=3';
    expect(foreignHash(hash)).toEqual(['code=N4Ig+bW-x']);
    const next = formatHash(view, foreignHash(hash));
    expect(next).toBe('#code=N4Ig+bW-x&f=12');
    expect(parseHash(next).frame).toBe(12);
  });

  it('has only the view state when the page put nothing there', () => {
    expect(formatHash(view, foreignHash('#f=1&z=2.000'))).toBe('#f=12');
  });
});
