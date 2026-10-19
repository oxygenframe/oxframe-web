// Cloudflare glue for service.ts: bindings, the build container class and
// the cron that prebuilds examples.
import { Container, getContainer } from '@cloudflare/containers';
import { examples } from './examples.gen';
import { createService } from './service';

interface Env {
  ARTIFACTS: R2Bucket;
  BUILDER: DurableObjectNamespace<Builder>;
  LIMITER: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  SDK_VERSION: string;
  BUILD_ID: string;
  CORS_ORIGINS: string;
  POOL_SIZE: string;
}

/** One build machine: services/compile with the local runner, inside a
 *  Firecracker VM that has no internet (the image carries every crate). */
export class Builder extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = '5m';
  enableInternet = false;
  envVars = {
    OXFRAME_BUILD_ID: this.env.BUILD_ID,
    OXFRAME_SDK_VERSION: this.env.SDK_VERSION,
  };
}

function service(env: Env) {
  const pool = Math.max(1, Number(env.POOL_SIZE) || 1);
  return createService({
    bucket: env.ARTIFACTS,
    // The same source always goes to the same machine, so concurrent
    // requests for it join one build.
    container: (id, req) =>
      getContainer(env.BUILDER, `pool-${parseInt(id.slice(0, 8), 16) % pool}`).fetch(req),
    allowBuild: async (ip) => (await env.LIMITER.limit({ key: ip })).success,
    examples,
    sdkVersion: env.SDK_VERSION,
    buildId: env.BUILD_ID,
    corsOrigins: env.CORS_ORIGINS.split(',').map((s) => s.trim()),
  });
}

export default {
  fetch: (req: Request, env: Env) => service(env).fetch(req),
  async scheduled(_c: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      service(env)
        .prebuild()
        .then((built) => built.length && console.log('prebuilt', built)),
    );
  },
} satisfies ExportedHandler<Env>;
