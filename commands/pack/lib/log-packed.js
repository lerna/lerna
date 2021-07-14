"use strict";

const byteSize = require("byte-size");
const columnify = require("columnify");
const hasUnicode = require("has-unicode")();
const npmlog = require("npmlog");

module.exports.logPacked = logPacked;

/** @typedef {{
    id: string;
    name: string;
    version: string;
    size: number;
    unpackedSize: number;
    shasum: string;
    integrity: import('ssri').IntegrityMap;
    filename?: string;
    files: string[];
    entryCount: number;
    bundled: string[];
}} PackedInfo */

/**
 * @param {PackedInfo} tarball
 * @param {{ log?: npmlog.Logger; unicode?: boolean; }} [options]
 */
function logPacked(tarball, { log = npmlog, unicode = hasUnicode } = {}) {
  log.notice("");
  log.notice("", `${unicode ? "📦 " : "package:"} ${tarball.name}@${tarball.version}`);

  const contents = tarball.files
    .map((f) => {
      if (/^node_modules\//.test(f.path)) {
        return null;
      }
      const bytes = byteSize(f.size);
      return {
        path: f.path,
        size: `${bytes.value}${bytes.unit}`,
      };
    })
    .filter((f) => f);

  if (contents.length) {
    log.notice("=== Tarball Contents ===");
    log.notice(
      "",
      columnify(contents, {
        include: ["size", "path"],
        showHeaders: false,
      })
    );
  }

  if (tarball.bundled.length) {
    log.notice("=== Bundled Dependencies ===");
    tarball.bundled.forEach((name) => log.notice("", name));
  }

  log.notice("=== Tarball Details ===");
  log.notice(
    "",
    columnify(
      [
        { name: "name:", value: tarball.name },
        { name: "version:", value: tarball.version },
        tarball.filename && { name: "filename:", value: tarball.filename },
        { name: "package size:", value: byteSize(tarball.size) },
        { name: "unpacked size:", value: byteSize(tarball.unpackedSize) },
        { name: "shasum:", value: tarball.shasum },
        { name: "integrity:", value: elideIntegrity(tarball.integrity) },
        tarball.bundled.length && {
          name: "bundled deps:",
          value: tarball.bundled.length,
        },
        tarball.bundled.length && {
          name: "bundled files:",
          value: tarball.entryCount - contents.length,
        },
        tarball.bundled.length && {
          name: "own files:",
          value: contents.length,
        },
        { name: "total files:", value: tarball.entryCount },
      ].filter((x) => x),
      {
        include: ["name", "value"],
        showHeaders: false,
      }
    )
  );

  // an empty line
  log.notice("", "");
}

function elideIntegrity(integrity) {
  const str = integrity.toString();

  return `${str.substr(0, 20)}[...]${str.substr(80)}`;
}
