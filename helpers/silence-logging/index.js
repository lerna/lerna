"use strict";

const log = require("libnpm/log");

// silence logs
log.level = "silent";

// keep snapshots stable
log.disableColor();

// avoid corrupting test logging
log.disableProgress();

// never let anyone enable progress
log.enableProgress = jest.fn();
