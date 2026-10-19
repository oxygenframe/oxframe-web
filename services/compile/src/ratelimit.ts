/** Sliding-window limiter: at most `limit` events per `windowMs` per key. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
  ) {}

  /** Records a hit; returns false if over the limit (nothing recorded). */
  take(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }

  retryAfterSeconds(key: string, now = Date.now()): number {
    const oldest = (this.hits.get(key) ?? [])[0];
    return oldest === undefined ? 0 : Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
  }
}
