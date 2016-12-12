// @flow

import ChildProcessUtilities from "./ChildProcessUtilities";
import logger from "./logger";
import escapeArgs from "command-join";

export default class NpmUtilities {
  @logger.logifyAsync()
  static installInDir(directory: string, dependencies: Array<string>, callback: Function) {
    let args = ["install"];

    if (dependencies) {
      args = args.concat(dependencies);
    }

    const opts = {
      cwd: directory,
      stdio: ["ignore", "ignore", "pipe"],
    };

    ChildProcessUtilities.spawn("npm", args, opts, callback);
  }

  @logger.logifySync()
  static addDistTag(packageName: string, version: string, tag: string) {
    ChildProcessUtilities.execSync(`npm dist-tag add ${packageName}@${version} ${tag}`);
  }

  @logger.logifySync()
  static removeDistTag(packageName: string, tag: string) {
    ChildProcessUtilities.execSync(`npm dist-tag rm ${packageName} ${tag}`);
  }

  @logger.logifySync()
  static checkDistTag(packageName: string, tag: string) {
    return ChildProcessUtilities.execSync(`npm dist-tag ls ${packageName}`).indexOf(tag) >= 0;
  }

  @logger.logifyAsync()
  static execInDir(command: string, args: Array<string>, directory: string, callback: Function) {
    ChildProcessUtilities.exec(`npm ${command} ${escapeArgs(args)}`, { cwd: directory, env: process.env }, callback);
  }

  @logger.logifyAsync()
  static runScriptInDir(script: string, args: Array<string>, directory: string, callback: Function) {
    NpmUtilities.execInDir(`run ${script}`, args, directory, callback);
  }

  @logger.logifyAsync()
  static publishTaggedInDir(tag: string, directory: string, callback: Function) {
    ChildProcessUtilities.exec("cd " + escapeArgs(directory) + " && npm publish --tag " + tag, null, callback);
  }
}
