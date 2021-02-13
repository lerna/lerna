"use strict";

const path = require("path");
const packlist = require("npm-packlist");
const log = require("npmlog");
const tar = require("tar");
const { Package } = require("@lerna/package");
const { runLifecycle } = require("@lerna/run-lifecycle");

module.exports.packDirectory = packDirectory;

/**
 * @typedef {object} PackConfig
 * @property {typeof log} [log]
 * @property {string} [lernaCommand] If "publish", run "prepublishOnly" lifecycle
 * @property {boolean} [ignorePrepublish]
 */

/**
 * Pack a directory suitable for publishing, returning the tarball buffer.
 * @param {Package|string} _pkg Package instance or path to manifest
 * @param {string} dir to pack
 * @param {PackConfig} options
 */
async function packDirectory(_pkg, dir, options) {
  const pkg = Package.lazy(_pkg, dir);
  const opts = {
    log,
    ...options,
  };

  opts.log.verbose("pack-directory", path.relative(".", pkg.contents));

  if (opts.ignorePrepublish !== true) {
    await runLifecycle(pkg, "prepublish", opts);
  }

  await runLifecycle(pkg, "prepare", opts);

  if (opts.lernaCommand === "publish") {
    await pkg.refresh();
    await runLifecycle(pkg, "prepublishOnly", opts);
    await pkg.refresh();
  }

  await runLifecycle(pkg, "prepack", opts);
  await pkg.refresh();

  const files = await packlist({ path: pkg.contents });
  const stream = tar.create(
    {
      cwd: pkg.contents,
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
    files.map((f) => `./${f}`)
  );

  /** @type {Buffer} */
  const tarballData = await stream.concat();

  await runLifecycle(pkg, "postpack", opts);

  return tarballData;
}
