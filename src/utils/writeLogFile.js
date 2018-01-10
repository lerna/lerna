import os from "os";
import path from "path";
import log from "npmlog";
import writeFileAtomic from "write-file-atomic";

export default function writeLogFile(cwd) {
  let logOutput = "";

  log.record.forEach(m => {
    let pref = [m.id, m.level];
    if (m.prefix) {
      pref.push(m.prefix);
    }
    pref = pref.join(" ");

    m.message
      .trim()
      .split(/\r?\n/)
      .map(line => `${pref} ${line}`.trim())
      .forEach(line => {
        logOutput += line + os.EOL;
      });
  });

  writeFileAtomic.sync(path.join(cwd, "lerna-debug.log"), logOutput);

  // truncate log after writing
  log.record.length = 0;
}
