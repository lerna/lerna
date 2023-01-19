import { initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getCurrentBranch } = require("./get-current-branch");

test("getCurrentBranch", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(getCurrentBranch({ cwd })).toBe("main");
});

test("getCurrentBranch without commit", async () => {
  const cwd = await initFixture("root-manifest-only", false);

  expect(() => getCurrentBranch({ cwd })).toThrow(/Command failed.*: git rev-parse --abbrev-ref HEAD.*/);
});
