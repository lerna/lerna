// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import fs from "fs-extra";
import path from "path";
import ssri from "ssri";
import tar from "tar";

export function getPacked(pkg, tarFilePath) {
  const bundledWanted = new Set(pkg.bundleDependencies || pkg.bundledDependencies || []);
  const bundled = new Set();
  const files = [];

  let totalEntries = 0;
  let totalEntrySize = 0;

  return tar
    .list({
      file: tarFilePath,
      onentry(entry) {
        totalEntries += 1;
        totalEntrySize += entry.size;

        const p = entry.path;

        /* istanbul ignore if */
        if (p.startsWith("package/node_modules/")) {
          const name = p.match(/^package\/node_modules\/((?:@[^/]+\/)?[^/]+)/)[1];

          if (bundledWanted.has(name)) {
            bundled.add(name);
          }
        } else {
          files.push({
            path: entry.path.replace(/^package\//, ""),
            size: entry.size,
            mode: entry.mode,
          });
        }
      },
      strip: 1,
    })
    .then(() =>
      Promise.all([
        fs.stat(tarFilePath),
        ssri.fromStream(fs.createReadStream(tarFilePath), {
          algorithms: ["sha1", "sha512"],
        }),
      ])
    )
    .then(([{ size }, { sha1, sha512 }]) => {
      const shasum = sha1[0].hexDigest();

      return {
        id: `${pkg.name}@${pkg.version}`,
        name: pkg.name,
        version: pkg.version,
        size,
        unpackedSize: totalEntrySize,
        shasum,
        integrity: ssri.parse(sha512[0]),
        filename: path.basename(tarFilePath),
        files,
        entryCount: totalEntries,
        bundled: Array.from(bundled),
        tarFilePath,
      };
    });
}
