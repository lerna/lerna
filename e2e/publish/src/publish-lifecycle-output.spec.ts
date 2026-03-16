import { Fixture, normalizeCommitSHAs, normalizeEnvironment, trimEnds } from "@lerna/e2e-utils";

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomVersion = () => `${randomInt(10, 89)}.${randomInt(10, 89)}.${randomInt(10, 89)}`;

expect.addSnapshotSerializer({
  serialize(str: string) {
    return trimEnds(
      normalizeCommitSHAs(normalizeEnvironment(str))
        .replaceAll(/integrity:\s*.*/g, "integrity: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        .replaceAll(/\d*B package\.json/g, "XXXB package.json")
        .replaceAll(/size:\s*\d*\s?B/g, "size: XXXB")
        .replaceAll(/\d*\.\d*\s?kB/g, "XXX.XXX kb")
    );
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-publish-lifecycle-output", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-publish",
      packageManager: "npm",
      initializeGit: true,
      lernaInit: { args: [`--packages="packages/*"`] },
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  // Regression test for https://github.com/lerna/lerna/issues/4090
  it("should show postpublish lifecycle script output", async () => {
    await fixture.lerna("create test-1 -y");

    await fixture.addScriptsToPackage({
      packagePath: "packages/test-1",
      scripts: {
        postpublish: "echo POSTPUBLISH_OUTPUT_TEST_1",
      },
    });

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    const version = randomVersion();
    await fixture.lerna(`version ${version} -y`);

    await fixture.exec('echo "registry=http://localhost:4873" > .npmrc');

    const output = await fixture.lerna("publish from-git -y");
    await fixture.exec(`npm unpublish --force test-1@${version} --registry=http://localhost:4873`);

    expect(output.combinedOutput).toContain("POSTPUBLISH_OUTPUT_TEST_1");
  });

  // Regression test for https://github.com/lerna/lerna/issues/4090
  it("should show publish lifecycle script output", async () => {
    await fixture.lerna("create test-1 -y");

    await fixture.addScriptsToPackage({
      packagePath: "packages/test-1",
      scripts: {
        publish: "echo PUBLISH_OUTPUT_TEST_1",
      },
    });

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    const version = randomVersion();
    await fixture.lerna(`version ${version} -y`);

    await fixture.exec('echo "registry=http://localhost:4873" > .npmrc');

    const output = await fixture.lerna("publish from-git -y");
    await fixture.exec(`npm unpublish --force test-1@${version} --registry=http://localhost:4873`);

    expect(output.combinedOutput).toContain("PUBLISH_OUTPUT_TEST_1");
  });

  // Regression test for https://github.com/lerna/lerna/issues/4090
  it("should show postpublish output from multiple packages", async () => {
    await fixture.lerna("create test-1 -y");
    await fixture.lerna("create test-2 -y");

    await fixture.addScriptsToPackage({
      packagePath: "packages/test-1",
      scripts: {
        postpublish: "echo POSTPUBLISH_PKG1",
      },
    });
    await fixture.addScriptsToPackage({
      packagePath: "packages/test-2",
      scripts: {
        postpublish: "echo POSTPUBLISH_PKG2",
      },
    });

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");

    const version = randomVersion();
    await fixture.lerna(`version ${version} -y`);

    await fixture.exec('echo "registry=http://localhost:4873" > .npmrc');

    const output = await fixture.lerna("publish from-git -y");
    await fixture.exec(`npm unpublish --force test-1@${version} --registry=http://localhost:4873`);
    await fixture.exec(`npm unpublish --force test-2@${version} --registry=http://localhost:4873`);

    expect(output.combinedOutput).toContain("POSTPUBLISH_PKG1");
    expect(output.combinedOutput).toContain("POSTPUBLISH_PKG2");
  });
});
