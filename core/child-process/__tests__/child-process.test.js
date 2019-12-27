"use strict";

const os = require("os");

// file under test
const ChildProcessUtilities = require("..");

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
    it("returns an execa Promise", async () => {
      const { stderr, stdout } = await ChildProcessUtilities.exec("echo", ["foo"]);

      expect(stderr).toBe("");
      expect(stdout).toBe("foo");
    });

    it("rejects on undefined command", async () => {
      const result = ChildProcessUtilities.exec("nowImTheModelOfAModernMajorGeneral");

      await expect(result).rejects.toThrow(/\bnowImTheModelOfAModernMajorGeneral\b/);
      expect(ChildProcessUtilities.getChildProcessCount()).toBe(0);
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

    it("decorates opts.pkg on error if caught", async () => {
      const result = ChildProcessUtilities.exec(
        "theVeneratedVirginianVeteranWhoseMenAreAll",
        ["liningUpToPutMeUpOnAPedestal"],
        { pkg: { name: "hamilton" } }
      );

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          code: os.constants.errno.ENOENT,
          pkg: { name: "hamilton" },
        })
      );
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

    it("decorates opts.pkg on error if caught", async () => {
      const result = ChildProcessUtilities.spawn("exit", ["123"], {
        pkg: { name: "shelled" },
        shell: true,
      });

      await expect(result).rejects.toThrow(
        expect.objectContaining({
          code: 123,
          pkg: { name: "shelled" },
        })
      );
    });
  });
});
