import { normalizeFixtureCommandOutput } from "./normalize-fixture-command-output";

describe("normalizeFixtureCommandOutput", () => {
  it("removes npm 12 npx launcher notices from lerna output", () => {
    expect(
      normalizeFixtureCommandOutput(
        "npx --offline --no lerna changed --json",
        "npm notice run npx\nnpm notice run 'lerna' changed --json\npackage-a\n"
      )
    ).toBe("package-a\n");
  });

  it("removes launcher notices appended after stdout", () => {
    expect(
      normalizeFixtureCommandOutput(
        "npx --offline --no lerna exec npm run build",
        "package output\nnpm notice run npx\nnpm notice run 'lerna' exec npm run build\nlerna success exec\n"
      )
    ).toBe("package output\nlerna success exec\n");
  });

  it("handles Windows line endings", () => {
    expect(
      normalizeFixtureCommandOutput(
        "npx --registry=http://localhost:4873/ --yes lerna@999.9.9-e2e.0 init",
        "npm notice run npx\r\nnpm notice run 'lerna' init\r\nInitialized Lerna files\r\n"
      )
    ).toBe("Initialized Lerna files\r\n");
  });

  it("preserves notices from commands other than lerna", () => {
    const output = "npm notice run npx\nnpm notice run 'nx' test e2e-utils\n";

    expect(normalizeFixtureCommandOutput("npx nx test e2e-utils", output)).toBe(output);
  });

  it("removes terminal colors from all command output", () => {
    expect(normalizeFixtureCommandOutput("git status", "\u001b[32mclean\u001b[39m\n")).toBe("clean\n");
  });
});
