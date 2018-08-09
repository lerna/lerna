"use strict";

const byteSize = require("byte-size");
const columnify = require("columnify");
const hasUnicode = require("has-unicode")();
const log = require("npmlog");

module.exports = logContents;

function logContents(tarball) {
  log.notice("");
  log.notice("", `${hasUnicode ? "📦 " : "package:"} ${tarball.name}@${tarball.version}`);
  log.notice("=== Tarball Contents ===");

  if (tarball.files.length) {
    log.notice(
      "",
      columnify(
        tarball.files.map(f => {
          const bytes = byteSize(f.size);
          return {
            path: f.path,
            size: `${bytes.value}${bytes.unit}`,
          };
        }),
        {
          include: ["size", "path"],
          showHeaders: false,
        }
      )
    );
  }

  if (tarball.bundled.length) {
    log.notice("=== Bundled Dependencies ===");
    tarball.bundled.forEach(name => log.notice("", name));
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
        { name: "integrity:", value: elideIntegrity(tarball) },
        tarball.bundled.length && {
          name: "bundled deps:",
          value: tarball.bundled.length,
        },
        tarball.bundled.length && {
          name: "bundled files:",
          value: tarball.entryCount - tarball.files.length,
        },
        tarball.bundled.length && {
          name: "own files:",
          value: tarball.files.length,
        },
        { name: "total files:", value: tarball.entryCount },
      ].filter(x => x),
      {
        include: ["name", "value"],
        showHeaders: false,
      }
    )
  );

  // an empty line
  log.notice("", "");
}

function elideIntegrity(tarball) {
  const str = tarball.integrity.toString();

  return `${str.substr(0, 20)}[...]${str.substr(80)}`;
}
