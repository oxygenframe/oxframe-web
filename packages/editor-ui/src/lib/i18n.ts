// UI strings. English only in v1; adding a language is adding a dictionary.
const en = {
  'app.title': 'oxframe',
  'conn.connecting': 'Connecting…',
  'conn.open': 'Connected',
  'conn.reconnecting': 'Reconnecting…',
  'conn.closed': 'Disconnected',
  'status.building': 'Building…',
  'status.reloaded': 'Reloaded',
  'status.incompatible': 'Version mismatch',
  'error.build': 'Build failed',
  'error.runtime': 'Runtime error',
  'error.meta': 'Could not apply the edit',
  'error.incompatible': 'Incompatible versions',
  'error.dismiss': 'Dismiss',
  'error.previous': 'The previous version keeps running.',
  'transport.play': 'Play (Space)',
  'transport.pause': 'Pause (Space)',
  'transport.prev': 'Previous frame (←, Shift+← for 10)',
  'transport.next': 'Next frame (→, Shift+→ for 10)',
  'transport.start': 'Go to start (Home)',
  'transport.end': 'Go to end (End)',
  'timeline.label': 'Timeline',
  'timeline.marker': 'Marker {name} at {time} s. Drag or use ←/→ to move.',
  'timeline.addMarker': 'Add marker at playhead (M)',
  'inspector.tree': 'Scene',
  'inspector.signals': 'Signals',
  'inspector.noSelection': 'Click a node in the viewport or the tree.',
  'inspector.tunables': 'Tunables',
  'inspector.eases': 'Eases',
  'inspector.none': 'None yet — use tune!() and ease!() in your scene.',
  'curve.title': 'Ease “{name}”',
  'curve.presets': 'Presets',
  'curve.close': 'Close',
  'viewport.label': 'Preview',
  'viewport.axes': 'Axes',
  'viewport.fit': 'Fit (double-click)',
  'theme.toggle': 'Toggle light/dark theme',
  'help.title': 'Shortcuts',
  'help.keys':
    'Space play/pause · ←/→ step · Shift+←/→ 10 frames · Home/End · M marker · wheel zoom · Alt/middle-drag pan',
} as const;

export type Key = keyof typeof en;
const dict: Record<Key, string> = en;

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  return dict[key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
