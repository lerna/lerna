import execa from "execa";
import { resetWorkspaceContext, setupWorkspaceContext } from "nx/src/utils/workspace-context";
import { setWorkspaceRoot } from "nx/src/utils/workspace-root";
import path, { join } from "path";
import yargs from "yargs";
import { lernaCLI } from "@lerna/core";
import { strict } from "assert";

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

    return (...args: any) => {
      // eslint-disable-next-line no-async-promise-executor

      // We always need fresh copies of the graph in the unit test fixtures
      process.env.NX_DAEMON = "false";
      process.env.NX_CACHE_PROJECT_GRAPH = "false";

      // Update the global workspaceRoot to the current test's cwd
      setWorkspaceRoot(cwd);
      // The environment variable is needed in order to influence the graph creation within lerna itself
      process.env.NX_WORKSPACE_ROOT_PATH = cwd;

      // Reset the Nx file hasher in order to respect the newly set workspaceRoot
      resetWorkspaceContext();
      setupWorkspaceContext(cwd);

      const yargsMeta: { error?: any; exitCode?: number } = {};
      let realResult: any = {};
      let rejectedResult: any = undefined;
      const context = {
        cwd,
        lernaVersion: "__TEST_VERSION__",
        loglevel: "silent",
        progress: false,
        onResolved: (res: any) => {
          realResult = Object.assign({}, res, yargsMeta);
        },
        onRejected: (result: any) => {
          Object.assign(result, yargsMeta);
          // tests expect errors thrown to indicate failure,
          // _not_ just non-zero exitCode
          rejectedResult = result;
        },
      };

      const parseFn = (yargsError: any, parsedArgv: any, yargsOutput: any) => {
        // this is synchronous, before the async handlers resolve
        Object.assign(yargsMeta, { parsedArgv, yargsOutput });
      };

      // eslint-disable-next-line no-async-promise-executor
      return new Promise((resolve, reject) => {
        const result = cli
          .fail((msg: string | undefined, err: Error) => {
            // since yargs 10.1.0, this is the only way to catch handler rejection
            // _and_ yargs validation exceptions when using async command handlers
            const actual = err || new Error(msg);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            yargsMeta.error = actual;
            // ok lets keep the exit code here and always have one
            if (!(actual as any).exitCode) {
              (actual as any).exitCode = 1;
            }
          })
          .parse([cmd, ...args], context, parseFn);
        Promise.resolve(result)
          .then(() => {
            if (yargsMeta.error) {
              reject(yargsMeta.error);
              return;
            }
            if (rejectedResult) {
              reject(rejectedResult);
              return;
            }
            resolve(realResult);
          })
          .catch((e) => reject(e));
      });
    };
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
