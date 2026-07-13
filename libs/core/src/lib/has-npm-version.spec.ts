import { hasNpmVersion } from "./has-npm-version";

vi.mock("@lerna/child-process");

import * as childProcess from "@lerna/child-process";

childProcess.execSync.mockReturnValue("5.6.0");

test("hasNpmVersion() returns boolean if range is satisfied by npm --version", () => {
  expect(hasNpmVersion(">=5")).toBe(true);
  expect(hasNpmVersion(">=6")).toBe(false);

  expect(childProcess.execSync).toHaveBeenLastCalledWith("npm", ["--version"]);
});
