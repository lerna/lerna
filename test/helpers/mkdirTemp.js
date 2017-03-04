import fs from "graceful-fs";
import os from "os";
import path from "path";
import pify from "pify";

const mkdtempAsync = pify(fs.mkdtemp);
const realpathAsync = pify(fs.realpath);

export default function mkdirTemp(cwd) {
  const prefix = path.join(cwd || os.tmpdir(), path.sep);
  // realpath because OS X symlinks /var -> /private/var
  return mkdtempAsync(prefix).then(realpathAsync);
}
