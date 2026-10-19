/** Cubic Bézier easing, same algorithm as oxframe-core (Newton + bisection). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const xs = (s: number) => ((ax * s + bx) * s + cx) * s;
  const ys = (s: number) => ((ay * s + by) * s + cy) * s;
  const dx = (s: number) => (3 * ax * s + 2 * bx) * s + cx;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = xs(s) - t;
      if (Math.abs(err) < 1e-7) return ys(s);
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s = Math.min(1, Math.max(0, s - err / d));
    }
    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < 40; i++) {
      const v = xs(s);
      if (Math.abs(v - t) < 1e-7) break;
      if (v < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return ys(s);
  };
}

export const PRESETS: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'in-out-cubic': [0.65, 0, 0.35, 1],
  'in-cubic': [0.32, 0, 0.67, 0],
  'out-cubic': [0.33, 1, 0.68, 1],
  'in-out-sine': [0.37, 0, 0.63, 1],
  'in-out-expo': [0.87, 0, 0.13, 1],
  'out-back': [0.34, 1.56, 0.64, 1],
  'in-out-back': [0.68, -0.6, 0.32, 1.6],
};
