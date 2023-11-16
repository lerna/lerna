import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";
import { readFileSync, writeFileSync } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

const setupYarnBerryWithCorepack = async (fixture: Fixture) => {
  // "corepack use ..." will try to do an install afterwards, but it will fail due to unsafeHttpWhitelist not being set.
  // This isn't a problem as yarn itself will still be installed and we can do a `yarn install` after setting appropriate config.
  await fixture.exec("corepack use yarn@stable", {
    silenceError: true,
  });

  await fixture.exec("corepack yarn set version berry");
  await fixture.exec("corepack yarn config set nodeLinker node-modules");
  await fixture.exec("corepack yarn config set npmRegistryServer http://localhost:4872");
  await fixture.exec("corepack yarn config set unsafeHttpWhitelist localhost");

  await fixture.createInitialGitCommit();

  await fixture.exec("corepack yarn install", {
    env: {
      ...process.env,
      YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
    },
  });
  writeFileSync(
    fixture.getWorkspacePath(".gitignore"),
    `
  node_modules
  .pnp.*
  .yarn/*
  !.yarn/patches
  !.yarn/plugins
  !.yarn/releases
  !.yarn/sdks
  !.yarn/versions
  `
  );

  await fixture.overrideLernaConfig({
    npmClient: "yarn",
  });

  await fixture.exec("git add .");
  await fixture.exec("git commit -m 'chore: setup yarn berry'");
  await fixture.exec("git push origin test-main");
};

describe("lerna-version-corepack", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-corepack",
      packageManager: "yarn",
      initializeGit: true,
      lernaInit: false,
      installDependencies: false,
    });

    await fixture.lernaInit("");

    await fixture.exec("corepack enable");
    await setupYarnBerryWithCorepack(fixture);

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b --dependencies package-a -y");

    await fixture.exec("corepack yarn install", {
      env: {
        ...process.env,
        YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
      },
    });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: add packages'");
    await fixture.exec("git push origin test-main");
  });

  afterEach(async () => {
    await fixture.destroy();
  });

  it("should update yarn.lock", async () => {
    const output = await fixture.lerna("version 3.3.3 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info current version 0.0.0
        lerna info Assuming all packages changed

        Changes:
         - package-a: 0.0.0 => 3.3.3
         - package-b: 0.0.0 => 3.3.3

        lerna info auto-confirmed 
        lerna info execute Skipping releases
        lerna info git Pushing tags...
        lerna success version finished

      `);
    const yarnLock = readFileSync(fixture.getWorkspacePath("yarn.lock")).toString();
    expect(yarnLock).toContain(`package-a@npm:^3.3.3, package-a@workspace:packages/package-a`);
    expect(yarnLock).toContain(`package-b@workspace:packages/package-b`);
    expect(yarnLock).toContain(`package-a: "npm:^3.3.3"`);
  });
});
