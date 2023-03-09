import fs from "fs-extra";
import pMap from "p-map";
import path from "path";
import { createSymlink } from "../create-symlink";
import { Package, RawManifest } from "../package";

/**
 * Symlink bins of srcPackage to node_modules/.bin in destPackage
 */
export function symlinkBinary(
  srcPackageRef: string | Package | RawManifest,
  destPackageRef: string | Package | RawManifest
): Promise<[Package, Package]> {
  return Promise.all([Package.lazy(srcPackageRef), Package.lazy(destPackageRef)]).then(
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ([srcPackage, destPackage]) => {
      const actions = Object.keys(srcPackage.bin).map((name) => {
        const srcLocation = srcPackage.contents
          ? path.resolve(srcPackage.location, srcPackage.contents)
          : srcPackage.location;
        const src = path.join(srcLocation, srcPackage.bin[name]);
        const dst = path.join(destPackage.binLocation, name);

        // Symlink all declared binaries, even if they don't exist (yet). We will
        // assume the package author knows what they're doing and that the binaries
        // will be generated during a later build phase (potentially source compiled from
        // another language).
        return { src, dst };
      });

      if (actions.length === 0) {
        return Promise.resolve();
      }

      return fs.mkdirp(destPackage.binLocation).then(() =>
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        pMap(actions, (meta) => {
          if (meta) {
            return createSymlink(meta.src, meta.dst, "exec");
          }
        })
      );
    }
  );
}
