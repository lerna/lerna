import Arborist from "@npmcli/arborist";
import packlist from "npm-packlist";
import path from "path";
import { IntegrityMap } from "ssri";
import * as tar from "tar";
import { getPacked } from "./get-packed";
import log from "./npmlog";
import { Package } from "./package";
import { runLifecycle } from "./run-lifecycle";
import tempWrite from "./temp-write";

interface PackConfig {
  log?: typeof log;
  lernaCommand?: string; // If "publish", run "prepublishOnly" lifecycle
  ignorePrepublish?: boolean;
}

export interface Packed {
  id: string;
  name: string;
  version: string;
  size: number;
  unpackedSize: number;
  shasum: string;
  integrity: IntegrityMap;
  filename: string;
  files: string[];
  entryCount: number;
  bundled: unknown[];
  tarFilePath: string;
}

/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param _pkg Package instance or path to manifest
 * @param dir to pack
 * @param options
 */
export async function packDirectory(
  _pkg: Package | string,
  dir: string,
  options: PackConfig
): Promise<Packed> {
  const pkg = Package.lazy(_pkg, dir);
  const opts: PackConfig = {
    log,
    ...options,
  };

  opts.log!.verbose("pack-directory", path.relative(".", pkg.contents));

  if (opts.ignorePrepublish !== true) {
    await runLifecycle(pkg, "prepublish", opts);
  }

  await runLifecycle(pkg, "prepare", opts);

  if (opts.lernaCommand === "publish") {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    opts.stdio = "inherit";

    await pkg.refresh();
    await runLifecycle(pkg, "prepublishOnly", opts);
    await pkg.refresh();
  }

  await runLifecycle(pkg, "prepack", opts);
  await pkg.refresh();

  const arborist = new Arborist({
    path: pkg.contents,
  });
  const tree = await arborist.loadActual();
  const files = await packlist(tree);

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

  const tarFilePath = await tempWrite(stream, getTarballName(pkg));
  const packed = await getPacked(pkg, tarFilePath);

  await runLifecycle(pkg, "postpack", opts);

  return packed;
}

function getTarballName(pkg: Package) {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}
