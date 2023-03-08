import {
  prereleaseIdFromVersion,
  promptSelectOne as _promptSelectOne,
  promptTextInput as _promtTextInput,
} from "@lerna/core";
import semver from "semver";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

const promptTextInput = jest.mocked(_promtTextInput);

// The mocked version isn't the same as the real one
const promptSelectOne = _promptSelectOne as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { makePromptVersion } = require("./prompt-version");

const resolvePrereleaseId = jest.fn(() => "alpha");
const versionPrompt = makePromptVersion(resolvePrereleaseId);

describe("select", () => {
  describe("message", () => {
    test("default", async () => {
      await versionPrompt({
        version: "1.2.3",
      });

      expect(promptSelectOne).toHaveBeenLastCalledWith(
        "Select a new version (currently 1.2.3)",
        expect.objectContaining({
          choices: expect.any(Array),
        })
      );
    });

    test("with name", async () => {
      await versionPrompt({
        version: "3.2.1",
        name: "my-package",
      });

      expect(promptSelectOne).toHaveBeenLastCalledWith(
        "Select a new version for my-package (currently 3.2.1)",
        expect.any(Object)
      );
    });
  });

  describe("choice", () => {
    test.each([
      ["patch", "1.0.1"],
      ["minor", "1.1.0"],
      ["major", "2.0.0"],
      ["prepatch", "1.0.1-alpha.0"],
      ["preminor", "1.1.0-alpha.0"],
      ["premajor", "2.0.0-alpha.0"],
    ])("bump %s", async (bump, result) => {
      promptSelectOne.chooseBump(bump);

      const choice = await versionPrompt({
        version: "1.0.0",
        prereleaseId: "",
      });

      expect(choice).toBe(result);
    });
  });
});

describe("custom version", () => {
  let inputFilter;
  let inputValidate;

  beforeEach(() => {
    promptSelectOne.chooseBump("CUSTOM");

    promptTextInput.mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;
      inputValidate = cfg.validate;

      return Promise.resolve(msg);
    });
  });

  test("message", async () => {
    const message = await versionPrompt({
      version: "1.0.0",
    });

    expect(message).toBe("Enter a custom version");
    expect(inputFilter).toBe(semver.valid);
  });

  test.each([
    ["", "Must be a valid semver version"],
    ["poop", "Must be a valid semver version"],
    ["v3.2.1", true],
    ["1.2.3", true],
  ])("user input %j", async (stdin, result) => {
    await versionPrompt({ version: "1.0.0" });

    expect(inputValidate(inputFilter(stdin))).toBe(result);
  });
});

/**
 * here be dragons
 */
describe("custom prerelease", () => {
  let inputFilter;

  beforeEach(() => {
    promptSelectOne.chooseBump("PRERELEASE");

    promptTextInput.mockImplementationOnce((msg, cfg) => {
      inputFilter = cfg.filter;

      return Promise.resolve(msg);
    });
  });

  describe.each`
    preid        | isPrerelease
    ${undefined} | ${true}
    ${"beta"}    | ${true}
    ${undefined} | ${false}
    ${"beta"}    | ${false}
  `("pre-bump: $isPrerelease, id: $preid", ({ preid, isPrerelease }) => {
    // FIXME: this is a copy+paste from the implementation :P
    const scopedResolveId = (existingPreid) => preid || (isPrerelease && existingPreid) || "alpha";

    beforeEach(() => {
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      resolvePrereleaseId.mockImplementationOnce(scopedResolveId);
    });

    // TODO: better matrix of tests
    test("1.0.0", async () => {
      const version = "1.0.0";
      const node = {
        version,
        prereleaseId: prereleaseIdFromVersion(version),
      };
      const defaultIdentifier = scopedResolveId(node.prereleaseId);
      const message = await versionPrompt(node);

      expect(message).toMatch("Enter a prerelease identifier");
      expect(message).toMatch(`default: "${defaultIdentifier}"`);
      expect(message).toMatch(`yielding ${semver.inc(version, "prerelease", defaultIdentifier)}`);

      expect(inputFilter(null)).toBe(`1.0.1-${defaultIdentifier}.0`);
      expect(inputFilter("rc")).toBe("1.0.1-rc.0");
    });

    test("1.0.1-beta.1", async () => {
      const version = "1.0.1-beta.1";
      const node = {
        version,
        prereleaseId: prereleaseIdFromVersion(version),
      };
      const defaultIdentifier = scopedResolveId(node.prereleaseId);
      const message = await versionPrompt(node);

      expect(message).toMatch("Enter a prerelease identifier");
      expect(message).toMatch(`default: "${defaultIdentifier}"`);
      expect(message).toMatch(`yielding ${semver.inc(version, "prerelease", defaultIdentifier)}`);

      expect(inputFilter("beta")).toBe("1.0.1-beta.2");
      expect(inputFilter("rc")).toBe("1.0.1-rc.0");
    });
  });
});
