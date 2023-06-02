import execa from "execa";
// TODO: What is the equivalent of this in Nx 16.3.1+?
// import { defaultFileHasher } from "nx/src/hasher/file-hasher";
import { setWorkspaceRoot } from "nx/src/utils/workspace-root";
import path, { join } from "path";
import yargs from "yargs";

/**
 * A higher-order function to help with passing _actual_ yargs-parsed argv
 * into command constructors (instead of artificial direct parameters).
 */
export function commandRunner(commandModule: yargs.CommandModule) {
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const cmd = commandModule.command.split(" ")[0];

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { lernaCLI } = require("@lerna/core");

  // prime the pump so slow-as-molasses CI doesn't fail with delayed require()
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  require(path.resolve(require.main.filename, "../../"));

  return (cwd: string) => {
    // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
    const cli = lernaCLI([], cwd)
      .exitProcess(false)
      .detectLocale(false)
      .showHelpOnFail(false)
      .wrap(null)
      .command(commandModule);

    return (...args: any) =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async (resolve, reject) => {
        // We always need fresh copies of the graph in the unit test fixtures
        process.env.NX_DAEMON = "false";
        process.env.NX_CACHE_PROJECT_GRAPH = "false";

        // Update the global workspaceRoot to the current test's cwd
        setWorkspaceRoot(cwd);
        // The environment variable is needed in order to influence the graph creation within lerna itself
        process.env.NX_WORKSPACE_ROOT_PATH = cwd;

        // Reset the Nx file hasher in order to respect the newly set workspaceRoot
        // TODO: What is the equivalent of this in Nx 16.3.1+?
        // defaultFileHasher.clear();
        // await defaultFileHasher.ensureInitialized();

        const yargsMeta = {};

        const context = {
          cwd,
          lernaVersion: "__TEST_VERSION__",
          loglevel: "silent",
          progress: false,
          onResolved: (result: any) => {
            // success resolves the result, if any, returned from execute()
            resolve(Object.assign({}, result, yargsMeta));
          },
          onRejected: (result: any) => {
            Object.assign(result, yargsMeta);
            // tests expect errors thrown to indicate failure,
            // _not_ just non-zero exitCode
            reject(result);
          },
        };

        const parseFn = (yargsError: any, parsedArgv: any, yargsOutput: any) => {
          // this is synchronous, before the async handlers resolve
          Object.assign(yargsMeta, { parsedArgv, yargsOutput });
        };

        cli
          .fail((msg: string | undefined, err: Error) => {
            // since yargs 10.1.0, this is the only way to catch handler rejection
            // _and_ yargs validation exceptions when using async command handlers
            const actual = err || new Error(msg);
            // backfill exitCode for test convenience
            // TODO: refactor to address type issues
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            yargsMeta.exitCode = "exitCode" in actual ? actual.exitCode : 1;
            context.onRejected(actual);
          })
          .parse([cmd, ...args], context, parseFn);
      });
  };
}

export function cliRunner(cwd: any, env?: any) {
  const opts = {
    cwd,
    env: Object.assign(
      {
        CI: "true",
        // always turn off chalk
        FORCE_COLOR: "0",
      },
      env
    ),
    // when debugging integration test snapshots, uncomment next line
    // stdio: ["ignore", "inherit", "inherit"],
  };

  // eslint-disable-next-line node/no-unpublished-require, node/no-missing-require
  const LERNA_BIN = require.resolve(join(__dirname, "../../../../", "packages/lerna/dist/cli"));

  return (...args: any[]) => execa("node", [LERNA_BIN].concat(args), opts);
}
