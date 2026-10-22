// Plausible custom events (no cookies). The funnel they make: a visit, the
// playground (opened, compiled, edited), a Share link or an MP4, then an
// install command copied. Goals are set up in Plausible under these names.
type Props = Record<string, string | number | boolean>;

/** Plausible custom event. No-op when the script is blocked or not loaded. */
export function track(name: string, props?: Props): void {
  const plausible = (
    window as unknown as { plausible?: (event: string, opts?: { props: Props }) => void }
  ).plausible;
  plausible?.(name, props ? { props } : undefined);
}

const once = new Set<string>();

/** `track`, at most once until the page reloads (the first compile, the first edit). */
export function trackOnce(name: string, props?: Props): void {
  if (once.has(name)) return;
  once.add(name);
  track(name, props);
}
