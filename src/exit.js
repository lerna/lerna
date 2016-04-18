import FileSystemUtilities from "./FileSystemUtilities";
import logger from "./logger";
import path from "path";
import pad from "pad";

class ExitHandler {
  constructor() {
    this.errorsSeen = {};
  }

  writeLogs() {
    var filePath = path.join(process.cwd(), "lerna-debug.log");
    var fileContent = this._formatLogs(logger.logs);

    FileSystemUtilities.writeFileSync(filePath, fileContent);
  }

  _formatLogs(logs) {
    return logs.map(log => this._formatLog(log)).join("\n");
  }

  _formatLog(log) {
    return (
      this._formatType(log.type) +
      log.message +
      this._formatError(log.error)
    );
  }

  _formatType(type) {
    return pad("lerna(" + type + ")", 15, " ");
  }

  _formatError(error) {
    if (!error || this.errorsSeen[error.toString()]) {
      return "";
    }

    let message = [];

    this.errorsSeen[error.toString()] = true;

    if (error.message) message.push(error.message);
    if (error.stack) message.push(error.stack);
    if (!message.length) message.push(error);

    message = message.join("\n").split("\n").map(function(line) {
      return "  " + line;
    }).join("\n");

    return "\n" + message;
  }
}

export default function exit(code) {
  if (!code || code === 0) {
    process.exit(0);
  }

  const exitHandler = new ExitHandler();
  exitHandler.writeLogs();
  process.exit(code);
}
