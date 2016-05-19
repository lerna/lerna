import assert from "assert";

import ChildProcessUtilities from "../src/ChildProcessUtilities";

describe("ChildProcessUtilities", () => {
  describe(".execSync()", () => {
    it("should execute a command in a child process and return the result", () => {
      assert.equal(ChildProcessUtilities.execSync("echo foo"), "foo");
    });
  });

  describe(".exec()", () => {
    it("should execute a command in a child process and call the callback with the result", done => {
      ChildProcessUtilities.exec("echo foo", null, (stderr, stdout) => {
        assert.equal(stdout, "foo\n");
        done(stderr);
      });
    });
  });

  describe(".spawn()", () => {
    it("should spawn a command in a child process", done => {
      ChildProcessUtilities.spawn("echo", ["foo"], {}, done);
    });
  });
});
