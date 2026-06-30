import log from "./npmlog";

export function getNpmExecOpts(pkg: { name: any; location: string }, registry?: any) {
  // execa automatically extends process.env
  const env: any = {
    LERNA_PACKAGE_NAME: pkg.name,
  };

  if (registry) {
    env.npm_config_registry = registry;
    // Set unconditionally since this function doesn't know the active client; harmless for non-bun operations.
    env.BUN_CONFIG_REGISTRY = registry;
  }

  log.silly("getNpmExecOpts", pkg.location, registry);
  return {
    cwd: pkg.location,
    env,
    pkg,
  };
}
