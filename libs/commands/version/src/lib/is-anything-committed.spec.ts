import { initFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";
import { isAnythingCommitted } from "./is-anything-committed";

const initFixture = initFixtureFactory(__dirname);

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
