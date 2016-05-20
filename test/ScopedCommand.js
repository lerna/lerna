import assert from "assert";
import initFixture from "./_initFixture";
import ScopedCommand from "../src/ScopedCommand";

describe("ScopedCommand", () => {

  beforeEach(done => {
    initFixture("ScopedCommand/basic", done);
  });

  it("should throw when --scope is given but empty", done => {
    const scopedCommand = new ScopedCommand([], {scope: ""});

    scopedCommand.runValidations();
    try {
      scopedCommand.runPreparations();
    } catch (err) {
      assert.ok(err instanceof Error);
      done();
    }
  });

  it("should throw when --scope is given but excludes all packages", done => {
    const scopedCommand = new ScopedCommand([], {scope: "no-matchy"});

    scopedCommand.runValidations();
    try {
      scopedCommand.runPreparations();
    } catch (err) {
      assert.ok(err instanceof Error);
      done();
    }
  });

  it("should properly restrict the package scope", () => {
    const scopedCommand = new ScopedCommand([], {scope: "package-3"});

    scopedCommand.runPreparations();
    assert.deepEqual(scopedCommand.packages.map(pkg => pkg.name), ["package-3"]);
  });

  it("should properly restrict the package scope with a glob", () => {
    const scopedCommand = new ScopedCommand([], {scope: "package-a-*"});

    scopedCommand.runPreparations();
    assert.deepEqual(scopedCommand.packages.map(pkg => pkg.name), ["package-a-1", "package-a-2"]);
  });
});
