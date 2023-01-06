import log from "npmlog";
import os from "os";
import path from "path";
import writeFileAtomic from "write-file-atomic";

export function writeLogFile(cwd: string) {
  let logOutput = "";

  log.record.forEach((m) => {
    let pref = [m.id, m.level];
    if (m.prefix) {
      pref.push(m.prefix);
    }
    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    pref = pref.join(" ");

    m.message
      .trim()
      .split(/\r?\n/)
      .map((line) => `${pref} ${line}`.trim())
      .forEach((line) => {
        logOutput += line + os.EOL;
      });
  });

  // this must be synchronous because it is called before process exit
  writeFileAtomic.sync(path.join(cwd, "lerna-debug.log"), logOutput);

  // truncate log after writing
  log.record.length = 0;
}
