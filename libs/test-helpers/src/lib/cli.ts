import execa from "execa";
import { resetWorkspaceContext, setupWorkspaceContext } from "nx/src/utils/workspace-context";
import { setWorkspaceRoot } from "nx/src/utils/workspace-root";
import path, { join } from "path";
import yargs from "yargs";
import { lernaCLI } from "@lerna/core";

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

  try {
    // prime the pump so slow-as-molasses CI doesn't fail with delayed require()
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    require(path.resolve(require.main.filename, "../../"));
  } catch {
    /* empty */
  }

  return (cwd: string) => {
    // create a _new_ yargs instance every time cwd changes to avoid singleton pollution
    const cli = lernaCLI([], cwd)
      .exitProcess(false)
      .detectLocale(false)
      .showHelpOnFail(false)
      .wrap(null)
      .command(commandModule);

    return (...args: any) => {
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

      const yargsMeta: { exitCode?: number | unknown } = {};
      //keep track of the results in order to complete promise
      let fullResult: unknown = {};
      let capturedError: Error | undefined = undefined;

      const context = {
        cwd,
        lernaVersion: "__TEST_VERSION__",
        loglevel: "silent",
        progress: false,
        //used to capture information for testing
        onResolved: (res: unknown) => {
          fullResult = Object.assign({}, res, yargsMeta);
        },
        //used to capture information for testing
        onRejected: (result: Error) => {
          Object.assign(result, yargsMeta);
          // tests expect errors thrown to indicate failure,
          // _not_ just non-zero exitCode
          capturedError = result;
        },
      };

      const parseFn = (_: unknown, parsedArgv: unknown, yargsOutput: unknown) => {
        // this is synchronous, before the async handlers resolve
        Object.assign(yargsMeta, { parsedArgv, yargsOutput });
      };

      return new Promise((resolve, reject) => {
        // we wrap command execution in a promise to get additional information for testing, which is collected from inner promises (builder and command handler)
        Promise.resolve(
          //cli parse can potentially be a promise so we wait until it is resolved, which means the whole command has really finished.
          //this has to be done since yargs 17.0.0, because handlers get executed no matter if the builder and its checks succeed
          cli
            .fail((msg: string | undefined, err: Error) => {
              // since yargs 10.1.0, this is the only way to catch handler rejection
              // _and_ yargs validation exceptions when using async command handlers
              const actual = err || new Error(msg);
              // backfill exitCode for test convenience
              yargsMeta.exitCode = "exitCode" in actual ? actual.exitCode : 1;
              context.onRejected(actual);
            })
            .parse([cmd, ...args], context, parseFn)
        )
          .then(() => {
            //if there is an error we reject the promise
            if (capturedError) {
              reject(capturedError);
              return;
            }
            // resolve with full result
            resolve(fullResult);
          })
          .catch((e) => reject(e));
      });
    };
  };
}

export function cliRunner(cwd: string, env?: any) {
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
