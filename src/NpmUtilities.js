"use strict";

const log = require("npmlog");
const onExit = require("signal-exit");
const path = require("path");
const writePkg = require("write-pkg");

const ChildProcessUtilities = require("./ChildProcessUtilities");
const FileSystemUtilities = require("./FileSystemUtilities");
const splitVersion = require("./utils/splitVersion");

function execInstall(directory, { registry, npmClient, npmClientArgs, npmGlobalStyle, mutex }) {
  // build command, arguments, and options
  // eslint-disable-next-line no-use-before-define
  const opts = exports.getExecOpts(directory, registry);
  const args = ["install"];
  let cmd = npmClient || "npm";

  if (npmGlobalStyle) {
    cmd = "npm";
    args.push("--global-style");
  }

  if (cmd === "yarn" && mutex) {
    args.push("--mutex", mutex);
  }

  if (cmd === "yarn") {
    args.push("--non-interactive");
  }

  if (npmClientArgs && npmClientArgs.length) {
    args.push(...npmClientArgs);
  }

  log.silly("installInDir", [cmd, args]);
  return ChildProcessUtilities.exec(cmd, args, opts);
}

function installInDir(directory, dependencies, config, callback) {
  log.silly("installInDir", path.basename(directory), dependencies);

  // Nothing to do if we weren't given any deps.
  if (!(dependencies && dependencies.length)) {
    log.verbose("installInDir", "no dependencies to install");
    return callback();
  }

  const packageJson = path.join(directory, "package.json");
  const packageJsonBkp = `${packageJson}.lerna_backup`;

  log.silly("installInDir", "backup", packageJson);
  FileSystemUtilities.rename(packageJson, packageJsonBkp, err => {
    if (err) {
      log.error("installInDir", "problem backing up package.json", err);
      return callback(err);
    }

    const cleanup = () => {
      log.silly("installInDir", "cleanup", packageJson);
      // Need to do this one synchronously because we might be doing it on exit.
      FileSystemUtilities.renameSync(packageJsonBkp, packageJson);
    };

    // If we die we need to be sure to put things back the way we found them.
    const unregister = onExit(cleanup);

    // We have a few housekeeping tasks to take care of whether we succeed or fail.
    const done = finalError => {
      cleanup();
      unregister();
      callback(finalError);
    };

    // Construct a basic fake package.json with just the deps we need to install.
    const tempJson = {
      dependencies: dependencies.reduce((obj, dep) => {
        const [pkg, version] = splitVersion(dep);
        obj[pkg] = version || "*";
        return obj;
      }, {}),
    };

    log.silly("installInDir", "writing tempJson", tempJson);
    // Write out our temporary cooked up package.json and then install.
    writePkg(packageJson, tempJson)
      .then(() => execInstall(directory, config))
      .then(() => done(), done);
  });
}

function installInDirOriginalPackageJson(directory, config, callback) {
  log.silly("installInDirOriginalPackageJson", directory);

  return execInstall(directory, config).then(() => callback(), callback);
}

function addDistTag(directory, packageName, version, tag, registry) {
  log.silly("addDistTag", tag, version, packageName);

  const opts = exports.getExecOpts(directory, registry);
  return ChildProcessUtilities.exec("npm", ["dist-tag", "add", `${packageName}@${version}`, tag], opts);
}

function removeDistTag(directory, packageName, tag, registry) {
  log.silly("removeDistTag", tag, packageName);

  const opts = exports.getExecOpts(directory, registry);
  return ChildProcessUtilities.exec("npm", ["dist-tag", "rm", packageName, tag], opts);
}

function checkDistTag(directory, packageName, tag, registry) {
  log.silly("checkDistTag", tag, packageName);

  const opts = exports.getExecOpts(directory, registry);
  return ChildProcessUtilities.execSync("npm", ["dist-tag", "ls", packageName], opts).indexOf(tag) >= 0;
}

function runScriptInDir(script, { args, directory, npmClient }, callback) {
  log.silly("runScriptInDir", script, args, path.basename(directory));

  const opts = exports.getExecOpts(directory);
  ChildProcessUtilities.exec(npmClient, ["run", script, ...args], opts, callback);
}

function runScriptInDirSync(script, { args, directory, npmClient }, callback) {
  log.silly("runScriptInDirSync", script, args, path.basename(directory));

  const opts = exports.getExecOpts(directory);
  ChildProcessUtilities.execSync(npmClient, ["run", script, ...args], opts, callback);
}

function runScriptInPackageStreaming(script, { args, pkg, npmClient }, callback) {
  log.silly("runScriptInPackageStreaming", [script, args, pkg.name]);

  const opts = exports.getExecOpts(pkg.location);
  ChildProcessUtilities.spawnStreaming(npmClient, ["run", script, ...args], opts, pkg.name, callback);
}

function publishTaggedInDir(tag, pkg, { npmClient, registry }, callback) {
  const directory = pkg.location;

  log.silly("publishTaggedInDir", tag, path.basename(directory));

  const opts = exports.getExecOpts(directory, registry);
  const args = ["publish", "--tag", tag.trim()];

  if (npmClient === "yarn") {
    // skip prompt for new version, use existing instead
    // https://yarnpkg.com/en/docs/cli/publish#toc-yarn-publish-new-version
    args.push("--new-version", pkg.version);
  }

  return ChildProcessUtilities.exec(npmClient, args, opts, callback);
}

function getExecOpts(directory, registry) {
  const opts = {
    cwd: directory,
  };

  if (registry) {
    opts.env = Object.assign({}, process.env, {
      npm_config_registry: registry,
    });
  }

  log.silly("getExecOpts", opts);
  return opts;
}

exports.installInDir = installInDir;
exports.installInDirOriginalPackageJson = installInDirOriginalPackageJson;
exports.addDistTag = addDistTag;
exports.removeDistTag = removeDistTag;
exports.checkDistTag = checkDistTag;
exports.runScriptInDir = runScriptInDir;
exports.runScriptInDirSync = runScriptInDirSync;
exports.runScriptInPackageStreaming = runScriptInPackageStreaming;
exports.publishTaggedInDir = publishTaggedInDir;
exports.getExecOpts = getExecOpts;
