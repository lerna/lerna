import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(
      str
        .replaceAll(/OS: .*\n/g, "OS: {OS}\n")
        .replaceAll(/CPU: \(\d{1,2}\) x(64|32) .* CPU .*\n/g, "CPU: {CPU}\n")
        .replaceAll(/CPU: \(\d{1,2}\) arm64 .*\n/g, "CPU: {CPU}\n")
        .replaceAll(/Node: (\d{1,2})\.(\d{1,2})\.(\d{1,2}) - .*\n/g, "Node: XX.XX.XX - {Node}\n")
        .replaceAll(/Yarn: (\d{1,2})\.(\d{1,2})\.(\d{1,2}) - .*\n/g, "Yarn: XX.XX.XX - {Yarn}\n")
        .replaceAll(/npm: (\d{1,2})\.(\d{1,2})\.(\d{1,2}) - .*\n/g, "npm: XX.XX.XX - {npm}\n")
        .replaceAll(/Git: (\d{1,2})\.(\d{1,2})\.(\d{1,2}) - .*\n/g, "Git: XX.XX.XX - {Git}\n")
    );
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-info", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-info",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterAll(() => fixture.destroy());

  it("should output environment info", async () => {
    const output = await fixture.lerna("info");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

       Environment info:

        System:
          OS: {OS}
          CPU: {CPU}
        Binaries:
          Node: XX.XX.XX - {Node}
          Yarn: XX.XX.XX - {Yarn}
          npm: XX.XX.XX - {npm}
        Utilities:
          Git: XX.XX.XX - {Git}
        npmPackages:
          lerna: ^999.9.9-e2e.0 => 999.9.9-e2e.0 


    `);
  });
});
