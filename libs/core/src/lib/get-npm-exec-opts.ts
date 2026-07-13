import log from "./npmlog";

export function getNpmExecOpts(pkg: { name: any; location: string }, registry?: any, npmClient?: string) {
  // execa automatically extends process.env
  const env: any = {
    LERNA_PACKAGE_NAME: pkg.name,
  };

  if (registry) {
    env.npm_config_registry = registry;
    // bun ignores npm_config_registry, so it needs its own env var. Only set it for bun:
    // lifecycle scripts spawned by other clients may themselves invoke bun, and their
    // registry must not be silently redirected.
    if (npmClient === "bun") {
      env.BUN_CONFIG_REGISTRY = registry;
    }
  }

  log.silly("getNpmExecOpts", pkg.location, registry);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}
