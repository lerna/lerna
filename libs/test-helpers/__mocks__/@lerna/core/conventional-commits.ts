// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import path from "path";
import semver from "semver";
import { vi } from "vitest";

const fs = await vi.importActual("fs-extra");

const mockRecommendVersion = vi.fn().mockName("recommendVersion");
const mockUpdateChangelog = vi.fn().mockName("updateChangelog");

mockRecommendVersion.mockImplementation((node) => semver.inc(node.version, "patch"));

mockUpdateChangelog.mockImplementation((pkg) => {
  const filePath = path.join(pkg.location, "CHANGELOG.md");

  // grumble grumble re-implementing the implementation
  return fs.outputFile(filePath, "changelog", "utf8").then(() => ({
    logPath: filePath,
    newEntry: pkg.version ? `${pkg.name} - ${pkg.version}` : pkg.name,
  }));
});

export const recommendVersion = mockRecommendVersion;
export const updateChangelog = mockUpdateChangelog;
