import execa from "execa";

import { LERNA_BIN } from "../helpers/constants";
import initFixture from "../helpers/initFixture";

describe("lerna run", () => {
  test.concurrent("my-script --scope", async () => {
    const cwd = await initFixture("RunCommand/basic");
    const args = [
      "run",
      "my-script",
      "--scope=package-1",
      "--concurrency=1",
      // args below tell npm to be quiet
      "--", "--silent",
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
      "--", "--silent",
    ];
    const { stdout, stderr } = await execa(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: test --ignore");
    expect(stderr).toMatchSnapshot("stderr: test --ignore");
  });
});
