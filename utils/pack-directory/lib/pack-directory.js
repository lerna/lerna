"use strict";

const figgyPudding = require("figgy-pudding");
const packlist = require("npm-packlist");
const log = require("libnpm/log");
const tar = require("tar");
const tempWrite = require("temp-write");
const getPacked = require("@lerna/get-packed");
const runLifecycle = require("@lerna/run-lifecycle");

module.exports = packDirectory;

const PackConfig = figgyPudding({
  log: { default: log },
  "lerna-command": { default: "pack" },
  lernaCommand: "lerna-command",
  "ignore-prepublish": {},
  ignorePrepublish: "ignore-prepublish",
});

function packDirectory(pkg, _opts) {
  const opts = PackConfig(_opts);
  const dir = pkg.location;
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;
  const outputFileName = `${name}-${pkg.version}.tgz`;

  opts.log.verbose("packDirectory", dir);

  let chain = Promise.resolve();

  if (opts.ignorePrepublish !== false) {
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
  chain = chain.then(stream => tempWrite(stream, outputFileName));
  chain = chain.then(tarFilePath =>
    getPacked(pkg, tarFilePath).then(packed =>
      Promise.resolve()
        .then(() => runLifecycle(pkg, "postpack", opts))
        .then(() => packed)
    )
  );

  return chain;
}
