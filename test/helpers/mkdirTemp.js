import fs from "fs";
import os from "os";
import path from "path";

export default function mkdirTemp(cwd) {
  const prefix = path.join(cwd || os.tmpdir(), path.sep);

  return new Promise((resolve, reject) => {
    fs.mkdtemp(prefix, (err, dirPath) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(dirPath);
    });
  });
}
