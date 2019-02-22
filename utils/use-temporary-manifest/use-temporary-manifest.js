"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const onExit = require("signal-exit");
const writePkg = require("write-pkg");

module.exports = useTemporaryManifest;

function useTemporaryManifest(pkg, temporaryPkgJson, doSomething) {
  const packageJsonBkp = `${pkg.manifestLocation}.lerna_backup`;

  log.silly("useTemporaryManifest", "backup", pkg.manifestLocation);

  return fs.rename(pkg.manifestLocation, packageJsonBkp).then(() => {
    const cleanup = () => {
      log.silly("useTemporaryManifest", "cleanup", pkg.manifestLocation);
      // Need to do this one synchronously because we might be doing it on exit.
      fs.renameSync(packageJsonBkp, pkg.manifestLocation);
    };

    // If we die we need to be sure to put things back the way we found them.
    const unregister = onExit(cleanup);

    // We have a few housekeeping tasks to take care of whether we succeed or fail.
    const done = finalError => {
      console.log("cleanup", finalError);
      cleanup();
      unregister();

      if (finalError) {
        throw finalError;
      }
    };

    log.silly("useTemporaryManifest", "writing tempJson", temporaryPkgJson);

    // Write out our temporary cooked up package.json and then do something.
    return writePkg(pkg.manifestLocation, temporaryPkgJson)
      .then(doSomething)
      .then(() => done(), done);
  });
}
