"use strict";

jest.mock("@lerna/child-process");

const childProcess = require("@lerna/child-process");
const hasNpmVersion = require("../lib/has-npm-version");

childProcess.execSync.mockReturnValue("5.6.0");

test("hasNpmVersion() returns boolean if range is satisfied by npm --version", () => {
  expect(hasNpmVersion(">=5")).toBe(true);
  expect(hasNpmVersion(">=6")).toBe(false);

  expect(childProcess.execSync).lastCalledWith("npm", ["--version"]);
});

test("hasNpmVersion.makePredicate() returns a predicate with cached version", () => {
  const predicate = hasNpmVersion.makePredicate();

  childProcess.execSync.mockReturnValue("3.10.10");

  // the predicate has cached the initial version, not the new version
  expect(predicate(">=5")).toBe(true);
  expect(hasNpmVersion(">=5")).toBe(false);
});
