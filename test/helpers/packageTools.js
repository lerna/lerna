import glob from "glob";
import readPkg from "read-pkg";

const parsePackageJson = (filePath) =>
  readPkg(filePath, { normalize: false });

export const loadAllPackages = (cwd) => {
  return new Promise((resolve, reject) => {
    glob("packages/*/package.json", {
      absolute: true,
      strict: true,
      cwd,
    }, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(Promise.all(files.map(parsePackageJson)));
      }
    });
  });
};
