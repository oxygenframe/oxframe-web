// Image build step: compiles the SDK once per build worker, exactly as
// LocalRunner will at run time, so a build in a fresh container only
// compiles the user's scene. Runs with network; the container has none.
import { loadConfig } from '../../compile/src/config';
import { LocalRunner } from '../../compile/src/runner';

const cfg = loadConfig();
const runner = new LocalRunner(cfg);
for (let i = 0; i < cfg.workers; i++) {
  const t = performance.now();
  await runner.warm(i);
  console.log(`worker ${i} warm in ${((performance.now() - t) / 1000).toFixed(0)} s`);
}
