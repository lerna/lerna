import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);
const env = {
  // Hush timing information
  LERNA_INTEGRATION: "SKIP",
};

/**
 * NOTE: We do not test the "missing test script" case here
 * because Windows makes the snapshots impossible to stabilize.
 */
describe("lerna run", () => {
  test("fail", async () => {
    const cwd = await initFixture("lerna-run");
    const args = ["run", "fail", "--", "--silent"];

    await expect(cliRunner(cwd, env)(...args)).rejects.toThrow(
      "npm run fail --silent exited 1 in 'package-3'"
    );
  });

  test("fail --no-bail", async () => {
    const cwd = await initFixture("lerna-run");
    const args = ["run", "fail", "--no-bail", "--concurrency", "1", "--", "--silent"];

    // it should pick the highest exit code (100), not the first (1)
    await expect(cliRunner(cwd, env)(...args)).rejects.toThrow(
      "Received non-zero exit code 100 during execution"
    );
  });

  test("--stream", async () => {
    const cwd = await initFixture("lerna-run");
    const args = [
      "run",
      "--stream",
      "test",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`
package-3: package-3
package-4: package-4
package-1: package-1
package-2: package-2
`);
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info Executing command in 4 packages: "npm run test --silent"
lerna success run Ran npm script 'test' in 4 packages in 0.0s:
lerna success - package-1
lerna success - package-2
lerna success - package-3
lerna success - package-4
`);
  });

  test("--stream --no-prefix", async () => {
    const cwd = await initFixture("lerna-run");
    const args = [
      "run",
      "--stream",
      "--no-prefix",
      "test",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd, env)(...args);
    expect(stdout).toMatchInlineSnapshot(`
package-3
package-4
package-1
package-2
`);
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info Executing command in 4 packages: "npm run test --silent"
lerna success run Ran npm script 'test' in 4 packages in 0.0s:
lerna success - package-1
lerna success - package-2
lerna success - package-3
lerna success - package-4
`);
  });

  test("--parallel", async () => {
    const cwd = await initFixture("lerna-run");
    const args = [
      "run",
      "test",
      "--parallel",
      // args below tell npm to be quiet
      "--",
      "--silent",
    ];
    const { stdout, stderr } = await cliRunner(cwd, env)(...args);
    expect(stderr).toMatchInlineSnapshot(`
lerna notice cli __TEST_VERSION__
lerna info ci enabled
lerna info Executing command in 4 packages: "npm run test --silent"
lerna success run Ran npm script 'test' in 4 packages in 0.0s:
lerna success - package-1
lerna success - package-2
lerna success - package-3
lerna success - package-4
`);

    // order is non-deterministic, so assert each item separately
    expect(stdout).toMatch("package-1: package-1");
    expect(stdout).toMatch("package-2: package-2");
    expect(stdout).toMatch("package-3: package-3");
    expect(stdout).toMatch("package-4: package-4");
  });
});
