"use strict";

jest.mock("@lerna/bootstrap");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const { getPackages } = require("@lerna/project");

// file under test
const lernaRemove = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
expect.extend(require("@lerna-test/pkg-matchers"));

describe("RmoveCommand", () => {});
