"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const { publish } = require("libnpmpublish");
const pify = require("pify");
const readJSON = require("read-package-json");
const figgyPudding = require("figgy-pudding");
const runLifecycle = require("@lerna/run-lifecycle");
const npa = require("npm-package-arg");
const otplease = require("@lerna/otplease");

module.exports = npmPublish;

const readJSONAsync = pify(readJSON);

const PublishConfig = figgyPudding(
  {
    "dry-run": { default: false },
    dryRun: "dry-run",
    log: { default: log },
    "project-scope": {},
    projectScope: "project-scope",
    tag: { default: "latest" },
  },
  {
    other() {
      // open it up for the sake of tests
      return true;
    },
  }
);

function npmPublish(pkg, tarFilePath, _opts, otpCache) {
  const { scope } = npa(pkg.name);
  // pass only the package scope to libnpmpublish
  const opts = PublishConfig(_opts, {
    projectScope: scope,
  });

  opts.log.verbose("publish", pkg.name);

  let chain = Promise.resolve();

  if (!opts.dryRun) {
    chain = chain.then(() => Promise.all([fs.readFile(tarFilePath), readJSONAsync(pkg.manifestLocation)]));
    chain = chain.then(([tarData, manifest]) => {
      // non-default tag needs to override publishConfig.tag,
      // which is merged over opts.tag in libnpmpublish
      if (
        opts.tag !== "latest" &&
        manifest.publishConfig &&
        manifest.publishConfig.tag &&
        manifest.publishConfig.tag !== opts.tag
      ) {
        // eslint-disable-next-line no-param-reassign
        manifest.publishConfig.tag = opts.tag;
      }

      return otplease(innerOpts => publish(manifest, tarData, innerOpts), opts, otpCache).catch(err => {
        opts.log.silly("", err);
        opts.log.error(err.code, (err.body && err.body.error) || err.message);

        // avoid dumping logs, this isn't a lerna problem
        err.name = "ValidationError";

        // ensure process exits non-zero
        process.exitCode = "errno" in err ? err.errno : 1;

        // re-throw to break chain upstream
        throw err;
      });
    });
  }

  chain = chain.then(() => runLifecycle(pkg, "publish", opts));
  chain = chain.then(() => runLifecycle(pkg, "postpublish", opts));

  return chain;
}
