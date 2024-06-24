"use strict";

// TODO: verify this actually works after we switched from npmlog to inlined version
// eslint-disable-next-line import/no-unresolved, node/no-missing-require
const { log } = require("@lerna/core");

// silence logs
log.level = "silent";

// keep snapshots stable
log.disableColor();

// avoid corrupting test logging
log.disableProgress();

// never let anyone enable progress
// eslint-disable-next-line no-undef
log.enableProgress = jest.fn();
