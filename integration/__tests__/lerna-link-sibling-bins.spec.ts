import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

if (process.platform !== "win32") {
  test("lerna link symlinks generated binaries of sibling packages", async () => {
    const cwd = await initFixture("lerna-generated-build-tool");
    const lerna = cliRunner(cwd);

    // First bootstrap, I expect this to succeed but don't are about the output
    await lerna("bootstrap");

    const { stdout } = await lerna("run", "build");

    expect(stdout).toMatch("build tool executed");
  });
} else {
  test("windows can go pound sand, impossible to validate", () => {
    expect(true).toBe(true);
  });
}
