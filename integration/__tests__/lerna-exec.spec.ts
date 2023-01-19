import { cliRunner, initFixtureFactory } from "@lerna/test-helpers";
import path from "path";
import pathKey from "path-key";

const initFixture = initFixtureFactory(__dirname);

const EXEC_TEST_COMMAND = process.platform === "win32" ? "exec-test.cmd" : "exec-test";

const pathName = pathKey(); // PATH (POSIX) or PATH/path/Path (Windows)
const existingPath = process.env[pathName];
const fixturePath = path.resolve(__dirname, "__fixtures__");

// The Node docs (https://nodejs.org/api/process.html#process_process_env)
// explicitly say: "On Windows operating systems, environment variables
// are case-insensitive" However, this isn't entirely true, at least within
// AppVeyor. Following code sets three different variables:
//
// process.env.path = "foo";
// process.env.Path = "bar";
// process.env.PATH = "baz";
//
// Following lines consolidate the variables into one.
delete process.env.path;
delete process.env.Path;
process.env.PATH = existingPath;

// adds "__fixtures__" to PATH for child processes
const env = {
  PATH: [fixturePath, existingPath].join(path.delimiter),
};

// exec never mutates working directory
let cwd: string;
beforeAll(async () => {
  cwd = await initFixture("lerna-exec");
});

test("lerna exec --ignore <pkg> exec-test -- -1", async () => {
  const args = [
    "exec",
    "--ignore=package-1",
    EXEC_TEST_COMMAND,
    "--concurrency=1",
    "--",
    // args to exec-test
    "-1",
  ];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`
--> in "package-2" with extra args "-1"
file-2.js
package.json
`);
});

test("lerna exec exec-test --scope <pkg>", async () => {
  const args = [
    "exec",
    "--concurrency=1",
    EXEC_TEST_COMMAND,
    "--scope=package-1",
    // no args to exec-test
  ];

  const { stdout } = await cliRunner(cwd, env)(...args);
  expect(stdout).toMatchInlineSnapshot(`
--> in "package-1" with extra args ""
file-1.js
package.json
`);
});

test("lerna exec echo $LERNA_PACKAGE_NAME", async () => {
  const args = [
    "exec",
    "--concurrency=1",
    "echo",
    process.platform === "win32" ? "%LERNA_PACKAGE_NAME%" : "$LERNA_PACKAGE_NAME",
  ];

  const { stdout } = await cliRunner(cwd)(...args);
  expect(stdout).toMatchInlineSnapshot(`
package-1
package-2
`);
});

test("lerna exec --parallel", async () => {
  const args = [
    "exec",
    EXEC_TEST_COMMAND,
    "--parallel",
    // -- is required to pass args to command
    "--",
    "-C",
  ];

  const { stdout, stderr } = await cliRunner(cwd, env)(...args);
  expect(stderr).toMatch(EXEC_TEST_COMMAND);

  // order is non-deterministic, so assert individually
  expect(stdout).toMatch("package-1: file-1.js");
  expect(stdout).toMatch("package-1: package.json");
  expect(stdout).toMatch("package-2: file-2.js");
  expect(stdout).toMatch("package-2: package.json");
});

test("lerna exec --parallel --no-prefix", async () => {
  const args = ["exec", "--parallel", "--no-prefix", EXEC_TEST_COMMAND];

  const { stdout, stderr } = await cliRunner(cwd, env)(...args);
  expect(stderr).toMatch(EXEC_TEST_COMMAND);

  // order is non-deterministic, so assert individually
  expect(stdout).toMatch("file-1.js");
  expect(stdout).toMatch("file-2.js");
});

test("lerna exec --stream", async () => {
  const args = [
    "exec",
    EXEC_TEST_COMMAND,
    "--stream",
    // -- is required to pass args to command
    "--",
    "-C",
  ];

  const { stdout } = await cliRunner(cwd, env)(...args);

  // order is non-deterministic, so assert individually
  expect(stdout).toMatch("package-1: file-1.js");
  expect(stdout).toMatch("package-1: package.json");
  expect(stdout).toMatch("package-2: file-2.js");
  expect(stdout).toMatch("package-2: package.json");
});

test("lerna exec --stream --no-prefix", async () => {
  const args = ["exec", "--stream", "--no-prefix", EXEC_TEST_COMMAND];

  const { stdout } = await cliRunner(cwd, env)(...args);

  // order is non-deterministic, so assert individually
  expect(stdout).toMatch("file-1.js");
  expect(stdout).toMatch("file-2.js");
});

if (process.platform !== "win32") {
  test("lerna exec --no-bail", async () => {
    const args = ["exec", "--no-bail", "--concurrency=1", "--", "npm", "run", "fail-or-succeed", "--silent"];

    await expect(cliRunner(cwd, env)(...args)).rejects.toThrow(
      "Received non-zero exit code 1 during execution"
    );
  });

  test("lerna exec string node error code is not swallowed", async () => {
    const args = ["exec", "--no-bail", "--concurrency=1", "--", "thing-that-is-missing"];

    await expect(cliRunner(cwd, env)(...args)).rejects.toThrow(
      /Received non-zero exit code \d+ during execution/
    );
  });
}
