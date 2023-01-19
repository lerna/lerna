import { cloneFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";

const cloneFixture = cloneFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isBehindUpstream } = require("./is-behind-upstream");

test("isBehindUpstream", async () => {
  const { cwd } = await cloneFixture("root-manifest-only");

  expect(isBehindUpstream("origin", "main", { cwd })).toBe(false);

  await execa("git", ["commit", "--allow-empty", "-m", "change"], { cwd });
  await execa("git", ["push", "origin", "main"], { cwd });
  await execa("git", ["reset", "--hard", "HEAD^"], { cwd });

  expect(isBehindUpstream("origin", "main", { cwd })).toBe(true);
});
