// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { vi } from "vitest";

// TODO: verify this actually works after we switched from npmlog to inlined version
import { log } from "@lerna/core";

// silence logs
log.level = "silent";

// keep snapshots stable
log.disableColor();

// avoid corrupting test logging
log.disableProgress();

// never let anyone enable progress
log.enableProgress = vi.fn();
