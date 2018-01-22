import log from "npmlog";
import path from "path";

// mocked modules
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import UpdatedPackagesCollector from "../src/UpdatedPackagesCollector";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/ExecCommand";

const run = yargsRunner(commandModule);

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/UpdatedPackagesCollector");

// silence logs
log.level = "silent";

const calledInPackages = () => ChildProcessUtilities.spawn.mock.calls.map(args => path.basename(args[2].cwd));

const execInPackagesStreaming = testDir =>
  ChildProcessUtilities.spawnStreaming.mock.calls.reduce((arr, args) => {
    const command = args[0];
    const params = args[1];
    const opts = args[2];
    const dir = normalizeRelativeDir(testDir, opts.cwd);
    arr.push([dir, command].concat(params).join(" "));
    return arr;
  }, []);

describe("ExecCommand", () => {
  beforeEach(() => {
    ChildProcessUtilities.spawn = jest.fn(callsBack());
  });

  afterEach(() => jest.resetAllMocks());

  describe("in a basic repo", () => {
    let testDir;
    let lernaExec;

    beforeAll(async () => {
      testDir = await initFixture("ExecCommand/basic");
      lernaExec = run(testDir);
    });

    it("should complain if invoked without command", async () => {
      try {
        await lernaExec("--parallel");
      } catch (err) {
        expect(err.message).toBe("Not enough non-option arguments: got 0, need at least 1");
      }
    });

    it("passes execution error to callback", async () => {
      const boom = new Error("execa error");
      boom.code = 1;
      boom.cmd = "boom";

      let errorLog;
      log.once("log.error", m => {
        errorLog = m;
      });

      ChildProcessUtilities.spawn = jest.fn(callsBack(boom));

      try {
        await lernaExec("boom");
      } catch (err) {
        expect(errorLog).toHaveProperty("message", "Errored while executing 'boom' in 'package-1'");
      }
    });

    it("should ignore execution errors with --bail=false", async () => {
      const { exitCode } = await lernaExec("boom", "--no-bail");

      expect(exitCode).toBe(0);
      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
      expect(ChildProcessUtilities.spawn).lastCalledWith(
        "boom",
        [],
        expect.objectContaining({
          reject: false,
        }),
        expect.any(Function)
      );
    });

    it("should filter packages with `ignore`", async () => {
      await lernaExec("ls", "--ignore", "package-1");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(1);
      expect(ChildProcessUtilities.spawn).lastCalledWith(
        "ls",
        [],
        {
          cwd: path.join(testDir, "packages/package-2"),
          env: expect.objectContaining({
            LERNA_PACKAGE_NAME: "package-2",
          }),
          reject: true,
          shell: true,
        },
        expect.any(Function)
      );
    });

    it("should filter packages that are not updated with --since", async () => {
      UpdatedPackagesCollector.prototype.getUpdates = jest.fn(() => [
        {
          package: {
            name: "package-2",
            location: path.join(testDir, "packages/package-2"),
          },
        },
      ]);

      await lernaExec("ls", "--since");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(1);
      expect(ChildProcessUtilities.spawn).lastCalledWith(
        "ls",
        [],
        {
          cwd: path.join(testDir, "packages/package-2"),
          env: expect.objectContaining({
            LERNA_PACKAGE_NAME: "package-2",
          }),
          reject: true,
          shell: true,
        },
        expect.any(Function)
      );
    });

    it("should run a command", async () => {
      await lernaExec("ls");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
      expect(calledInPackages()).toEqual(["package-1", "package-2"]);
    });

    it("should run a command with parameters", async () => {
      await lernaExec("--", "ls", "-la");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
      expect(ChildProcessUtilities.spawn).lastCalledWith(
        "ls",
        ["-la"],
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("runs a command for a given scope", async () => {
      await lernaExec("ls", "--scope", "package-1");

      expect(calledInPackages()).toEqual(["package-1"]);
    });

    it("does not run a command for ignored packages", async () => {
      await lernaExec("ls", "--ignore", "package-@(2|3|4)");

      expect(calledInPackages()).toEqual(["package-1"]);
    });

    it("executes a command in all packages with --parallel", async () => {
      ChildProcessUtilities.spawnStreaming = jest.fn(callsBack());

      await lernaExec("--parallel", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual(["packages/package-1 ls", "packages/package-2 ls"]);
    });

    it("executes a command in all packages with --stream", async () => {
      ChildProcessUtilities.spawnStreaming = jest.fn(callsBack());

      await lernaExec("--stream", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual(["packages/package-1 ls", "packages/package-2 ls"]);
    });
  });
});
