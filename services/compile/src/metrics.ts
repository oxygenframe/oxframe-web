/** Minimal Prometheus text exposition. */
export class Metrics {
  private counters = new Map<string, number>();
  private gauges = new Map<string, () => number>();
  private buildSeconds: number[] = [];
  private static readonly BUCKETS = [1, 2, 5, 10, 15, 30, 60];

  inc(name: string, labels: Record<string, string> = {}, by = 1): void {
    const key = `${name}${fmt(labels)}`;
    this.counters.set(key, (this.counters.get(key) ?? 0) + by);
  }

  gauge(name: string, read: () => number): void {
    this.gauges.set(name, read);
  }

  observeBuild(seconds: number): void {
    this.buildSeconds.push(seconds);
    if (this.buildSeconds.length > 10_000) this.buildSeconds.shift();
  }

  render(): string {
    const lines: string[] = [];
    for (const [k, v] of [...this.counters].sort()) lines.push(`${k} ${v}`);
    for (const [k, read] of this.gauges) lines.push(`${k} ${read()}`);
    const b = this.buildSeconds;
    for (const le of Metrics.BUCKETS)
      lines.push(`oxframe_build_seconds_bucket{le="${le}"} ${b.filter((s) => s <= le).length}`);
    lines.push(`oxframe_build_seconds_bucket{le="+Inf"} ${b.length}`);
    lines.push(`oxframe_build_seconds_sum ${b.reduce((a, s) => a + s, 0).toFixed(3)}`);
    lines.push(`oxframe_build_seconds_count ${b.length}`);
    return lines.join('\n') + '\n';
  }
}

function fmt(labels: Record<string, string>): string {
  const e = Object.entries(labels);
  return e.length ? `{${e.map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`).join(',')}}` : '';
}
