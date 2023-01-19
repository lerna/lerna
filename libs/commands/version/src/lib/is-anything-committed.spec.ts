import { initFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isAnythingCommitted } = require("./is-anything-committed");

test("isAnythingCommitted", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(isAnythingCommitted({ cwd })).toBe(true);
});

test("isAnythingCommitted without and with a commit", async () => {
  const cwd = await initFixture("root-manifest-only", false);

  expect(isAnythingCommitted({ cwd })).toBe(false);

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });

  expect(isAnythingCommitted({ cwd })).toBe(true);
});
