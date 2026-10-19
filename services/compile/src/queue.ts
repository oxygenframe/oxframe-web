import { writeFileSync } from 'node:fs';
import type { Runner } from './runner';
import type { JobRecord, Store } from './store';
import type { Metrics } from './metrics';

interface Job {
  id: string;
  source: string;
  sdkVersion: string;
  waiters: Array<(r: JobRecord) => void>;
}

/** Bounded build queue with N workers; identical sources share one build. */
export class BuildQueue {
  private pending: Job[] = [];
  private active = new Map<string, Job>();
  private busy = new Set<number>();

  constructor(
    private readonly store: Store,
    private readonly runner: Runner,
    private readonly workers: number,
    private readonly limit: number,
    private readonly metrics: Metrics,
  ) {
    metrics.gauge('oxframe_queue_depth', () => this.pending.length);
    metrics.gauge('oxframe_builds_running', () => this.busy.size);
  }

  get depth(): number {
    return this.pending.length;
  }

  isFull(): boolean {
    return this.pending.length >= this.limit;
  }

  inFlight(id: string): boolean {
    return this.active.has(id) || this.pending.some((j) => j.id === id);
  }

  /** Enqueues (or joins) a build; resolves when it finishes. */
  submit(id: string, source: string, sdkVersion: string): Promise<JobRecord> {
    return new Promise((resolve) => {
      const existing = this.active.get(id) ?? this.pending.find((j) => j.id === id);
      if (existing) {
        existing.waiters.push(resolve);
        return;
      }
      this.store.put({ id, status: 'queued', errors: [], sdkVersion, created: Date.now() });
      this.pending.push({ id, source, sdkVersion, waiters: [resolve] });
      this.pump();
    });
  }

  private pump(): void {
    for (let w = 0; w < this.workers && this.pending.length; w++) {
      if (this.busy.has(w)) continue;
      const job = this.pending.shift()!;
      this.busy.add(w);
      this.active.set(job.id, job);
      void this.run(job, w).finally(() => {
        this.busy.delete(w);
        this.active.delete(job.id);
        this.pump();
      });
    }
  }

  private async run(job: Job, worker: number): Promise<void> {
    const started = performance.now();
    this.store.put({
      id: job.id,
      status: 'building',
      errors: [],
      sdkVersion: job.sdkVersion,
      created: Date.now(),
    });
    let rec: JobRecord;
    try {
      const res = await this.runner.build(job.source, this.store.dir(job.id), worker);
      rec = {
        id: job.id,
        status: res.ok ? 'done' : 'error',
        errors: res.errors,
        ...(res.transient ? { transient: true } : {}),
        log: res.log,
        sdkVersion: job.sdkVersion,
        created: Date.now(),
        finished: Date.now(),
      };
      writeFileSync(this.store.file(job.id, 'source.rs'), job.source);
    } catch (e) {
      rec = {
        id: job.id,
        status: 'error',
        transient: true,
        errors: [{ file: 'scene.rs', line: 1, column: 1, message: `internal error: ${String(e)}` }],
        sdkVersion: job.sdkVersion,
        created: Date.now(),
        finished: Date.now(),
      };
    }
    const secs = (performance.now() - started) / 1000;
    this.metrics.observeBuild(secs);
    this.metrics.inc('oxframe_builds_total', { status: rec.status });
    this.store.put(rec);
    for (const w of job.waiters) w(rec);
  }
}
