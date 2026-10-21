// Cloudflare glue for service.ts: bindings, the build container class and
// the cron that prebuilds examples.
import { Container, getContainer } from '@cloudflare/containers';
import { BUILD_ID, examples, SDK_VERSION } from './examples.gen';
import { createService } from './service';

interface Env {
  ARTIFACTS: R2Bucket;
  BUILDER: DurableObjectNamespace<Builder>;
  LIMITER: { limit(opts: { key: string }): Promise<{ success: boolean }> };
  CORS_ORIGINS: string;
  POOL_SIZE: string;
}

/** One build machine: services/compile with the local runner, inside a
 *  Firecracker VM that has no internet (the image carries every crate).
 *
 *  Billing is for provisioned memory while the machine is awake, so it
 *  sleeps soon after the last build. standard-3 (2 vCPU, 8 GiB) builds a
 *  scene in ~15 s; a build peaks under 1 GB. */
export class Builder extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = '2m';
  enableInternet = false;
  // The SDK version comes from the image (Dockerfile ENV), not from here.
  // A machine still on the previous image then answers 422 "this service
  // builds with SDK …" and service.ts restarts it on the new one. Passing
  // the Worker's version made an old machine accept the new version and
  // build with the old SDK, and that result was cached under the new key.
  envVars = {
    OXFRAME_BUILD_ID: BUILD_ID,
  };
}

function service(env: Env) {
  const pool = Math.max(1, Number(env.POOL_SIZE) || 1);
  // The image's BUILD_ID is part of the name, so a new image gets new
  // machines. A machine started on the old image keeps that image until it
  // is destroyed, even after the rollout reports the new one.
  const machine = (id: string) =>
    getContainer(env.BUILDER, `${BUILD_ID}-pool-${parseInt(id.slice(0, 8), 16) % pool}`);
  return createService({
    bucket: env.ARTIFACTS,
    // The same source always goes to the same machine, so concurrent
    // requests for it join one build.
    container: (id, req) => machine(id).fetch(req),
    restartContainer: (id) => machine(id).destroy(),
    allowBuild: async (ip) => (await env.LIMITER.limit({ key: ip })).success,
    examples,
    sdkVersion: SDK_VERSION,
    buildId: BUILD_ID,
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
