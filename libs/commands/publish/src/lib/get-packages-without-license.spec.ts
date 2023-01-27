import { Project } from "@lerna/core";
import { initFixtureFactory } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getPackagesWithoutLicense } = require("./get-packages-without-license");

test("getPackagesWithoutLicense", async () => {
  const cwd = await initFixture("licenses");
  const project = new Project(cwd);

  const [pkg1, pkg2] = await project.getPackages();
  const packagesToBeLicensed = await getPackagesWithoutLicense(project, [pkg1, pkg2]);

  expect(packagesToBeLicensed).toEqual([pkg1]);
});
