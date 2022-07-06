"use strict";

// file under test
const childProcess = require("..");

describe("childProcess", () => {
  describe(".execSync()", () => {
    it("should execute a command in a child process and return the result", () => {
      expect(childProcess.execSync("echo", ["execSync"])).toBe("execSync");
    });

    it("does not error when stdout is ignored", () => {
      expect(() => childProcess.execSync("echo", ["ignored"], { stdio: "ignore" })).not.toThrow();
    });
  });

  describe(".exec()", () => {
    it("returns an execa Promise", async () => {
      const { stderr, stdout } = await childProcess.exec("echo", ["foo"]);

      expect(stderr).toBe("");
      expect(stdout).toBe("foo");
    });

    it("rejects on undefined command", async () => {
      const result = childProcess.exec("nowImTheModelOfAModernMajorGeneral");

      await expect(result).rejects.toThrow(/\bnowImTheModelOfAModernMajorGeneral\b/);
      expect(childProcess.getChildProcessCount()).toBe(0);
    });

    it("registers child processes that are created", async () => {
      const echoOne = childProcess.exec("echo", ["one"]);
      expect(childProcess.getChildProcessCount()).toBe(1);

      const echoTwo = childProcess.exec("echo", ["two"]);
      expect(childProcess.getChildProcessCount()).toBe(2);

      const [one, two] = await Promise.all([echoOne, echoTwo]);
      expect(one.stdout).toBe("one");
      expect(two.stdout).toBe("two");
    });

    it("decorates opts.pkg on error if caught", async () => {
      const result = childProcess.exec(
        "theVeneratedVirginianVeteranWhoseMenAreAll",
        ["liningUpToPutMeUpOnAPedestal"],
        { pkg: { name: "hamilton" } }
      );

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          pkg: { name: "hamilton" },
        })
      );
    });
  });

  describe(".spawn()", () => {
    it("should spawn a command in a child process that always inherits stdio", async () => {
      const child = childProcess.spawn("echo", ["-n"]);
      expect(child.stdio).toEqual([null, null, null]);

      const { exitCode, signal } = await child;
      expect(exitCode).toBe(0);
      expect(signal).toBe(undefined);
    });

    it("decorates opts.pkg on error if caught", async () => {
      const result = childProcess.spawn("exit", ["123"], {
        pkg: { name: "shelled" },
        shell: true,
      });

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          exitCode: 123,
          pkg: { name: "shelled" },
        })
      );
    });
  });
});
