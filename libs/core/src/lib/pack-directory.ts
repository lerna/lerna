import path from "path";
import packlist from "npm-packlist";
import log from "npmlog";
import tar from "tar";
import tempWrite from "./temp-write";
import { getPacked } from "./get-packed";
import { Package } from "./package";
import { runLifecycle } from "./run-lifecycle";

interface PackConfig {
  log?: typeof log;
  lernaCommand?: string; // If "publish", run "prepublishOnly" lifecycle
  ignorePrepublish?: boolean;
}

/**
 * Pack a directory suitable for publishing, writing tarball to a tempfile.
 * @param _pkg Package instance or path to manifest
 * @param dir to pack
 * @param options
 */
export function packDirectory(_pkg: Package | string, dir: string, options: PackConfig) {
  const pkg = Package.lazy(_pkg, dir);
  const opts = {
    log,
    ...options,
  };

  opts.log.verbose("pack-directory", path.relative(".", pkg.contents));

  let chain = Promise.resolve();

  if (opts.ignorePrepublish !== true) {
    chain = chain.then(() => runLifecycle(pkg, "prepublish", opts));
  }

  chain = chain.then(() => runLifecycle(pkg, "prepare", opts));

  if (opts.lernaCommand === "publish") {
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    opts.stdio = "inherit";
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => pkg.refresh());
    chain = chain.then(() => runLifecycle(pkg, "prepublishOnly", opts));
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    chain = chain.then(() => pkg.refresh());
  }

  chain = chain.then(() => runLifecycle(pkg, "prepack", opts));
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() => pkg.refresh());
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then(() => packlist({ path: pkg.contents }));
  chain = chain.then((files) =>
    tar.create(
      {
        cwd: pkg.contents,
        prefix: "package/",
        portable: true,
        // Provide a specific date in the 1980s for the benefit of zip,
        // which is confounded by files dated at the Unix epoch 0.
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        mtime: new Date("1985-10-26T08:15:00.000Z"),
        gzip: true,
      },
      // NOTE: node-tar does some Magic Stuff depending on prefixes for files
      //       specifically with @ signs, so we just neutralize that one
      //       and any such future "features" by prepending `./`
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      files.map((f) => `./${f}`)
    )
  );
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then((stream) => tempWrite(stream, getTarballName(pkg)));
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  chain = chain.then((tarFilePath) =>
    getPacked(pkg, tarFilePath).then((packed) =>
      Promise.resolve()
        .then(() => runLifecycle(pkg, "postpack", opts))
        .then(() => packed)
    )
  );

  return chain;
}

function getTarballName(pkg: Package) {
  const name =
    pkg.name[0] === "@"
      ? // scoped packages get special treatment
        pkg.name.substr(1).replace(/\//g, "-")
      : pkg.name;

  return `${name}-${pkg.version}.tgz`;
}
