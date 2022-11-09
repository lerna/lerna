import { Fixture } from "../../utils/fixture";
import { normalizeEnvironment } from "../../utils/snapshot-serializer-utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str);
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-repair", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-repair",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterAll(() => fixture.destroy());

  it("should run any existing migrations", async () => {
    const output = await fixture.lerna("repair");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

       >  Lerna   No changes were necessary. This workspace is up to date!


    `);
  });
});
