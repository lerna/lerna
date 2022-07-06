"use strict";

const byteSize = require("byte-size");
const columnify = require("columnify");
const hasUnicode = require("has-unicode")();
const log = require("npmlog");

module.exports.logPacked = logPacked;

function logPacked(tarball) {
  log.notice("");
  log.notice("", `${hasUnicode ? "📦 " : "package:"} ${tarball.name}@${tarball.version}`);

  if (tarball.files && tarball.files.length) {
    log.notice("=== Tarball Contents ===");
    log.notice(
      "",
      columnify(
        tarball.files.map((f) => {
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

  if (tarball.bundled && tarball.bundled.length) {
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
        tarball.size && { name: "package size:", value: byteSize(tarball.size) },
        tarball.unpackedSize && { name: "unpacked size:", value: byteSize(tarball.unpackedSize) },
        tarball.shasum && { name: "shasum:", value: tarball.shasum },
        tarball.integrity && { name: "integrity:", value: elideIntegrity(tarball.integrity) },
        tarball.bundled &&
          tarball.bundled.length && {
            name: "bundled deps:",
            value: tarball.bundled.length,
          },
        tarball.bundled &&
          tarball.bundled.length && {
            name: "bundled files:",
            value: tarball.entryCount - tarball.files.length,
          },
        tarball.bundled &&
          tarball.bundled.length && {
            name: "own files:",
            value: tarball.files.length,
          },
        tarball.entryCount && { name: "total files:", value: tarball.entryCount },
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
