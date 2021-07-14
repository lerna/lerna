"use strict";

const ssri = require("ssri");
const tar = require("tar");

module.exports.getPacked = getPacked;

/** @typedef {{ name: string; version: string; }} Manifest */
/** @typedef {{ path: string; size: number; mode: number; }} FileEntry */

/**
 * @param {Manifest} pkg
 * @param {Buffer} tarballData
 */
async function getPacked(pkg, tarballData) {
  /** @type {Set<string>} */
  const bundled = new Set();
  /** @type {FileEntry[]} */
  const files = [];

  let totalEntries = 0;
  let totalEntrySize = 0;

  const stream = tar.list({
    onentry(/** @type {FileEntry} */ entry) {
      totalEntries += 1;
      totalEntrySize += entry.size;

      const p = entry.path;

      /* istanbul ignore if */
      if (p.startsWith("package/node_modules/")) {
        const name = p.match(/^package\/node_modules\/((?:@[^/]+\/)?[^/]+)/)[1];
        bundled.add(name);
      }

      files.push({
        path: entry.path.replace(/^package\//, ""),
        size: entry.size,
        mode: entry.mode,
      });
    },
  });
  stream.end(tarballData);

  // resolve minipass promise, as ssri.fromData() is synchronous
  await stream;

  const { sha1, sha512 } = ssri.fromData(tarballData, {
    algorithms: ["sha1", "sha512"],
  });

  /** @type {string} */
  const shasum = sha1[0].hexDigest();
  const integrity = ssri.parse(sha512[0]);

  const uppers = files.filter((file) => isUpper(file.path));
  const others = files.filter((file) => !isUpper(file.path));

  uppers.sort(entriesByPath);
  others.sort(entriesByPath);

  return {
    id: `${pkg.name}@${pkg.version}`,
    name: pkg.name,
    version: pkg.version,
    size: tarballData.length,
    unpackedSize: totalEntrySize,
    shasum,
    integrity,
    filename: getTarballName(pkg),
    files: uppers.concat(others),
    entryCount: totalEntries,
    bundled: Array.from(bundled),
  };
}

/**
 * @param {FileEntry} a
 * @param {FileEntry} b
 */
function entriesByPath(a, b) {
  return a.path.localeCompare(b.path, undefined, {
    sensitivity: "case",
    numeric: true,
  });
}

/** @param {string} str */
function isUpper(str) {
  const ch = str.charAt(0);
  return ch >= "A" && ch <= "Z";
}

/**
 * @param {Manifest} pkg
 */
function getTarballName(pkg) {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}
