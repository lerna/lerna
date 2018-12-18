"use strict";

const fs = require("fs-extra");
const log = require("libnpm/log");
const publish = require("libnpm/publish");
const figgyPudding = require("figgy-pudding");
const runLifecycle = require("@lerna/run-lifecycle");

module.exports = npmPublish;

const PublishConfig = figgyPudding(
  {
    "dry-run": { default: false },
    dryRun: "dry-run",
    tag: { default: "latest" },
  },
  {
    other(key) {
      // allow any other keys _except_ circular objects
      return key !== "log" && key !== "logstream";
    },
  }
);

function npmPublish(pkg, tag, tarFilePath, _opts) {
  log.verbose("publish", pkg.name);

  const deets = { projectScope: pkg.name };

  if (tag) {
    deets.tag = tag;
  }

  const opts = PublishConfig(_opts, deets);

  let chain = Promise.resolve();

  if (!opts.dryRun) {
    chain = chain.then(() => fs.readFile(tarFilePath));
    chain = chain.then(tarData => publish(pkg.toJSON(), tarData, opts.toJSON()));
  }

  chain = chain.then(() => runLifecycle(pkg, "publish", opts));
  chain = chain.then(() => runLifecycle(pkg, "postpublish", opts));

  // pipelined Package instance
  return chain.then(() => pkg);
}
