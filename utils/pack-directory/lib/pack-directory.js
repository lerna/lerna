"use strict";

const path = require("path");
const figgyPudding = require("figgy-pudding");
const packlist = require("npm-packlist");
const log = require("npmlog");
const tar = require("tar");
const tempWrite = require("temp-write");
const getPacked = require("@lerna/get-packed");
const Package = require("@lerna/package");
const runLifecycle = require("@lerna/run-lifecycle");

module.exports = packDirectory;

const PackConfig = figgyPudding({
  log: { default: log },
  "lerna-command": { default: "pack" },
  lernaCommand: "lerna-command",
  "ignore-prepublish": {},
  ignorePrepublish: "ignore-prepublish",
});

function packDirectory(_pkg, dir, _opts) {
  const pkg = Package.lazy(_pkg, dir);
  const opts = PackConfig(_opts);

  opts.log.verbose("pack-directory", path.relative(".", dir));

  let chain = Promise.resolve();

  if (opts.ignorePrepublish !== true) {
    chain = chain.then(() => runLifecycle(pkg, "prepublish", opts));
  }

  chain = chain.then(() => runLifecycle(pkg, "prepare", opts));

  if (opts.lernaCommand === "publish") {
    chain = chain.then(() => pkg.refresh());
    chain = chain.then(() => runLifecycle(pkg, "prepublishOnly", opts));
    chain = chain.then(() => pkg.refresh());
  }

  chain = chain.then(() => runLifecycle(pkg, "prepack", opts));
  chain = chain.then(() => pkg.refresh());
  chain = chain.then(() => packlist({ path: dir }));
  chain = chain.then(files =>
    tar.create(
      {
        cwd: dir,
        prefix: "package/",
        portable: true,
        // Provide a specific date in the 1980s for the benefit of zip,
        // which is confounded by files dated at the Unix epoch 0.
        mtime: new Date("1985-10-26T08:15:00.000Z"),
        gzip: true,
      },
      // NOTE: node-tar does some Magic Stuff depending on prefixes for files
      //       specifically with @ signs, so we just neutralize that one
      //       and any such future "features" by prepending `./`
      files.map(f => `./${f}`)
    )
  );
  chain = chain.then(stream => tempWrite(stream, getTarballName(pkg)));
  chain = chain.then(tarFilePath =>
    getPacked(pkg, tarFilePath).then(packed =>
      Promise.resolve()
        .then(() => runLifecycle(pkg, "postpack", opts))
        .then(() => packed)
    )
  );

  return chain;
}

function getTarballName(pkg) {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}
