import log from "./npmlog";

/** pnpm 12+ exits with ERR_PNPM_IGNORED_BUILDS when dependency build scripts are skipped. */
export function getPnpmInstallEnv(): Record<string, string> {
  return {
    PNPM_CONFIG_STRICT_DEP_BUILDS: "false",
    // pnpm 12 runs a preflight install before `pnpm exec`; skip it for lerna workspaces.
    PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN: "false",
    // Resolve semver workspace siblings during `install --lockfile-only` (version command).
    PNPM_CONFIG_LINK_WORKSPACE_PACKAGES: "true",
    PNPM_CONFIG_PREFER_WORKSPACE_PACKAGES: "true",
  };
}

export function getNpmExecOpts(pkg: { name: any; location: string }, registry?: any, npmClient?: string) {
  // execa automatically extends process.env
  const env: any = {
    LERNA_PACKAGE_NAME: pkg.name,
  };

  if (npmClient === "pnpm") {
    Object.assign(env, getPnpmInstallEnv());
  }

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
