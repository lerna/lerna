import { initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

import { getCurrentSHA } from "./get-current-sha";

test("getCurrentSHA", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
});
