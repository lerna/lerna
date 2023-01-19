import log from "npmlog";
import { getNpmExecOpts } from "./get-npm-exec-opts";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

export function npmRunScript(script: string, { args, npmClient, pkg, reject = true }: any) {
  log.silly("npmRunScript", script, args, pkg.name);

  const argv = ["run", script, ...args];
  const opts = makeOpts(pkg, reject);

  return childProcess.exec(npmClient, argv, opts);
}

export function npmRunScriptStreaming(script: string, { args, npmClient, pkg, prefix, reject = true }: any) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("npmRunScriptStreaming", [script, args, pkg.name]);

  const argv = ["run", script, ...args];
  const opts = makeOpts(pkg, reject);

  return childProcess.spawnStreaming(npmClient, argv, opts, prefix && pkg.name);
}

function makeOpts(pkg: { name: any; location: string }, reject: any) {
  return Object.assign(getNpmExecOpts(pkg), {
    windowsHide: false,
    reject,
  });
}
