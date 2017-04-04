import { EOL } from "os";

// file under test
import ChildProcessUtilities from "../src/ChildProcessUtilities";

describe("ChildProcessUtilities", () => {
  describe(".execSync()", () => {
    it("should execute a command in a child process and return the result", () => {
      expect(ChildProcessUtilities.execSync("echo foo")).toBe("foo");
    });

    it("does not error when stdout is ignored", () => {
      expect(() => ChildProcessUtilities.execSync("echo foo", { stdio: "ignore" })).not.toThrow();
    });
  });

  describe(".exec()", () => {
    it("should execute a command in a child process and call the callback with the result", (done) => {
      ChildProcessUtilities.exec("echo foo", null, (stderr, stdout) => {
        try {
          expect(stderr).toBe(null);
          expect(stdout).toBe(`foo${EOL}`);
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("passes an error object to callback when stdout maxBuffer exceeded", (done) => {
      ChildProcessUtilities.exec("echo foo", { maxBuffer: 1 }, (stderr, stdout) => {
        try {
          expect(String(stderr)).toBe("Error: stdout maxBuffer exceeded");
          expect(stdout).toBe("");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    if (process.platform !== "win32") {
      // windows is too weird
      it("passes an error object to callback when stdout maxBuffer exceeded", (done) => {
        ChildProcessUtilities.exec("echo foo >&2", { maxBuffer: 1 }, (stderr, stdout) => {
          try {
            expect(stderr).toBe("Error: stderr maxBuffer exceeded.  Partial output follows:\n\n");
            expect(stdout).toBe("");
            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });
    }
  });

  describe(".spawn()", () => {
    it("should spawn a command in a child process", (done) => {
      ChildProcessUtilities.spawn("echo", ["foo"], { stdio: "pipe" }, (err, output) => {
        if (err) return done.fail(err);

        try {
          expect(output.trim()).toBe("foo");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("passes error message to callback", (done) => {
      ChildProcessUtilities.spawn("iAmTheModelOfAModernMajorGeneral", [], { stdio: "pipe" }, (err) => {
        try {
          expect(String(err)).toMatch("iAmTheModelOfAModernMajorGeneral");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
