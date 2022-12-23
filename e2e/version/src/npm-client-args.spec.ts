import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-npm-client-args", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-npm-client-args",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
    await fixture.lerna("create package-a -y");

    // eslint-plugin-react-app@6.2.2 requires a peer dependency of eslint@"6.x".
    // Without it, the npm install at the end of `lerna version` will fail if
    // --legacy-peer-deps is not passed correctly.
    await fixture.updateJson("package.json", (json) => ({
      ...json,
      dependencies: {
        ...(json.dependencies as Record<string, string>),
        "eslint-plugin-react-app": "6.2.2",
        eslint: "8.25.0",
      },
    }));
    await fixture.exec(
      "npm install eslint-plugin-react-app@6.2.2 eslint@8.25.0 --save=false --legacy-peer-deps"
    );
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
  });
  afterEach(() => fixture.destroy());

  it("should add npmClientArgs to npm install at the end of the version command", async () => {
    const output = await fixture.lerna("version 3.3.3 -y --npm-client-args=--legacy-peer-deps");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });

  it("should support multiple arguments, comma delimited", async () => {
    const output = await fixture.lerna('version 3.3.3 -y --npm-client-args="--legacy-peer-deps,--fund"');
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });

  it("should support multiple arguments, space delimited", async () => {
    const output = await fixture.lerna('version 3.3.3 -y --npm-client-args="--legacy-peer-deps --fund"');
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info current version 0.0.0
      lerna info Assuming all packages changed

      Changes:
       - package-a: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });
});
