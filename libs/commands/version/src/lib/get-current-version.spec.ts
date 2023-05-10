import _execa from "execa";
import { isEqual } from "lodash";
import { getCurrentVersion } from "./get-current-version";

let mockNpmViewResult: string | undefined = undefined;
let mockNpmViewError: Error | undefined = undefined;

jest.mock("execa");

const packageName = "my-package";

const execaMockFn = (file: string, args: string[]) => {
  if (file !== "npm" || !isEqual(args, ["view", packageName, "dist-tags", "--json"])) {
    throw new Error();
  }

  return mockNpmViewError ? Promise.reject(mockNpmViewError) : Promise.resolve({ stdout: mockNpmViewResult });
};

const execa = _execa as jest.MockedFunction<typeof _execa>;
execa.mockImplementation(execaMockFn as typeof _execa);

describe("getCurrentVersion", () => {
  afterEach(() => {
    mockNpmViewError = undefined;
    mockNpmViewResult = undefined;
  });

  it("should return current version of package@latest", async () => {
    mockNpmViewResult = '{ "latest": "1.0.0" }';
    const result = await getCurrentVersion(packageName, "latest");

    expect(result).toEqual("1.0.0");
  });

  it("should return current version of package@beta", async () => {
    mockNpmViewResult = '{ "latest": "1.0.0", "beta": "1.0.1-beta.0" }';
    const result = await getCurrentVersion(packageName, "beta");

    expect(result).toEqual("1.0.1-beta.0");
  });

  it("should error if no version is found for a given distTag", async () => {
    mockNpmViewResult = '{ "latest": "1.0.0" }';

    await expect(getCurrentVersion(packageName, "foo")).rejects.toThrowErrorMatchingInlineSnapshot(`
      "No version found for my-package@foo.
       If you are trying to version based on a different tag than 'latest', ensure that it is provided with the --distTag option."
    `);
  });

  it("should error if `npm view` command fails", async () => {
    mockNpmViewError = new Error("ERROR");

    await expect(getCurrentVersion(packageName, "latest")).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Could not get current version of my-package via \`npm view\`.
       Please verify that \`npm view my-package\` completes successfully from the root of the workspace."
    `);
  });
});
