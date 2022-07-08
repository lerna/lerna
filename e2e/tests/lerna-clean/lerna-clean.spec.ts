import { Fixture } from "../../utils/fixture";
import { normalizeEnvironment } from "../../utils/snapshot-serializer-utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str.replaceAll(/index .{7}\.\..{7} \d{6}/g, "index XXXXXXX..XXXXXXX XXXXXX"));
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-clean", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-clean",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterAll(() => fixture.destroy());

  it("should remove node_modules for all packages", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y");
    await fixture.exec("npm install --prefix ./packages/package-a");
    await fixture.exec("npm install --prefix ./packages/package-b");

    const output = await fixture.lerna("clean -y");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info clean removing /tmp/lerna-e2e/lerna-clean/lerna-workspace/packages/package-a/node_modules
      lerna info clean removing /tmp/lerna-e2e/lerna-clean/lerna-workspace/packages/package-b/node_modules
      lerna success clean finished

    `);
  });

  it("should remove node_modules for only package-a", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y");
    await fixture.exec("npm install --prefix ./packages/package-a");
    await fixture.exec("npm install --prefix ./packages/package-b");

    const output = await fixture.lerna("clean --scope=package-a -y");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter including "package-a"
      lerna info filter [ 'package-a' ]
      lerna info clean removing /tmp/lerna-e2e/lerna-clean/lerna-workspace/packages/package-a/node_modules
      lerna success clean finished

    `);
  });
});
