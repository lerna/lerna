"use strict";

const log = require("npmlog");
const Package = require("../src/Package");

// file under test
const validatePackageNames = require("../src/utils/validatePackageNames");

// silence logs
log.level = "silent";

describe("validatePackageNames", () => {
  it("should log a warning if multiple packages have the same name", () => {
    const packagesToValidate = [
      new Package({ name: "name1" }, "packages/package1"),
      new Package({ name: "name2" }, "packages/package2"),
      new Package({ name: "name3" }, "packages/package3"),
      new Package({ name: "name1" }, "packages/package4"),
      new Package({ name: "name1" }, "packages/package5"),
      new Package({ name: "name2" }, "packages/package6"),
    ];
    const logMessages = [];

    log.on("log.warn", evt => {
      logMessages.push(evt.message);
    });

    validatePackageNames(packagesToValidate);

    expect(logMessages[0]).toContain('Package name "name1" used in multiple packages:');
    expect(logMessages[0]).toContain("packages/package1");
    expect(logMessages[0]).toContain("packages/package4");
    expect(logMessages[0]).toContain("packages/package5");
    expect(logMessages[1]).toContain('Package name "name2" used in multiple packages:');
    expect(logMessages[1]).toContain("packages/package2");
    expect(logMessages[1]).toContain("packages/package6");
  });

  it("should not log any warning if packages all have the unique name", () => {
    const packagesToValidate = [
      new Package({ name: "name1" }, "packages/package1"),
      new Package({ name: "name2" }, "packages/package2"),
      new Package({ name: "name3" }, "packages/package3"),
    ];
    let didLogOccur = false;

    log.once("log.warn", () => {
      didLogOccur = true;
    });

    validatePackageNames(packagesToValidate);

    expect(didLogOccur).toBeFalsy();
  });
});
