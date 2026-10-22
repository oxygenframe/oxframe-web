// Editor view state survives reconnects and reloads: it lives in the URL
// hash (shareable, survives a page reload) and sessionStorage (survives the
// token-bearing URL being re-opened by `oxframe dev --open`).

export interface ViewState {
  frame: number;
  zoom: number;
  panX: number;
  panY: number;
  selected: number | null;
}

const KEY = 'oxframe-editor-view';

export function parseHash(hash: string): Partial<ViewState> {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  const num = (k: string) => {
    const v = p.get(k);
    if (v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const out: Partial<ViewState> = {};
  const f = num('f');
  if (f !== undefined) out.frame = Math.max(0, Math.round(f));
  const z = num('z');
  if (z !== undefined && z > 0) out.zoom = z;
  const x = num('px');
  if (x !== undefined) out.panX = x;
  const y = num('py');
  if (y !== undefined) out.panY = y;
  if (p.has('s')) {
    const s = num('s');
    out.selected = s === undefined ? null : s;
  }
  return out;
}

/** Keys of the hash that belong to the editor's view state. */
const OWN = new Set(['f', 'z', 'px', 'py', 's']);

/**
 * The parts of `hash` the editor does not own, as they are: the page may
 * keep its own state there (the playground's share link, `code=…`).
 * Re-encoding them would change them (`+` becomes a space).
 */
export function foreignHash(hash: string): string[] {
  return hash
    .replace(/^#/, '')
    .split('&')
    .filter((part) => part !== '' && !OWN.has(part.split('=')[0]!));
}

export function formatHash(v: ViewState, keep: string[] = []): string {
  const p = new URLSearchParams();
  p.set('f', String(v.frame));
  if (v.zoom !== 1) p.set('z', v.zoom.toFixed(3));
  if (v.panX !== 0 || v.panY !== 0) {
    p.set('px', v.panX.toFixed(1));
    p.set('py', v.panY.toFixed(1));
  }
  if (v.selected !== null) p.set('s', String(v.selected));
  return `#${[...keep, p.toString()].join('&')}`;
}

export function load(): Partial<ViewState> {
  let stored: Partial<ViewState> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Partial<ViewState>;
  } catch {
    stored = {};
  }
  return { ...stored, ...parseHash(typeof location === 'undefined' ? '' : location.hash) };
}

export function save(v: ViewState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    // Storage may be unavailable (private mode); the hash still works.
  }
  if (typeof history !== 'undefined') {
    history.replaceState(
      history.state,
      '',
      `${location.pathname}${location.search}${formatHash(v, foreignHash(location.hash))}`,
    );
  }
}
