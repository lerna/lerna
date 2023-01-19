import { hasNpmVersion } from "./has-npm-version";

jest.mock("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

childProcess.execSync.mockReturnValue("5.6.0");

test("hasNpmVersion() returns boolean if range is satisfied by npm --version", () => {
  expect(hasNpmVersion(">=5")).toBe(true);
  expect(hasNpmVersion(">=6")).toBe(false);

  expect(childProcess.execSync).toHaveBeenLastCalledWith("npm", ["--version"]);
});
