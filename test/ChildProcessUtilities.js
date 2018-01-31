"use strict";

// file under test
const ChildProcessUtilities = require("../src/ChildProcessUtilities");

describe("ChildProcessUtilities", () => {
  describe(".execSync()", () => {
    it("should execute a command in a child process and return the result", () => {
      expect(ChildProcessUtilities.execSync("echo", ["execSync"])).toBe("execSync");
    });

    it("does not error when stdout is ignored", () => {
      expect(() => ChildProcessUtilities.execSync("echo", ["ignored"], { stdio: "ignore" })).not.toThrow();
    });
  });

  describe(".exec()", () => {
    afterEach(done => {
      if (ChildProcessUtilities.getChildProcessCount()) {
        ChildProcessUtilities.onAllExited(done);
      } else {
        done();
      }
    });

    it("should execute a command in a child process and call the callback with the result", done => {
      ChildProcessUtilities.exec("echo", ["foo"], null, (stderr, stdout) => {
        try {
          expect(stderr).toBe(null);
          expect(stdout).toBe("foo");
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("passes an error object to callback when stdout maxBuffer exceeded", done => {
      ChildProcessUtilities.exec("echo", ["wat"], { maxBuffer: 1 }, (stderr, stdout) => {
        try {
          expect(String(stderr)).toBe("Error: stdout maxBuffer exceeded");
          expect(stdout).toBeUndefined();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("does not require a callback, instead returning a Promise", async () => {
      const { stdout } = await ChildProcessUtilities.exec("echo", ["Promise"]);
      expect(stdout).toBe("Promise");
    });

    it("passes error object to callback", done => {
      ChildProcessUtilities.exec("nowImTheModelOfAModernMajorGeneral", [], {}, err => {
        try {
          expect(err.message).toMatch(/\bnowImTheModelOfAModernMajorGeneral\b/);
          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("passes Promise rejection through", async () => {
      expect.assertions(1);

      try {
        await ChildProcessUtilities.exec("theVeneratedVirginianVeteranWhoseMenAreAll", []);
      } catch (err) {
        expect(err.message).toMatch(/\btheVeneratedVirginianVeteranWhoseMenAreAll\b/);
      }
    });

    it("registers child processes that are created", async () => {
      const echoOne = ChildProcessUtilities.exec("echo", ["one"]);
      expect(ChildProcessUtilities.getChildProcessCount()).toBe(1);

      const echoTwo = ChildProcessUtilities.exec("echo", ["two"]);
      expect(ChildProcessUtilities.getChildProcessCount()).toBe(2);

      const [one, two] = await Promise.all([echoOne, echoTwo]);
      expect(one.stdout).toBe("one");
      expect(two.stdout).toBe("two");
    });
  });

  describe(".spawn()", () => {
    it("should spawn a command in a child process that always inherits stdio", async () => {
      const child = ChildProcessUtilities.spawn("echo", ["-n"]);
      expect(child.stdio).toEqual([null, null, null]);

      const { code, signal } = await child;
      expect(code).toBe(0);
      expect(signal).toBe(null);
    });
  });
});
