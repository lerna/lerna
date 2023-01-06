import byteSize from "byte-size";
import columnify from "columnify";
import log from "npmlog";

// has-unicode does not have types.
// TODO: it is a tiny module, inline it?
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createHasUnicode from "has-unicode";

const hasUnicode = createHasUnicode();

interface Tarball {
  name: string;
  version: any;
  filename: string;
  files: any[];
  bundled: any[];
  size: any;
  unpackedSize: any;
  shasum: any;
  integrity: any;
  entryCount: number;
}

export function logPacked(tarball: Tarball) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.notice("");
  log.notice("", `${hasUnicode ? "📦 " : "package:"} ${tarball.name}@${tarball.version}`);

  if (tarball.files && tarball.files.length) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.notice("=== Tarball Contents ===");
    log.notice(
      "",
      columnify(
        tarball.files.map((f: { size: any; path: any }) => {
          const bytes = byteSize(f.size);
          return {
            path: f.path,
            size: `${bytes.value}${bytes.unit}`,
          };
        }),
        {
          // TODO: refactor based on TS feedback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          include: ["size", "path"],
          showHeaders: false,
        }
      )
    );
  }

  if (tarball.bundled && tarball.bundled.length) {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.notice("=== Bundled Dependencies ===");
    tarball.bundled.forEach((name: string) => log.notice("", name));
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        include: ["name", "value"],
        showHeaders: false,
      }
    )
  );

  // an empty line
  log.notice("", "");
}

function elideIntegrity(integrity: any) {
  const str = integrity.toString();

  return `${str.substr(0, 20)}[...]${str.substr(80)}`;
}
