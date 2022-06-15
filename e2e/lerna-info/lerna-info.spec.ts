import {
  createEmptyDirectoryForWorkspace,
  removeWorkspace,
  runCLI,
  runLernaInit,
  runNpmInstall,
} from "../utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return str
      .replaceAll(/OS: .*\n/g, "OS: {OS}\n")
      .replaceAll(/CPU: \(\d\) x(64|32) .* CPU @ .*\n/g, "CPU: {CPU}\n")
      .replaceAll(/Node: (\d{1}|\d{2})\.(\d{1}|\d{2})\.(\d{1}|\d{2}) - .*\n/g, "Node: XX.XX.XX - {Node}\n")
      .replaceAll(/Yarn: (\d{1}|\d{2})\.(\d{1}|\d{2})\.(\d{1}|\d{2}) - .*\n/g, "Yarn: XX.XX.XX - {Yarn}\n")
      .replaceAll(/npm: (\d{1}|\d{2})\.(\d{1}|\d{2})\.(\d{1}|\d{2}) - .*\n/g, "npm: XX.XX.XX - {npm}\n")
      .replaceAll(/Git: (\d{1}|\d{2})\.(\d{1}|\d{2})\.(\d{1}|\d{2}) - .*\n/g, "Git: XX.XX.XX - {Git}\n");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna info", () => {
  beforeAll(async () => {
    createEmptyDirectoryForWorkspace("lerna-info-test");
    await runLernaInit();
    await runNpmInstall();
  });
  afterAll(() => removeWorkspace());

  it("should output environment info", async () => {
    const output = await runCLI("info");

    expect(output.combinedOutput).toMatchInlineSnapshot(`

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

lerna notice cli v999.9.9-e2e.0

`);
  });
});
