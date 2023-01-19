import log from "npmlog";
import { multiLineTrimRight } from "./multi-line-trim-right";

// clear logs between tests
afterEach(() => {
  log.record.length = 0;
});

export function loggingOutput(minLevel = "info") {
  // returns an array of log messages at or above the prescribed minLevel
  return (
    log.record
      // select all non-empty info, warn, or error logs
      .filter((m) => log["levels"][m.level] >= log["levels"][minLevel])
      // return just the normalized message content
      .map((m) => multiLineTrimRight(m.message || m.prefix))
  );
}
