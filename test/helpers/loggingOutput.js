import _ from "lodash";
import log from "npmlog";

// clear logs between tests
afterEach(() => {
  log.record.length = 0;
});

const getVisibleMessages = _.flow(
  list =>
    _.filter(
      list,
      m =>
        // select all info, warn, and error logs
        log.levels[m.level] >= log.levels.info
    ),
  list => _.map(list, "message"),
  // remove empty logs ("newline")
  _.compact
);

export default function loggingOutput() {
  return getVisibleMessages(log.record);
}
