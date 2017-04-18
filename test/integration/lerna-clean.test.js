import execa from "execa";
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

  test.skip("local yarn", async () => {
    const cwd = await initFixture("CleanCommand/integration");
    const mutex = ["--mutex", "network:42042"];

    await execa("yarn", ["install", ...mutex], { cwd });

    const stdout = await execa.stdout("yarn", ["clean", "--silent", ...mutex], { cwd });
    expect(stdout).toMatchSnapshot("stdout: local yarn");

    const found = await globby(["package-*/node_modules"], { cwd });
    expect(found).toEqual([]);
  });
});
