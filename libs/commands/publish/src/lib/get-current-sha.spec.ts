import { initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getCurrentSHA } = require("./get-current-sha");

test("getCurrentSHA", async () => {
  const cwd = await initFixture("root-manifest-only");

  expect(getCurrentSHA({ cwd })).toMatch(/^[0-9a-f]{40}$/);
});
