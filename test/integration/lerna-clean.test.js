import execa from "execa";
import getPort from "get-port";
import globby from "globby";
import initFixture from "../helpers/initFixture";
import { LERNA_BIN } from "../helpers/constants";

describe("lerna clean", () => {
  test.concurrent("global", async () => {
    const cwd = await initFixture("CleanCommand/basic");
    const args = [
      "clean",
      "--yes",
      "--concurrency=1",
    ];

    const stdout = await execa.stdout(LERNA_BIN, args, { cwd });
    expect(stdout).toMatchSnapshot("stdout: global --yes");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });

  test.concurrent("local npm", async () => {
    const cwd = await initFixture("CleanCommand/integration");

    await execa("npm", ["install", "--cache-min=99999"], { cwd });

    const stdout = await execa.stdout("npm", ["run", "clean", "--silent"], { cwd });
    expect(stdout).toMatchSnapshot("stdout: local npm");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });

  // FIXME
  test.skip("local yarn", async () => {
    const cwd = await initFixture("CleanCommand/integration");

    const port = await getPort(42042);
    const mutex = ["--mutex", `network:${port}`];

    await execa("yarn", ["install", "--no-lockfile", ...mutex], { cwd });

    const stdout = await execa.stdout("yarn", ["clean", "--silent", ...mutex], { cwd });
    expect(stdout).toMatchSnapshot("stdout: local yarn");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });
});
