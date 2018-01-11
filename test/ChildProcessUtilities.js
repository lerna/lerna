// file under test
import ChildProcessUtilities from "../src/ChildProcessUtilities";

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

    it("does not require a callback, instead returning a Promise", () =>
      ChildProcessUtilities.exec("echo", ["Promise"]).then(result => {
        expect(result.stdout).toBe("Promise");
      }));

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

    it("passes Promise rejection through", () =>
      ChildProcessUtilities.exec("theVeneratedVirginianVeteranWhoseMenAreAll", []).catch(err => {
        expect(err.message).toMatch(/\btheVeneratedVirginianVeteranWhoseMenAreAll\b/);
      }));

    it("registers child processes that are created", () => {
      const echoOne = ChildProcessUtilities.exec("echo", ["one"]);
      expect(ChildProcessUtilities.getChildProcessCount()).toBe(1);

      const echoTwo = ChildProcessUtilities.exec("echo", ["two"]);
      expect(ChildProcessUtilities.getChildProcessCount()).toBe(2);

      return Promise.all([echoOne, echoTwo]).then(([one, two]) => {
        expect(one.stdout).toBe("one");
        expect(two.stdout).toBe("two");
      });
    });
  });

  describe(".spawn()", () => {
    it("should spawn a command in a child process that always inherits stdio", () => {
      const child = ChildProcessUtilities.spawn("echo", ["-n"]);
      expect(child.stdio).toEqual([null, null, null]);

      return child.then(result => {
        expect(result.code).toBe(0);
        expect(result.signal).toBe(null);
      });
    });
  });
});
