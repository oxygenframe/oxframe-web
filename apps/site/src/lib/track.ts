/** Plausible custom event. No-op when the script is blocked or not loaded. */
export function track(name: string): void {
  const plausible = (window as unknown as { plausible?: (event: string) => void }).plausible;
  plausible?.(name);
}
