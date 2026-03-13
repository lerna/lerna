import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import { tmpdir } from "os";

if (!process.env.E2E_ROOT) {
  const isCI = process.env.CI != null && process.env.CI !== "false";
  const e2eRoot = isCI ? join(tmpdir(), `lerna-e2e-${process.pid}-${Date.now()}`) : join("/tmp", "lerna-e2e");
  if (!existsSync(e2eRoot)) {
    mkdirSync(e2eRoot, { recursive: true });
  }
  process.env.E2E_ROOT = e2eRoot;
}

jest.retryTimes(process.env.LERNA_E2E_DEBUG === "true" ? 0 : 3);
