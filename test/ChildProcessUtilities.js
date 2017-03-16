import assert from "assert";
import os from "os";

import ChildProcessUtilities from "../src/ChildProcessUtilities";

describe("ChildProcessUtilities", () => {
  describe(".execSync()", () => {
    it("should execute a command in a child process and return the result", () => {
      assert.equal(ChildProcessUtilities.execSync("echo foo"), "foo");
    });
  });

  describe(".exec()", () => {
    it("should execute a command in a child process and call the callback with the result", (done) => {
      ChildProcessUtilities.exec("echo foo", null, (stderr, stdout) => {
        assert.equal(stderr, null);
        assert.equal(stdout, `foo${os.EOL}`);
        done();
      });
    });

    it("passes an error object to callback when stdout maxBuffer exceeded", (done) => {
      ChildProcessUtilities.exec("echo foo", { maxBuffer: 1 }, (stderr, stdout) => {
        assert.equal(stderr, "Error: stdout maxBuffer exceeded");
        assert.equal(stdout, "");
        done();
      });
    });

    if (process.platform !== "win32") {
      // windows is too weird
      it("passes an error object to callback when stdout maxBuffer exceeded", (done) => {
        ChildProcessUtilities.exec("echo foo >&2", { maxBuffer: 1 }, (stderr, stdout) => {
          assert.equal(stderr, "Error: stderr maxBuffer exceeded.  Partial output follows:\n\n");
          assert.equal(stdout, "");
          done();
        });
      });
    }
  });

  describe(".spawn()", () => {
    it("should spawn a command in a child process", (done) => {
      ChildProcessUtilities.spawn("echo", ["foo"], { stdio: "pipe" }, (err, output) => {
        assert.equal(err, null);
        assert.equal(output.trim(), "foo");
        done();
      });
    });

    it("passes error message to callback", (done) => {
      ChildProcessUtilities.spawn("iAmTheModelOfAModernMajorGeneral", [], { stdio: "pipe" }, (err) => {
        const inErrorMessage = String(err).indexOf("iAmTheModelOfAModernMajorGeneral") > -1;
        assert.ok(inErrorMessage, "did not log missing executable error");
        done();
      });
    });
  });
});
