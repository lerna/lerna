import { normalizeCommandOutput } from "./normalize-command-output";

describe("normalizeCommandOutput", () => {
  it("removes npm 12 npx launcher notices from lerna output", () => {
    expect(
      normalizeCommandOutput(
        "npx --offline --no lerna changed --json",
        "npm notice run npx\nnpm notice run 'lerna' changed --json\npackage-a\n"
      )
    ).toBe("package-a\n");
  });

  it("handles Windows line endings", () => {
    expect(
      normalizeCommandOutput(
        "npx --registry=http://localhost:4873/ --yes lerna@999.9.9-e2e.0 init",
        "npm notice run npx\r\nnpm notice run 'lerna' init\r\nInitialized Lerna files\r\n"
      )
    ).toBe("Initialized Lerna files\r\n");
  });

  it("preserves notices from commands other than lerna", () => {
    const output = "npm notice run npx\nnpm notice run 'nx' test e2e-utils\n";

    expect(normalizeCommandOutput("npx nx test e2e-utils", output)).toBe(output);
  });

  it("removes terminal colors from all command output", () => {
    expect(normalizeCommandOutput("git status", "\u001b[32mclean\u001b[39m\n")).toBe("clean\n");
  });
});
