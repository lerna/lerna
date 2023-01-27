import { cliRunner, cloneFixtureFactory } from "@lerna/test-helpers";
import path from "path";

const cloneFixture = cloneFixtureFactory(path.resolve(__dirname, "../../libs/commands/publish"));

test("lerna publish sets correct exit code when libnpmpublish fails", async () => {
  const { cwd } = await cloneFixture("normal");

  await expect(
    cliRunner(cwd)("publish", "patch", "--yes", "--no-verify-access", "--loglevel", "error")
  ).rejects.toThrow(
    expect.objectContaining({
      stderr: expect.stringContaining("E404 Not found"),
      exitCode: 1,
    })
  );
});
