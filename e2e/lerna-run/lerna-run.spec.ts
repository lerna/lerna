import {
  addScriptsToPackageAsync,
  createEmptyDirectoryForWorkspace,
  removeWorkspace,
  runLernaCommandAsync,
  runLernaInitAsync,
} from "../utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return str.replaceAll(/package-\d/g, "package-X").replaceAll(/\d\.\ds/g, "X.Xs");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna run", () => {
  afterEach(() => removeWorkspace());

  it("should run script on all child packages", async () => {
    createEmptyDirectoryForWorkspace("lerna-run-test");
    await runLernaInitAsync();

    await runLernaCommandAsync("create package-1");
    await addScriptsToPackageAsync("package-1", {
      "print-name": "echo test-package-1",
    });
    await runLernaCommandAsync("create package-2");
    await addScriptsToPackageAsync("package-2", {
      "print-name": "echo test-package-2",
    });
    await runLernaCommandAsync("create package-3");
    await addScriptsToPackageAsync("package-3", {
      "print-name": "echo test-package-3",
    });

    const output = await runLernaCommandAsync("run print-name");

    expect(output.combinedOutput).toMatchInlineSnapshot(`

      > package-X@0.0.0 print-name
      > echo test-package-X

      test-package-X

      > package-X@0.0.0 print-name
      > echo test-package-X

      test-package-X

      > package-X@0.0.0 print-name
      > echo test-package-X

      test-package-X
      lerna notice cli v999.9.9-e2e.0
      lerna info Executing command in 3 packages: "npm run print-name"
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
      lerna success - package-X
      lerna success - package-X
      lerna success - package-X

    `);
  });
});
