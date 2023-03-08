import log from "npmlog";
import PQueue from "p-queue";
import { Package } from "./package";

// @npmcli/run-script does not have any types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const runScript = require("@npmcli/run-script");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const npmConf = require("./npm-conf");

const queue = new PQueue({ concurrency: 1 });

interface LifecycleConfig {
  log?: typeof log;
  ignorePrepublish?: boolean;
  ignoreScripts?: boolean;
  nodeOptions?: string;
  scriptShell?: string;
  scriptsPrependNodePath?: boolean;
  unsafePerm?: boolean;
  stdio?: string;
}

/**
 * Alias dash-cased npmConf to camelCase
 */
function flattenOptions(obj: any): LifecycleConfig {
  return {
    ignorePrepublish: obj["ignore-prepublish"],
    ignoreScripts: obj["ignore-scripts"],
    nodeOptions: obj["node-options"],
    scriptShell: obj["script-shell"],
    scriptsPrependNodePath: obj["scripts-prepend-node-path"],
    unsafePerm: obj["unsafe-perm"],
    ...obj,
  };
}

/**
 * Adapted from https://github.com/npm/run-script/blob/bb5156063ea3a7e167a6d5435847d9389146ec89/lib/run-script-pkg.js#L9
 * Modified to add back "path" and make it behave more like "npm-lifecycle"
 */
function printCommandBanner(id: string, event: string, cmd: string, path: string) {
  // eslint-disable-next-line no-console
  return console.log(`\n> ${id ? `${id} ` : ""}${event} ${path}\n> ${cmd.trim().replace(/\n/g, "\n> ")}\n`);
}

/**
 * Run a lifecycle script for a package.
 * @param {import("@lerna/package").Package} pkg
 * @param {string} stage
 * @param {LifecycleConfig} options
 */
export function runLifecycle(pkg: Package, stage: string, options: LifecycleConfig) {
  // back-compat for @lerna/npm-conf instances
  // https://github.com/isaacs/proto-list/blob/27764cd/proto-list.js#L14
  if ("root" in options) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    options = options.snapshot;
  }

  const opts = {
    log,
    unsafePerm: true,
    ...flattenOptions(options),
  };
  const dir = pkg.location;
  const id = `${pkg.name}@${pkg.version}`;
  const config = {};

  if (opts.ignoreScripts) {
    opts.log.verbose("lifecycle", "%j ignored in %j", stage, pkg.name);

    return Promise.resolve();
  }

  if (!pkg.scripts || !pkg.scripts[stage]) {
    opts.log.silly("lifecycle", "No script for %j in %j, continuing", stage, pkg.name);

    return Promise.resolve();
  }

  if (stage === "prepublish" && opts.ignorePrepublish) {
    opts.log.verbose("lifecycle", "%j ignored in %j", stage, pkg.name);

    return Promise.resolve();
  }

  // https://github.com/zkat/figgy-pudding/blob/7d68bd3/index.js#L42-L64
  for (const [key, val] of Object.entries(opts)) {
    // omit falsy values and circular objects
    if (val != null && key !== "log" && key !== "logstream") {
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config[key] = val;
    }
  }

  /* istanbul ignore else */
  // eslint-disable-next-line no-underscore-dangle
  if (pkg.__isLernaPackage) {
    // To ensure npm-lifecycle creates the correct npm_package_* env vars,
    // we must pass the _actual_ JSON instead of our fancy Package thingy
    // eslint-disable-next-line no-param-reassign
    pkg = pkg.toJSON();
  }

  // _id is needed by @npmcli/run-script
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pkg._id = id;

  opts.log.silly("lifecycle", "%j starting in %j", stage, pkg.name);

  // info log here to reproduce previous behavior when this was powered by "npm-lifecycle"
  opts.log.info("lifecycle", `${id}~${stage}: ${id}`);

  /**
   * In order to match the previous behavior of "npm-lifecycle", we have to disable the writing
   * to the parent process and print the command banner ourselves, unless overridden by the options.
   */
  const stdio = opts.stdio || "pipe";
  if (log.level !== "silent") {
    printCommandBanner(id, stage, pkg.scripts[stage], dir);
  }

  return queue.add(async () =>
    runScript({
      event: stage,
      path: dir,
      pkg,
      args: [],
      stdio,
      banner: false,
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      scriptShell: config.scriptShell,
    }).then(
      ({ stdout }: any) => {
        if (stdout) {
          /**
           * This adjustment is based on trying to match the existing integration test outputs when migrating
           * from "npm-lifecycle" to "@npmcli/run-script".
           */
          // eslint-disable-next-line no-console
          process.stdout.write(stdout.toString().trimEnd() + "\n");
        }

        opts.log.silly("lifecycle", "%j finished in %j", stage, pkg.name);
      },
      (err: any) => {
        // propagate the exit code
        const exitCode = err.code || 1;

        // error logging has already occurred on stderr, but we need to stop the chain
        log.error("lifecycle", "%j errored in %j, exiting %d", stage, pkg.name, exitCode);

        // ensure clean logging, avoiding spurious log dump
        err.name = "ValidationError";

        // our yargs.fail() handler expects a numeric .exitCode, not .errno
        err.exitCode = exitCode;
        process.exitCode = exitCode;

        // stop the chain
        throw err;
      }
    )
  );
}

// TODO: add types for commandOptions
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export function createRunner(commandOptions) {
  const cfg = npmConf(commandOptions).snapshot;

  return (pkg: Package, stage: string) => runLifecycle(pkg, stage, cfg);
}
