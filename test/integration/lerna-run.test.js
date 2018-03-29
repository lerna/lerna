import execa from "execa";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";

/**
 * NOTE: We do not test the "missing test script" case here
 * because Windows makes the snapshots impossible to stabilize.
 */
describe("lerna run", () => {
  test.concurrent("my-script --scope", async () => {
    const cwd = await initFixture("RunCommand/basic");
    const args = [
      "run",
      "my-script",
      "--scope=package-1",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: my-script --scope");
    expect(stderr).toMatchSnapshot("stderr: my-script --scope");
  });

  test.concurrent("test --ignore", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
    const args = [
      "run",
      "--concurrency=1",
      "test",
      "--ignore",
      "package-@(1|2|3)",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: test --ignore");
    expect(stderr).toMatchSnapshot("stderr: test --ignore");
  });

  test.concurrent("test --stream", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
    const args = [
      "run",
      "--stream",
      "test",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: test --stream");
    expect(stderr).toMatchSnapshot("stderr: test --stream");
  });

  test.concurrent("test --stream --no-prefix", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
    const args = [
      "run",
      "--stream",
      "--no-prefix",
      "test",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: test --stream --no-prefix");
    expect(stderr).toMatchSnapshot("stderr: test --stream --no-prefix");
  });

  test.concurrent("test --parallel", async () => {
    const cwd = await initFixture("RunCommand/integration-lifecycle");
    const args = [
      "run",
      "test",
      "--parallel",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr: test --parallel");

    // order is non-deterministic, so assert each item separately
    expect(stdout).toMatch("package-1: package-1");
    expect(stdout).toMatch("package-2: package-2");
    expect(stdout).toMatch("package-3: package-3");
    expect(stdout).toMatch("package-4: package-4");
  });

  test.concurrent("my-script --parallel", async () => {
    const cwd = await initFixture("RunCommand/basic");
    const args = [
      "run",
      "--parallel",
      "my-script",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr: my-script --parallel");

    // order is non-deterministic, so assert each item separately
    expect(stdout).toMatch("package-1: package-1");
    expect(stdout).not.toMatch("package-2");
    expect(stdout).toMatch("package-3: package-3");
    expect(stdout).not.toMatch("package-4");
  });

  test.concurrent("my-script --parallel --no-prefix", async () => {
    const cwd = await initFixture("RunCommand/basic");
    const args = [
      "run",
      "--parallel",
      "--no-prefix",
      "my-script",
      // args below tell npm to be quiet
      "--",
      "--silent",
      "--onload-script=false",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stderr).toMatchSnapshot("stderr: my-script --parallel --no-prefix");

    // order is non-deterministic, so assert each item separately
    expect(stdout).toMatch("package-1");
    expect(stdout).not.toMatch("package-2");
    expect(stdout).toMatch("package-3");
    expect(stdout).not.toMatch("package-4");
  });
});
