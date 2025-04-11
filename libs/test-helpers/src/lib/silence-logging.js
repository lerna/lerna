"use strict";

// TODO: verify this actually works after we switched from npmlog to inlined version
const { log } = require("@lerna/core");

// silence logs
log.level = "silent";

// keep snapshots stable
log.disableColor();

// avoid corrupting test logging
log.disableProgress();

// never let anyone enable progress

log.enableProgress = jest.fn();
