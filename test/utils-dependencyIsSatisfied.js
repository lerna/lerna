import path from "path";

// mocked modules
import readPkg from "read-pkg";

// file under test
import dependencyIsSatisfied from "../src/utils/dependencyIsSatisfied";

jest.mock("read-pkg");

describe("utils/dependencyIsSatisfied", () => {
  beforeEach(() => {
    readPkg.sync.mockImplementation(() => ({ version: "1.0.0" }));
  });

  it("returns true if a package satisfies the given version range", () => {
    expect(dependencyIsSatisfied("node_modules", "foo-pkg", "^1.0.0")).toBe(true);
    expect(readPkg.sync).lastCalledWith(path.join("node_modules", "foo-pkg", "package.json"), {
      normalize: false,
    });
  });

  it("returns false if a package does not satisfy the given version range", () => {
    expect(dependencyIsSatisfied("node_modules", "foo-pkg", "^2.0.0")).toBe(false);
  });
});
