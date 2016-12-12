// @flow

import FileSystemUtilities from "./FileSystemUtilities";
import type {Log, Levels} from "./logger";
import logger from "./logger";
import path from "path";
import pad from "pad";

export default class ExitHandler {
  errorsSeen: { [error: string]: true };

  constructor() {
    this.errorsSeen = {};
  }

  writeLogs() {
    const filePath = path.join(process.cwd(), "lerna-debug.log");
    const fileContent = this._formatLogs(logger.logs);

    FileSystemUtilities.writeFileSync(filePath, fileContent);
  }

  _formatLogs(logs: Array<Log>) {
    return logs.map((log) => this._formatLog(log)).join("\n");
  }

  _formatLog(log: Log) {
    return (
      this._formatType(log.type) +
      log.message +
      this._formatError(log.error)
    );
  }

  _formatType(type: Levels) {
    return pad("lerna(" + type + ")", 15, " ");
  }

  _formatError(error: ?Error) {
    if (!error || this.errorsSeen[error.toString()]) {
      return "";
    }

    let message = "";

    this.errorsSeen[error.toString()] = true;

    if (error) {
      message += (error.stack || (error: any));
    }

    message = message.split("\n").map((line) => "    " + line).join("\n");

    return "\n" + message;
  }
}
